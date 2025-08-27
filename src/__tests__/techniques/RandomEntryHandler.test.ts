/**
 * Tests for RandomEntryHandler including Rory Mode enhancement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RandomEntryHandler } from '../../techniques/RandomEntryHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('RandomEntryHandler', () => {
  let handler: RandomEntryHandler;

  beforeEach(() => {
    handler = new RandomEntryHandler();
    // Reset any randomization for consistent testing
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Random Entry');
      expect(info.emoji).toBe('🎲');
      expect(info.totalSteps).toBe(3);
      expect(info.description).toContain('random stimuli');
      expect(info.focus).toContain('unrelated concept');
      expect(info.parallelSteps?.canParallelize).toBe(false);
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Random Stimulus');
      expect(step1.emoji).toBe('🎲');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Force Connections');
      expect(step2.emoji).toBe('🔗');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Develop Ideas');
      expect(step3.emoji).toBe('💡');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(4)).toThrow(ValidationError);

      try {
        handler.getStepInfo(4);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Valid steps are 1-3');
      }
    });
  });

  describe('getStepGuidance - Standard Mode', () => {
    const problem = 'Improve customer service efficiency';

    it('should provide guidance for step 1 - Random Stimulus', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Random Stimulus');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('random word');
    });

    it('should provide guidance for step 2 - Force Connections', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Force Connections');
      expect(guidance).toContain('Force connections');
      expect(guidance).toContain('associations');
    });

    it('should provide guidance for step 3 - Develop Ideas', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Develop Ideas');
      expect(guidance).toContain('practical ideas');
    });
  });

  describe('getStepGuidance - Rory Mode', () => {
    const problem = 'Improve customer service efficiency';
    const context = {
      roryMode: true,
      roryCategory: 'psychological' as const,
    };

    it('should provide Rory Mode guidance for step 1 with psychological category', () => {
      const guidance = handler.getStepGuidance(1, problem, context);
      expect(guidance).toContain('Rory Mode');
      expect(guidance).toContain('behavioral economics');
      expect(guidance).toContain('Perceptual');
      expect(guidance).toContain('Sutherland');
    });

    it('should provide Rory Mode guidance for step 1 with contextual category', () => {
      const contextualContext = { ...context, roryCategory: 'contextual' as const };
      const guidance = handler.getStepGuidance(1, problem, contextualContext);
      expect(guidance).toContain('Rory Mode');
      expect(guidance).toContain('Context');
      expect(guidance).toContain('Environmental');
    });

    it('should provide Rory Mode guidance for step 1 with perceptual category', () => {
      const perceptualContext = { ...context, roryCategory: 'perceptual' as const };
      const guidance = handler.getStepGuidance(1, problem, perceptualContext);
      expect(guidance).toContain('Rory Mode');
      expect(guidance).toContain('Perceptual');
      expect(guidance).toContain('illusion');
    });

    it('should provide Rory Mode guidance for step 1 with counterintuitive category', () => {
      const counterContext = { ...context, roryCategory: 'counterintuitive' as const };
      const guidance = handler.getStepGuidance(1, problem, counterContext);
      expect(guidance).toContain('Rory Mode');
      expect(guidance).toContain('Counterintuitive');
      expect(guidance).toContain('opposite');
    });

    it('should use random category if none specified in Rory Mode', () => {
      const randomContext = { roryMode: true };
      const guidance = handler.getStepGuidance(1, problem, randomContext);
      expect(guidance).toContain('Rory Mode');
      expect(guidance).toMatch(/Psychological|Contextual|Perceptual|Counterintuitive/);
    });

    it('should provide enhanced guidance for step 2 in Rory Mode', () => {
      const guidance = handler.getStepGuidance(2, problem, context);
      expect(guidance).toContain('Force Connections (Rory Mode)');
      expect(guidance).toContain('behavioral');
      expect(guidance).toContain('perception');
      expect(guidance).toContain('psychological');
    });

    it('should provide enhanced guidance for step 3 in Rory Mode', () => {
      const guidance = handler.getStepGuidance(3, problem, context);
      expect(guidance).toContain('Develop Ideas (Rory Mode)');
      expect(guidance).toContain('Perception');
      expect(guidance).toContain('Context Solution');
      expect(guidance).toContain('Psychological Solution');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(3, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(4, {})).toBe(false);
    });

    it('should validate basic step data', () => {
      const validData = {
        output: 'Some output',
        connections: ['Connection 1', 'Connection 2'],
      };
      expect(handler.validateStep(2, validData)).toBe(true);
    });

    it('should validate Rory Mode specific data', () => {
      const roryData = {
        roryMode: true,
        roryCategory: 'psychological',
        randomStimulus: 'loss aversion',
        connections: [
          {
            association: 'Fear of missing out',
            relevance: 'Customer retention',
            behavioralInsight: 'People value avoiding losses more than gaining',
          },
        ],
      };
      expect(handler.validateStep(2, roryData)).toBe(true);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from standard mode history', () => {
      const history = [
        { currentStep: 1, randomStimulus: 'butterfly' },
        { currentStep: 2, connections: ['Transformation', 'Delicate handling'] },
        { currentStep: 3, output: 'Generated solutions' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Random stimulus used: butterfly'))).toBe(true);
      expect(insights.some(i => i.includes('Key connection'))).toBe(true);
    });

    it('should extract enhanced insights from Rory Mode history', () => {
      const history = [
        {
          currentStep: 1,
          randomStimulus: 'loss aversion',
          roryMode: true,
        },
        {
          currentStep: 2,
          connections: ['Fear of loss', 'Retention strategy'],
          roryMode: true,
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Rory Mode stimulus: loss aversion'))).toBe(true);
      expect(insights.some(i => i.includes('behavioral economics'))).toBe(true);
    });

    it('should handle partial history', () => {
      const history = [{ currentStep: 1, randomStimulus: 'clock' }];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Random stimulus used: clock'))).toBe(true);
    });

    it('should detect Rory Mode', () => {
      const history = [
        {
          currentStep: 1,
          randomStimulus: 'make it harder',
          roryMode: true,
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Rory Mode stimulus'))).toBe(true);
    });
  });

  describe('Rory Mode Stimulus Selection', () => {
    it('should have all four categories of Rory stimuli', () => {
      // Access private property through reflection for testing
      const handlerAny = handler as any;
      expect(handlerAny.roryModeStimuli).toHaveProperty('psychological');
      expect(handlerAny.roryModeStimuli).toHaveProperty('contextual');
      expect(handlerAny.roryModeStimuli).toHaveProperty('perceptual');
      expect(handlerAny.roryModeStimuli).toHaveProperty('counterintuitive');
    });

    it('should have appropriate stimuli in each category', () => {
      const handlerAny = handler as any;

      // Check psychological category
      expect(handlerAny.roryModeStimuli.psychological).toContain('status anxiety');
      expect(handlerAny.roryModeStimuli.psychological).toContain('loss aversion');

      // Check contextual category
      expect(handlerAny.roryModeStimuli.contextual).toContain('expensive wine in cheap bottle');

      // Check perceptual category
      expect(handlerAny.roryModeStimuli.perceptual).toContain('progress illusion');

      // Check counterintuitive category
      expect(handlerAny.roryModeStimuli.counterintuitive).toContain(
        'make it harder to increase value'
      );
    });
  });
});
