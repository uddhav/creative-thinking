/**
 * Tests for AnecdotalSignalHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnecdotalSignalHandler } from '../../techniques/AnecdotalSignalHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('AnecdotalSignalHandler', () => {
  let handler: AnecdotalSignalHandler;

  beforeEach(() => {
    handler = new AnecdotalSignalHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Anecdotal Signal Detection');
      expect(info.emoji).toBe('🔍');
      expect(info.totalSteps).toBe(6);
      expect(info.description).toContain('outliers and individual stories');
      expect(info.focus).toContain('non-statistical anecdotal evidence');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('observational');
      expect(info.reflexivityProfile?.overallReversibility).toBe('medium');
      expect(info.reflexivityProfile?.riskLevel).toBe('low');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Anecdote Collection');
      expect(step1.emoji).toBe('📚');
      expect(step1.type).toBe('thinking');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Signal Assessment');
      expect(step2.emoji).toBe('📡');
      expect(step2.type).toBe('thinking');
      expect(step2.reflexiveEffects?.reversibility).toBe('high');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Trajectory Analysis');
      expect(step3.emoji).toBe('📈');
      expect(step3.type).toBe('thinking');
      expect(step3.reflexiveEffects?.reversibility).toBe('medium');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Early Warning Extraction');
      expect(step4.emoji).toBe('⚠️');
      expect(step4.type).toBe('action');
      expect(step4.reflexiveEffects?.reversibility).toBe('medium');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Scaling Projection');
      expect(step5.emoji).toBe('🔮');
      expect(step5.type).toBe('action');
      expect(step5.reflexiveEffects?.reversibility).toBe('low');

      const step6 = handler.getStepInfo(6);
      expect(step6.name).toBe('Strategic Response');
      expect(step6.emoji).toBe('🎯');
      expect(step6.type).toBe('action');
      expect(step6.reflexiveEffects?.reversibility).toBe('low');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(7)).toThrow(ValidationError);

      try {
        handler.getStepInfo(7);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Valid steps are 1-6');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'Detect early signs of market disruption';

    it('should provide guidance for step 1 - Anecdote Collection', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Anecdote Collection');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('outlier');
      expect(guidance).toContain('edge cases');
      expect(guidance).toContain('Sutherland');
      expect(guidance).toContain('Titanic');
    });

    it('should provide guidance for step 2 - Signal Assessment', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Signal Assessment');
      expect(guidance).toContain('signal strength');
      expect(guidance).toContain('noise');
      expect(guidance).toContain('Low Reflexivity');
    });

    it('should provide guidance for step 3 - Trajectory Analysis', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Trajectory Analysis');
      expect(guidance).toContain('ensemble average');
      expect(guidance).toContain('individual path');
      expect(guidance).toContain('Non-Ergodic');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 4 - Early Warning Extraction', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Early Warning Extraction');
      expect(guidance).toContain('early warning signals');
      expect(guidance).toContain('assumption');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 5 - Scaling Projection', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Scaling Projection');
      expect(guidance).toContain('adoption');
      expect(guidance).toContain('mainstream adoption');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 6 - Strategic Response', () => {
      const guidance = handler.getStepGuidance(6, problem);
      expect(guidance).toContain('Strategic Response');
      expect(guidance).toContain('Early Mover');
      expect(guidance).toContain('monitoring');
      expect(guidance).toContain('weak signals');
      expect(guidance).toContain('High Reflexivity');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(6, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(7, {})).toBe(false);
    });

    it('should validate signal assessment for step 2', () => {
      const validData = {
        signals: [
          {
            story: 'Small startup using AI differently',
            divergenceLevel: 'significant',
            signalStrength: 'strong',
            precedentType: 'first',
          },
        ],
      };
      expect(handler.validateStep(2, validData)).toBe(true);

      const invalidData1 = {
        signals: 'not an array',
      };
      expect(handler.validateStep(2, invalidData1)).toBe(false);

      const invalidData2 = {
        signals: [
          {
            story: 'Test',
            divergenceLevel: 'invalid_level',
            signalStrength: 'strong',
            precedentType: 'first',
          },
        ],
      };
      expect(handler.validateStep(2, invalidData2)).toBe(false);

      const invalidData3 = {
        signals: [
          {
            story: 'Test',
            divergenceLevel: 'minor',
            signalStrength: 'invalid_strength',
            precedentType: 'first',
          },
        ],
      };
      expect(handler.validateStep(2, invalidData3)).toBe(false);

      const invalidData4 = {
        signals: [
          {
            story: 'Test',
            divergenceLevel: 'minor',
            signalStrength: 'weak',
            precedentType: 'invalid_precedent',
          },
        ],
      };
      expect(handler.validateStep(2, invalidData4)).toBe(false);
    });

    it('should validate scaling scenarios for step 5', () => {
      const validData = {
        scalingScenarios: [{ adoptionLevel: 10 }, { adoptionLevel: 50 }, { adoptionLevel: 100 }],
      };
      expect(handler.validateStep(5, validData)).toBe(true);

      const invalidData1 = {
        scalingScenarios: 'not an array',
      };
      expect(handler.validateStep(5, invalidData1)).toBe(false);

      const invalidData2 = {
        scalingScenarios: [{ adoptionLevel: -5 }],
      };
      expect(handler.validateStep(5, invalidData2)).toBe(false);

      const invalidData3 = {
        scalingScenarios: [{ adoptionLevel: 150 }],
      };
      expect(handler.validateStep(5, invalidData3)).toBe(false);

      const invalidData4 = {
        scalingScenarios: [{ adoptionLevel: 'not a number' }],
      };
      expect(handler.validateStep(5, invalidData4)).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from complete history', () => {
      const history = [
        { output: 'Collected anecdotes', anecdoteCount: 15 },
        {
          output: 'Signals assessed',
          signals: [
            {
              story: 'Story 1',
              divergenceLevel: 'extreme',
              signalStrength: 'critical',
              precedentType: 'first',
            },
            {
              story: 'Story 2',
              divergenceLevel: 'significant',
              signalStrength: 'strong',
              precedentType: 'rare',
            },
            {
              story: 'Story 3',
              divergenceLevel: 'minor',
              signalStrength: 'weak',
              precedentType: 'recurring',
            },
          ],
        },
        { output: 'Trajectories analyzed', trajectoryAnalysis: { nonErgodic: true } },
        { output: 'Warnings extracted', earlyWarnings: ['Warning 1', 'Warning 2', 'Warning 3'] },
        { output: 'Scaling projected', scalingScenarios: [{ adoptionLevel: 30 }] },
        { output: 'Strategy formed', strategicResponse: { approach: 'Early mover' } },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Collected 15 significant anecdotes'))).toBe(true);
      expect(insights.some(i => i.includes('2 strong signals'))).toBe(true);
      expect(insights.some(i => i.includes('non-ergodic path dependencies'))).toBe(true);
      expect(insights.some(i => i.includes('3 early warning signals'))).toBe(true);
      expect(insights.some(i => i.includes('potential mainstream adoption'))).toBe(true);
      expect(insights.some(i => i.includes('Strategic response formulated'))).toBe(true);
      expect(insights.some(i => i.includes('future insights extracted from outliers'))).toBe(true);
    });

    it('should handle partial history', () => {
      const history = [{ output: 'Anecdotes collected', anecdoteCount: 5 }];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Collected 5 significant anecdotes'))).toBe(true);
      expect(insights.some(i => i.includes('future insights extracted'))).toBe(false);
    });

    it('should detect low adoption scenarios', () => {
      const history = [{ output: 'Scaling projected', scalingScenarios: [{ adoptionLevel: 5 }] }];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('mainstream adoption'))).toBe(false);
    });

    it('should identify critical signals', () => {
      const history = [
        {
          output: 'Signals found',
          signals: [
            {
              story: 'Critical discovery',
              divergenceLevel: 'extreme',
              signalStrength: 'critical',
              precedentType: 'first',
            },
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('1 strong signals'))).toBe(true);
    });
  });
});
