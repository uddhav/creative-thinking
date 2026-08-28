#!/usr/bin/env node
/**
 * Replay harness orchestrator.
 *
 * For each fixture (a synthetic CT_CALL_LOG transcript — {tool, arguments}
 * per line), spawns a fresh in-memory server, replays every call through the
 * rewrite layer, captures every response verbatim, and computes EMISSION
 * metrics only. Effect metrics (decisive-step hit rates) belong to grade.mjs;
 * replay structurally cannot measure whether a caller would have acted
 * differently — subsequent fixture calls are frozen (design ledger, Learning
 * Log entry 6).
 *
 * Modes:
 *   node evals/replay/run-replay.mjs                  # replay, write out/, print metrics
 *   node evals/replay/run-replay.mjs --check          # + compare against baseline.json (ratchet)
 *   node evals/replay/run-replay.mjs --write-baseline # + regenerate baseline.json (deliberate act)
 *
 * The baseline is a ratchet, not a mirror (same discipline as
 * scripts/generate-evals-baseline.mjs): regenerate it when behavior has
 * genuinely improved, never to make a failing check pass.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReplayClient } from './client.mjs';
import { createRewriter, normalizeForDiff } from './rewrite.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(HERE, 'fixtures');
const OUT_DIR = path.join(HERE, 'out');
const BASELINE_PATH = path.join(HERE, 'baseline.json');
const SERVER_PATH = path.join(HERE, '../../dist/mcp-server-main.js');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const WRITE_BASELINE = args.includes('--write-baseline');
// Live-archive mode: preserve the recorded randomStimulus/provocation values
// instead of rewriting them to the fresh plan's assignment. The rewrite keeps
// the mismatch gate coherent for synthetic fixtures, but it ERASES caller
// deviation — exactly the evidence an effect analysis of a live CT_CALL_LOG
// archive needs to observe. (Note: batch-collected calls append to the log in
// completion order, not causal order — sequence-sensitive analysis over
// archives must tolerate that.)
const KEEP_RECORDED_STIMULI = args.includes('--keep-recorded-stimuli');

async function replayFixture(fixtureFile) {
  const lines = readFileSync(path.join(FIXTURES_DIR, fixtureFile), 'utf8')
    .split('\n')
    .filter(l => l.trim());
  // A live CT_CALL_LOG interleaves `kind: 'call'` and `kind: 'result'` lines;
  // only the calls are replayable. Fixtures recorded before the result lines
  // existed carry no `kind` at all, so absence means call.
  const calls = lines.map(l => JSON.parse(l)).filter(entry => entry.kind !== 'result');

  const client = new ReplayClient({ serverPath: SERVER_PATH });
  await client.connect();
  const rewriter = createRewriter({ keepRecordedStimuli: KEEP_RECORDED_STIMULI });
  const records = [];

  try {
    for (let i = 0; i < calls.length; i++) {
      const { tool, arguments: recordedArgs } = calls[i];
      const sentArgs = rewriter.rewriteArgs(tool, recordedArgs);
      const { rawText, parsed, isError } = await client.call(tool, sentArgs);
      rewriter.observeResponse(tool, parsed);
      // A failed plan call cascades: every later execute keeps its dead
      // recorded planId and degrades into workflow-guard errors that look
      // like intentional refusals in the counts. Name it when it happens.
      if (tool === 'plan_thinking_session' && typeof parsed?.planId !== 'string') {
        process.stderr.write(
          `  WARNING ${fixtureFile} call ${i + 1}: plan_thinking_session returned no planId — subsequent execute calls will cascade into plan-not-found errors\n`
        );
      }
      records.push({ tool, sentArgs, rawText, parsed, isError });
    }
  } finally {
    await client.close();
  }
  return { records, assignedValues: rewriter.assignedValues() };
}

function emissionMetrics(fixtureName, records, assignedValues) {
  const metrics = {
    fixture: fixtureName,
    calls: records.length,
    errors: records.filter(r => r.isError).length,
    // Errors by code, so a plan-failure cascade (E207/E208 on every execute)
    // is distinguishable from a fixture's intentional refusals.
    errorsByCode: {},
    normalizedBytes: 0,
    advisoryFindings: 0,
    assignedStimuli: 0,
    discoveries: [],
  };
  for (const r of records) {
    if (r.isError) {
      const code = r.parsed?.error?.code ?? r.parsed?.code ?? 'uncoded';
      metrics.errorsByCode[code] = (metrics.errorsByCode[code] ?? 0) + 1;
    }
    // Assigned stimuli are fresh draws per run (seeded on the fresh planId),
    // so they must not leak into the byte metric — scrub them to a
    // placeholder alongside ids and timestamps.
    metrics.normalizedBytes += Buffer.byteLength(
      normalizeForDiff(r.parsed ?? r.rawText, assignedValues)
    );
    if (Array.isArray(r.parsed?.advisoryFindings)) {
      metrics.advisoryFindings += r.parsed.advisoryFindings.length;
    }
    if (r.tool === 'plan_thinking_session' && r.parsed) {
      // Response workflow is flat (one row per step); tolerate nested too.
      for (const entry of r.parsed.workflow ?? []) {
        const rows = Array.isArray(entry?.steps) ? entry.steps : [entry];
        for (const step of rows) {
          if (step?.stimulusSource === 'assigned') metrics.assignedStimuli++;
        }
      }
    }
    if (r.tool === 'discover_techniques' && r.parsed && !r.isError) {
      const recs = Array.isArray(r.parsed.recommendations) ? r.parsed.recommendations : [];
      metrics.discoveries.push({
        topPick: recs[0]?.technique ?? null,
        techniques: recs.map(x => x?.technique).filter(Boolean),
        hasEvidenceBreadth: typeof r.parsed.evidenceBreadth === 'number',
        hasScoreBreakdown: recs.some(x => x?.scoreBreakdown),
        hasScoreProvenance: recs.some(x => typeof x?.scoreProvenance === 'string'),
      });
    }
  }
  return metrics;
}

function checkAgainstBaseline(baseline, current) {
  const failures = [];
  const baseFixtures = new Map(baseline.fixtures.map(f => [f.fixture, f]));
  // Structural currency: the fixture sets must match, or the baseline is stale.
  const currentNames = current.fixtures.map(f => f.fixture).sort();
  const baseNames = [...baseFixtures.keys()].sort();
  if (JSON.stringify(currentNames) !== JSON.stringify(baseNames)) {
    failures.push(
      `fixture set changed (baseline: ${baseNames.join(', ')} | current: ${currentNames.join(', ')}) — regenerate the baseline deliberately`
    );
    return failures;
  }
  for (const cur of current.fixtures) {
    const base = baseFixtures.get(cur.fixture);
    if (cur.errors > base.errors) {
      failures.push(`${cur.fixture}: errors ${base.errors} → ${cur.errors}`);
    }
    if (cur.normalizedBytes > base.normalizedBytes * 1.2) {
      failures.push(
        `${cur.fixture}: normalized response bytes grew >20% (${base.normalizedBytes} → ${cur.normalizedBytes})`
      );
    }
    // Emission floors: the steering signals this harness exists to measure
    // must never silently drop below the baseline. Upward moves regenerate
    // the baseline deliberately; downward moves are the regression class the
    // ratchet is FOR (a re-broken response flattener would otherwise shrink
    // responses and pass every other check).
    if (cur.advisoryFindings < (base.advisoryFindings ?? 0)) {
      failures.push(
        `${cur.fixture}: advisory findings emitted dropped ${base.advisoryFindings} → ${cur.advisoryFindings}`
      );
    }
    if (cur.assignedStimuli < (base.assignedStimuli ?? 0)) {
      failures.push(
        `${cur.fixture}: assigned stimuli dropped ${base.assignedStimuli} → ${cur.assignedStimuli}`
      );
    }
    const basePicks = base.discoveries.map(d => d.topPick);
    const curPicks = cur.discoveries.map(d => d.topPick);
    if (JSON.stringify(basePicks) !== JSON.stringify(curPicks)) {
      failures.push(
        `${cur.fixture}: discovery top pick flipped (${basePicks.join(',')} → ${curPicks.join(',')}) — determinism regression or deliberate rescoring; if deliberate, regenerate the baseline`
      );
    }
    for (let i = 0; i < cur.discoveries.length; i++) {
      const baseD = base.discoveries[i];
      const curD = cur.discoveries[i];
      if (!baseD || !curD) continue;
      for (const flag of ['hasEvidenceBreadth', 'hasScoreBreakdown', 'hasScoreProvenance']) {
        if (baseD[flag] === true && curD[flag] !== true) {
          failures.push(`${cur.fixture}: discovery ${flag} regressed true → false`);
        }
      }
    }
  }
  return failures;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const fixtureFiles = readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.calls.jsonl'))
    .sort();
  if (fixtureFiles.length === 0) {
    console.error('no fixtures found in', FIXTURES_DIR);
    process.exit(1);
  }

  const fixtures = [];
  for (const fixtureFile of fixtureFiles) {
    const name = fixtureFile.replace(/\.calls\.jsonl$/, '');
    process.stderr.write(`replaying ${name}...\n`);
    const { records, assignedValues } = await replayFixture(fixtureFile);
    writeFileSync(
      path.join(OUT_DIR, `${name}.responses.jsonl`),
      records
        .map(r =>
          JSON.stringify({
            tool: r.tool,
            isError: r.isError,
            normalized: normalizeForDiff(r.parsed ?? r.rawText, assignedValues),
          })
        )
        .join('\n') + '\n'
    );
    fixtures.push(emissionMetrics(name, records, assignedValues));
  }

  const result = {
    serverPath: path.relative(path.join(HERE, '../..'), SERVER_PATH),
    fixtures,
    summary: {
      fixtureCount: fixtures.length,
      totalCalls: fixtures.reduce((a, f) => a + f.calls, 0),
      totalErrors: fixtures.reduce((a, f) => a + f.errors, 0),
      totalAdvisoryFindings: fixtures.reduce((a, f) => a + f.advisoryFindings, 0),
      totalAssignedStimuli: fixtures.reduce((a, f) => a + f.assignedStimuli, 0),
    },
  };
  writeFileSync(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify(result.summary, null, 2) + '\n');

  if (WRITE_BASELINE) {
    // Deliberately no timestamp/commit stamp — same rationale as the guidance
    // baseline: the git history of this file is its provenance.
    writeFileSync(BASELINE_PATH, JSON.stringify(result, null, 2) + '\n');
    process.stdout.write(`baseline written: ${path.relative(process.cwd(), BASELINE_PATH)}\n`);
  } else if (CHECK) {
    let baseline;
    try {
      baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    } catch {
      console.error('no baseline.json — run with --write-baseline first');
      process.exit(1);
    }
    const failures = checkAgainstBaseline(baseline, result);
    if (failures.length > 0) {
      console.error('replay ratchet FAILED:');
      for (const f of failures) console.error(`  - ${f}`);
      process.exit(1);
    }
    process.stdout.write('replay ratchet passed\n');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
