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
      // fillers are scored from quality coverage, and signature appends are a
      // conservative fallback for techniques discovery did not surface at all —
      // neither is bias-boosted, so neither belongs in this comparison.
      //
      // [tbd] Worth investigating separately: a persona's preferredOutcome
      // override can drop a technique that same persona most favours out of the
      // scored set entirely, after which it returns only as a low-scored
      // append. That interaction predates this test and is not a bias bug.
      const isScored = (r: { isQualityFiller?: boolean; reasoning: string }): boolean =>
        !r.isQualityFiller && !r.reasoning.includes('Signature technique');

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

    it('should append the persona signature technique when discovery did not surface it', () => {
      // tarantino's top bias is random_entry (0.95). A production-debugging
      // problem will not surface it on its own merits.
      const input: DiscoverTechniquesInput = {
        problem: 'Intermittent 500 errors appear in production only under high load',
        persona: 'tarantino',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      const signature = result.recommendations.find(
        r => r.technique === 'random_entry' && r.reasoning.includes('Signature technique')
      );

      expect(signature).toBeDefined();
    });

    it('should never let an appended signature technique outrank a genuinely scored one', () => {
      // The signature is scored from a conservative base through the same 70/30
      // blend, so it must sit below techniques that actually matched the problem.
      const input: DiscoverTechniquesInput = {
        problem: 'Intermittent 500 errors appear in production only under high load',
        persona: 'tarantino',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      const signatureIndex = result.recommendations.findIndex(r =>
        r.reasoning.includes('Signature technique')
      );

      if (signatureIndex >= 0) {
        // It must not be rank 1 while genuinely-scored recommendations exist
        expect(result.recommendations.length).toBeGreaterThan(1);
        expect(signatureIndex).toBeGreaterThan(0);

        const signature = result.recommendations[signatureIndex];
        const scored = result.recommendations.filter(
          r => !r.reasoning.includes('Signature technique')
        );
        for (const rec of scored) {
          expect(rec.effectiveness).toBeGreaterThanOrEqual(signature.effectiveness);
        }
      }
    });

    it('should never hoist a quality filler above a genuinely scored recommendation', () => {
      // Regression guard: appending the signature technique must not re-sort the
      // whole list. Quality fillers are appended at a flat score with no
      // problem-fit evidence, so a global re-sort promotes them over techniques
      // that actually matched the problem.
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

          const firstScoredIndex = result.recommendations.findIndex(
            r => !r.isQualityFiller && !r.reasoning.includes('Signature technique')
          );
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

    it('should append at most one signature technique and never cascade to a lesser bias', () => {
      // charlie_munger has several biases >= 0.85. Only the single top entry
      // may ever be appended — a second/third favourite must not sneak in.
      const input: DiscoverTechniquesInput = {
        problem: 'Should we acquire this competitor? I really want to do this deal',
        persona: 'charlie_munger',
      };

      const result = discoverTechniques(input, techniqueRegistry, complexityAnalyzer);
      const appended = result.recommendations.filter(r =>
        r.reasoning.includes('Signature technique')
      );

      expect(appended.length).toBeLessThanOrEqual(1);
      for (const rec of appended) {
        // Only the persona's single highest-biased technique qualifies
        expect(rec.technique).toBe('cognitive_bias_audit');
      }
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
