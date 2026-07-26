/**
 * Guards the recommender's fit scores against reintroduced false precision.
 *
 * These scores are hand-authored judgement, not measurement — nothing has
 * benchmarked whether `triz` beats `scamper` on technical problems. Written as
 * free decimals they drift: `effectiveness` had reached SIXTEEN distinct values
 * including 0.82, 0.83, 0.84, 0.85, 0.86 and 0.98, gaps no author could justify
 * if asked. A dead `EFFECTIVENESS_SCORES` table sat in the class unused the
 * whole time, which is the tell — someone saw the problem and wrote the fix,
 * but nothing enforced it, so every call site kept inventing its own decimal.
 *
 * This pins the vocabulary rather than the values. Changing a technique's
 * standing means moving it a named tier; it must not mean inventing a decimal.
 *
 * SCOPE: deliberately limited to `effectiveness`. An earlier version also
 * forced the technique profile tables (TechniqueScorer, HumanisticQualityCoverage,
 * ergodicity) onto a 0.1 grid. That was measured and rejected — snapping their
 * six off-grid values changed the top recommendation in real scenarios, with
 * `cognitive_bias_audit` and `latticework` both losing first place, for purely
 * cosmetic consistency. Removing a fake decimal is not worth degrading a real
 * ranking, so those tables keep their values and carry provenance comments
 * instead.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { TECHNIQUE_FIT } from '../../../layers/discovery/TechniqueRecommender.js';

const MAX_TIERS = 6;

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
}

describe('Ordinal fit scale', () => {
  it('exposes few, distinct, strictly descending tiers', () => {
    const tiers = Object.values(TECHNIQUE_FIT);

    expect(
      tiers.length,
      `${tiers.length} tiers defined. More tiers is how the original sixteen ` +
        'values accumulated — add one only if a genuinely new rank is needed.'
    ).toBeLessThanOrEqual(MAX_TIERS);

    expect(new Set(tiers).size, 'two tiers share a value').toBe(tiers.length);
    expect(tiers, 'tiers must be declared highest-first').toEqual([...tiers].sort((a, b) => b - a));
  });

  it('keeps every tier inside the unit interval', () => {
    for (const [name, value] of Object.entries(TECHNIQUE_FIT)) {
      expect(value, `TECHNIQUE_FIT.${name}`).toBeGreaterThan(0);
      expect(value, `TECHNIQUE_FIT.${name}`).toBeLessThanOrEqual(1);
    }
  });

  it('never lets a raw decimal back into recommender effectiveness', () => {
    const source = readSource('../../../layers/discovery/TechniqueRecommender.ts');

    // Any `effectiveness: <number>` is a literal that bypassed the scale.
    // Assignments via `TECHNIQUE_FIT.X` do not match this pattern.
    const rawLiterals = [...source.matchAll(/effectiveness:\s*(-?\d*\.?\d+)/g)].map(m => m[1]);

    expect(
      rawLiterals,
      `Raw effectiveness literals found: ${rawLiterals.join(', ')}. ` +
        'Use a TECHNIQUE_FIT tier — a fresh decimal claims precision nobody has.'
    ).toEqual([]);
  });

  it('does not reintroduce the dead parallel scale', () => {
    const source = readSource('../../../layers/discovery/TechniqueRecommender.ts');

    // EFFECTIVENESS_SCORES was declared and never referenced, so the literals
    // drifted freely beside it. Two competing scales is how that happens.
    expect(
      source.includes('EFFECTIVENESS_SCORES = {'),
      'A second, unused scoring scale is back. One scale, actually used, or none.'
    ).toBe(false);
  });
});
