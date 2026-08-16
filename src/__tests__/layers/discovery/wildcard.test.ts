/**
 * Wildcard selection is deterministic per problem, varied across problems.
 *
 * It used to be Math.random(): one discover call in five grew 1–2 extra
 * techniques, so the same problem got different recommendation sets run to
 * run — untestable, and indistinguishable from a routing change. The draw is
 * now seeded from the category and the chosen set.
 *
 * The previous tests here asserted the old statistical contract (identical
 * calls sometimes differing across 100 iterations) and forced draws by
 * mocking Math.random, with every property assertion inside `if (wildcard)` —
 * conditionally vacuous. These assert the new contract unconditionally: a
 * sweep over many distinct inputs must find wildcards on some and not others,
 * every draw must repeat exactly, and the found wildcards carry the
 * properties the old tests only checked when luck produced one.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  TechniqueRecommender,
  TECHNIQUE_FIT,
} from '../../../layers/discovery/TechniqueRecommender.js';
import { TechniqueRegistry } from '../../../techniques/TechniqueRegistry.js';

const CATEGORIES = [
  'paradoxical',
  'temporal',
  'organizational',
  'validation',
  'behavioral',
  'fundamental',
  'learning',
  'computational',
  'cognitive',
  'implementation',
  'systems',
  'user-centered',
  'technical',
  'creative',
  'process',
  'strategic',
  'decision',
  'communication',
  'cultural',
  'biological',
  'retention',
  'adversarial',
  'general',
];
const OUTCOMES = [undefined, 'innovative', 'systematic', 'risk-aware', 'analytical'] as const;

interface Recommendation {
  technique: string;
  reasoning: string;
  effectiveness: number;
  isWildcard?: boolean;
}

interface SweepEntry {
  category: string;
  outcome: string | undefined;
  recs: Recommendation[];
}

let recommender: TechniqueRecommender;
let registry: TechniqueRegistry;
let sweep: SweepEntry[];

beforeAll(() => {
  recommender = new TechniqueRecommender();
  registry = TechniqueRegistry.getInstance();
  sweep = [];
  for (const category of CATEGORIES) {
    for (const outcome of OUTCOMES) {
      sweep.push({
        category,
        outcome,
        recs: recommender.recommendTechniques(category, outcome, undefined, 'medium', registry),
      });
    }
  }
});

describe('deterministic wildcard selection', () => {
  it('returns the identical recommendation list when called again with the same input', () => {
    // The property Math.random() could never satisfy. Every input, both the
    // set and the order.
    for (const { category, outcome, recs } of sweep) {
      const again = recommender.recommendTechniques(
        category,
        outcome,
        undefined,
        'medium',
        registry
      );
      expect(again, `${category}/${outcome ?? 'no outcome'} differed on repeat`).toEqual(recs);
    }
  });

  it('draws wildcards for some inputs and not others', () => {
    // Seeded ≠ constant: variety across problems is the feature being kept.
    const withWildcard = sweep.filter(s => s.recs.some(r => r.isWildcard === true));
    expect(withWildcard.length, 'no input ever draws a wildcard').toBeGreaterThan(0);
    expect(withWildcard.length, 'every input draws a wildcard').toBeLessThan(sweep.length);
  });

  it('never duplicates an already-recommended technique', () => {
    for (const { category, recs } of sweep) {
      const regular = recs.filter(r => !r.isWildcard).map(r => r.technique);
      for (const wildcard of recs.filter(r => r.isWildcard === true)) {
        expect(regular, `${category}: wildcard duplicates a recommendation`).not.toContain(
          wildcard.technique
        );
      }
    }
  });

  it('labels every wildcard as exploratory, with reasoning and step count', () => {
    const wildcards = sweep.flatMap(s => s.recs.filter(r => r.isWildcard === true));
    // Unconditional: the sweep must have produced some, or the checks below
    // run zero times and this test guards nothing.
    expect(wildcards.length).toBeGreaterThan(0);
    for (const wildcard of wildcards) {
      expect(wildcard.reasoning).toMatch(
        /alternative|wildcard|unexpected|complementary|unconventional/i
      );
      expect(wildcard.reasoning).toContain('steps)');
      expect(wildcard.effectiveness).toBe(TECHNIQUE_FIT.WEAK);
    }
  });

  it('picks different wildcard techniques for different inputs', () => {
    const picked = new Set(
      sweep.flatMap(s => s.recs.filter(r => r.isWildcard === true).map(r => r.technique))
    );
    // Anti-pigeonholing requires the pool to actually vary; one constant
    // technique would satisfy every other test here.
    expect(picked.size).toBeGreaterThanOrEqual(3);
  });

  it('respects the WILDCARD_PROBABILITY environment variable at both extremes', () => {
    const originalEnv = process.env.WILDCARD_PROBABILITY;

    // 1.0: the seeded unit draw is always < 1, so every input draws.
    process.env.WILDCARD_PROBABILITY = '1.0';
    const alwaysRecommender = new TechniqueRecommender();
    for (const category of ['process', 'strategic', 'creative']) {
      const recs = alwaysRecommender.recommendTechniques(
        category,
        undefined,
        undefined,
        'low',
        registry
      );
      expect(
        recs.some(r => r.isWildcard === true),
        `${category} drew no wildcard at 1.0`
      ).toBe(true);
    }

    // 0.0: the draw is always >= 0, so no input draws.
    process.env.WILDCARD_PROBABILITY = '0.0';
    const neverRecommender = new TechniqueRecommender();
    for (const category of ['organizational', 'technical', 'general']) {
      const recs = neverRecommender.recommendTechniques(
        category,
        undefined,
        undefined,
        'high',
        registry
      );
      expect(
        recs.some(r => r.isWildcard === true),
        `${category} drew a wildcard at 0.0`
      ).toBe(false);
    }

    if (originalEnv !== undefined) {
      process.env.WILDCARD_PROBABILITY = originalEnv;
    } else {
      delete process.env.WILDCARD_PROBABILITY;
    }
  });

  it('sizes the recommendation list by tier', () => {
    // Range assertions only — how many wildcards ride along is the seed's
    // business; the base count is the tier's.
    const high = recommender.recommendTechniques(
      'strategic',
      'systematic',
      ['time constraint'],
      'high',
      registry
    );
    expect(high.length).toBeGreaterThanOrEqual(5);
    expect(high.length).toBeLessThanOrEqual(9);
    expect(high.filter(r => r.isWildcard === true).length).toBeLessThanOrEqual(2);

    const low = recommender.recommendTechniques('strategic', 'systematic', [], 'low', registry);
    expect(low.length).toBeLessThanOrEqual(4);
  });
});
