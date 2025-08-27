/**
 * Tests for PerceptionOptimizationHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerceptionOptimizationHandler } from '../../techniques/PerceptionOptimizationHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('PerceptionOptimizationHandler', () => {
  let handler: PerceptionOptimizationHandler;

  beforeEach(() => {
    handler = new PerceptionOptimizationHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Perception Optimization');
      expect(info.emoji).toBe('👁️');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toContain('Enhance subjective experience');
      expect(info.focus).toContain('disproportionate value');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('perceptual');
      expect(info.reflexivityProfile?.overallReversibility).toBe('low');
      expect(info.reflexivityProfile?.riskLevel).toBe('medium');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Perception Mapping');
      expect(step1.emoji).toBe('🗺️');
      expect(step1.type).toBe('thinking');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Value Amplification');
      expect(step2.emoji).toBe('💎');
      expect(step2.type).toBe('thinking');
      expect(step2.reflexiveEffects?.reversibility).toBe('medium');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Experience Design');
      expect(step3.emoji).toBe('✨');
      expect(step3.type).toBe('action');
      expect(step3.reflexiveEffects?.reversibility).toBe('low');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Psychological Value Creation');
      expect(step4.emoji).toBe('🧠');
      expect(step4.type).toBe('action');
      expect(step4.reflexiveEffects?.reversibility).toBe('low');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Perception Activation');
      expect(step5.emoji).toBe('🚀');
      expect(step5.type).toBe('action');
      expect(step5.reflexiveEffects?.reversibility).toBe('very_low');
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
    const problem = 'Make our service feel more premium';

    it('should provide guidance for step 1 - Perception Mapping', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Perception Mapping');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('objective');
      expect(guidance).toContain('PERCEIVED');
      expect(guidance).toContain('Uber');
      expect(guidance).toContain('Sutherland');
    });

    it('should provide guidance for step 2 - Value Amplification', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Value Amplification');
      expect(guidance).toContain('Attention Direction');
      expect(guidance).toContain('Comparison Management');
      expect(guidance).toContain('Non-Linear Perception');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 3 - Experience Design', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Experience Design');
      expect(guidance).toContain('Peak-End Rule');
      expect(guidance).toContain('Duration Neglect');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 4 - Psychological Value Creation', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Psychological Value Creation');
      expect(guidance).toContain('Status Enhancement');
      expect(guidance).toContain('Identity');
      expect(guidance).toContain('meaning');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 5 - Perception Activation', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Perception Activation');
      expect(guidance).toContain('Perception ROI');
      expect(guidance).toContain('Net Promoter Score');
      expect(guidance).toContain('Very High Reflexivity');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(5, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(6, {})).toBe(false);
    });

    it('should validate perception gaps for step 1', () => {
      const validData = {
        perceptionGaps: [
          {
            objective: 'Fast delivery (2 days)',
            perceived: 'Slow service',
            gapSize: 'large',
            leverageOpportunity: 'high',
          },
        ],
      };
      expect(handler.validateStep(1, validData)).toBe(true);

      const invalidData1 = {
        perceptionGaps: 'not an array',
      };
      expect(handler.validateStep(1, invalidData1)).toBe(false);

      const invalidData2 = {
        perceptionGaps: [
          {
            objective: 'Test',
            perceived: 'Test',
            gapSize: 'invalid_size',
            leverageOpportunity: 'high',
          },
        ],
      };
      expect(handler.validateStep(1, invalidData2)).toBe(false);

      const invalidData3 = {
        perceptionGaps: [
          {
            objective: 'Test',
            perceived: 'Test',
            gapSize: 'large',
            leverageOpportunity: 'invalid_leverage',
          },
        ],
      };
      expect(handler.validateStep(1, invalidData3)).toBe(false);
    });

    it('should validate perception ROI for step 5', () => {
      const validData = {
        perceptionROI: 15.5,
      };
      expect(handler.validateStep(5, validData)).toBe(true);

      const invalidData1 = {
        perceptionROI: -5,
      };
      expect(handler.validateStep(5, invalidData1)).toBe(false);

      const invalidData2 = {
        perceptionROI: 'not a number',
      };
      expect(handler.validateStep(5, invalidData2)).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from history with perception gaps', () => {
      const history = [
        {
          output: 'Gaps identified',
          perceptionGaps: [
            {
              objective: 'Fast',
              perceived: 'Slow',
              gapSize: 'massive',
              leverageOpportunity: 'very_high',
            },
            {
              objective: 'Quality',
              perceived: 'Average',
              gapSize: 'large',
              leverageOpportunity: 'high',
            },
            {
              objective: 'Price',
              perceived: 'Expensive',
              gapSize: 'medium',
              leverageOpportunity: 'low',
            },
          ],
        },
        {
          output: 'Value amplified',
          valueAmplification: { strategy: 'Focus on speed perception' },
        },
        { output: 'Experience designed', experienceDesign: { peaks: 'Onboarding and delivery' } },
        { output: 'Psychology added', psychologicalValue: { layers: 'Status and belonging' } },
        { output: 'Activated', perceptionROI: 25 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('2 major perception gaps'))).toBe(true);
      expect(insights.some(i => i.includes('Value amplification strategy'))).toBe(true);
      expect(insights.some(i => i.includes('Peak experiences designed'))).toBe(true);
      expect(insights.some(i => i.includes('Psychological value layers'))).toBe(true);
      expect(insights.some(i => i.includes('Exceptional perception ROI: 25x'))).toBe(true);
      expect(insights.some(i => i.includes('subjective value dramatically enhanced'))).toBe(true);
    });

    it('should handle low ROI', () => {
      const history = [{ output: 'Activated', perceptionROI: 5 }];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Exceptional perception ROI'))).toBe(false);
    });

    it('should handle partial history', () => {
      const history = [
        {
          output: 'Gaps analyzed',
          perceptionGaps: [
            { objective: 'Test', perceived: 'Test', gapSize: 'small', leverageOpportunity: 'low' },
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('major perception gaps'))).toBe(false);
      expect(insights.some(i => i.includes('dramatically enhanced'))).toBe(false);
    });
  });
});
