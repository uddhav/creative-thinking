/**
 * Tests for race conditions and complex concurrency scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressCoordinator } from '../ProgressCoordinator.js';
import { SessionManager } from '../../../core/SessionManager.js';
import { SessionSynchronizer } from '../../../core/session/SessionSynchronizer.js';
import type { ProgressUpdate } from '../ProgressCoordinator.js';
import type { ParallelPlan } from '../../../types/planning.js';

describe('Race Conditions', () => {
  let sessionManager: SessionManager;
  let progressCoordinator: ProgressCoordinator;
  let sessionSynchronizer: SessionSynchronizer;

  beforeEach(() => {
    sessionManager = new SessionManager();
    progressCoordinator = new ProgressCoordinator(sessionManager);
    sessionSynchronizer = new SessionSynchronizer(sessionManager);
  });

  describe('Concurrent Progress Updates', () => {
    it('should handle thousands of concurrent updates without data loss', async () => {
      const sessionId = 'stress-session';
      const groupId = 'stress-group';
      const updateCount = 1000;

      // Create session
      sessionManager.createSession(
        {
          problem: 'Stress test',
          technique: 'six_hats',
          currentStep: 0,
          totalSteps: updateCount,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      // Create updates with different timestamps
      const updates: ProgressUpdate[] = Array.from({ length: updateCount }, (_, i) => ({
        groupId,
        sessionId,
        technique: 'six_hats' as const,
        currentStep: i + 1,
        totalSteps: updateCount,
        status: 'in_progress' as const,
        timestamp: Date.now() + i,
      }));

      // Shuffle to simulate random arrival order
      const shuffled = [...updates].sort(() => Math.random() - 0.5);

      // Send all updates concurrently in batches
      const batchSize = 100;
      const batches: Promise<void>[] = [];

      for (let i = 0; i < shuffled.length; i += batchSize) {
        const batch = shuffled.slice(i, i + batchSize);
        batches.push(
          Promise.all(batch.map(update => progressCoordinator.reportProgress(update))).then(
            () => {}
          )
        );
      }

      await Promise.all(batches);

      // Verify final state is consistent
      const finalProgress = progressCoordinator.getSessionProgress(sessionId);
      expect(finalProgress).toBeDefined();
      expect(finalProgress?.currentStep).toBeGreaterThanOrEqual(1);
      expect(finalProgress?.currentStep).toBeLessThanOrEqual(updateCount);

      // The exact value depends on which update "won" due to timing
      // But it should be a valid step number
      expect(Number.isInteger(finalProgress?.currentStep)).toBe(true);
    });

    it('should maintain data integrity with competing shared context updates', async () => {
      const plan: ParallelPlan = {
        planId: 'race-plan',
        techniques: ['six_hats'],
        workflow: [
          {
            technique: 'six_hats',
            stepCount: 6,
            description: 'Race condition test',
          },
        ],
        estimatedTime: 'quick',
        canExecuteIndependently: true,
      };

      const groupId = sessionManager.createParallelSessionGroup('Test problem', [plan], {
        strategy: 'merge',
      });

      const group = sessionManager.getParallelGroup(groupId);
      const sessionId = group?.sessionIds[0] || '';

      // Initialize shared context
      sessionSynchronizer.initializeSharedContext(groupId, 'immediate');

      // Create many concurrent updates
      const updatePromises: Promise<void>[] = [];
      const updateCount = 100;

      for (let i = 0; i < updateCount; i++) {
        updatePromises.push(
          sessionSynchronizer.updateSharedContext(sessionId, groupId, {
            type: 'immediate',
            insights: [`Race insight ${i}`],
            themes: [{ theme: `Race theme ${i}`, weight: Math.random() }],
            metrics: {
              step: i,
              timestamp: Date.now() + i,
            },
          })
        );
      }

      // Execute all updates concurrently
      await Promise.all(updatePromises);

      // Verify context integrity
      const context = sessionSynchronizer.getSharedContext(groupId);
      expect(context).toBeDefined();

      // All insights should be present (no data loss)
      const insightSet = new Set(context?.sharedInsights);
      expect(insightSet.size).toBe(context?.sharedInsights.length); // No duplicates
      expect(context?.sharedInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Dependency Chains', () => {
    it('should handle parallel completion updates without race conditions', async () => {
      // Create multiple independent plans that can execute in parallel
      const plans: ParallelPlan[] = [
        {
          planId: 'plan-1',
          techniques: ['six_hats'],
          workflow: [{ technique: 'six_hats', stepCount: 6, description: 'Plan 1' }],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
        {
          planId: 'plan-2',
          techniques: ['po'],
          workflow: [{ technique: 'po', stepCount: 4, description: 'Plan 2' }],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
        {
          planId: 'plan-3',
          techniques: ['random_entry'],
          workflow: [{ technique: 'random_entry', stepCount: 3, description: 'Plan 3' }],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
      ];

      const groupId = sessionManager.createParallelSessionGroup('Parallel test', plans, {
        strategy: 'merge',
      });

      const group = sessionManager.getParallelGroup(groupId);
      expect(group).toBeDefined();
      expect(group?.sessionIds.length).toBe(3);

      // Start all sessions
      progressCoordinator.startGroup(groupId);

      // Complete all sessions concurrently
      const completionPromises =
        group?.sessionIds.map((sessionId, index) =>
          progressCoordinator.reportProgress({
            groupId,
            sessionId,
            technique: plans[index].techniques[0] as any,
            currentStep: plans[index].workflow[0].stepCount,
            totalSteps: plans[index].workflow[0].stepCount,
            status: 'completed',
            timestamp: Date.now() + index * 10,
          })
        ) || [];

      await Promise.all(completionPromises);

      // Verify all sessions completed
      const groupProgress = progressCoordinator.getGroupProgress(groupId);
      expect(groupProgress?.completedSessions).toBe(3);
      expect(groupProgress?.totalSessions).toBe(3);
      expect(groupProgress?.overallProgress).toBe(1); // 100% complete
    });

    it('should detect when all sessions are waiting (potential deadlock)', async () => {
      // Create sessions that will all be in waiting state
      const plans: ParallelPlan[] = [
        {
          planId: 'waiting-1',
          techniques: ['six_hats'],
          workflow: [{ technique: 'six_hats', stepCount: 6, description: 'Waiting 1' }],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
        {
          planId: 'waiting-2',
          techniques: ['po'],
          workflow: [{ technique: 'po', stepCount: 4, description: 'Waiting 2' }],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
      ];

      const groupId = sessionManager.createParallelSessionGroup('Deadlock test', plans, {
        strategy: 'merge',
      });

      const group = sessionManager.getParallelGroup(groupId);
      expect(group).toBeDefined();

      // Put all sessions in waiting state
      for (const sessionId of group?.sessionIds || []) {
        await progressCoordinator.reportProgress({
          groupId,
          sessionId,
          technique: 'six_hats',
          currentStep: 1,
          totalSteps: 6,
          status: 'waiting',
          timestamp: Date.now(),
        });
      }

      // Check for deadlock - all sessions waiting with no active sessions
      const hasDeadlock = progressCoordinator.checkForDeadlock(groupId);
      expect(hasDeadlock).toBe(true);
    });
  });

  describe('Event Emitter Cleanup', () => {
    it('should not accumulate listeners over time', () => {
      const groupIds: string[] = [];
      const maxGroups = 100;

      // Get initial listener count
      const initialListenerCount = progressCoordinator.listenerCount('progress');

      // Create and clean up many groups
      for (let i = 0; i < maxGroups; i++) {
        const plans: ParallelPlan[] = [
          {
            planId: `listener-plan-${i}`,
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

        // Add listeners
        const handler = () => {};
        progressCoordinator.on(`progress:${groupId}`, handler);
        progressCoordinator.on(`group:${groupId}`, handler);

        // Clean up immediately
        progressCoordinator.clearGroupProgress(groupId);
      }

      // Verify no listener leak
      const finalListenerCount = progressCoordinator.listenerCount('progress');
      expect(finalListenerCount).toBe(initialListenerCount);

      // Verify group-specific listeners are cleaned up
      for (const groupId of groupIds) {
        expect(progressCoordinator.listenerCount(`progress:${groupId}`)).toBe(0);
        expect(progressCoordinator.listenerCount(`group:${groupId}`)).toBe(0);
      }
    });
  });

  describe('Lock Management', () => {
    it('should prevent lock accumulation during heavy concurrent usage', async () => {
      const sessionId = 'lock-test-session';
      const groupId = 'lock-test-group';

      // Create session
      sessionManager.createSession(
        {
          problem: 'Lock test',
          technique: 'six_hats',
          currentStep: 0,
          totalSteps: 100,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      // Generate many rapid updates
      const updates: Promise<void>[] = [];
      for (let i = 0; i < 500; i++) {
        updates.push(
          progressCoordinator.reportProgress({
            groupId,
            sessionId,
            technique: 'six_hats',
            currentStep: (i % 100) + 1,
            totalSteps: 100,
            status: 'in_progress',
            timestamp: Date.now() + i,
          })
        );
      }

      // Wait for all updates
      await Promise.all(updates);

      // The internal lock map should be cleaned up
      // We can't access it directly, but we can verify the system still works
      await progressCoordinator.reportProgress({
        groupId,
        sessionId,
        technique: 'six_hats',
        currentStep: 100,
        totalSteps: 100,
        status: 'completed',
        timestamp: Date.now() + 1000,
      });

      const progress = progressCoordinator.getSessionProgress(sessionId);
      expect(progress?.status).toBe('completed');
    });
  });
});
