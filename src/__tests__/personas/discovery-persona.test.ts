import { describe, it, expect } from 'vitest';
import { discoverTechniques } from '../../layers/discovery.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import type { DiscoverTechniquesInput } from '../../types/planning.js';

describe('Discovery Layer - Persona Integration', () => {
  const techniqueRegistry = TechniqueRegistry.getInstance();
  const complexityAnalyzer = new HybridComplexityAnalyzer();

  describe('single persona', () => {
    it('should return personaContext when persona is provided', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to simplify our microservice architecture',
        persona: 'rich_hickey',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      expect(result.personaContext).toBeDefined();
      const ctx = result.personaContext;
      expect(ctx?.activePersonas).toHaveLength(1);
      expect(ctx?.activePersonas[0].id).toBe('rich_hickey');
      expect(ctx?.activePersonas[0].name).toBe('Rich Hickey');
      expect(ctx?.isDebateMode).toBe(false);
    });

    it('should apply persona technique bias to recommendations', () => {
      // Rich Hickey biases toward first_principles (0.95), triz (0.8), etc.
      const withPersona: DiscoverTechniquesInput = {
        problem: 'How to simplify our architecture',
        persona: 'rich_hickey',
      };

      const withoutPersona: DiscoverTechniquesInput = {
        problem: 'How to simplify our architecture',
      };

      const resultWith = discoverTechniques(withPersona, techniqueRegistry, complexityAnalyzer);
      const resultWithout = discoverTechniques(
        withoutPersona,
        techniqueRegistry,
        complexityAnalyzer
      );

      // Find any technique that exists in Rich Hickey's bias in both results
      const biasedTechniques = [
        'first_principles',
        'paradoxical_problem',
        'triz',
        'concept_extraction',
      ];
      let foundMatch = false;

      // Only genuinely-scored recommendations carry persona bias. Quality
      // fillers are scored from quality coverage rather than problem fit, so
      // they do not belong in this comparison.
      const isScored = (r: { isQualityFiller?: boolean }): boolean => !r.isQualityFiller;

      for (const technique of biasedTechniques) {
        const withRec = resultWith.recommendations.find(
          r => r.technique === technique && isScored(r)
        );
        const withoutRec = resultWithout.recommendations.find(
          r => r.technique === technique && isScored(r)
        );

        if (withRec && withoutRec) {
          // With persona bias, the technique should have higher or equal effectiveness
          expect(withRec.effectiveness).toBeGreaterThanOrEqual(withoutRec.effectiveness);
          foundMatch = true;
          break;
        }
      }

      // At least one biased technique should be present in both result sets
      expect(foundMatch).toBe(true);
    });

    it('should never hoist a quality filler above a genuinely scored recommendation', () => {
      // Quality fillers are appended at a flat score with no problem-fit
      // evidence. Any global re-sort after they are added promotes them over
      // techniques that actually matched the problem, so nothing downstream of
      // fillCoverageGaps may re-sort the list.
      const problems = [
        'How to simplify our architecture',
        'Intermittent 500 errors appear in production only under high load',
        'How do we grow enterprise market share next year?',
      ];

      for (const persona of ['rich_hickey', 'charlie_munger', 'tarantino']) {
        for (const problem of problems) {
          const result = discoverTechniques(
            { problem, persona },
            techniqueRegistry,
            complexityAnalyzer
          );

          const firstScoredIndex = result.recommendations.findIndex(r => !r.isQualityFiller);
          const firstFillerIndex = result.recommendations.findIndex(r => r.isQualityFiller);

          if (firstScoredIndex >= 0 && firstFillerIndex >= 0) {
            expect(
              firstScoredIndex,
              `quality filler outranked a scored technique for ${persona} / "${problem}"`
            ).toBeLessThan(firstFillerIndex);
          }
        }
      }
    });

    it('should recommend a decision technique on merit, without persona machinery', () => {
      // The case that once motivated injecting a persona's signature technique.
      // Category routing now surfaces it on its own, so no persona is needed
      // and nothing is appended out of band.
      const input: DiscoverTechniquesInput = {
        problem: 'Should we acquire this competitor? I really want to do this deal',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      const audit = result.recommendations.find(r => r.technique === 'cognitive_bias_audit');

      expect(audit).toBeDefined();
      expect(audit?.isQualityFiller).toBeFalsy();
    });

    it('should use persona preferredOutcome when no explicit preference given', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to improve system reliability',
        persona: 'nassim_taleb',
        // No preferredOutcome — should use nassim_taleb's "risk-aware"
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      // Nassim Taleb prefers risk-aware techniques
      expect(result.personaContext).toBeDefined();
      expect(result.personaContext?.activePersonas[0].id).toBe('nassim_taleb');
    });

    it('should respect explicit preferredOutcome over persona preference', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to improve system reliability',
        persona: 'nassim_taleb',
        preferredOutcome: 'innovative', // Override nassim_taleb's "risk-aware"
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      // Should still have persona context
      expect(result.personaContext).toBeDefined();
      expect(result.personaContext?.activePersonas[0].id).toBe('nassim_taleb');
    });

    it('should handle unknown persona gracefully', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Test problem',
        persona: 'nonexistent_person',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      // Should not have persona context since resolution failed
      expect(result.personaContext).toBeUndefined();
      // Should still return recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle custom persona', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to design a new user interface',
        persona: 'custom:UX designer with accessibility focus',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      expect(result.personaContext).toBeDefined();
      expect(result.personaContext?.activePersonas[0].name).toBe(
        'UX designer with accessibility focus'
      );
    });
  });

  describe('multiple personas (debate mode)', () => {
    it('should set isDebateMode when multiple personas are provided', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Should we rewrite the system in Rust?',
        personas: ['rich_hickey', 'joe_armstrong'],
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      expect(result.personaContext).toBeDefined();
      expect(result.personaContext?.isDebateMode).toBe(true);
      expect(result.personaContext?.activePersonas).toHaveLength(2);
    });

    it('should use primary persona bias (first in array) for technique boosting', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to handle system failures',
        personas: ['rich_hickey', 'joe_armstrong'],
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      // Rich Hickey is primary — first_principles should be boosted
      expect(result.personaContext?.activePersonas[0].id).toBe('rich_hickey');
    });

    it('should handle mix of persona and personas', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to design a creative solution',
        persona: 'rory_sutherland',
        personas: ['rich_hickey', 'tarantino'],
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      expect(result.personaContext).toBeDefined();
      // Primary persona is from 'persona' field (rory_sutherland)
      expect(result.personaContext?.activePersonas[0].id).toBe('rory_sutherland');
      // All three should be present
      expect(result.personaContext?.activePersonas).toHaveLength(3);
      expect(result.personaContext?.isDebateMode).toBe(true);
    });

    it('should skip invalid personas in the array', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Test problem',
        personas: ['rich_hickey', 'nonexistent', 'joe_armstrong'],
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      expect(result.personaContext).toBeDefined();
      expect(result.personaContext?.activePersonas).toHaveLength(2);
    });
  });

  describe('no persona', () => {
    it('should not include personaContext when no persona is provided', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'A simple problem to solve',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      expect(result.personaContext).toBeUndefined();
    });

    it('should still produce recommendations without persona', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to improve team collaboration',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
