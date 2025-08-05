/**
 * Tests for parallel execution performance metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParallelExecutionMetrics } from '../ParallelExecutionMetrics.js';
import type {} from '../ParallelExecutionMetrics.js';

describe('ParallelExecutionMetrics', () => {
  let metrics: ParallelExecutionMetrics;

  beforeEach(() => {
    vi.useFakeTimers();
    metrics = new ParallelExecutionMetrics();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Group Tracking', () => {
    it('should track group start and completion', () => {
      const groupId = 'test-group-1';

      // Start group
      metrics.startGroup(groupId, 3, { strategy: 'merge' });

      let current = metrics.getCurrentMetrics();
      expect(current.activeGroups).toBe(1);
      expect(current.currentConcurrency).toBe(1);

      // Complete group
      metrics.completeGroup(groupId);

      current = metrics.getCurrentMetrics();
      expect(current.activeGroups).toBe(0);

      // Get completed group metrics
      const groupMetrics = metrics.getGroupMetrics(groupId);
      expect(groupMetrics).toBeDefined();
      expect(groupMetrics?.endTime).toBeDefined();
      expect(groupMetrics?.totalDuration).toBeDefined();
    });

    it('should track peak concurrency', () => {
      // Start multiple groups
      for (let i = 0; i < 5; i++) {
        metrics.startGroup(`group-${i}`, 2);
      }

      const current = metrics.getCurrentMetrics();
      expect(current.currentConcurrency).toBe(5);
      expect(current.peakConcurrency).toBe(5);

      // Complete some groups
      metrics.completeGroup('group-0');
      metrics.completeGroup('group-1');

      const afterComplete = metrics.getCurrentMetrics();
      expect(afterComplete.currentConcurrency).toBe(3);
      expect(afterComplete.peakConcurrency).toBe(5); // Peak should remain
    });
  });

  describe('Session Tracking', () => {
    it('should track session lifecycle', () => {
      const groupId = 'session-test-group';
      const sessionId = 'test-session-1';

      metrics.startGroup(groupId, 1);

      // Start session
      metrics.startSession(groupId, sessionId, 'six_hats', 1000);

      // Record steps
      const stepStartTime = Date.now();
      metrics.recordStepCompletion(sessionId, 1, stepStartTime, stepStartTime + 500);
      metrics.recordStepCompletion(sessionId, 2, stepStartTime + 500, stepStartTime + 1000);

      // Complete session
      metrics.completeSession(sessionId, 'completed', 5);

      // Get group metrics
      const groupMetrics = metrics.getGroupMetrics(groupId);
      const session = groupMetrics?.sessions.get(sessionId);

      expect(session).toBeDefined();
      expect(session?.status).toBe('completed');
      expect(session?.steps.length).toBe(2);
      expect(session?.insightsGenerated).toBe(5);
      expect(session?.waitTime).toBe(1000);
    });

    it('should track errors and retries', () => {
      const groupId = 'error-test-group';
      const sessionId = 'error-session';

      metrics.startGroup(groupId, 1);
      metrics.startSession(groupId, sessionId, 'po');

      // Record errors and retries
      metrics.recordError(sessionId);
      metrics.recordError(sessionId);
      metrics.recordRetry(sessionId);

      const groupMetrics = metrics.getGroupMetrics(groupId);
      const session = groupMetrics?.sessions.get(sessionId);

      expect(session?.errorCount).toBe(2);
      expect(session?.retryCount).toBe(1);
    });
  });

  describe('Parallel Efficiency Calculation', () => {
    it('should calculate parallel efficiency correctly', () => {
      const groupId = 'efficiency-group';

      metrics.startGroup(groupId, 3);

      // Simulate 3 sessions running in parallel
      metrics.startSession(groupId, 'session-1', 'six_hats');
      metrics.startSession(groupId, 'session-2', 'po');
      metrics.startSession(groupId, 'session-3', 'random_entry');

      // Advance time and complete sessions at different times
      vi.advanceTimersByTime(1000); // 1 second
      metrics.completeSession('session-1', 'completed', 3);

      vi.advanceTimersByTime(500); // 0.5 seconds more
      metrics.completeSession('session-2', 'completed', 2);

      vi.advanceTimersByTime(1000); // 1 second more
      metrics.completeSession('session-3', 'completed', 4);

      // Complete group
      metrics.completeGroup(groupId);

      const groupMetrics = metrics.getGroupMetrics(groupId);
      expect(groupMetrics?.parallelEfficiency).toBeDefined();
      expect(groupMetrics?.parallelEfficiency).toBeGreaterThan(0);
      expect(groupMetrics?.parallelEfficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('Aggregate Metrics', () => {
    it('should calculate aggregate metrics across multiple groups', () => {
      // Create multiple groups with different outcomes
      for (let i = 0; i < 3; i++) {
        const groupId = `agg-group-${i}`;
        metrics.startGroup(groupId, 2);

        metrics.startSession(groupId, `${groupId}-s1`, 'six_hats');
        metrics.startSession(groupId, `${groupId}-s2`, 'po');

        // Complete with different statuses
        if (i === 0) {
          metrics.completeSession(`${groupId}-s1`, 'completed', 5);
          metrics.completeSession(`${groupId}-s2`, 'completed', 3);
        } else if (i === 1) {
          metrics.completeSession(`${groupId}-s1`, 'completed', 4);
          metrics.completeSession(`${groupId}-s2`, 'failed', 0);
        } else {
          metrics.completeSession(`${groupId}-s1`, 'failed', 0);
          metrics.completeSession(`${groupId}-s2`, 'failed', 0);
        }

        metrics.completeGroup(groupId);
      }

      const aggregate = metrics.getAggregateMetrics();

      expect(aggregate.totalExecutions).toBe(6);
      expect(aggregate.successfulExecutions).toBe(3);
      expect(aggregate.failedExecutions).toBe(3);
      expect(aggregate.totalInsightsGenerated).toBe(12); // 5 + 3 + 4

      // Check technique performance
      const sixHatsPerf = aggregate.techniquePerformance.get('six_hats');
      expect(sixHatsPerf).toBeDefined();
      expect(sixHatsPerf?.count).toBe(3);
      expect(sixHatsPerf?.successRate).toBe(2 / 3);

      const poPerf = aggregate.techniquePerformance.get('po');
      expect(poPerf).toBeDefined();
      expect(poPerf?.count).toBe(3);
      expect(poPerf?.successRate).toBe(1 / 3);
    });

    it('should track technique-specific metrics', () => {
      const techniques = ['six_hats', 'po', 'random_entry', 'scamper'];

      techniques.forEach((technique, index) => {
        const groupId = `tech-group-${index}`;
        metrics.startGroup(groupId, 1);

        const sessionId = `tech-session-${index}`;
        metrics.startSession(groupId, sessionId, technique as any);

        // Record some steps
        const baseTime = Date.now();
        for (let step = 1; step <= 3; step++) {
          metrics.recordStepCompletion(
            sessionId,
            step,
            baseTime + (step - 1) * 1000,
            baseTime + step * 1000
          );
        }

        metrics.completeSession(sessionId, 'completed', index + 2);
        metrics.completeGroup(groupId);
      });

      const aggregate = metrics.getAggregateMetrics();

      // Each technique should have metrics
      techniques.forEach((technique, index) => {
        const techPerf = aggregate.techniquePerformance.get(technique as any);
        expect(techPerf).toBeDefined();
        expect(techPerf?.count).toBe(1);
        expect(techPerf?.successRate).toBe(1);
        expect(techPerf?.averageInsights).toBe(index + 2);
      });
    });
  });

  describe('Resource Usage Tracking', () => {
    it('should track resource usage metrics', () => {
      const groupId = 'resource-group';

      metrics.startGroup(groupId, 2);
      metrics.startSession(groupId, 'session-1', 'six_hats');
      vi.advanceTimersByTime(500);
      metrics.startSession(groupId, 'session-2', 'po');

      vi.advanceTimersByTime(1000);
      metrics.completeSession('session-1', 'completed', 3);
      vi.advanceTimersByTime(500);
      metrics.completeSession('session-2', 'completed', 2);

      metrics.completeGroup(groupId);

      const groupMetrics = metrics.getGroupMetrics(groupId);

      expect(groupMetrics?.resourceUsage).toBeDefined();
      expect(groupMetrics?.resourceUsage.peakMemoryUsage).toBeGreaterThan(0);
      expect(groupMetrics?.resourceUsage.averageMemoryUsage).toBeGreaterThan(0);
      expect(groupMetrics?.resourceUsage.cpuTime).toBeGreaterThan(0);
    });
  });

  describe('Export and Reset', () => {
    it('should export metrics as JSON', () => {
      // Create some data
      metrics.startGroup('export-group', 1);
      metrics.startSession('export-group', 'export-session', 'six_hats');
      metrics.completeSession('export-session', 'completed', 5);
      metrics.completeGroup('export-group');

      const exported = metrics.exportMetrics();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('aggregate');
      expect(parsed).toHaveProperty('current');
      expect(parsed).toHaveProperty('groups');
      expect(parsed.groups.length).toBe(1);
    });

    it('should reset all metrics', () => {
      // Create some data
      metrics.startGroup('reset-group', 2);
      metrics.startSession('reset-group', 'session-1', 'six_hats');
      metrics.completeSession('session-1', 'completed', 3);

      // Reset
      metrics.reset();

      const current = metrics.getCurrentMetrics();
      expect(current.activeGroups).toBe(0);
      expect(current.activeSessions).toBe(0);
      expect(current.currentConcurrency).toBe(0);

      const aggregate = metrics.getAggregateMetrics();
      expect(aggregate.totalExecutions).toBe(0);
    });
  });

  describe('Current Metrics Snapshot', () => {
    it('should provide accurate current metrics', () => {
      // Start multiple groups and sessions
      metrics.startGroup('current-group-1', 3);
      metrics.startGroup('current-group-2', 2);

      metrics.startSession('current-group-1', 'session-1-1', 'six_hats');
      metrics.startSession('current-group-1', 'session-1-2', 'po');
      metrics.startSession('current-group-1', 'session-1-3', 'random_entry');
      metrics.startSession('current-group-2', 'session-2-1', 'scamper');
      metrics.startSession('current-group-2', 'session-2-2', 'triz');

      // Advance time to ensure uptime > 0
      vi.advanceTimersByTime(100);

      const current = metrics.getCurrentMetrics();

      expect(current.activeGroups).toBe(2);
      expect(current.activeSessions).toBe(5);
      expect(current.currentConcurrency).toBe(2);
      expect(current.uptime).toBeGreaterThan(0);
    });
  });
});
