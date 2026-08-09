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
import { fileURLToPath } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const { analyzeAllTechniques, summarize } = await import(new URL('evals/guidanceMetrics.js', dist));
const { TechniqueRegistry } = await import(new URL('techniques/TechniqueRegistry.js', dist));

// No provenance stamp. The file recorded the commit it was generated from,
// which could never name the commit it ships in — the baseline is committed
// inside that commit. It was always one behind, nothing read it, and a number
// that cannot be right is worse than no number.

const registry = TechniqueRegistry.getInstance();
const techniques = analyzeAllTechniques(registry);
const summary = summarize(techniques);

const target = fileURLToPath(new URL('../src/evals/baseline.json', import.meta.url));
const baseline = { summary, techniques };

writeFileSync(target, `${JSON.stringify(baseline, null, 2)}\n`);

process.stderr.write(
  `baseline regenerated: ${summary.techniqueCount} techniques, ` +
    `${summary.totalSteps} steps, interpolation ${summary.overallProblemInterpolationRate}\n`
);
