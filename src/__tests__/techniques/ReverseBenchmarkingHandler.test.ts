/**
 * Tests for ReverseBenchmarkingHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReverseBenchmarkingHandler } from '../../techniques/ReverseBenchmarkingHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('ReverseBenchmarkingHandler', () => {
  let handler: ReverseBenchmarkingHandler;

  beforeEach(() => {
    handler = new ReverseBenchmarkingHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Reverse Benchmarking');
      expect(info.emoji).toBe('🔄');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toContain('Find competitive advantage');
      expect(info.focus).toContain('uncontested market spaces');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('strategic');
      expect(info.reflexivityProfile?.riskLevel).toBe('medium');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Weakness Mapping');
      expect(step1.emoji).toBe('🗺️');
      expect(step1.type).toBe('thinking');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Vacant Space Analysis');
      expect(step2.emoji).toBe('🔍');
      expect(step2.type).toBe('thinking');
      expect(step2.reflexiveEffects?.reversibility).toBe('medium');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Anti-Mimetic Strategy');
      expect(step3.emoji).toBe('🎯');
      expect(step3.type).toBe('action');
      expect(step3.reflexiveEffects?.reversibility).toBe('medium');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Excellence Design');
      expect(step4.emoji).toBe('⭐');
      expect(step4.type).toBe('action');
      expect(step4.reflexiveEffects?.reversibility).toBe('low');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Implementation Path');
      expect(step5.emoji).toBe('🚀');
      expect(step5.type).toBe('action');
      expect(step5.reflexiveEffects?.reversibility).toBe('low');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(6)).toThrow(ValidationError);

      try {
        handler.getStepInfo(6);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Valid steps are 1-5');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'Differentiate our product in a crowded market';

    it('should provide guidance for step 1 - Weakness Mapping', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Weakness Mapping');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('competitors');
      expect(guidance).toContain('universal weaknesses');
      expect(guidance).toContain('11 Madison Park');
    });

    it('should provide guidance for step 2 - Vacant Space Analysis', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Vacant Space Analysis');
      expect(guidance).toContain('opportunity');
      expect(guidance).toContain('value of excelling');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 3 - Anti-Mimetic Strategy', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Anti-Mimetic Strategy');
      expect(guidance).toContain('differentiation');
      expect(guidance).toContain('path independence');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 4 - Excellence Design', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Excellence Design');
      expect(guidance).toContain('mundane');
      expect(guidance).toContain('world-class execution');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 5 - Implementation Path', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Implementation Path');
      expect(guidance).toContain('competitive advantage');
      expect(guidance).toContain('strategic advantage');
      expect(guidance).toContain('High Reflexivity');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(5, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(6, {})).toBe(false);
    });

    it('should validate vacant spaces structure for step 2', () => {
      const validData = {
        vacantSpaces: [
          {
            space: 'Customer service excellence',
            opportunityValue: 'high',
            implementationDifficulty: 'medium',
            whyVacant: 'Industry focuses on price competition',
          },
        ],
      };
      expect(handler.validateStep(2, validData)).toBe(true);

      const invalidData1 = {
        vacantSpaces: 'not an array',
      };
      expect(handler.validateStep(2, invalidData1)).toBe(false);

      const invalidData2 = {
        vacantSpaces: [
          {
            space: 'Test',
            opportunityValue: 'invalid_value',
            implementationDifficulty: 'low',
            whyVacant: 'Test',
          },
        ],
      };
      expect(handler.validateStep(2, invalidData2)).toBe(false);

      const invalidData3 = {
        vacantSpaces: [
          {
            space: 'Test',
            opportunityValue: 'high',
            implementationDifficulty: 'invalid',
            whyVacant: 'Test',
          },
        ],
      };
      expect(handler.validateStep(2, invalidData3)).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from history', () => {
      const history = [
        {
          output: 'Identified weaknesses',
          weaknessMapping: { universalWeaknesses: ['Poor UX', 'Bad support'] },
        },
        {
          output: 'Found opportunities',
          vacantSpaces: [
            {
              space: 'UX excellence',
              opportunityValue: 'very_high',
              implementationDifficulty: 'low',
              whyVacant: 'Ignored',
            },
            {
              space: 'Support quality',
              opportunityValue: 'high',
              implementationDifficulty: 'medium',
              whyVacant: 'Cost focus',
            },
          ],
        },
        { output: 'Strategy designed', antiMimeticStrategy: { differentiationVector: 'UX focus' } },
        { output: 'Excellence defined', excellenceDesign: { area: 'User experience' } },
        { output: 'Implementation ready' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('2 universal competitor weaknesses'))).toBe(true);
      expect(insights.some(i => i.includes('2 high-value vacant spaces'))).toBe(true);
      expect(insights.some(i => i.includes('Anti-mimetic strategy'))).toBe(true);
      expect(insights.some(i => i.includes('Excellence standard defined'))).toBe(true);
      expect(insights.some(i => i.includes('competitive advantage identified'))).toBe(true);
    });

    it('should handle partial history', () => {
      const history = [
        { output: 'Weaknesses mapped', weaknessMapping: { universalWeaknesses: ['Issue 1'] } },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('1 universal competitor weaknesses'))).toBe(true);
      expect(insights.some(i => i.includes('competitive advantage identified'))).toBe(false);
    });

    it('should handle empty vacant spaces', () => {
      const history = [{ output: 'Analyzed', vacantSpaces: [] }];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('high-value vacant spaces'))).toBe(false);
    });
  });
});
