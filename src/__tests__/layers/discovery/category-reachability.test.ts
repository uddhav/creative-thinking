/**
 * Guards against TechniqueRecommender case groups becoming unreachable.
 *
 * The recommender switches on problem categories, but only ProblemAnalyzer can
 * produce them. When a case group has no producing category, every technique
 * registered there is stranded — silently, with no type error and no test
 * failure. Four groups (decision, communication, cultural, biological) were
 * dead this way, which is why techniques registered under their most on-point
 * category were never recommended.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TechniqueRecommender } from '../../../layers/discovery/TechniqueRecommender.js';
import { ProblemAnalyzer } from '../../../layers/discovery/ProblemAnalyzer.js';
import { TechniqueRegistry } from '../../../techniques/TechniqueRegistry.js';

/**
 * Every category ProblemAnalyzer.categorizeProblem can return. If you add a
 * `return '<category>'` there, add it here too — this list is what proves the
 * recommender actually handles it.
 */
const PRODUCIBLE_CATEGORIES = [
  'behavioral',
  'biological',
  'cognitive',
  'communication',
  'computational',
  'creative',
  'cultural',
  'decision',
  'fundamental',
  'general',
  'implementation',
  'learning',
  'organizational',
  'paradoxical',
  'process',
  'strategic',
  'systems',
  'technical',
  'temporal',
  'user-centered',
  'validation',
] as const;

describe('Discovery category reachability', () => {
  let recommender: TechniqueRecommender;
  let analyzer: ProblemAnalyzer;
  let registry: TechniqueRegistry;

  beforeEach(() => {
    recommender = new TechniqueRecommender();
    analyzer = new ProblemAnalyzer();
    registry = TechniqueRegistry.getInstance();
  });

  it('recommends at least one technique for every producible category', () => {
    for (const category of PRODUCIBLE_CATEGORIES) {
      const recommendations = recommender.recommendTechniques(
        category,
        undefined,
        undefined,
        'medium',
        registry
      );
      expect(
        recommendations.length,
        `category "${category}" produced no recommendations — its case group may be missing`
      ).toBeGreaterThan(0);
    }
  });

  describe('rescue categories reclaim problems that used to fall through to general', () => {
    const cases: Array<{ category: string; problems: string[] }> = [
      {
        category: 'decision',
        problems: [
          'Should we acquire this competitor? I really want to do this deal',
          'Which vendor should we pick for observability?',
          'What are the pros and cons of rewriting the billing service?',
        ],
      },
      {
        category: 'communication',
        problems: ['Explain to the board why the migration slipped'],
      },
      {
        category: 'cultural',
        problems: [
          'How do we handle localization for new markets?',
          'Our culture rewards the wrong things',
        ],
      },
      {
        category: 'biological',
        problems: [
          'What can biomimicry teach us here?',
          'How would a swarm solve this?',
          'Look for symbiosis between the two products',
        ],
      },
    ];

    for (const { category, problems } of cases) {
      for (const problem of problems) {
        it(`routes "${problem.slice(0, 45)}..." to ${category}`, () => {
          expect(analyzer.categorizeProblem(problem)).toBe(category);
        });
      }
    }
  });

  it('surfaces the cognitive bias audit for decision problems', () => {
    const recommendations = recommender.recommendTechniques(
      'decision',
      undefined,
      undefined,
      'medium',
      registry
    );
    expect(recommendations.map(r => r.technique)).toContain('cognitive_bias_audit');
  });
});
