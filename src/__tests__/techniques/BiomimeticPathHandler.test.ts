/**
 * Tests for BiomimeticPathHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BiomimeticPathHandler } from '../../techniques/BiomimeticPathHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('BiomimeticPathHandler', () => {
  let handler: BiomimeticPathHandler;

  beforeEach(() => {
    handler = new BiomimeticPathHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Biomimetic Path Management');
      expect(info.emoji).toBe('🦠');
      expect(info.totalSteps).toBe(6);
      expect(info.description).toContain('biological solutions');
      expect(info.focus).toContain('evolutionary patterns');
      expect(info.parallelSteps?.canParallelize).toBe(false);
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Immune Response');
      expect(step1.emoji).toBe('🦠');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Evolutionary Variation');
      expect(step2.emoji).toBe('🧬');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Ecosystem Dynamics');
      expect(step3.emoji).toBe('🌿');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Swarm Intelligence');
      expect(step4.emoji).toBe('🐜');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Resilience Patterns');
      expect(step5.emoji).toBe('🔄');

      const step6 = handler.getStepInfo(6);
      expect(step6.name).toBe('Natural Synthesis');
      expect(step6.emoji).toBe('🌱');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(7)).toThrow(ValidationError);

      try {
        handler.getStepInfo(7);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'How to create a self-healing system architecture';

    it('should provide guidance for step 1 - Immune Response', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('immune system thinking');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('antibodies');
      expect(guidance).toContain('memory cells');
    });

    it('should provide guidance for step 2 - Evolutionary Variation', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('evolutionary variation');
      expect(guidance).toContain('mutations');
      expect(guidance).toContain('selection pressures');
      expect(guidance).toContain('fitness');
    });

    it('should provide guidance for step 3 - Ecosystem Dynamics', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('ecosystem dynamics');
      expect(guidance).toContain('symbiotic relationships');
      expect(guidance).toContain('resource flows');
      expect(guidance).toContain('ecological niches');
    });

    it('should provide guidance for step 4 - Swarm Intelligence', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('swarm intelligence');
      expect(guidance).toContain('emergent behaviors');
      expect(guidance).toContain('stigmergic coordination');
      expect(guidance).toContain('collective decision-making');
    });

    it('should provide guidance for step 5 - Resilience Patterns', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('resilience patterns');
      expect(guidance).toContain('redundancy');
      expect(guidance).toContain('modular components');
      expect(guidance).toContain('adaptive cycles');
    });

    it('should provide guidance for step 6 - Natural Synthesis', () => {
      const guidance = handler.getStepGuidance(6, problem);
      expect(guidance).toContain('natural solutions');
      expect(guidance).toContain('biological strategies');
      expect(guidance).toContain('hybrid solution');
      expect(guidance).toContain('biomimetic');
    });
  });

  describe('validateStep', () => {
    it('should validate step 1 data correctly', () => {
      const validData = {
        immuneResponse: 'Pattern recognition system',
        antibodies: ['Solution variant 1', 'Solution variant 2'],
        output: 'Analysis complete',
      };

      expect(handler.validateStep(1, validData)).toBe(true);

      const invalidData = {
        output: 'Missing immune response',
      };

      expect(() => handler.validateStep(1, invalidData)).toThrow(ValidationError);
    });

    it('should validate step 2 data correctly', () => {
      const validData = {
        mutations: ['Variant A', 'Variant B'],
        selectionPressure: 'Performance criteria',
        output: 'Evolution complete',
      };

      expect(handler.validateStep(2, validData)).toBe(true);

      const invalidData = {
        output: 'Missing mutations',
      };

      expect(() => handler.validateStep(2, invalidData)).toThrow(ValidationError);
    });

    it('should validate step 3 data correctly', () => {
      const validData = {
        symbioticRelationships: ['Component A + B', 'Component B + C'],
        ecosystemBalance: 'Resource flow mapped',
        output: 'Ecosystem analyzed',
      };

      expect(handler.validateStep(3, validData)).toBe(true);
    });

    it('should validate step 4 data correctly', () => {
      const validData = {
        swarmBehavior: 'Collective patterns identified',
        emergentPatterns: ['Pattern 1', 'Pattern 2'],
        output: 'Swarm intelligence applied',
      };

      expect(handler.validateStep(4, validData)).toBe(true);
    });

    it('should validate step 5 data correctly', () => {
      const validData = {
        resiliencePatterns: ['Redundancy at critical points'],
        redundancy: 'Backup systems in place',
        output: 'Resilience built',
      };

      expect(handler.validateStep(5, validData)).toBe(true);
    });

    it('should validate step 6 data correctly', () => {
      const validData = {
        naturalSynthesis: 'Integrated biological solution',
        integratedSolution: 'Complete biomimetic system',
        output: 'Synthesis complete',
      };

      expect(handler.validateStep(6, validData)).toBe(true);
    });

    it('should reject invalid step numbers', () => {
      const data = { output: 'test' };
      expect(handler.validateStep(0, data)).toBe(false);
      expect(handler.validateStep(7, data)).toBe(false);
    });

    it('should handle output as string', () => {
      expect(handler.validateStep(1, 'Applied immune system thinking')).toBe(true);
    });
  });

  describe('extractInsights', () => {
    it('reports every required field under its own step name', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Three threat classes matter here.',
          immuneResponse: ['rate-limit abuse', 'credential stuffing'],
        },
        { currentStep: 2, mutations: ['cache-first variant', 'queue-first variant'] },
        { currentStep: 3, symbioticRelationships: ['gateway feeds the cache warmer'] },
        { currentStep: 4, swarmBehavior: ['each worker publishes its own backlog'] },
        { currentStep: 5, resiliencePatterns: ['shed load before the queue fills'] },
        { currentStep: 6, naturalSynthesis: 'Adaptive shedding driven by local signals' },
      ]);

      expect(insights).toContain('Immune Response: rate-limit abuse, credential stuffing');
      expect(insights).toContain(
        'Evolutionary Variation: cache-first variant, queue-first variant'
      );
      expect(insights).toContain('Ecosystem Dynamics: gateway feeds the cache warmer');
      expect(insights).toContain('Swarm Intelligence: each worker publishes its own backlog');
      expect(insights).toContain('Resilience Patterns: shed load before the queue fills');
      expect(insights).toContain('Natural Synthesis: Adaptive shedding driven by local signals');
      expect(insights).toContain('Immune Response: Three threat classes matter here.');
      // No banner: reaching step 6 is not itself a finding.
      expect(insights.some(i => /nature-inspired solution|biomimetic .*complete/i.test(i))).toBe(
        false
      );
    });

    it('reports the alias fields identically to the primary names', () => {
      const primary = handler.extractInsights([
        { currentStep: 1, immuneResponse: ['a'] },
        { currentStep: 2, mutations: ['b'] },
        { currentStep: 3, symbioticRelationships: ['c'] },
        { currentStep: 4, swarmBehavior: ['d'] },
        { currentStep: 5, resiliencePatterns: ['e'] },
        { currentStep: 6, naturalSynthesis: 'f' },
      ]);
      const aliases = handler.extractInsights([
        { currentStep: 1, antibodies: ['a'] },
        { currentStep: 2, selectionPressure: 'b' },
        { currentStep: 3, ecosystemBalance: 'c' },
        { currentStep: 4, emergentPatterns: ['d'] },
        { currentStep: 5, redundancy: ['e'] },
        { currentStep: 6, biologicalStrategies: ['f'] },
      ]);

      expect(aliases).toEqual(primary);
      expect(aliases).toContain('Immune Response: a');
      expect(aliases).toContain('Natural Synthesis: f');
    });

    it('lets a revision supersede the step it revises', () => {
      const insights = handler.extractInsights([
        { currentStep: 1, immuneResponse: ['the first reading'] },
        { currentStep: 2, mutations: ['a later step'] },
        { currentStep: 1, immuneResponse: ['the corrected reading'] },
      ]);

      expect(insights).toContain('Immune Response: the corrected reading');
      expect(insights).not.toContain('Immune Response: the first reading');
      expect(insights).toContain('Evolutionary Variation: a later step');
      expect(insights.some(i => i.startsWith('Ecosystem Dynamics'))).toBe(false);
    });

    it('reports nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 1, output: '   ' }])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 3, symbioticRelationships: [] }])).toEqual([]);
    });

    it('does not cut the output summary at an abbreviation', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Latency held at 40ms vs. 90ms before. The shedding rule is what changed.',
        },
      ]);

      expect(insights[0]).toContain('vs. 90ms before.');
    });
  });
});
