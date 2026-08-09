/**
 * Tests for MetricsCollector
 * Ensures comprehensive metrics tracking and calculation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import type { SessionData, ThinkingOperationData } from '../../types/index.js';
import { ErgodicityManager } from '../../ergodicity/index.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;
  let mockSession: SessionData;

  beforeEach(() => {
    collector = new MetricsCollector();
    mockSession = {
      technique: 'six_hats',
      problem: 'Test problem',
      history: [],
      branches: {},
      insights: [],
      lastActivityTime: Date.now(),
    };
  });

  describe('updateMetrics', () => {
    it('should initialize metrics if not present', () => {
      const input: ThinkingOperationData = {
        technique: 'six_hats',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const metrics = collector.updateMetrics(mockSession, input);

      expect(metrics.risksCaught).toBe(0);
      expect(metrics.antifragileFeatures).toBe(0);
      expect(typeof metrics.outputCompleteness).toBe('number');
      // Empty session: no insights, no risks, no antifragile features, not ended.
      expect(metrics.outputCompleteness).toBe(0);
    });

    it('should set output completeness from session state', () => {
      const input: ThinkingOperationData = {
        technique: 'six_hats',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 6,
        output:
          'This is a very creative and diverse output with many unique ideas and concepts that span multiple domains and perspectives',
        nextStepNeeded: true,
      };
      // updateMetrics runs after the step is pushed onto history (execution.ts).
      mockSession.history = [{ ...input, timestamp: new Date().toISOString() }];
      mockSession.insights = ['Insight 1', 'Insight 2'];

      const metrics = collector.updateMetrics(mockSession, input);

      // 2 insights / 1 step = 2 -> clamped to 1 by insightsPerStep * 0.4 = 0.8
      expect(metrics.outputCompleteness).toBeCloseTo(0.8, 5);
      expect(metrics.outputCompleteness).toBeLessThanOrEqual(1);
    });

    it('should accumulate risks caught', () => {
      mockSession.metrics = {
        outputCompleteness: 0,
        risksCaught: 2,
        antifragileFeatures: 0,
      };

      const input: ThinkingOperationData = {
        technique: 'six_hats',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
        risks: ['Risk 1', 'Risk 2', 'Risk 3'],
      };

      const metrics = collector.updateMetrics(mockSession, input);

      expect(metrics.risksCaught).toBe(5); // 2 + 3
    });

    it('should accumulate antifragile features', () => {
      mockSession.metrics = {
        outputCompleteness: 0,
        risksCaught: 0,
        antifragileFeatures: 1,
      };

      const input: ThinkingOperationData = {
        technique: 'triz',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
        antifragileProperties: ['Redundancy', 'Optionality'],
      };

      const metrics = collector.updateMetrics(mockSession, input);

      expect(metrics.antifragileFeatures).toBe(3); // 1 + 2
    });
  });

  // These cases previously covered `calculateCreativityScore`, which scored
  // lexical diversity x verbosity and rendered as X/10 on a scale it could not
  // reach. It has been replaced by outputCompleteness — 0-1 coverage of the
  // fields a technique asks for — so the coverage carries over to that metric.
  describe('outputCompleteness on updateMetrics', () => {
    const makeStep = (output: string) => ({
      technique: 'six_hats' as const,
      problem: 'Test',
      currentStep: 1,
      totalSteps: 6,
      output,
      nextStepNeeded: true,
      timestamp: new Date().toISOString(),
    });

    const makeInput = (): ThinkingOperationData => ({
      technique: 'six_hats',
      problem: 'Test',
      currentStep: 1,
      totalSteps: 6,
      output: 'Step output',
      nextStepNeeded: true,
    });

    it('should return higher scores for more insights per step', () => {
      const steps = [makeStep('a'), makeStep('b'), makeStep('c'), makeStep('d')];

      const sparse = collector.updateMetrics(
        { ...mockSession, history: [...steps], insights: ['One'] },
        makeInput()
      );
      const rich = collector.updateMetrics(
        { ...mockSession, history: [...steps], insights: ['One', 'Two', 'Three', 'Four'] },
        makeInput()
      );

      expect(sparse.outputCompleteness).toBeCloseTo(0.1, 5); // 1/4 insights per step * 0.4
      expect(rich.outputCompleteness).toBeCloseTo(0.4, 5); // 4/4 insights per step * 0.4
      expect(rich.outputCompleteness).toBeGreaterThan(sparse.outputCompleteness as number);
    });

    it('should cap output completeness at 1', () => {
      const session: SessionData = {
        ...mockSession,
        history: [makeStep('only step')],
        insights: Array.from({ length: 20 }, (_, i) => `Insight ${i + 1}`),
        endTime: Date.now(),
        metrics: { outputCompleteness: 0, risksCaught: 4, antifragileFeatures: 2 },
      };

      const metrics = collector.updateMetrics(session, makeInput());

      // 20 insights over 1 step alone would score 8.0 before weighting.
      expect(metrics.outputCompleteness).toBeLessThanOrEqual(1);
      expect(metrics.outputCompleteness).toBe(1);
    });

    it('should return 0 for a session that produced nothing', () => {
      const metrics = collector.updateMetrics({ ...mockSession }, makeInput());

      expect(metrics.outputCompleteness).toBe(0); // no insights, risks, features, or end
    });

    it('should ignore the wording of step outputs', () => {
      const terse = collector.updateMetrics(
        { ...mockSession, history: [makeStep('x')], insights: ['One'] },
        makeInput()
      );
      const verbose = collector.updateMetrics(
        {
          ...mockSession,
          history: [makeStep('a florid and extravagantly varied restatement of x')],
          insights: ['One'],
        },
        makeInput()
      );

      // The old creativityScore rewarded exactly this difference; this one must not.
      expect(verbose.outputCompleteness).toBe(terse.outputCompleteness);
    });

    it('should increase as the session accumulates insights', () => {
      const session: SessionData = { ...mockSession, history: [makeStep('one step')] };
      let previous = -1;

      ['Insight 1', 'Insight 2'].forEach(insight => {
        session.insights = [...session.insights, insight];
        const metrics = collector.updateMetrics(session, makeInput());
        expect(metrics.outputCompleteness).toBeGreaterThan(previous);
        previous = metrics.outputCompleteness as number;
      });

      expect(previous).toBeGreaterThan(0);
      expect(previous).toBeLessThanOrEqual(1);
    });
  });

  describe('countRisks', () => {
    it('should count risks correctly', () => {
      const risks = ['Risk 1', 'Risk 2', 'Risk 3'];
      const count = collector.countRisks(risks);
      expect(count).toBe(3);
    });

    it('should handle empty array', () => {
      const count = collector.countRisks([]);
      expect(count).toBe(0);
    });
  });

  describe('countAntifragileFeatures', () => {
    it('should count antifragile properties correctly', () => {
      const properties = ['Redundancy', 'Optionality', 'Overcompensation'];
      const count = collector.countAntifragileFeatures(properties);
      expect(count).toBe(3);
    });

    it('should handle empty array', () => {
      const count = collector.countAntifragileFeatures([]);
      expect(count).toBe(0);
    });
  });

  describe('getDetailedMetrics', () => {
    it('should calculate detailed metrics for a complete session', () => {
      // Setup a comprehensive session
      mockSession.startTime = Date.now() - 3600000; // 1 hour ago
      mockSession.endTime = Date.now();
      mockSession.metrics = {
        outputCompleteness: 0,
        risksCaught: 5,
        antifragileFeatures: 3,
      };
      mockSession.history = [
        {
          technique: 'six_hats',
          problem: 'Test',
          currentStep: 1,
          totalSteps: 6,
          output: 'Step 1',
          nextStepNeeded: true,
          timestamp: new Date().toISOString(),
        },
        {
          technique: 'six_hats',
          problem: 'Test',
          currentStep: 2,
          totalSteps: 6,
          output: 'Step 2',
          nextStepNeeded: true,
          timestamp: new Date().toISOString(),
          isRevision: true,
        },
      ];
      mockSession.branches = { branch1: [] };
      mockSession.insights = ['Insight 1', 'Insight 2', 'Insight 3'];

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.totalSteps).toBe(2);
      expect(detailed.revisionsCount).toBe(1);
      expect(detailed.branchesCount).toBe(1);
      expect(detailed.insightsGenerated).toBe(3);
      // 3 insights / 2 steps = 1.5 -> 0.6, +0.2 risks +0.2 antifragile +0.2 completed = 1.2, capped
      expect(detailed.outputCompleteness).toBe(1);
      expect(detailed.risksCaught).toBe(5);
      expect(detailed.antifragileFeatures).toBe(3);
      expect(detailed.completionTime).toBeCloseTo(3600000, -4); // ~1 hour
      expect(detailed.outputCompleteness).toBeGreaterThan(0);
      expect(detailed.outputCompleteness).toBeLessThanOrEqual(1);
    });

    it('should handle session with path memory', () => {
      const ergodicityManager = new ErgodicityManager();
      mockSession.pathMemory = ergodicityManager.getPathMemory();
      mockSession.pathMemory.currentFlexibility.flexibilityScore = 0.6;
      mockSession.pathMemory.constraints = [
        {
          id: 'c1',
          description: 'Constraint 1',
          strength: 0.5,
          source: 'test',
          timestamp: Date.now(),
          flexibility_impact: -0.1,
        },
        {
          id: 'c2',
          description: 'Constraint 2',
          strength: 0.3,
          source: 'test',
          timestamp: Date.now(),
          flexibility_impact: -0.05,
        },
      ];

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.flexibilityScore).toBe(0.6);
      expect(detailed.constraintsIdentified).toBe(2);
    });

    it('should detect escape plan generation', () => {
      mockSession.escapeRecommendation = {
        name: 'Temporal Unbinding',
        priority: 'high',
        steps: ['Step 1', 'Step 2'],
        timeToImplement: '2 hours',
        prerequisites: [],
        risks: [],
      };

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.escapePlanGenerated).toBe(true);
    });

    it('should handle incomplete session', () => {
      // Session without end time
      mockSession.startTime = Date.now() - 1800000; // 30 minutes ago

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.completionTime).toBeUndefined();
      expect(detailed.totalSteps).toBe(0);
      expect(detailed.outputCompleteness).toBeLessThan(0.5); // Lower score for incomplete
    });
  });

  describe('calculateOutputCompleteness', () => {
    it('should give high score to effective sessions', () => {
      mockSession.history = Array.from({ length: 10 }, (_, i) => ({
        technique: 'six_hats' as const,
        problem: 'Test',
        currentStep: (i % 6) + 1,
        totalSteps: 6,
        output: 'Step',
        nextStepNeeded: true,
        timestamp: new Date().toISOString(),
      }));
      mockSession.insights = Array.from({ length: 8 }, (_, i) => `Insight ${i + 1}`);
      mockSession.metrics = {
        outputCompleteness: 0,
        risksCaught: 5,
        antifragileFeatures: 3,
      };
      mockSession.endTime = Date.now();

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.outputCompleteness).toBeGreaterThan(0.7);
    });

    it('should give low score to ineffective sessions', () => {
      mockSession.history = Array.from({ length: 10 }, (_, i) => ({
        technique: 'six_hats' as const,
        problem: 'Test',
        currentStep: (i % 6) + 1,
        totalSteps: 6,
        output: 'Step',
        nextStepNeeded: true,
        timestamp: new Date().toISOString(),
        isRevision: true, // All revisions
      }));
      mockSession.insights = []; // No insights
      mockSession.metrics = {
        outputCompleteness: 0,
        risksCaught: 0,
        antifragileFeatures: 0,
      };
      // No end time - incomplete

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.outputCompleteness).toBeLessThan(0.3);
    });
  });

  describe('generateMetricsSummary', () => {
    it('should generate comprehensive summary', () => {
      const metrics = {
        totalSteps: 10,
        revisionsCount: 2,
        branchesCount: 1,
        insightsGenerated: 5,
        risksCaught: 3,
        antifragileFeatures: 2,
        flexibilityScore: 0.65,
        constraintsIdentified: 4,
        escapePlanGenerated: false,
        completionTime: 3665000, // 61 minutes 5 seconds
        outputCompleteness: 0.82,
      };

      const summary = collector.generateMetricsSummary(metrics);

      expect(summary).toContain('Total Steps: 10');
      expect(summary).toContain('Insights Generated: 5');
      expect(summary.join('\n')).not.toContain('Creativity Score'); // Metric removed
      expect(summary).toContain('Risks Identified: 3');
      expect(summary).toContain('Antifragile Features: 2');
      expect(summary).toContain('Revisions Made: 2');
      expect(summary).toContain('Flexibility Score: 65%');
      expect(summary).toContain('Completion Time: 61m 5s');
      expect(summary).toContain('Output Completeness: 82%');
    });

    it('should handle partial metrics gracefully', () => {
      const metrics = {
        totalSteps: 5,
        revisionsCount: 0,
        branchesCount: 0,
        insightsGenerated: 2,
      };

      const summary = collector.generateMetricsSummary(metrics);

      expect(summary).toContain('Total Steps: 5');
      expect(summary).toContain('Insights Generated: 2');
      expect(summary.join('\n')).not.toContain('Output Completeness'); // Undefined
      expect(summary).not.toContain('Revisions Made'); // Zero
    });
  });

  describe('compareMetrics', () => {
    it('should calculate percentage differences correctly', () => {
      const session1 = {
        totalSteps: 10,
        revisionsCount: 2,
        branchesCount: 1,
        insightsGenerated: 4,
        risksCaught: 2,
        antifragileFeatures: 1,
        outputCompleteness: 0.7,
      };

      const session2 = {
        totalSteps: 15,
        revisionsCount: 1,
        branchesCount: 2,
        insightsGenerated: 8,
        risksCaught: 5,
        antifragileFeatures: 3,
        outputCompleteness: 0.85,
      };

      const comparison = collector.compareMetrics(session1, session2);

      expect(comparison.creativityScoreDiff).toBeUndefined(); // Metric removed
      expect(comparison.risksCaughtDiff).toBeCloseTo(150, 1); // (5-2)/2 * 100
      expect(comparison.insightsGeneratedDiff).toBeCloseTo(100, 1); // (8-4)/4 * 100
      expect(comparison.effectivenessDiff).toBeCloseTo(21.43, 1); // (0.85-0.7)/0.7 * 100
    });

    it('should handle zero baseline values', () => {
      const session1 = {
        totalSteps: 10,
        revisionsCount: 0,
        branchesCount: 0,
        insightsGenerated: 4,
        risksCaught: 0,
      };

      const session2 = {
        totalSteps: 15,
        revisionsCount: 2,
        branchesCount: 1,
        insightsGenerated: 8,
        risksCaught: 3,
      };

      const comparison = collector.compareMetrics(session1, session2);

      expect(comparison.risksCaughtDiff).toBe(300); // Uses 1 as base instead of 0
    });

    it('should handle missing values', () => {
      const session1 = {
        totalSteps: 10,
        revisionsCount: 0,
        branchesCount: 0,
        insightsGenerated: 4,
      };

      const session2 = {
        totalSteps: 15,
        revisionsCount: 2,
        branchesCount: 1,
        insightsGenerated: 8,
      };

      const comparison = collector.compareMetrics(session1, session2);

      expect(comparison.creativityScoreDiff).toBeUndefined();
      expect(comparison.effectivenessDiff).toBeUndefined();
    });
  });

  describe('aggregateMetrics', () => {
    it('should aggregate metrics across multiple sessions', () => {
      const sessions: SessionData[] = [
        {
          technique: 'six_hats',
          problem: 'Problem 1',
          history: Array.from({ length: 5 }, (_, i) => ({
            technique: 'six_hats' as const,
            problem: 'Test',
            currentStep: (i % 6) + 1,
            totalSteps: 6,
            output: 'Step',
            nextStepNeeded: true,
            timestamp: new Date().toISOString(),
          })),
          branches: {},
          insights: ['Insight 1', 'Insight 2'],
          lastActivityTime: Date.now(),
          metrics: {
            outputCompleteness: 0,
            risksCaught: 2,
            antifragileFeatures: 1,
          },
          endTime: Date.now(),
        },
        {
          technique: 'po',
          problem: 'Problem 2',
          history: Array.from({ length: 8 }, (_, i) => ({
            technique: 'po' as const,
            problem: 'Test',
            currentStep: (i % 4) + 1,
            totalSteps: 4,
            output: 'Step',
            nextStepNeeded: true,
            timestamp: new Date().toISOString(),
          })),
          branches: { branch1: [] },
          insights: ['Insight 3', 'Insight 4', 'Insight 5'],
          lastActivityTime: Date.now(),
          metrics: {
            outputCompleteness: 0,
            risksCaught: 3,
            antifragileFeatures: 2,
          },
          endTime: Date.now(),
        },
      ];

      const aggregated = collector.aggregateMetrics(sessions);

      expect(aggregated.totalSessions).toBe(2);
      expect(aggregated.averageMetrics.totalSteps).toBe(6.5); // (5+8)/2
      expect(aggregated.averageMetrics.insightsGenerated).toBe(2.5); // (2+3)/2
      // Recomputed per session, not read off session.metrics:
      // s1 = 2/5*0.4 + 0.2 + 0.2 + 0.2 = 0.76, s2 = 3/8*0.4 + 0.2 + 0.2 + 0.2 = 0.75
      expect(aggregated.averageMetrics.outputCompleteness).toBeCloseTo(0.755, 5);
      expect(aggregated.averageMetrics.risksCaught).toBe(2.5); // (2+3)/2
      expect(aggregated.techniqueDistribution).toEqual({
        six_hats: 1,
        po: 1,
      });
      expect(aggregated.successRate).toBe(100); // Both completed
    });

    it('should handle sessions with flexibility scores', () => {
      const sessions: SessionData[] = [
        {
          technique: 'scamper',
          problem: 'Problem 1',
          history: [],
          branches: {},
          insights: [],
          lastActivityTime: Date.now(),
          pathMemory: {
            pathHistory: [],
            constraints: [],
            foreclosedOptions: [],
            availableOptions: [],
            currentFlexibility: {
              flexibilityScore: 0.7,
              reversibilityIndex: 0.7,
              pathDivergence: 0.3,
              barrierProximity: [],
              optionVelocity: 0,
              commitmentDepth: 0.3,
            },
            absorbingBarriers: [],
            criticalDecisions: [],
            escapeRoutes: [],
          },
        },
        {
          technique: 'scamper',
          problem: 'Problem 2',
          history: [],
          branches: {},
          insights: [],
          lastActivityTime: Date.now(),
          pathMemory: {
            pathHistory: [],
            constraints: [],
            foreclosedOptions: [],
            availableOptions: [],
            currentFlexibility: {
              flexibilityScore: 0.5,
              reversibilityIndex: 0.5,
              pathDivergence: 0.5,
              barrierProximity: [],
              optionVelocity: 0,
              commitmentDepth: 0.5,
            },
            absorbingBarriers: [],
            criticalDecisions: [],
            escapeRoutes: [],
          },
        },
      ];

      const aggregated = collector.aggregateMetrics(sessions);

      expect(aggregated.averageMetrics.flexibilityScore).toBe(0.6); // (0.7+0.5)/2
    });

    it('should handle empty sessions array', () => {
      const aggregated = collector.aggregateMetrics([]);

      expect(aggregated.totalSessions).toBe(0);
      expect(aggregated.averageMetrics.totalSteps).toBe(0);
      expect(aggregated.techniqueDistribution).toEqual({});
      expect(aggregated.successRate).toBe(0);
    });

    it('should calculate success rate correctly', () => {
      const sessions: SessionData[] = [
        {
          technique: 'six_hats',
          problem: 'Problem 1',
          history: [],
          branches: {},
          insights: [],
          lastActivityTime: Date.now(),
          endTime: Date.now(), // Completed
        },
        {
          technique: 'po',
          problem: 'Problem 2',
          history: [],
          branches: {},
          insights: [],
          lastActivityTime: Date.now(),
          // No endTime - not completed
        },
        {
          technique: 'triz',
          problem: 'Problem 3',
          history: [],
          branches: {},
          insights: [],
          lastActivityTime: Date.now(),
          endTime: Date.now(), // Completed
        },
      ];

      const aggregated = collector.aggregateMetrics(sessions);

      expect(aggregated.successRate).toBeCloseTo(66.67, 1); // 2/3 * 100
    });
  });
});
