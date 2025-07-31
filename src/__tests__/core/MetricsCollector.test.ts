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
      expect(typeof metrics.creativityScore).toBe('number');
      expect(metrics.creativityScore).toBeGreaterThan(0);
    });

    it('should update creativity score based on output', () => {
      const input: ThinkingOperationData = {
        technique: 'six_hats',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 6,
        output:
          'This is a very creative and diverse output with many unique ideas and concepts that span multiple domains and perspectives',
        nextStepNeeded: true,
      };

      const metrics = collector.updateMetrics(mockSession, input);

      expect(metrics.creativityScore).toBeGreaterThan(0);
      expect(metrics.creativityScore).toBeLessThanOrEqual(10);
    });

    it('should accumulate risks caught', () => {
      mockSession.metrics = {
        creativityScore: 5,
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
        creativityScore: 5,
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

  describe('calculateCreativityScore', () => {
    it('should return higher scores for diverse vocabulary', () => {
      const repetitiveOutput = 'test test test test test';
      const diverseOutput = 'innovative creative unique novel original';

      const repetitiveScore = collector.calculateCreativityScore(repetitiveOutput, 0);
      const diverseScore = collector.calculateCreativityScore(diverseOutput, 0);

      expect(diverseScore).toBeGreaterThan(repetitiveScore);
    });

    it('should cap creativity score at 10', () => {
      const veryLongDiverseOutput = Array(1000)
        .fill(0)
        .map((_, i) => `unique_word_${i}`)
        .join(' ');

      const score = collector.calculateCreativityScore(veryLongDiverseOutput, 9.5);

      expect(score).toBeLessThanOrEqual(10);
      expect(score).toBeGreaterThan(9.5);
    });

    it('should handle empty output gracefully', () => {
      const score = collector.calculateCreativityScore('', 5);

      expect(score).toBe(5); // No change from current score
    });

    it('should handle whitespace-only output', () => {
      const score = collector.calculateCreativityScore('   \n\t  ', 5);

      expect(score).toBe(5); // No change for whitespace-only
    });

    it('should incrementally increase score', () => {
      let score = 0;
      const outputs = [
        'First creative thought',
        'Second innovative idea with different concepts',
        'Third unique perspective bringing novel approaches',
      ];

      outputs.forEach(output => {
        const newScore = collector.calculateCreativityScore(output, score);
        expect(newScore).toBeGreaterThan(score);
        score = newScore;
      });

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
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
        creativityScore: 7.5,
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
      expect(detailed.creativityScore).toBe(7.5);
      expect(detailed.risksCaught).toBe(5);
      expect(detailed.antifragileFeatures).toBe(3);
      expect(detailed.completionTime).toBeCloseTo(3600000, -4); // ~1 hour
      expect(detailed.techniqueEffectiveness).toBeGreaterThan(0);
      expect(detailed.techniqueEffectiveness).toBeLessThanOrEqual(10);
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
      expect(detailed.techniqueEffectiveness).toBeLessThan(5); // Lower score for incomplete
    });
  });

  describe('calculateTechniqueEffectiveness', () => {
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
        creativityScore: 8,
        risksCaught: 5,
        antifragileFeatures: 3,
      };
      mockSession.endTime = Date.now();

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.techniqueEffectiveness).toBeGreaterThan(7);
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
        creativityScore: 2,
        risksCaught: 0,
        antifragileFeatures: 0,
      };
      // No end time - incomplete

      const detailed = collector.getDetailedMetrics(mockSession);

      expect(detailed.techniqueEffectiveness).toBeLessThan(3);
    });
  });

  describe('generateMetricsSummary', () => {
    it('should generate comprehensive summary', () => {
      const metrics = {
        totalSteps: 10,
        revisionsCount: 2,
        branchesCount: 1,
        insightsGenerated: 5,
        creativityScore: 7.5,
        risksCaught: 3,
        antifragileFeatures: 2,
        flexibilityScore: 0.65,
        constraintsIdentified: 4,
        escapePlanGenerated: false,
        completionTime: 3665000, // 61 minutes 5 seconds
        techniqueEffectiveness: 8.2,
      };

      const summary = collector.generateMetricsSummary(metrics);

      expect(summary).toContain('Total Steps: 10');
      expect(summary).toContain('Insights Generated: 5');
      expect(summary).toContain('Creativity Score: 7.5/10');
      expect(summary).toContain('Risks Identified: 3');
      expect(summary).toContain('Antifragile Features: 2');
      expect(summary).toContain('Revisions Made: 2');
      expect(summary).toContain('Flexibility Score: 65%');
      expect(summary).toContain('Completion Time: 61m 5s');
      expect(summary).toContain('Technique Effectiveness: 8.2/10');
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
      expect(summary).not.toContain('Creativity Score'); // Undefined
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
        creativityScore: 6,
        risksCaught: 2,
        antifragileFeatures: 1,
        techniqueEffectiveness: 7,
      };

      const session2 = {
        totalSteps: 15,
        revisionsCount: 1,
        branchesCount: 2,
        insightsGenerated: 8,
        creativityScore: 8,
        risksCaught: 5,
        antifragileFeatures: 3,
        techniqueEffectiveness: 8.5,
      };

      const comparison = collector.compareMetrics(session1, session2);

      expect(comparison.creativityScoreDiff).toBeCloseTo(33.33, 1); // (8-6)/6 * 100
      expect(comparison.risksCaughtDiff).toBeCloseTo(150, 1); // (5-2)/2 * 100
      expect(comparison.insightsGeneratedDiff).toBeCloseTo(100, 1); // (8-4)/4 * 100
      expect(comparison.effectivenessDiff).toBeCloseTo(21.43, 1); // (8.5-7)/7 * 100
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
            creativityScore: 6,
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
            creativityScore: 8,
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
      expect(aggregated.averageMetrics.creativityScore).toBe(7); // (6+8)/2
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
