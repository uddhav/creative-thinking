/**
 * Tests for enhanced category mappings and technique recommendations
 * Verifies that underutilized techniques are properly mapped to problem categories
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TechniqueRecommender } from '../../../layers/discovery/TechniqueRecommender.js';
import { ProblemAnalyzer } from '../../../layers/discovery/ProblemAnalyzer.js';
import { TechniqueRegistry } from '../../../techniques/TechniqueRegistry.js';

describe('Enhanced Category Mappings', () => {
  let recommender: TechniqueRecommender;
  let analyzer: ProblemAnalyzer;
  let registry: TechniqueRegistry;

  beforeEach(() => {
    recommender = new TechniqueRecommender();
    analyzer = new ProblemAnalyzer();
    registry = new TechniqueRegistry();
  });

  describe('ProblemAnalyzer - Enhanced Category Detection', () => {
    describe('Fundamental/First Principles Category', () => {
      it('should detect fundamental problems from keywords', () => {
        const testCases = [
          'What are the fundamental principles of this system?',
          'Break this down to basic components',
          'What is the core issue here?',
          'Find the essential elements',
          'What is the foundation of this approach?',
          'Identify the root cause of the problem',
        ];

        testCases.forEach(problem => {
          const category = analyzer.categorizeProblem(problem);
          expect(category).toBe('fundamental');
        });
      });

      it('should detect first principles technique request explicitly', () => {
        const category = analyzer.categorizeProblem('Use first principles thinking to solve this');
        expect(category).toBe('fundamental');
      });
    });

    describe('Behavioral/Psychology Category', () => {
      it('should detect behavioral problems from keywords', () => {
        const testCases = [
          'How can we influence customer behavior?',
          'Optimize the perception of value',
          'Create psychological incentives',
          'Design a nudge for better choices',
          'Understanding user psychology',
        ];

        testCases.forEach(problem => {
          const category = analyzer.categorizeProblem(problem);
          expect(category).toBe('behavioral');
        });
      });
    });

    describe('Learning/Adaptive Category', () => {
      it('should detect learning problems from keywords', () => {
        const testCases = [
          'How can we learn from past failures?',
          'Adapt our approach based on feedback',
          'Synthesize patterns from multiple experiences',
          'Evolve our strategy over time',
          'Build knowledge from these observations',
        ];

        testCases.forEach(problem => {
          const category = analyzer.categorizeProblem(problem);
          expect(category).toBe('learning');
        });
      });
    });

    describe('Computational/Algorithmic Category', () => {
      it('should detect computational problems from keywords', () => {
        const testCases = [
          'Design an algorithm to optimize this process',
          'Apply computational modeling',
          'Create a neural network approach',
          'Process these in parallel',
          'Optimize the computational efficiency',
        ];

        testCases.forEach(problem => {
          const category = analyzer.categorizeProblem(problem);
          expect(category).toBe('computational');
        });
      });
    });

    describe('Validation/Verification Category', () => {
      it('should detect validation problems from keywords', () => {
        const testCases = [
          'Verify the truth of these claims',
          'Validate the authenticity of this data',
          'Test our hypothesis',
          'Prove this assertion',
          'What evidence supports this?',
        ];

        testCases.forEach(problem => {
          const category = analyzer.categorizeProblem(problem);
          expect(category).toBe('validation');
        });
      });
    });
  });

  describe('TechniqueRecommender - Enhanced Mappings', () => {
    describe('Technical Category Enhancements', () => {
      it('should recommend first_principles for technical problems', () => {
        const recommendations = recommender.recommendTechniques(
          'technical',
          undefined,
          undefined,
          'medium',
          registry
        );

        const firstPrinciples = recommendations.find(r => r.technique === 'first_principles');
        expect(firstPrinciples).toBeDefined();
        expect(firstPrinciples?.reasoning).toContain('fundamental components');
      });

      it('should recommend triz for technical problems', () => {
        const recommendations = recommender.recommendTechniques(
          'technical',
          undefined,
          undefined,
          'medium',
          registry
        );

        const triz = recommendations.find(r => r.technique === 'triz');
        expect(triz).toBeDefined();
        expect(triz?.reasoning).toContain('Systematic innovation');
      });

      it('should recommend biomimetic_path for technical problems', () => {
        // Use high complexity to get more recommendations
        const recommendations = recommender.recommendTechniques(
          'technical',
          undefined,
          undefined,
          'high',
          registry
        );

        const biomimetic = recommendations.find(r => r.technique === 'biomimetic_path');
        expect(biomimetic).toBeDefined();
        expect(biomimetic?.reasoning).toContain('Nature-inspired');
      });
    });

    describe('Creative Category Enhancements', () => {
      it('should recommend perception_optimization for creative problems', () => {
        const recommendations = recommender.recommendTechniques(
          'creative',
          undefined,
          undefined,
          'medium',
          registry
        );

        const perception = recommendations.find(r => r.technique === 'perception_optimization');
        expect(perception).toBeDefined();
        expect(perception?.reasoning).toContain('subjective experience');
      });

      it('should recommend anecdotal_signal for creative problems', () => {
        const recommendations = recommender.recommendTechniques(
          'creative',
          undefined,
          undefined,
          'medium',
          registry
        );

        const anecdotal = recommendations.find(r => r.technique === 'anecdotal_signal');
        expect(anecdotal).toBeDefined();
        expect(anecdotal?.reasoning).toContain('outliers');
      });

      it('should recommend context_reframing for creative problems', () => {
        // Use high complexity to get more recommendations
        const recommendations = recommender.recommendTechniques(
          'creative',
          undefined,
          undefined,
          'high',
          registry
        );

        const context = recommendations.find(r => r.technique === 'context_reframing');
        expect(context).toBeDefined();
        expect(context?.reasoning).toContain('environmental context');
      });
    });

    describe('Process Category Enhancements', () => {
      it('should recommend temporal_work for process problems', () => {
        const recommendations = recommender.recommendTechniques(
          'process',
          undefined,
          undefined,
          'medium',
          registry
        );

        const temporal = recommendations.find(r => r.technique === 'temporal_work');
        expect(temporal).toBeDefined();
        expect(temporal?.reasoning).toContain('timing');
      });

      it('should recommend nine_windows for process problems', () => {
        const recommendations = recommender.recommendTechniques(
          'process',
          undefined,
          undefined,
          'medium',
          registry
        );

        const nineWindows = recommendations.find(r => r.technique === 'nine_windows');
        expect(nineWindows).toBeDefined();
        expect(nineWindows?.reasoning).toContain('process analysis');
      });
    });

    describe('Strategic Category Enhancements', () => {
      it('should recommend perception_optimization for strategic problems', () => {
        const recommendations = recommender.recommendTechniques(
          'strategic',
          undefined,
          undefined,
          'medium',
          registry
        );

        const perception = recommendations.find(r => r.technique === 'perception_optimization');
        expect(perception).toBeDefined();
        expect(perception?.reasoning).toContain('value perception');
      });

      it('should recommend context_reframing for strategic problems', () => {
        const recommendations = recommender.recommendTechniques(
          'strategic',
          undefined,
          undefined,
          'medium',
          registry
        );

        const context = recommendations.find(r => r.technique === 'context_reframing');
        expect(context).toBeDefined();
        expect(context?.reasoning).toContain('competitive environment');
      });

      it('should recommend first_principles for strategic problems', () => {
        // Use high complexity to get more recommendations
        const recommendations = recommender.recommendTechniques(
          'strategic',
          undefined,
          undefined,
          'high',
          registry
        );

        const firstPrinciples = recommendations.find(r => r.technique === 'first_principles');
        expect(firstPrinciples).toBeDefined();
        expect(firstPrinciples?.reasoning).toContain('fundamental market truths');
      });
    });

    describe('Systems Category Enhancements', () => {
      it('should recommend first_principles for systems problems', () => {
        const recommendations = recommender.recommendTechniques(
          'systems',
          undefined,
          undefined,
          'medium',
          registry
        );

        const firstPrinciples = recommendations.find(r => r.technique === 'first_principles');
        expect(firstPrinciples).toBeDefined();
        expect(firstPrinciples?.reasoning).toContain('fundamental components');
      });

      it('should recommend meta_learning for systems problems', () => {
        const recommendations = recommender.recommendTechniques(
          'systems',
          undefined,
          undefined,
          'medium',
          registry
        );

        const metaLearning = recommendations.find(r => r.technique === 'meta_learning');
        expect(metaLearning).toBeDefined();
        expect(metaLearning?.reasoning).toContain('system patterns');
      });
    });

    describe('Communication Category Enhancements', () => {
      it('should recommend perception_optimization for communication problems', () => {
        const recommendations = recommender.recommendTechniques(
          'communication',
          undefined,
          undefined,
          'medium',
          registry
        );

        const perception = recommendations.find(r => r.technique === 'perception_optimization');
        expect(perception).toBeDefined();
        expect(perception?.reasoning).toContain('message perception');
      });
    });

    describe('Organizational Category Enhancements', () => {
      it('should recommend context_reframing for organizational problems', () => {
        const recommendations = recommender.recommendTechniques(
          'organizational',
          undefined,
          undefined,
          'medium',
          registry
        );

        const context = recommendations.find(r => r.technique === 'context_reframing');
        expect(context).toBeDefined();
        expect(context?.reasoning).toContain('organizational');
      });
    });
  });

  describe('Wildcard Selection', () => {
    it('varies the wildcard pick across inputs while repeating exactly per input', () => {
      // Wildcard draws are seeded from the category and chosen set — the old
      // version of this test called the same input 200 times and counted on
      // Math.random() to vary the answer, which is the nondeterminism the
      // seeding removed. Variety now comes from varying the input; the full
      // contract (some draw, some don't; no duplicates; labelling) lives in
      // wildcard.test.ts.
      const originalEnv = process.env.WILDCARD_PROBABILITY;
      process.env.WILDCARD_PROBABILITY = '1.0';
      const alwaysRecommender = new TechniqueRecommender();

      const picks = new Set<string>();
      const categories = [
        'general',
        'strategic',
        'creative',
        'process',
        'organizational',
        'technical',
        'validation',
        'learning',
      ];
      for (const category of categories) {
        const recommendations = alwaysRecommender.recommendTechniques(
          category,
          undefined,
          undefined,
          'medium',
          registry
        );
        const wildcard = recommendations.find(r => r.isWildcard);
        expect(wildcard, `${category} drew no wildcard at probability 1.0`).toBeDefined();
        picks.add(wildcard?.technique ?? '');

        // Per input, the draw repeats exactly.
        const again = alwaysRecommender.recommendTechniques(
          category,
          undefined,
          undefined,
          'medium',
          registry
        );
        expect(again.find(r => r.isWildcard)?.technique).toBe(wildcard?.technique);
      }

      // Across inputs, the pool actually varies.
      expect(picks.size).toBeGreaterThanOrEqual(3);

      if (originalEnv !== undefined) {
        process.env.WILDCARD_PROBABILITY = originalEnv;
      } else {
        delete process.env.WILDCARD_PROBABILITY;
      }
    });
  });

  describe('Multi-factor Scoring Integration', () => {
    it('should apply multi-factor scoring to all recommendations', () => {
      const recommendations = recommender.recommendTechniques(
        'technical',
        'systematic',
        ['limited time', 'budget constraints'],
        'high',
        registry
      );

      // All recommendations should have effectiveness scores
      recommendations.forEach(rec => {
        expect(rec.effectiveness).toBeGreaterThan(0);
        expect(rec.effectiveness).toBeLessThanOrEqual(1);
      });

      // Recommendations should be sorted by effectiveness
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].effectiveness).toBeGreaterThanOrEqual(
          recommendations[i + 1].effectiveness
        );
      }
    });
  });
});
