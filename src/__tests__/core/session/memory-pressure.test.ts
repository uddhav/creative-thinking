/**
 * Memory Pressure and Session Management Tests
 * Tests for memory limits, cleanup, and bounds checking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionEncoder } from '../../../core/session/SessionEncoder.js';
import { ExecutionGraphGenerator } from '../../../layers/planning/ExecutionGraphGenerator.js';
import type { EncodedSessionData } from '../../../core/session/SessionEncoder.js';

describe('Memory Pressure and Session Management', () => {
  beforeEach(() => {
    // Reset metrics for clean tests
    vi.clearAllMocks();
  });

  describe('Session Size Limits', () => {
    it('should reject sessions larger than 1MB', () => {
      const largeData: EncodedSessionData = {
        planId: 'test-plan',
        problem: 'x'.repeat(1024 * 1024 + 1), // Over 1MB
        technique: 'six_hats',
        currentStep: 1,
        totalSteps: 7,
        timestamp: Date.now(),
      };

      expect(() => SessionEncoder.encode(largeData)).toThrow('Session data too large');
    });

    it('should accept sessions under 1MB', () => {
      const normalData: EncodedSessionData = {
        planId: 'test-plan',
        problem: 'x'.repeat(1000), // Well under 1MB
        technique: 'six_hats',
        currentStep: 1,
        totalSteps: 7,
        timestamp: Date.now(),
      };

      expect(() => SessionEncoder.encode(normalData)).not.toThrow();
    });

    it('should track largest session size in metrics', () => {
      const smallData: EncodedSessionData = {
        planId: 'test',
        problem: 'small',
        technique: 'po',
        currentStep: 1,
        totalSteps: 4,
        timestamp: Date.now(),
      };

      const largerData: EncodedSessionData = {
        planId: 'test',
        problem: 'x'.repeat(10000),
        technique: 'scamper',
        currentStep: 1,
        totalSteps: 8,
        timestamp: Date.now(),
      };

      SessionEncoder.encode(smallData);
      SessionEncoder.encode(largerData);

      const metrics = SessionEncoder.getMetrics();
      expect(metrics.largestSession).toBeGreaterThan(10000);
      expect(metrics.encodeCalls).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Session Expiry and Cleanup', () => {
    it('should mark sessions as expired after 30 days', () => {
      const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 days ago
      const expiredData: EncodedSessionData = {
        planId: 'old-plan',
        problem: 'expired session',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 7,
        timestamp: oldTimestamp,
      };

      const encoded = SessionEncoder.encode(expiredData);

      // Manually decode to check without validation
      const decoded = SessionEncoder.decode(encoded);
      expect(decoded).toBeDefined();

      // But validation should fail
      expect(SessionEncoder.isValid(encoded)).toBe(false);
    });

    it('should accept sessions within 30 days', () => {
      const recentTimestamp = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      const validData: EncodedSessionData = {
        planId: 'recent-plan',
        problem: 'valid session',
        technique: 'design_thinking',
        currentStep: 2,
        totalSteps: 5,
        timestamp: recentTimestamp,
      };

      const encoded = SessionEncoder.encode(validData);
      expect(SessionEncoder.isValid(encoded)).toBe(true);
    });

    it('should track session creation metrics', () => {
      const initialMetrics = SessionEncoder.getMetrics();
      const initialCount = initialMetrics.totalSessionsCreated;

      // Encode multiple sessions
      for (let i = 0; i < 10; i++) {
        const data: EncodedSessionData = {
          planId: `plan-${i}`,
          problem: `problem ${i}`,
          technique: 'po',
          currentStep: 1,
          totalSteps: 4,
          timestamp: Date.now(),
        };
        SessionEncoder.encode(data);
      }

      const finalMetrics = SessionEncoder.getMetrics();
      expect(finalMetrics.totalSessionsCreated).toBe(initialCount + 10);
      expect(finalMetrics.activeSessions).toBeGreaterThan(0);
    });
  });

  describe('Purple Hat and Bounds Checking', () => {
    it('should handle purple hat (7th step) correctly for six_hats', () => {
      const params = ExecutionGraphGenerator.getTechniqueSpecificParams('six_hats', 7, {
        description: 'step 7',
      });
      expect(params.hatColor).toBe('purple');
    });

    it('should handle out of bounds steps safely for six_hats', () => {
      // Step 0 should map to first color
      let params = ExecutionGraphGenerator.getTechniqueSpecificParams('six_hats', 0, {
        description: 'step 0',
      });
      expect(params.hatColor).toBe('blue');

      // Step 10 should cap at last color (purple)
      params = ExecutionGraphGenerator.getTechniqueSpecificParams('six_hats', 10, {
        description: 'step 10',
      });
      expect(params.hatColor).toBe('purple');

      // Negative step should map to first color
      params = ExecutionGraphGenerator.getTechniqueSpecificParams('six_hats', -5, {
        description: 'negative step',
      });
      expect(params.hatColor).toBe('blue');
    });

    it('should handle out of bounds steps for scamper', () => {
      // SCAMPER has 8 actions
      let params = ExecutionGraphGenerator.getTechniqueSpecificParams('scamper', 0, {
        description: 'step 0',
      });
      expect(params.scamperAction).toBe('substitute');

      params = ExecutionGraphGenerator.getTechniqueSpecificParams('scamper', 15, {
        description: 'step 15',
      });
      expect(params.scamperAction).toBe('parameterize'); // Last action
    });

    it('should handle out of bounds steps for design_thinking', () => {
      // Design thinking has 5 stages
      let params = ExecutionGraphGenerator.getTechniqueSpecificParams('design_thinking', 0, {
        description: 'step 0',
      });
      expect(params.designStage).toBe('empathize');

      params = ExecutionGraphGenerator.getTechniqueSpecificParams('design_thinking', 10, {
        description: 'step 10',
      });
      expect(params.designStage).toBe('test'); // Last stage
    });

    it('should handle out of bounds steps for disney_method', () => {
      // Disney method has 3 roles
      let params = ExecutionGraphGenerator.getTechniqueSpecificParams('disney_method', 0, {
        description: 'step 0',
      });
      expect(params.disneyRole).toBe('dreamer');

      params = ExecutionGraphGenerator.getTechniqueSpecificParams('disney_method', 5, {
        description: 'step 5',
      });
      expect(params.disneyRole).toBe('critic'); // Last role
    });

    it('should handle out of bounds steps for nine_windows', () => {
      // Nine windows has 9 cells
      let params = ExecutionGraphGenerator.getTechniqueSpecificParams('nine_windows', 0, {
        description: 'step 0',
      });
      expect(params.currentCell).toEqual({
        systemLevel: 'sub-system',
        timeFrame: 'past',
      });

      params = ExecutionGraphGenerator.getTechniqueSpecificParams('nine_windows', 20, {
        description: 'step 20',
      });
      expect(params.currentCell).toEqual({
        systemLevel: 'super-system',
        timeFrame: 'future',
      }); // Last cell
    });
  });

  describe('DAG Generation Performance', () => {
    it('should efficiently generate DAG for large technique lists', () => {
      const startTime = Date.now();

      // Generate a large workflow
      const workflows = [];
      const techniques = ['six_hats', 'scamper', 'design_thinking', 'triz', 'po'] as const;

      for (const technique of techniques) {
        const stepCount =
          technique === 'six_hats'
            ? 7
            : technique === 'scamper'
              ? 8
              : technique === 'design_thinking'
                ? 5
                : 4;

        const steps = [];
        for (let i = 1; i <= stepCount; i++) {
          steps.push({
            description: `${technique} step ${i}`,
          });
        }

        workflows.push({
          technique,
          steps,
        });
      }

      // This should complete quickly even with many nodes
      const graph = ExecutionGraphGenerator.generateExecutionGraph(
        'test-plan',
        'test problem',
        workflows
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in under 100ms even for complex graphs
      expect(duration).toBeLessThan(100);
      expect(graph.nodes.length).toBeGreaterThan(20);
      expect(graph.metadata.parallelizableGroups).toBeDefined();

      // Verify the optimized algorithm found parallel groups
      const hasParallelGroups = graph.metadata.parallelizableGroups.some(group => group.length > 1);
      expect(hasParallelGroups).toBe(true);
    });

    it('should handle empty workflow gracefully', () => {
      const graph = ExecutionGraphGenerator.generateExecutionGraph('empty-plan', 'no problem', []);

      expect(graph.nodes).toHaveLength(0);
      expect(graph.metadata.totalNodes).toBe(0);
      expect(graph.metadata.criticalPath).toHaveLength(0);
    });
  });

  describe('Concurrent Session Encoding Stress Test', () => {
    it('should handle concurrent encoding without errors', async () => {
      const promises = [];

      // Create 50 concurrent encoding operations
      for (let i = 0; i < 50; i++) {
        const promise = new Promise(resolve => {
          const data: EncodedSessionData = {
            planId: `concurrent-${i}`,
            problem: `problem ${i}`.repeat(100),
            technique: 'six_hats',
            currentStep: (i % 7) + 1,
            totalSteps: 7,
            timestamp: Date.now(),
          };

          try {
            const encoded = SessionEncoder.encode(data);
            const decoded = SessionEncoder.decode(encoded);
            resolve({ success: true, decoded });
          } catch (error) {
            resolve({ success: false, error });
          }
        });

        promises.push(promise);
      }

      const results = await Promise.all(promises);

      // All operations should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(50);

      // Check metrics
      const metrics = SessionEncoder.getMetrics();
      expect(metrics.encodeCalls).toBeGreaterThanOrEqual(50);
      expect(metrics.decodeCalls).toBeGreaterThanOrEqual(50);
    });
  });
});
