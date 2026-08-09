#!/usr/bin/env node
/**
 * Regenerate src/evals/baseline.json from the current handlers.
 *
 *   npm run build && npm run evals:baseline
 *
 * The baseline is a ratchet, not a mirror: `guidanceMetrics.test.ts` asserts
 * that guidance quality has not fallen below it, so it records a previous state
 * on purpose and regenerating it is a deliberate act — do it when guidance has
 * genuinely improved, not to make a failing test pass.
 *
 * It exists because the file was hand-edited. Most of what it holds — every
 * length, the emoji and markdown counts, the whole summary block — is read by
 * nothing and compared against nothing, so a typo in any of them was invisible.
 * The structural facts are now enforced separately: the test checks the
 * baseline's technique list and per-technique step counts against the registry,
 * so a stale baseline fails rather than quietly misreporting.
 *
 * Reads from dist/, so build first.
 */

import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const { analyzeAllTechniques, summarize } = await import(new URL('evals/guidanceMetrics.js', dist));
const { TechniqueRegistry } = await import(new URL('techniques/TechniqueRegistry.js', dist));

function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    // Not a git checkout, or git is unavailable. The field is provenance only.
    return 'unknown';
  }
}

const registry = TechniqueRegistry.getInstance();
const techniques = analyzeAllTechniques(registry);
const summary = summarize(techniques);

const target = fileURLToPath(new URL('../src/evals/baseline.json', import.meta.url));
const baseline = { generatedFrom: currentCommit(), summary, techniques };

writeFileSync(target, `${JSON.stringify(baseline, null, 2)}\n`);

process.stderr.write(
  `baseline regenerated from ${baseline.generatedFrom}: ` +
    `${summary.techniqueCount} techniques, ${summary.totalSteps} steps, ` +
    `interpolation ${summary.overallProblemInterpolationRate}\n`
);
