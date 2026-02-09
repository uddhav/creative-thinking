/**
 * Tests for ContextReframingHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextReframingHandler } from '../../techniques/ContextReframingHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('ContextReframingHandler', () => {
  let handler: ContextReframingHandler;

  beforeEach(() => {
    handler = new ContextReframingHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Context Reframing');
      expect(info.emoji).toBe('🖼️');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toContain('Change decision contexts');
      expect(info.focus).toContain('Environmental and contextual design');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('environmental');
      expect(info.reflexivityProfile?.overallReversibility).toBe('low');
      expect(info.reflexivityProfile?.riskLevel).toBe('high');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Context Analysis');
      expect(step1.emoji).toBe('🗺️');
      expect(step1.type).toBe('thinking');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Intervention Points');
      expect(step2.emoji).toBe('🎯');
      expect(step2.type).toBe('thinking');
      expect(step2.reflexiveEffects?.reversibility).toBe('medium');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Frame Shifting');
      expect(step3.emoji).toBe('🔄');
      expect(step3.type).toBe('action');
      expect(step3.reflexiveEffects?.reversibility).toBe('low');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Environment Design');
      expect(step4.emoji).toBe('🏗️');
      expect(step4.type).toBe('action');
      expect(step4.reflexiveEffects?.reversibility).toBe('low');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Behavioral Activation');
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
    const problem = 'Increase healthy food choices in cafeteria';

    it('should provide guidance for step 1 - Context Analysis', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Context Analysis');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('Physical Context');
      expect(guidance).toContain('Temporal Context');
      expect(guidance).toContain('behavioral influences');
      expect(guidance).toContain('Rationality Audit');
      expect(guidance).toContain('golf with one club');
    });

    it('should provide guidance for step 2 - Intervention Points', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Intervention Points');
      expect(guidance).toContain('leverage points');
      expect(guidance).toContain('Spatial');
      expect(guidance).toContain('Temporal');
      expect(guidance).toContain('Sutherland');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 3 - Frame Shifting', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Frame Shifting');
      expect(guidance).toContain('perception');
      expect(guidance).toContain('Reference Point');
      expect(guidance).toContain('Default');
      expect(guidance).toContain('High Reflexivity');
      expect(guidance).toContain('Dare to Be Trivial');
      expect(guidance).toContain('disproportionate impact');
    });

    it('should provide guidance for step 4 - Environment Design', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Environment Design');
      expect(guidance).toContain('Choice Architecture');
      expect(guidance).toContain('Physical Spaces');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 5 - Behavioral Activation', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Behavioral Activation');
      expect(guidance).toContain('Deploying');
      expect(guidance).toContain('Measurement');
      expect(guidance).toContain('Very High Reflexivity');
      expect(guidance).toContain('Cheap Experiment Validation');
      expect(guidance).toContain('cheapest possible experiment');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(5, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(6, {})).toBe(false);
    });

    it('should validate intervention points for step 2', () => {
      const validData = {
        interventions: [
          {
            type: 'spatial',
            description: 'Move healthy foods to eye level',
            expectedImpact: 'Increase selection by 30%',
            implementationEase: 'easy',
          },
          {
            type: 'temporal',
            description: 'Offer discounts at peak times',
            expectedImpact: 'Shift demand patterns',
            implementationEase: 'moderate',
          },
        ],
      };
      expect(handler.validateStep(2, validData)).toBe(true);

      const invalidData1 = {
        interventions: 'not an array',
      };
      expect(handler.validateStep(2, invalidData1)).toBe(false);

      const invalidData2 = {
        interventions: [
          {
            type: 'invalid_type',
            description: 'Test',
            expectedImpact: 'Test',
            implementationEase: 'easy',
          },
        ],
      };
      expect(handler.validateStep(2, invalidData2)).toBe(false);

      const invalidData3 = {
        interventions: [
          {
            type: 'spatial',
            description: 'Test',
            expectedImpact: 'Test',
            implementationEase: 'invalid_ease',
          },
        ],
      };
      expect(handler.validateStep(2, invalidData3)).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from history', () => {
      const history = [
        { output: 'Context mapped', contextAnalysis: { factors: 'Layout influences choices' } },
        {
          output: 'Interventions identified',
          interventions: [
            {
              type: 'spatial',
              description: 'Rearrange',
              expectedImpact: 'High',
              implementationEase: 'easy',
            },
            {
              type: 'temporal',
              description: 'Timing',
              expectedImpact: 'Medium',
              implementationEase: 'moderate',
            },
          ],
        },
        { output: 'Frame shifted', frameShift: { newFrame: 'Health as default' } },
        { output: 'Environment designed', environmentDesign: { changes: 'Complete redesign' } },
        { output: 'Activated', behavioralMetrics: { changeRate: 0.35 } },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Current context mapped'))).toBe(true);
      expect(insights.some(i => i.includes('2 high-impact context interventions'))).toBe(true);
      expect(insights.some(i => i.includes('Frame shifting strategy'))).toBe(true);
      expect(insights.some(i => i.includes('Decision environment architected'))).toBe(true);
      expect(insights.some(i => i.includes('Behavioral activation metrics'))).toBe(true);
      expect(insights.some(i => i.includes('environment redesigned'))).toBe(true);
    });

    it('should handle partial history', () => {
      const history = [{ output: 'Context analyzed', contextAnalysis: {} }];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Current context mapped'))).toBe(true);
      expect(insights.some(i => i.includes('environment redesigned'))).toBe(false);
    });

    it('should detect behavioral change metrics', () => {
      const history = [{ output: 'behavioral change rate: 45%' }];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Behavioral activation metrics'))).toBe(true);
    });
  });
});
