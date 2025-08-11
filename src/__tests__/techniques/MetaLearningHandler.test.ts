/**
 * Tests for MetaLearningHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetaLearningHandler } from '../../techniques/MetaLearningHandler.js';
import { ErrorCode } from '../../errors/types.js';

describe('MetaLearningHandler', () => {
  let handler: MetaLearningHandler;

  beforeEach(() => {
    handler = new MetaLearningHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique information', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Meta-Learning from Path Integration');
      expect(info.emoji).toBe('🧠');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toContain('path patterns');
      expect(info.focus).toContain('Self-improving integration');
      expect(info.parallelSteps.canParallelize).toBe(false);
    });
  });

  describe('getStepInfo', () => {
    it('should return correct step information for each step', () => {
      const expectedSteps = [
        { name: 'Pattern Recognition', emoji: '🔍' },
        { name: 'Learning Accumulation', emoji: '📊' },
        { name: 'Strategy Evolution', emoji: '🔄' },
        { name: 'Feedback Integration', emoji: '📈' },
        { name: 'Meta-Synthesis', emoji: '🧠' },
      ];

      expectedSteps.forEach((expected, index) => {
        const stepInfo = handler.getStepInfo(index + 1);
        expect(stepInfo.name).toBe(expected.name);
        expect(stepInfo.emoji).toBe(expected.emoji);
        expect(stepInfo.focus).toBeTruthy();
      });
    });

    it('should throw error for invalid step number', () => {
      expect(() => handler.getStepInfo(0)).toThrow();
      expect(() => handler.getStepInfo(6)).toThrow();

      try {
        handler.getStepInfo(10);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.INVALID_STEP);
        expect(error.message).toContain('Valid steps are 1-5');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'Optimize team collaboration';

    it('should provide specific guidance for each step', () => {
      const guidance1 = handler.getStepGuidance(1, problem);
      expect(guidance1).toContain('patterns across all techniques');
      expect(guidance1).toContain(problem);

      const guidance2 = handler.getStepGuidance(2, problem);
      expect(guidance2).toContain('Accumulate learnings');
      expect(guidance2).toContain('affinity matrix');

      const guidance3 = handler.getStepGuidance(3, problem);
      expect(guidance3).toContain('Evolve your strategy');
      expect(guidance3).toContain('execution sequences');

      const guidance4 = handler.getStepGuidance(4, problem);
      expect(guidance4).toContain('feedback');
      expect(guidance4).toContain('telemetry');

      const guidance5 = handler.getStepGuidance(5, problem);
      expect(guidance5).toContain('meta-learning insights');
      expect(guidance5).toContain('self-improving framework');
    });

    it('should provide default guidance for invalid step', () => {
      const guidance = handler.getStepGuidance(99, problem);
      expect(guidance).toContain('Continue meta-learning');
      expect(guidance).toContain(problem);
    });
  });

  describe('validateStep', () => {
    it('should validate step 1 requires patternRecognition', () => {
      const data = {
        output: 'test output',
      };

      expect(() => handler.validateStep(1, data)).toThrow();

      try {
        handler.validateStep(1, data);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect(error.message).toContain('pattern recognition');
      }
    });

    it('should validate step 2 requires learningHistory', () => {
      const data = {
        output: 'test output',
      };

      expect(() => handler.validateStep(2, data)).toThrow();

      try {
        handler.validateStep(2, data);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect(error.message).toContain('learning history');
      }
    });

    it('should validate step 3 requires strategyAdaptations', () => {
      const data = {
        output: 'test output',
      };

      expect(() => handler.validateStep(3, data)).toThrow();

      try {
        handler.validateStep(3, data);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect(error.message).toContain('strategy adaptations');
      }
    });

    it('should validate step 4 requires feedbackInsights', () => {
      const data = {
        output: 'test output',
      };

      expect(() => handler.validateStep(4, data)).toThrow();

      try {
        handler.validateStep(4, data);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect(error.message).toContain('feedback insights');
      }
    });

    it('should validate step 5 requires metaSynthesis', () => {
      const data = {
        output: 'test output',
      };

      expect(() => handler.validateStep(5, data)).toThrow();

      try {
        handler.validateStep(5, data);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect(error.message).toContain('meta-synthesis');
      }
    });

    it('should pass validation with required fields', () => {
      const validData = {
        1: { output: 'test', patternRecognition: ['pattern1'] },
        2: { output: 'test', learningHistory: ['learning1'] },
        3: { output: 'test', strategyAdaptations: ['strategy1'] },
        4: { output: 'test', feedbackInsights: ['feedback1'] },
        5: { output: 'test', metaSynthesis: ['synthesis1'] },
      };

      Object.entries(validData).forEach(([step, data]) => {
        expect(handler.validateStep(Number(step), data)).toBe(true);
      });
    });
  });

  describe('getPromptContext', () => {
    it('should return comprehensive context for each step', () => {
      for (let step = 1; step <= 5; step++) {
        const context = handler.getPromptContext(step);

        expect(context.technique).toBe('meta_learning');
        expect(context.step).toBe(step);
        expect(context.stepName).toBeTruthy();
        expect(context.focus).toBeTruthy();
        expect(context.emoji).toBeTruthy();
        expect(context.capabilities).toBeDefined();
        expect(context.capabilities).toHaveProperty('patternRecognition');
        expect(context.capabilities).toHaveProperty('metaSynthesis');
      }
    });
  });
});
