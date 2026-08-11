/**
 * Tests for Temporal Creativity technique handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalCreativityHandler } from '../../techniques/TemporalCreativityHandler.js';
import { ValidationError } from '../../errors/types.js';

describe('TemporalCreativityHandler', () => {
  let handler: TemporalCreativityHandler;

  beforeEach(() => {
    handler = new TemporalCreativityHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique information', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Temporal Creativity');
      expect(info.emoji).toBe('⏳');
      expect(info.totalSteps).toBe(6);
      expect(info.description).toContain('path creation mechanism');
      expect(info.focus).toContain('Multi-timeline thinking');
      expect(info.enhancedFocus).toContain('archaeological analysis');
      expect(info.parallelSteps?.canParallelize).toBe(false);
    });
  });

  describe('getStepInfo', () => {
    it('should return correct step information for each step', () => {
      const steps = [
        { name: 'Archaeological Path Analysis', emoji: '🏛️' },
        { name: 'Present State Synthesis', emoji: '🎯' },
        { name: 'Future Path Projection', emoji: '🔮' },
        { name: 'Temporal Option Creation', emoji: '⚡' },
        { name: 'Cyclical Refinement', emoji: '🔄' },
        { name: 'Path Integration', emoji: '🌉' },
      ];

      steps.forEach((expectedStep, index) => {
        const stepInfo = handler.getStepInfo(index + 1);
        expect(stepInfo.name).toBe(expectedStep.name);
        expect(stepInfo.emoji).toBe(expectedStep.emoji);
        expect(stepInfo.focus).toBeDefined();
      });
    });

    it('should throw error for invalid step number', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(7)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(-1)).toThrow(ValidationError);
    });
  });

  describe('getStepGuidance', () => {
    it('should provide specific guidance for each step', () => {
      const problem = 'How to manage evolving project requirements';

      // Step 1: Archaeological Path Analysis
      const guidance1 = handler.getStepGuidance(1, problem);
      expect(guidance1).toContain('Excavate the decision history');
      expect(guidance1).toContain(problem);
      expect(guidance1).toContain('past decisions created current constraints');

      // Step 2: Present State Synthesis
      const guidance2 = handler.getStepGuidance(2, problem);
      expect(guidance2).toContain('Map the present state');
      expect(guidance2).toContain('constraints currently exist');
      expect(guidance2).toContain('flexibility score');

      // Step 3: Future Path Projection
      const guidance3 = handler.getStepGuidance(3, problem);
      expect(guidance3).toContain('Project future paths');
      expect(guidance3).toContain('time horizons');
      expect(guidance3).toContain('black swans');

      // Step 4: Temporal Option Creation
      const guidance4 = handler.getStepGuidance(4, problem);
      expect(guidance4).toContain('Create temporal options');
      expect(guidance4).toContain('delayed');
      expect(guidance4).toContain('accelerated');

      // Step 5: Cyclical Refinement
      const guidance5 = handler.getStepGuidance(5, problem);
      expect(guidance5).toContain('cyclical refinement');
      expect(guidance5).toContain('Integrate historical lessons');

      // Step 6: Path Integration
      const guidance6 = handler.getStepGuidance(6, problem);
      expect(guidance6).toContain('Integrate all temporal insights');
      expect(guidance6).toContain('preserving maximum future flexibility');
    });
  });

  describe('validateStep', () => {
    it('should validate basic step parameters', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(6, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(7, {})).toBe(false);
    });

    it('should validate step 1 specific fields', () => {
      const validData = {
        pathHistory: [{ decision: 'Use agile', impact: 'Increased flexibility' }],
        decisionPatterns: ['Incremental changes', 'Risk-averse choices'],
      };
      expect(handler.validateStep(1, validData)).toBe(true);

      const invalidData = {
        pathHistory: 'not an array',
      };
      expect(handler.validateStep(1, invalidData)).toBe(false);
    });

    it('should validate step 2 present state fields', () => {
      const validData = {
        currentConstraints: ['Budget limit', 'Fixed deadline'],
        activeOptions: ['Hire contractors', 'Reduce scope'],
        flexibilityScore: 0.6,
      };
      expect(handler.validateStep(2, validData)).toBe(true);

      // flexibilityScore is no longer an input. It is measured by the
      // ergodicity engine from the path history, so the handler neither
      // validates it nor reads it, and an unknown key is simply ignored.
      const strayFlexibility = {
        flexibilityScore: 'not a number',
      };
      expect(handler.validateStep(2, strayFlexibility)).toBe(true);
    });

    it('should validate step 3 projection fields', () => {
      const validData = {
        timelineProjections: {
          bestCase: ['All features complete'],
          worstCase: ['Project failure'],
        },
        blackSwanScenarios: ['Key developer leaves', 'Technology obsolescence'],
      };
      expect(handler.validateStep(3, validData)).toBe(true);

      const invalidData = {
        timelineProjections: 'not an object',
      };
      expect(handler.validateStep(3, invalidData)).toBe(false);
    });

    it('should validate step 4 temporal options', () => {
      const validData = {
        delayOptions: ['Wait for market clarity'],
        accelerationOptions: ['Fast-track MVP'],
        parallelTimelines: ['Develop two approaches simultaneously'],
      };
      expect(handler.validateStep(4, validData)).toBe(true);

      const invalidData = {
        delayOptions: 'not an array',
      };
      expect(handler.validateStep(4, invalidData)).toBe(false);
    });

    it('should validate step 5 refinement fields', () => {
      const validData = {
        lessonIntegration: ['Avoid overcommitment', 'Build in buffers'],
        strategyEvolution: 'From waterfall to agile to hybrid',
      };
      expect(handler.validateStep(5, validData)).toBe(true);

      const invalidStrategy = {
        strategyEvolution: 123, // Not a string
      };
      expect(handler.validateStep(5, invalidStrategy)).toBe(false);
    });

    it('should validate step 6 integration fields', () => {
      const validData = {
        synthesisStrategy: 'Maintain parallel tracks with decision points',
        preservedOptions: ['Pivot capability', 'Scale flexibility'],
      };
      expect(handler.validateStep(6, validData)).toBe(true);

      const invalidSynthesis = {
        synthesisStrategy: false, // Not a string
      };
      expect(handler.validateStep(6, invalidSynthesis)).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract path history insights', () => {
      const history = [
        {
          currentStep: 1,
          pathHistory: [
            { decision: 'Choose microservices', impact: 'Increased complexity' },
            { decision: 'Adopt CI/CD', impact: 'Faster deployment' },
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Path decision: Choose microservices → Increased complexity');
      expect(insights).toContain('Path decision: Adopt CI/CD → Faster deployment');
    });

    it('should report the constraints and closed options a path decision carried', () => {
      const history = [
        {
          currentStep: 1,
          pathHistory: [
            {
              decision: 'Choose microservices',
              impact: 'Increased complexity',
              constraintsCreated: ['Network partition handling', 'Distributed tracing required'],
              optionsClosed: ['In-process transactions'],
            },
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain(
        'Path decision: Choose microservices → Increased complexity ' +
          '(constraints created: Network partition handling, Distributed tracing required; ' +
          'options closed: In-process transactions)'
      );
    });

    it('should extract decision patterns', () => {
      const history = [
        {
          currentStep: 1,
          decisionPatterns: [
            'Tendency to over-engineer solutions',
            'Preference for proven technologies',
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Pattern: Tendency to over-engineer solutions');
      expect(insights).toContain('Pattern: Preference for proven technologies');
    });

    it('should extract active and preserved options', () => {
      const history = [
        {
          currentStep: 2,
          activeOptions: ['Refactor codebase', 'Add monitoring'],
        },
        {
          currentStep: 6,
          preservedOptions: ['Platform migration capability', 'Vendor independence'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Active option: Refactor codebase');
      expect(insights).toContain('Preserved: Platform migration capability');
    });

    it('should extract integrated lessons', () => {
      const history = [
        {
          currentStep: 5,
          lessonIntegration: [
            'Early prototyping reduces risk',
            'Regular retrospectives improve process',
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Lesson: Early prototyping reduces risk');
      expect(insights).toContain('Lesson: Regular retrospectives improve process');
    });

    it('should keep short content that the length gates used to drop', () => {
      // `pattern.length > 10`, `option.length > 5` and `lesson.length > 10`
      // rejected recorded content for a reason unrelated to whether it was
      // content: "Ship late" is nine characters and a decision pattern.
      const history = [
        { currentStep: 1, decisionPatterns: ['Ship late'] },
        { currentStep: 2, activeOptions: ['Wait'] },
        { currentStep: 5, lessonIntegration: ['Buy time'] },
        { currentStep: 6, preservedOptions: ['Exit'] },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Pattern: Ship late');
      expect(insights).toContain('Active option: Wait');
      expect(insights).toContain('Lesson: Buy time');
      expect(insights).toContain('Preserved: Exit');
    });

    it('should report the whole of step 3 projection and step 4 options', () => {
      // Every field here was validated by validateStep and then read by
      // nothing: step 4 produced no structured insight at all, and only the
      // black swans survived from step 3.
      const history = [
        {
          currentStep: 3,
          timelineProjections: {
            bestCase: ['Ships in one quarter'],
            probableCase: ['Ships in two quarters'],
            worstCase: ['Slips past the funding round'],
            antifragileDesign: ['Each slip buys a paying pilot'],
          },
          blackSwanScenarios: ['Regulator bans the primary data source'],
        },
        {
          currentStep: 4,
          delayOptions: ['Hold the schema decision until pilot two'],
          accelerationOptions: ['Buy the ingestion component'],
          parallelTimelines: ['Run the manual process alongside for a quarter'],
        },
        {
          currentStep: 5,
          strategyEvolution: 'From single-track delivery to two tracks with a decision point',
        },
        {
          currentStep: 6,
          synthesisStrategy: 'Converge only where both tracks agree',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Best case: Ships in one quarter');
      expect(insights).toContain('Probable case: Ships in two quarters');
      expect(insights).toContain('Worst case: Slips past the funding round');
      expect(insights).toContain('Antifragile design: Each slip buys a paying pilot');
      expect(insights).toContain('Black swan: Regulator bans the primary data source');
      expect(insights).toContain('Delay option: Hold the schema decision until pilot two');
      expect(insights).toContain('Acceleration option: Buy the ingestion component');
      expect(insights).toContain(
        'Parallel timeline: Run the manual process alongside for a quarter'
      );
      expect(insights).toContain(
        'Strategy evolution: From single-track delivery to two tracks with a decision point'
      );
      expect(insights).toContain('Synthesis strategy: Converge only where both tracks agree');
    });

    it('should read black swans nested inside timelineProjections', () => {
      const history = [
        {
          currentStep: 3,
          timelineProjections: {
            blackSwanScenarios: ['The incumbent open-sources the product'],
          },
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Black swan: The incumbent open-sources the product');
    });

    it('should remove duplicates without silently capping the count', () => {
      // Replaces the assertion that the result was cut to twelve. The cut was
      // silent, so a session could not tell that its thirteenth finding had
      // been dropped rather than never recorded.
      const patterns = Array.from({ length: 20 }, (_, i) => `Unique pattern ${i}`);
      const history = [
        { currentStep: 1, decisionPatterns: ['Duplicate pattern', ...patterns] },
        { currentStep: 2, activeOptions: ['Duplicate option', 'Duplicate option'] },
      ];

      const insights = handler.extractInsights(history);

      // All 21 patterns plus the one deduplicated option.
      expect(insights).toHaveLength(22);
      expect(insights.length).toBeGreaterThan(12);
      expect(insights).toContain('Pattern: Unique pattern 19');

      const uniqueInsights = new Set(insights);
      expect(uniqueInsights.size).toBe(insights.length);
    });

    it('should key on currentStep so a revision supersedes what it revises', () => {
      const history = [
        { currentStep: 1, output: 'The first reading of the decision history.' },
        { currentStep: 2, output: 'Present state as first mapped.' },
        { currentStep: 1, output: 'The corrected reading of the decision history.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Archaeological Path Analysis: The corrected reading of the decision history.',
        'Present State Synthesis: Present state as first mapped.',
      ]);
    });
  });
});
