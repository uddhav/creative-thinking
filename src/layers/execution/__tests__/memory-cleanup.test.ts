/**
 * Tests for memory cleanup functionality in parallel execution components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgressCoordinator } from '../ProgressCoordinator.js';
import { ParallelErrorHandler } from '../ParallelErrorHandler.js';
import { SessionManager } from '../../../core/SessionManager.js';
import type { ProgressUpdate } from '../ProgressCoordinator.js';
import type { ParallelPlan } from '../../../types/planning.js';

describe('Memory Cleanup', () => {
  let sessionManager: SessionManager;
  let progressCoordinator: ProgressCoordinator;
  let errorHandler: ParallelErrorHandler;

  beforeEach(() => {
    sessionManager = new SessionManager();
    progressCoordinator = new ProgressCoordinator(sessionManager);
    errorHandler = new ParallelErrorHandler(sessionManager);
  });

  afterEach(() => {
    // Clean up timers
    progressCoordinator.stopCleanupTimer();
  });

  describe('ProgressCoordinator Memory Management', () => {
    it('should automatically clean up old completed groups', async () => {
      // Create plans for parallel group
      const plans: ParallelPlan[] = [
        {
          planId: 'plan-1',
          techniques: ['six_hats'],
          workflow: [
            {
              technique: 'six_hats',
              stepCount: 6,
              description: 'Test plan 1',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
        {
          planId: 'plan-2',
          techniques: ['six_hats'],
          workflow: [
            {
              technique: 'six_hats',
              stepCount: 6,
              description: 'Test plan 2',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
      ];

      const groupId = sessionManager.createParallelSessionGroup('Test problem', plans, {
        strategy: 'merge',
      });

      // Get the actual session IDs
      const group = sessionManager.getParallelGroup(groupId);
      const sessionIds = group?.sessionIds || [];

      // Start the group
      progressCoordinator.startGroup(groupId);

      // Simulate progress updates
      for (const sessionId of sessionIds) {
        const update: ProgressUpdate = {
          groupId,
          sessionId,
          technique: 'six_hats',
          currentStep: 1,
          totalSteps: 6,
          status: 'started',
          timestamp: Date.now(),
        };
        await progressCoordinator.reportProgress(update);
      }

      // Complete all sessions
      for (const sessionId of sessionIds) {
        const update: ProgressUpdate = {
          groupId,
          sessionId,
          technique: 'six_hats',
          currentStep: 6,
          totalSteps: 6,
          status: 'completed',
          timestamp: Date.now(),
        };
        await progressCoordinator.reportProgress(update);
      }

      // Check initial memory stats
      const initialStats = progressCoordinator.getMemoryStats();
      expect(initialStats.sessionProgressCount).toBe(2);
      expect(initialStats.completedGroupsAwaitingCleanup).toBe(1);

      // Manually trigger cleanup
      progressCoordinator.clearGroupProgress(groupId);

      // Check memory stats after cleanup
      const finalStats = progressCoordinator.getMemoryStats();
      expect(finalStats.sessionProgressCount).toBe(0);
      expect(finalStats.completedGroupsAwaitingCleanup).toBe(0);
    });

    it('should handle concurrent progress updates safely', async () => {
      const groupId = 'concurrent-group';
      const sessionId = 'concurrent-session';

      sessionManager.createSession(
        {
          problem: 'Test problem',
          technique: 'six_hats',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test output',
          nextStepNeeded: true,
        },
        sessionId
      );

      // Create multiple concurrent updates
      const updates = Array.from({ length: 10 }, (_, i) => ({
        groupId,
        sessionId,
        technique: 'six_hats' as const,
        currentStep: i + 1,
        totalSteps: 10,
        status: 'in_progress' as const,
        timestamp: Date.now() + i,
      }));

      // Send all updates concurrently
      await Promise.all(updates.map(update => progressCoordinator.reportProgress(update)));

      // Verify the last update was stored
      const finalProgress = progressCoordinator.getSessionProgress(sessionId);
      expect(finalProgress).toBeDefined();
      expect(finalProgress?.currentStep).toBe(10);
    });

    it('should clean up event listeners properly', () => {
      // Create plans for parallel group
      const plans: ParallelPlan[] = [
        {
          planId: 'listener-plan-1',
          techniques: ['six_hats'],
          workflow: [
            {
              technique: 'six_hats',
              stepCount: 6,
              description: 'Test plan 1',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
        {
          planId: 'listener-plan-2',
          techniques: ['six_hats'],
          workflow: [
            {
              technique: 'six_hats',
              stepCount: 6,
              description: 'Test plan 2',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
      ];

      const groupId = sessionManager.createParallelSessionGroup('Test problem', plans, {
        strategy: 'merge',
      });

      // Add some listeners
      const progressHandler = vi.fn();
      const groupHandler = vi.fn();

      progressCoordinator.on(`progress:${groupId}`, progressHandler);
      progressCoordinator.on(`group:${groupId}`, groupHandler);

      // Check listeners are registered
      expect(progressCoordinator.listenerCount(`progress:${groupId}`)).toBe(1);
      expect(progressCoordinator.listenerCount(`group:${groupId}`)).toBe(1);

      // Clear group progress
      progressCoordinator.clearGroupProgress(groupId);

      // Check listeners are removed
      expect(progressCoordinator.listenerCount(`progress:${groupId}`)).toBe(0);
      expect(progressCoordinator.listenerCount(`group:${groupId}`)).toBe(0);
    });
  });

  describe('ParallelErrorHandler Memory Management', () => {
    it('should track retry attempts correctly', () => {
      const sessionId = 'retry-session';
      const groupId = 'retry-group';
      const context = {
        sessionId,
        groupId,
        technique: 'six_hats' as const,
        step: 1,
        errorType: 'execution_error' as const,
      };

      // Simulate multiple errors (retries)
      for (let i = 0; i < 3; i++) {
        errorHandler.handleParallelError(new Error('Test error'), context);
      }

      // Check retry stats
      const stats = errorHandler.getRetryStats();
      expect(stats.totalSessionsWithRetries).toBeGreaterThan(0);
      expect(stats.maxRetryCount).toBeGreaterThan(0);
    });

    it('should clean up retry attempts for completed sessions', () => {
      const sessionId = 'cleanup-session';
      const groupId = 'cleanup-group';

      // Create session
      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'six_hats',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      // Add retry attempt
      const context = {
        sessionId,
        groupId,
        technique: 'six_hats' as const,
        step: 1,
        errorType: 'execution_error' as const,
      };
      errorHandler.handleParallelError(new Error('Test'), context);

      // Verify retry exists
      let stats = errorHandler.getRetryStats();
      expect(stats.totalSessionsWithRetries).toBe(1);

      // Clear retry attempts
      errorHandler.clearRetryAttempts(sessionId);

      // Verify retry is cleared
      stats = errorHandler.getRetryStats();
      expect(stats.totalSessionsWithRetries).toBe(0);
    });

    it('should clean up stale retry attempts', () => {
      const staleSessionId = 'stale-session';
      const activeSessionId = 'active-session';
      const groupId = 'test-group';

      // Create only active session
      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'six_hats',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test',
          nextStepNeeded: true,
        },
        activeSessionId
      );

      // Add retry attempts for both (stale session doesn't exist)
      const staleContext = {
        sessionId: staleSessionId,
        groupId,
        technique: 'six_hats' as const,
        step: 1,
        errorType: 'execution_error' as const,
      };
      const activeContext = {
        sessionId: activeSessionId,
        groupId,
        technique: 'six_hats' as const,
        step: 1,
        errorType: 'execution_error' as const,
      };

      errorHandler.handleParallelError(new Error('Test'), staleContext);
      errorHandler.handleParallelError(new Error('Test'), activeContext);

      // Verify both exist
      let stats = errorHandler.getRetryStats();
      expect(stats.totalSessionsWithRetries).toBe(2);

      // Clean up stale attempts
      errorHandler.cleanupStaleRetryAttempts();

      // Verify only active session remains
      stats = errorHandler.getRetryStats();
      expect(stats.totalSessionsWithRetries).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    it('should handle group completion with error recovery', async () => {
      const groupId = 'integration-group';
      const sessionIds = ['session-1', 'session-2', 'session-3'];

      // Create plans for parallel group
      const plans: ParallelPlan[] = sessionIds.map((id, index) => ({
        planId: `integration-plan-${index + 1}`,
        techniques: ['six_hats'],
        workflow: [
          {
            technique: 'six_hats',
            stepCount: 6,
            description: `Integration plan ${index + 1}`,
          },
        ],
        estimatedTime: 'quick',
        canExecuteIndependently: true,
      }));

      const createdGroupId = sessionManager.createParallelSessionGroup('Test problem', plans, {
        strategy: 'merge',
      });

      // Get the actual session IDs
      const group = sessionManager.getParallelGroup(createdGroupId);
      const actualSessionIds = group?.sessionIds || [];

      progressCoordinator.startGroup(createdGroupId);

      // Complete some sessions successfully
      for (const sessionId of actualSessionIds.slice(0, 2)) {
        const update: ProgressUpdate = {
          groupId: createdGroupId,
          sessionId,
          technique: 'six_hats',
          currentStep: 6,
          totalSteps: 6,
          status: 'completed',
          timestamp: Date.now(),
        };
        await progressCoordinator.reportProgress(update);
      }

      // Fail one session
      const failedUpdate: ProgressUpdate = {
        groupId: createdGroupId,
        sessionId: actualSessionIds[2],
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'failed',
        timestamp: Date.now(),
      };
      await progressCoordinator.reportProgress(failedUpdate);

      // Check group progress
      const summary = progressCoordinator.getGroupProgress(createdGroupId);
      expect(summary).toBeDefined();
      expect(summary?.completedSessions).toBe(2);
      expect(summary?.failedSessions).toBe(1);
      expect(summary?.totalSessions).toBe(3);
    });
  });
});
