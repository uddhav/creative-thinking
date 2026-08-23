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

async function replayFixture(fixtureFile) {
  const lines = readFileSync(path.join(FIXTURES_DIR, fixtureFile), 'utf8')
    .split('\n')
    .filter(l => l.trim());
  const calls = lines.map(l => JSON.parse(l));

  const client = new ReplayClient({ serverPath: SERVER_PATH });
  await client.connect();
  const rewriter = createRewriter();
  const records = [];

  try {
    for (const { tool, arguments: recordedArgs } of calls) {
      const sentArgs = rewriter.rewriteArgs(tool, recordedArgs);
      const { rawText, parsed, isError } = await client.call(tool, sentArgs);
      rewriter.observeResponse(tool, parsed);
      records.push({ tool, sentArgs, rawText, parsed, isError });
    }
  } finally {
    await client.close();
  }
  return records;
}

function emissionMetrics(fixtureName, records) {
  const metrics = {
    fixture: fixtureName,
    calls: records.length,
    errors: records.filter(r => r.isError).length,
    normalizedBytes: 0,
    advisoryFindings: 0,
    assignedStimuli: 0,
    discoveries: [],
  };
  for (const r of records) {
    metrics.normalizedBytes += Buffer.byteLength(normalizeForDiff(r.parsed ?? r.rawText));
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
    const basePicks = base.discoveries.map(d => d.topPick);
    const curPicks = cur.discoveries.map(d => d.topPick);
    if (JSON.stringify(basePicks) !== JSON.stringify(curPicks)) {
      failures.push(
        `${cur.fixture}: discovery top pick flipped (${basePicks.join(',')} → ${curPicks.join(',')}) — determinism regression or deliberate rescoring; if deliberate, regenerate the baseline`
      );
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
    const records = await replayFixture(fixtureFile);
    writeFileSync(
      path.join(OUT_DIR, `${name}.responses.jsonl`),
      records
        .map(r =>
          JSON.stringify({
            tool: r.tool,
            isError: r.isError,
            normalized: normalizeForDiff(r.parsed ?? r.rawText),
          })
        )
        .join('\n') + '\n'
    );
    fixtures.push(emissionMetrics(name, records));
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
