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

      const invalidFlexibility = {
        flexibilityScore: 'not a number',
      };
      expect(handler.validateStep(2, invalidFlexibility)).toBe(false);
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

    it('should extract decision patterns', () => {
      const history = [
        {
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
          activeOptions: ['Refactor codebase', 'Add monitoring'],
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

    it('should limit insights to 12 and remove duplicates', () => {
      const history = [];

      // Add many insights
      for (let i = 0; i < 20; i++) {
        history.push({
          decisionPatterns: ['Duplicate pattern', `Unique pattern ${i}`],
          activeOptions: [`Option ${i}`],
        });
      }

      const insights = handler.extractInsights(history);
      expect(insights.length).toBeLessThanOrEqual(12);

      // Check for no duplicates
      const uniqueInsights = new Set(insights);
      expect(uniqueInsights.size).toBe(insights.length);
    });
  });

  describe('path memory tracking', () => {
    it('should track decisions in path memory', () => {
      handler.trackDecision(
        'Implement caching',
        ['Performance optimization'],
        ['Direct database access'],
        0.9
      );

      const analysis = handler.analyzePathMemory();
      expect(analysis.totalDecisions).toBe(1);
      expect(analysis.totalConstraintsCreated).toBe(1);
      expect(analysis.totalOptionsClosed).toBe(1);
      expect(analysis.currentFlexibility).toBe(0.9);
    });

    it('should identify critical decisions', () => {
      // Add a critical decision (many constraints)
      handler.trackDecision(
        'Choose architecture',
        ['Tech stack', 'Team structure', 'Deployment model'],
        ['Alternative architectures', 'Migration paths', 'Vendor options'],
        0.5
      );

      // Add a normal decision
      handler.trackDecision('Add feature', ['Feature dependency'], [], 0.95);

      const analysis = handler.analyzePathMemory();
      expect(analysis.criticalDecisions).toHaveLength(1);
      expect(analysis.criticalDecisions[0].decision).toBe('Choose architecture');
    });

    it('should calculate cumulative flexibility impact', () => {
      handler.trackDecision('Decision 1', [], [], 0.9);
      handler.trackDecision('Decision 2', [], [], 0.8);
      handler.trackDecision('Decision 3', [], [], 0.7);

      const analysis = handler.analyzePathMemory();
      // 0.9 * 0.8 * 0.7 = 0.504
      expect(analysis.currentFlexibility).toBeCloseTo(0.504, 3);
    });
  });

  describe('future flexibility projection', () => {
    it('should project future flexibility with decay', () => {
      handler.trackDecision('Initial decision', [], [], 0.8);

      const projections = handler.projectFutureFlexibility([1, 5, 10]);

      // With 0.9 decay rate and 0.8 initial flexibility
      expect(projections[1]).toBeCloseTo(0.8 * 0.9, 3);
      expect(projections[5]).toBeCloseTo(0.8 * Math.pow(0.9, 5), 3);
      expect(projections[10]).toBeCloseTo(0.8 * Math.pow(0.9, 10), 3);
    });

    it('should handle multiple horizons', () => {
      handler.trackDecision('Decision', [], [], 1.0);

      const projections = handler.projectFutureFlexibility([2, 4, 6, 8]);

      expect(Object.keys(projections)).toHaveLength(4);
      expect(projections[2]).toBeGreaterThan(projections[4]);
      expect(projections[4]).toBeGreaterThan(projections[6]);
      expect(projections[6]).toBeGreaterThan(projections[8]);
    });
  });
});
