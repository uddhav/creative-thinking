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

  describe('getPromptContext', () => {
    it('should return correct context for each step', () => {
      const context1 = handler.getPromptContext(1);
      expect(context1.technique).toBe('biomimetic_path');
      expect(context1.step).toBe(1);
      expect(context1.stepName).toBe('Immune Response');

      const context4 = handler.getPromptContext(4);
      expect(context4.step).toBe(4);
      expect(context4.stepName).toBe('Swarm Intelligence');
      expect(context4.capabilities).toBeDefined();
    });
  });
});
