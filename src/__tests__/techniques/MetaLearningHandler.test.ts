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
      expect(info.totalSteps).toBe(4);
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
        { name: 'Meta-Synthesis', emoji: '🧠' },
      ];

      expectedSteps.forEach((expected, index) => {
        const stepInfo = handler.getStepInfo(index + 1);
        expect(stepInfo.name).toBe(expected.name);
        expect(stepInfo.emoji).toBe(expected.emoji);
        expect(stepInfo.focus).toBeTruthy();
      });
    });

    it('should no longer expose a Feedback Integration step', () => {
      // Feedback Integration was removed deliberately: it asked what telemetry
      // revealed, but getStepGuidance receives no telemetry to answer from.
      // Meta-Synthesis took over step 4 and is now the last step.
      const stepNames = [1, 2, 3, 4].map(step => handler.getStepInfo(step).name);
      expect(stepNames).not.toContain('Feedback Integration');
      expect(handler.getStepInfo(4).name).toBe('Meta-Synthesis');
      expect(handler.getStepInfo(4).focus).toBe('Generate improved integration strategies');
      expect(handler.getStepInfo(4).type).toBe('action');
      expect(handler.getStepInfo(4).reflexiveEffects?.reversibility).toBe('medium');
      expect(() => handler.getStepInfo(5)).toThrow();
    });

    it('should throw error for invalid step number', () => {
      expect(() => handler.getStepInfo(0)).toThrow();
      expect(() => handler.getStepInfo(5)).toThrow();

      try {
        handler.getStepInfo(10);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.INVALID_STEP);
        expect(error.message).toContain('Valid steps are 1-4');
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
      expect(guidance4).toContain('meta-learning insights');
      expect(guidance4).toContain('self-improving framework');
    });

    it('should not ask any step for telemetry-derived feedback', () => {
      // Replaces the Feedback Integration guidance assertions: no step can ask
      // for telemetry, because getStepGuidance is given only (step, problem).
      const allGuidance = [1, 2, 3, 4].map(step => handler.getStepGuidance(step, problem));
      allGuidance.forEach(guidance => {
        expect(guidance).not.toContain('telemetry');
      });
      expect(handler.getStepGuidance(5, problem)).toBe(
        `Complete the Meta-Learning from Path Integration process for: "${problem}"`
      );
    });

    it('should provide default guidance for invalid step', () => {
      const guidance = handler.getStepGuidance(99, problem);
      expect(guidance).toContain('Complete the Meta-Learning');
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
        expect(error.message).toContain('Pattern Recognition');
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
        expect(error.message).toContain('Learning Accumulation');
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
        expect(error.message).toContain('Strategy Evolution');
      }
    });

    it('should validate step 4 requires metaSynthesis', () => {
      const data = {
        output: 'test output',
      };

      expect(() => handler.validateStep(4, data)).toThrow();

      try {
        handler.validateStep(4, data);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect(error.message).toContain('Meta-Synthesis');
      }
    });

    it('should no longer demand feedbackInsights on any step', () => {
      // Replaces "step 4 requires feedbackInsights": the Feedback Integration
      // step is gone, so feedbackInsights satisfies no step's validation and
      // step 4 asks for the meta-synthesis instead.
      try {
        handler.validateStep(4, { output: 'test output' });
      } catch (error: any) {
        expect(error.message).not.toContain('Feedback Integration');
        expect(error.message).toContain('Step 4 (Meta-Synthesis)');
      }

      // feedbackInsights alone no longer satisfies step 4
      expect(() =>
        handler.validateStep(4, { output: 'test', feedbackInsights: ['feedback1'] })
      ).toThrow();

      // and step 5 is out of range entirely
      expect(handler.validateStep(5, { output: 'test', metaSynthesis: ['synthesis1'] })).toBe(
        false
      );
    });

    it('should pass validation with required fields', () => {
      const validData = {
        1: { output: 'test', patternRecognition: ['pattern1'] },
        2: { output: 'test', learningHistory: ['learning1'] },
        3: { output: 'test', strategyAdaptations: ['strategy1'] },
        4: { output: 'test', metaSynthesis: ['synthesis1'] },
      };

      Object.entries(validData).forEach(([step, data]) => {
        expect(handler.validateStep(Number(step), data)).toBe(true);
      });
    });
  });

  describe('extractInsights', () => {
    it('reports every required field under its own step name', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Divergent techniques paid off early.',
          patternRecognition: ['six_hats before scamper', 'constraints raised idea quality'],
        },
        {
          currentStep: 2,
          output: 'Two combinations kept recurring.',
          learningHistory: ['triz suits contradictions', 'design_thinking suits users'],
        },
        {
          currentStep: 3,
          output: 'Selection now keys on problem type.',
          strategyAdaptations: ['pick visual techniques for spatial problems'],
        },
        {
          currentStep: 4,
          output: 'The framework updates itself per session.',
          metaSynthesis: 'Diverge first, converge on evidence of a constraint',
        },
      ]);

      expect(insights).toContain(
        'Pattern Recognition: six_hats before scamper, constraints raised idea quality'
      );
      expect(insights).toContain(
        'Learning Accumulation: triz suits contradictions, design_thinking suits users'
      );
      expect(insights).toContain('Strategy Evolution: pick visual techniques for spatial problems');
      expect(insights).toContain(
        'Meta-Synthesis: Diverge first, converge on evidence of a constraint'
      );
      // The outputs are reported too, each under its own step.
      expect(insights).toContain('Pattern Recognition: Divergent techniques paid off early.');
      // No banner: reaching step 4 is not itself a finding.
      expect(insights.some(i => /self-improving framework|meta-learning complete/i.test(i))).toBe(
        false
      );
    });

    it('reports the alias fields identically to the primary names', () => {
      const primary = handler.extractInsights([
        { currentStep: 1, patternRecognition: ['p'] },
        { currentStep: 2, learningHistory: ['l'] },
        { currentStep: 3, strategyAdaptations: ['s'] },
        { currentStep: 4, metaSynthesis: 'm' },
      ]);
      const aliases = handler.extractInsights([
        { currentStep: 1, patterns: ['p'] },
        { currentStep: 2, accumulatedLearning: ['l'] },
        { currentStep: 3, strategyEvolution: 's' },
        { currentStep: 4, synthesisStrategy: 'm' },
      ]);

      expect(aliases).toEqual(primary);
      expect(aliases).toContain('Pattern Recognition: p');
      expect(aliases).toContain('Meta-Synthesis: m');
    });

    it('lets a revision supersede the step it revises', () => {
      const insights = handler.extractInsights([
        { currentStep: 1, patternRecognition: ['the first reading'] },
        { currentStep: 2, learningHistory: ['a later step'] },
        { currentStep: 1, patternRecognition: ['the corrected reading'] },
      ]);

      expect(insights).toContain('Pattern Recognition: the corrected reading');
      expect(insights).not.toContain('Pattern Recognition: the first reading');
      // The revision must not shift step 2's label onto step 3's name.
      expect(insights).toContain('Learning Accumulation: a later step');
      expect(insights.some(i => i.startsWith('Strategy Evolution'))).toBe(false);
    });

    it('reports nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 1, output: '   ' }])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 2, learningHistory: [] }])).toEqual([]);
    });

    it('does not cut the output summary at an abbreviation', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Convergence took 3 rounds vs. 8 before. The pattern is early constraint.',
        },
      ]);

      expect(insights[0]).toContain('vs. 8 before.');
    });
  });

  describe('getPromptContext', () => {
    it('should return comprehensive context for each step', () => {
      for (let step = 1; step <= 4; step++) {
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
