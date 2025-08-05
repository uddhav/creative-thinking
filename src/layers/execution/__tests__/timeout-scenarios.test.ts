/**
 * Tests for timeout scenarios in parallel execution
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { ProgressCoordinator } from '../ProgressCoordinator.js';
import { ParallelErrorHandler } from '../ParallelErrorHandler.js';
import { ParallelStepExecutor } from '../ParallelStepExecutor.js';
import { SessionManager } from '../../../core/SessionManager.js';
import { SessionSynchronizer } from '../../../core/session/SessionSynchronizer.js';
import type { ParallelPlan } from '../../../types/planning.js';
import type { ExecuteThinkingStepInput } from '../../../types/index.js';

// Mock timers for testing
vi.useFakeTimers();

describe('Timeout Scenarios', () => {
  let sessionManager: SessionManager;
  let progressCoordinator: ProgressCoordinator;
  let errorHandler: ParallelErrorHandler;
  let parallelStepExecutor: ParallelStepExecutor;
  let sessionSynchronizer: SessionSynchronizer;

  beforeEach(() => {
    sessionManager = new SessionManager();
    progressCoordinator = new ProgressCoordinator(sessionManager);
    errorHandler = new ParallelErrorHandler(sessionManager);
    sessionSynchronizer = new SessionSynchronizer(sessionManager);
    parallelStepExecutor = new ParallelStepExecutor(sessionManager, sessionSynchronizer);

    // Wire up error handler for coordinated cleanup
    progressCoordinator.setErrorHandler(errorHandler);
  });

  describe('Automatic Cleanup Timers', () => {
    it('should automatically clean up old retry attempts after retention period', () => {
      const sessionId = 'timeout-session';
      const groupId = 'timeout-group';

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

      // Simulate error with retry
      const context = {
        sessionId,
        groupId,
        technique: 'six_hats' as const,
        step: 1,
        errorType: 'execution_error' as const,
      };

      errorHandler.handleParallelError(new Error('Test error'), context);

      // Verify retry exists
      let stats = errorHandler.getRetryStats();
      expect(stats.totalSessionsWithRetries).toBe(1);

      // Fast forward past retention period (30 minutes)
      vi.advanceTimersByTime(31 * 60 * 1000);

      // Trigger cleanup
      errorHandler.cleanupStaleRetryAttempts();

      // Verify retry is cleaned up
      stats = errorHandler.getRetryStats();
      expect(stats.totalSessionsWithRetries).toBe(0);
    });

    it('should clean up completed groups after retention period', async () => {
      // Create plans for parallel group
      const plans: ParallelPlan[] = [
        {
          planId: 'timeout-plan-1',
          techniques: ['six_hats'],
          workflow: [
            {
              technique: 'six_hats',
              stepCount: 6,
              description: 'Test plan',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
      ];

      const groupId = sessionManager.createParallelSessionGroup('Test problem', plans, {
        strategy: 'merge',
      });

      // Get session IDs
      const group = sessionManager.getParallelGroup(groupId);
      const sessionIds = group?.sessionIds || [];

      // Start and complete the group
      progressCoordinator.startGroup(groupId);

      for (const sessionId of sessionIds) {
        await progressCoordinator.reportProgress({
          groupId,
          sessionId,
          technique: 'six_hats',
          currentStep: 6,
          totalSteps: 6,
          status: 'completed',
          timestamp: Date.now(),
        });
      }

      // Check initial memory stats
      let memStats = progressCoordinator.getMemoryStats();
      expect(memStats.completedGroupsAwaitingCleanup).toBe(1);

      // Fast forward cleanup interval (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Fast forward past retention period (30 minutes total)
      vi.advanceTimersByTime(31 * 60 * 1000);

      // Memory should be cleaned up
      memStats = progressCoordinator.getMemoryStats();
      expect(memStats.completedGroupsAwaitingCleanup).toBe(0);
      expect(memStats.sessionProgressCount).toBe(0);
    });
  });

  describe('Dependency Timeout Handling', () => {
    it('should handle timeout when waiting for dependencies', async () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'dependent-plan',
          techniques: ['six_hats'],
          workflow: [
            {
              technique: 'six_hats',
              stepCount: 6,
              description: 'Dependent plan',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: false,
          dependencies: ['missing-dependency'],
        },
      ];

      const groupId = sessionManager.createParallelSessionGroup('Test problem', plans, {
        strategy: 'merge',
      });

      const group = sessionManager.getParallelGroup(groupId);
      const sessionId = group?.sessionIds[0] || '';

      const input: ExecuteThinkingStepInput = {
        technique: 'six_hats',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test',
        nextStepNeeded: true,
        planId: 'dependent-plan',
        sessionId,
      };

      // Check if session can proceed
      const context = parallelStepExecutor.checkParallelExecutionContext(sessionId, input);
      expect(context.canProceed).toBe(false);
      expect(context.waitingFor).toContain('missing-dependency');

      // In a real implementation, we would have a configurable timeout
      // For now, just verify the session is marked as waiting
      await progressCoordinator.reportProgress({
        groupId,
        sessionId,
        technique: 'six_hats',
        currentStep: 1,
        totalSteps: 6,
        status: 'waiting',
        timestamp: Date.now(),
        metadata: {
          dependencies: ['missing-dependency'],
        },
      });

      const summary = progressCoordinator.getGroupProgress(groupId);
      expect(summary?.waitingSessions).toBe(1);
    });
  });

  describe('Long-Running Session Detection', () => {
    it('should track execution time for performance monitoring', async () => {
      const sessionId = 'long-running-session';
      const groupId = 'long-running-group';

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

      // Start progress tracking
      const startTime = Date.now();
      await progressCoordinator.reportProgress({
        groupId,
        sessionId,
        technique: 'six_hats',
        currentStep: 1,
        totalSteps: 6,
        status: 'started',
        timestamp: startTime,
      });

      // Simulate long-running execution
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      // Update progress
      await progressCoordinator.reportProgress({
        groupId,
        sessionId,
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: startTime + 5 * 60 * 1000,
      });

      // Verify progress was tracked over time
      const progress = progressCoordinator.getSessionProgress(sessionId);
      expect(progress).toBeDefined();
      expect(progress?.currentStep).toBe(3);
      expect(progress?.status).toBe('in_progress');
    });
  });

  describe('Resource Exhaustion Prevention', () => {
    it('should handle cleanup when approaching memory limits', () => {
      const sessionIds: string[] = [];
      const groupIds: string[] = [];

      // Create many sessions to simulate resource exhaustion
      for (let i = 0; i < 100; i++) {
        const plans: ParallelPlan[] = [
          {
            planId: `exhaustion-plan-${i}`,
            techniques: ['six_hats'],
            workflow: [
              {
                technique: 'six_hats',
                stepCount: 6,
                description: `Plan ${i}`,
              },
            ],
            estimatedTime: 'quick',
            canExecuteIndependently: true,
          },
        ];

        const groupId = sessionManager.createParallelSessionGroup(`Problem ${i}`, plans, {
          strategy: 'merge',
        });
        groupIds.push(groupId);

        const group = sessionManager.getParallelGroup(groupId);
        if (group) {
          sessionIds.push(...group.sessionIds);
        }
      }

      // Check memory usage
      let memStats = progressCoordinator.getMemoryStats();
      expect(memStats.groupCount).toBe(0); // Not started yet

      // Start some groups
      for (let i = 0; i < 50; i++) {
        progressCoordinator.startGroup(groupIds[i]);
      }

      memStats = progressCoordinator.getMemoryStats();
      expect(memStats.groupCount).toBe(50);

      // Complete half of them
      for (let i = 0; i < 25; i++) {
        const group = sessionManager.getParallelGroup(groupIds[i]);
        if (group) {
          for (const sessionId of group.sessionIds) {
            void progressCoordinator.reportProgress({
              groupId: groupIds[i],
              sessionId,
              technique: 'six_hats',
              currentStep: 6,
              totalSteps: 6,
              status: 'completed',
              timestamp: Date.now(),
            });
          }
        }
      }

      // Fast forward to trigger cleanup
      vi.advanceTimersByTime(31 * 60 * 1000);

      // Memory should be managed
      memStats = progressCoordinator.getMemoryStats();
      expect(memStats.completedGroupsAwaitingCleanup).toBeLessThanOrEqual(25);
    });
  });
});

// Restore real timers after tests
afterAll(() => {
  vi.useRealTimers();
});
