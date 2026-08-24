#!/usr/bin/env node
/**
 * Effect grading over replay output.
 *
 * Mechanical metrics (always): computed from fixtures/*.marks.json against the
 * replayed discovery responses — no model involved.
 *   - discoveryHitRate: fraction of marked fixtures whose discovery top pick
 *     is the technique that produced the marked decisive step.
 *   - discoveryAnyRate: fraction where the decisive technique appears anywhere
 *     in the recommendation set.
 *
 * LLM pass (--llm): one qualitative grade per marked fixture via the Claude
 * CLI with a PINNED model — a different model than any session caller, per the
 * RFC's circularity caveat. Rubric committed at rubric.md; grader model pinned
 * via GRADER_MODEL (default claude-sonnet-5). The call log is ground truth.
 *
 * Requires evals/replay/out/ from a prior run-replay.mjs run.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(HERE, 'fixtures');
const OUT_DIR = path.join(HERE, 'out');
const GRADER_MODEL = process.env.GRADER_MODEL || 'claude-sonnet-5';
const LLM = process.argv.includes('--llm');

function loadMarks() {
  return readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.marks.json'))
    .map(f => ({
      fixture: f.replace(/\.marks\.json$/, ''),
      marks: JSON.parse(readFileSync(path.join(FIXTURES_DIR, f), 'utf8')),
    }));
}

function main() {
  const metricsPath = path.join(OUT_DIR, 'metrics.json');
  if (!existsSync(metricsPath)) {
    console.error('no out/metrics.json — run run-replay.mjs first');
    process.exit(1);
  }
  const metrics = JSON.parse(readFileSync(metricsPath, 'utf8'));
  const marked = loadMarks();

  const perFixture = [];
  for (const { fixture, marks } of marked) {
    const fm = metrics.fixtures.find(f => f.fixture === fixture);
    if (!fm) {
      // Structural currency, mirroring run-replay's fixture-set guard: a
      // marked fixture absent from metrics.json means out/ is stale (fixture
      // added after the last replay) — silently skipping it would compute
      // RFC-bound rates over the wrong fixture set.
      console.error(
        `grade: marked fixture "${fixture}" is not in out/metrics.json — out/ is stale; re-run run-replay.mjs first`
      );
      process.exit(1);
    }
    const decisiveTechniques = (marks.decisiveSteps ?? []).map(d => d.technique);
    const discovery = fm.discoveries[0];
    const graded = {
      fixture,
      markedBy: marks.markedBy ?? 'unknown',
      decisiveTechniques,
      topPick: discovery?.topPick ?? null,
      topPickHit: decisiveTechniques.includes(discovery?.topPick),
      inSetHit: decisiveTechniques.some(t => (discovery?.techniques ?? []).includes(t)),
    };
    if (LLM) graded.llm = llmGrade(fixture, marks);
    perFixture.push(graded);
  }

  if (perFixture.length === 0) {
    // Zero marked fixtures is an error, not a confident 0.0 — rates over an
    // empty set are not measurements.
    console.error('grade: no marked fixtures matched — nothing to grade');
    process.exit(1);
  }
  const denom = perFixture.length;
  const grades = {
    graderModel: LLM ? GRADER_MODEL : null,
    discoveryHitRate: perFixture.filter(g => g.topPickHit).length / denom,
    discoveryAnyRate: perFixture.filter(g => g.inSetHit).length / denom,
    fixtures: perFixture,
  };
  writeFileSync(path.join(OUT_DIR, 'grades.json'), JSON.stringify(grades, null, 2) + '\n');
  process.stdout.write(
    JSON.stringify(
      {
        discoveryHitRate: grades.discoveryHitRate,
        discoveryAnyRate: grades.discoveryAnyRate,
        graded: perFixture.length,
      },
      null,
      2
    ) + '\n'
  );
}

function llmGrade(fixture, marks) {
  const responses = readFileSync(path.join(OUT_DIR, `${fixture}.responses.jsonl`), 'utf8');
  const calls = readFileSync(path.join(FIXTURES_DIR, `${fixture}.calls.jsonl`), 'utf8');
  const rubric = readFileSync(path.join(HERE, 'rubric.md'), 'utf8');
  const prompt = [
    rubric,
    '--- CALL LOG (ground truth: what the caller actually sent) ---',
    calls,
    '--- REPLAYED RESPONSES (normalized) ---',
    responses,
    '--- MARKS ---',
    JSON.stringify(marks),
    'Return ONLY the JSON object the rubric specifies.',
  ].join('\n\n');
  try {
    // cwd is an empty temp dir: the CLI resolves project context (CLAUDE.md,
    // session state) from its cwd, and a grader inheriting ambient project
    // context grades the project's conversation, not the rubric + transcript.
    const isolatedCwd = mkdtempSync(path.join(tmpdir(), 'replay-grader-'));
    const stdout = execFileSync(
      'claude',
      ['-p', '--model', GRADER_MODEL, '--output-format', 'text'],
      {
        input: prompt,
        encoding: 'utf8',
        timeout: 120_000,
        cwd: isolatedCwd,
      }
    );
    const match = stdout.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { error: 'no JSON in grader output' };
  } catch (err) {
    return { error: `grader invocation failed: ${String(err?.message ?? err).slice(0, 200)}` };
  }
}

main();
