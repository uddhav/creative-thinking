/**
 * Tests for ParallelExecutionMetrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParallelExecutionMetrics } from '../../../layers/execution/ParallelExecutionMetrics.js';

describe('ParallelExecutionMetrics', () => {
  let metrics: ParallelExecutionMetrics;

  beforeEach(() => {
    metrics = new ParallelExecutionMetrics();
  });

  describe('startGroup', () => {
    it('should start tracking a group', () => {
      metrics.startGroup('group-123', 3);

      const current = metrics.getCurrentMetrics();
      expect(current.activeGroups).toBe(1);
      expect(current.currentConcurrency).toBe(1);
      expect(current.peakConcurrency).toBe(1);
    });

    it('should track convergence options', () => {
      metrics.startGroup('group-123', 3, { strategy: 'merge' });

      const groupMetrics = metrics.getGroupMetrics('group-123');
      expect(groupMetrics?.convergenceOptions).toEqual({
        strategy: 'merge',
        sessionCount: 3,
      });
    });

    it('should update peak concurrency', () => {
      metrics.startGroup('group-1', 2);
      metrics.startGroup('group-2', 3);
      metrics.startGroup('group-3', 2);

      const current = metrics.getCurrentMetrics();
      expect(current.currentConcurrency).toBe(3);
      expect(current.peakConcurrency).toBe(3);

      metrics.completeGroup('group-2');

      const afterComplete = metrics.getCurrentMetrics();
      expect(afterComplete.currentConcurrency).toBe(2);
      expect(afterComplete.peakConcurrency).toBe(3); // Peak remains
    });
  });

  describe('startSession', () => {
    it('should track session within a group', () => {
      metrics.startGroup('group-123', 2);
      metrics.startSession('group-123', 'session1', 'six_hats', 500);

      const groupMetrics = metrics.getGroupMetrics('group-123');
      expect(groupMetrics?.sessions.size).toBe(1);

      const session = groupMetrics?.sessions.get('session1');
      expect(session?.technique).toBe('six_hats');
      expect(session?.waitTime).toBe(500);
      expect(session?.status).toBe('in_progress');
    });

    it('should handle missing group gracefully', () => {
      // Should not throw
      expect(() => {
        metrics.startSession('non-existent', 'session1', 'po');
      }).not.toThrow();
    });
  });

  describe('recordStepCompletion', () => {
    it('should record step completion for a session', () => {
      metrics.startGroup('group-123', 1);
      metrics.startSession('group-123', 'session1', 'six_hats');

      const startTime = Date.now();
      const endTime = startTime + 1000;
      metrics.recordStepCompletion('session1', 1, startTime, endTime);

      const groupMetrics = metrics.getGroupMetrics('group-123');
      const session = groupMetrics?.sessions.get('session1');

      expect(session?.steps).toHaveLength(1);
      expect(session?.steps[0]).toEqual({
        stepNumber: 1,
        startTime,
        endTime,
        duration: 1000,
      });
    });

    it('should find session across groups', () => {
      metrics.startGroup('group-1', 1);
      metrics.startGroup('group-2', 1);
      metrics.startSession('group-2', 'session1', 'po');

      const startTime = Date.now();
      metrics.recordStepCompletion('session1', 1, startTime, startTime + 500);

      const groupMetrics = metrics.getGroupMetrics('group-2');
      const session = groupMetrics?.sessions.get('session1');
      expect(session?.steps).toHaveLength(1);
    });
  });

  describe('completeSession', () => {
    it('should complete a successful session', () => {
      metrics.startGroup('group-123', 1);
      metrics.startSession('group-123', 'session1', 'six_hats');

      metrics.completeSession('session1', 'completed', 5);

      const groupMetrics = metrics.getGroupMetrics('group-123');
      const session = groupMetrics?.sessions.get('session1');

      expect(session?.status).toBe('completed');
      expect(session?.endTime).toBeDefined();
      expect(session?.duration).toBeDefined();
      expect(session?.insightsGenerated).toBe(5);
    });

    it('should complete a failed session', () => {
      metrics.startGroup('group-123', 1);
      metrics.startSession('group-123', 'session1', 'triz');

      metrics.completeSession('session1', 'failed', 0);

      const groupMetrics = metrics.getGroupMetrics('group-123');
      const session = groupMetrics?.sessions.get('session1');

      expect(session?.status).toBe('failed');
      expect(session?.insightsGenerated).toBe(0);
    });
  });

  describe('recordError and recordRetry', () => {
    it('should track errors', () => {
      metrics.startGroup('group-123', 1);
      metrics.startSession('group-123', 'session1', 'scamper');

      metrics.recordError('session1');
      metrics.recordError('session1');

      const groupMetrics = metrics.getGroupMetrics('group-123');
      const session = groupMetrics?.sessions.get('session1');
      expect(session?.errorCount).toBe(2);
    });

    it('should track retries', () => {
      metrics.startGroup('group-123', 1);
      metrics.startSession('group-123', 'session1', 'disney_method');

      metrics.recordRetry('session1');
      metrics.recordRetry('session1');
      metrics.recordRetry('session1');

      const groupMetrics = metrics.getGroupMetrics('group-123');
      const session = groupMetrics?.sessions.get('session1');
      expect(session?.retryCount).toBe(3);
    });
  });

  describe('completeGroup', () => {
    it('should complete a group and calculate metrics', () => {
      metrics.startGroup('group-123', 2);

      // Start two sessions
      metrics.startSession('group-123', 'session1', 'six_hats');
      metrics.startSession('group-123', 'session2', 'po');

      // Complete sessions
      metrics.completeSession('session1', 'completed', 3);
      metrics.completeSession('session2', 'completed', 2);

      metrics.completeGroup('group-123');

      const groupMetrics = metrics.getGroupMetrics('group-123');
      expect(groupMetrics?.endTime).toBeDefined();
      expect(groupMetrics?.totalDuration).toBeDefined();
      expect(groupMetrics?.parallelEfficiency).toBeDefined();

      // Should be moved to completed
      const current = metrics.getCurrentMetrics();
      expect(current.activeGroups).toBe(0);
    });

    it('should calculate parallel efficiency correctly', () => {
      vi.useFakeTimers();
      const baseTime = Date.now();
      vi.setSystemTime(baseTime);

      metrics.startGroup('group-123', 2);

      // Start session1 at time 0
      metrics.startSession('group-123', 'session1', 'six_hats');

      // Advance 100ms and start session2
      vi.advanceTimersByTime(100);
      metrics.startSession('group-123', 'session2', 'po');

      // Complete session2 after 400ms more (total 500ms duration)
      vi.advanceTimersByTime(400);
      metrics.completeSession('session2', 'completed', 3);

      // Complete session1 after 500ms more (total 1000ms duration)
      vi.advanceTimersByTime(500);
      metrics.completeSession('session1', 'completed', 2);

      // Session 1: 0-1000ms (1 second)
      // Session 2: 100-600ms (0.5 seconds)
      // Wall clock time: 1000ms
      // Total work time: 1500ms
      // Theoretical parallel time: 1000ms * 2 = 2000ms
      // Efficiency: 1500/2000 = 0.75

      metrics.completeGroup('group-123');

      const groupMetrics = metrics.getGroupMetrics('group-123');
      // The exact efficiency depends on timing precision
      // We expect something close to 0.75 (could be 0.7 or 0.75)
      expect(groupMetrics?.parallelEfficiency).toBeGreaterThanOrEqual(0.7);
      expect(groupMetrics?.parallelEfficiency).toBeLessThanOrEqual(0.8);

      vi.useRealTimers();
    });
  });

  describe('getCurrentMetrics', () => {
    it('should provide current snapshot', () => {
      vi.useFakeTimers();
      const baseTime = Date.now();
      vi.setSystemTime(baseTime);

      metrics.startGroup('group-1', 2);
      metrics.startSession('group-1', 'session1', 'six_hats');
      metrics.startSession('group-1', 'session2', 'po');

      metrics.startGroup('group-2', 1);
      metrics.startSession('group-2', 'session3', 'scamper');

      // Advance time to ensure uptime > 0
      vi.advanceTimersByTime(100);

      const current = metrics.getCurrentMetrics();

      expect(current.activeGroups).toBe(2);
      expect(current.activeSessions).toBe(3);
      expect(current.currentConcurrency).toBe(2);
      expect(current.uptime).toBeGreaterThan(0);

      vi.useRealTimers();
    });
  });

  describe('getAggregateMetrics', () => {
    it('should calculate aggregate metrics across all groups', () => {
      // Start both groups concurrently to achieve peak concurrency of 2
      metrics.startGroup('group-1', 2);
      metrics.startGroup('group-2', 1);

      // Sessions for group-1
      metrics.startSession('group-1', 'session1', 'six_hats');
      metrics.startSession('group-1', 'session2', 'po');

      // Session for group-2
      metrics.startSession('group-2', 'session3', 'six_hats');

      // Complete sessions
      metrics.completeSession('session1', 'completed', 3);
      metrics.completeSession('session2', 'failed', 0);
      metrics.completeSession('session3', 'completed', 2);

      // Complete groups
      metrics.completeGroup('group-1');
      // Keep group-2 active to test mixed state

      const aggregate = metrics.getAggregateMetrics();

      expect(aggregate.totalExecutions).toBe(3);
      expect(aggregate.successfulExecutions).toBe(2);
      expect(aggregate.failedExecutions).toBe(1);
      expect(aggregate.totalInsightsGenerated).toBe(5);
      expect(aggregate.peakConcurrency).toBe(2);
    });

    it('should track technique performance', () => {
      metrics.startGroup('group-1', 3);

      // Six hats - 2 sessions
      metrics.startSession('group-1', 'session1', 'six_hats');
      metrics.completeSession('session1', 'completed', 4);

      metrics.startSession('group-1', 'session2', 'six_hats');
      metrics.completeSession('session2', 'completed', 6);

      // PO - 1 session
      metrics.startSession('group-1', 'session3', 'po');
      metrics.completeSession('session3', 'failed', 0);

      const aggregate = metrics.getAggregateMetrics();

      const sixHatsStats = aggregate.techniquePerformance.get('six_hats');
      expect(sixHatsStats).toBeDefined();
      expect(sixHatsStats?.count).toBe(2);
      expect(sixHatsStats?.successRate).toBe(1.0);
      expect(sixHatsStats?.averageInsights).toBe(5);

      const poStats = aggregate.techniquePerformance.get('po');
      expect(poStats).toBeDefined();
      expect(poStats?.count).toBe(1);
      expect(poStats?.successRate).toBe(0);
      expect(poStats?.averageInsights).toBe(0);
    });

    it('should handle empty metrics gracefully', () => {
      const aggregate = metrics.getAggregateMetrics();

      expect(aggregate.totalExecutions).toBe(0);
      expect(aggregate.averageDuration).toBe(0);
      expect(aggregate.averageParallelEfficiency).toBe(0);
      expect(aggregate.techniquePerformance.size).toBe(0);
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics as JSON', () => {
      metrics.startGroup('group-1', 1);
      metrics.startSession('group-1', 'session1', 'six_hats');
      metrics.completeSession('session1', 'completed', 3);
      metrics.completeGroup('group-1');

      const exported = metrics.exportMetrics();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('aggregate');
      expect(parsed).toHaveProperty('current');
      expect(parsed).toHaveProperty('groups');
      expect(parsed.groups).toHaveLength(1);
      expect(parsed.groups[0].groupId).toBe('group-1');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.startGroup('group-1', 2);
      metrics.startSession('group-1', 'session1', 'six_hats');
      metrics.completeSession('session1', 'completed', 3);
      metrics.completeGroup('group-1');

      metrics.reset();

      const current = metrics.getCurrentMetrics();
      expect(current.activeGroups).toBe(0);
      expect(current.activeSessions).toBe(0);
      expect(current.currentConcurrency).toBe(0);
      expect(current.peakConcurrency).toBe(0);

      const aggregate = metrics.getAggregateMetrics();
      expect(aggregate.totalExecutions).toBe(0);
    });
  });

  describe('resource usage tracking', () => {
    it('should track resource usage when completing a group', () => {
      metrics.startGroup('group-1', 1);
      metrics.startSession('group-1', 'session1', 'six_hats');
      metrics.completeSession('session1', 'completed', 2);
      metrics.completeGroup('group-1');

      const groupMetrics = metrics.getGroupMetrics('group-1');
      expect(groupMetrics?.resourceUsage).toBeDefined();
      expect(groupMetrics?.resourceUsage.peakMemoryUsage).toBeGreaterThan(0);
      expect(groupMetrics?.resourceUsage.averageMemoryUsage).toBeGreaterThan(0);
      expect(groupMetrics?.resourceUsage.cpuTime).toBeGreaterThanOrEqual(0);
    });
  });
});
