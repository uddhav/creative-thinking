/**
 * Tests for ProgressCoordinator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ProgressCoordinator,
  type ProgressUpdate,
} from '../../../layers/execution/ProgressCoordinator.js';
import type { SessionManager } from '../../../core/SessionManager.js';
import type { ParallelGroup } from '../../../core/session/types.js';
import type { SessionData } from '../../../types/index.js';

// Mock dependencies
const mockSessionManager: Pick<
  SessionManager,
  'getSession' | 'getParallelGroup' | 'updateParallelGroupStatus'
> = {
  getSession: vi.fn(),
  getParallelGroup: vi.fn(),
  updateParallelGroupStatus: vi.fn(),
};

// Mock timers
vi.useFakeTimers();

describe('ProgressCoordinator', () => {
  let coordinator: ProgressCoordinator;
  let mockSession: SessionData;
  let mockGroup: ParallelGroup;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    coordinator = new ProgressCoordinator(mockSessionManager as SessionManager);

    mockSession = {
      id: 'test-session',
      technique: 'six_hats',
      problem: 'Test problem',
      startTime: Date.now(),
      history: [],
      insights: [],
      branches: {},
    };

    mockGroup = {
      groupId: 'group-123',
      sessionIds: ['session1', 'session2', 'session3'],
      completedSessions: new Set(),
      failedSessions: new Set(),
      status: 'active',
      sharedContext: {},
      startTime: Date.now(),
    };
  });

  afterEach(() => {
    coordinator.stopCleanupTimer();
  });

  describe('reportProgress', () => {
    it('should report and emit progress updates', async () => {
      const progressSpy = vi.fn();
      coordinator.on('progress', progressSpy);

      const update: ProgressUpdate = {
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      };

      await coordinator.reportProgress(update);

      expect(progressSpy).toHaveBeenCalledWith(update);
      expect(coordinator.getSessionProgress('session1')).toEqual(update);
    });

    it('should emit group-specific progress events', async () => {
      const groupSpy = vi.fn();
      const sessionSpy = vi.fn();
      coordinator.on('progress:group-123', groupSpy);
      coordinator.on('progress:session1', sessionSpy);

      const update: ProgressUpdate = {
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      };

      await coordinator.reportProgress(update);

      expect(groupSpy).toHaveBeenCalledWith(update);
      expect(sessionSpy).toHaveBeenCalledWith(update);
    });

    it('should handle concurrent updates without race conditions', async () => {
      const updates = Array.from({ length: 10 }, (_, i) => ({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: i + 1,
        totalSteps: 10,
        status: 'in_progress' as const,
        timestamp: Date.now() + i,
      }));

      // Report all updates concurrently
      await Promise.all(updates.map(update => coordinator.reportProgress(update)));

      // Should have the last update
      const finalProgress = coordinator.getSessionProgress('session1');
      expect(finalProgress?.currentStep).toBe(10);
    });
  });

  describe('getGroupProgress', () => {
    it('should calculate group progress summary', async () => {
      // First report progress so the data is available
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 6,
        totalSteps: 6,
        status: 'completed',
        timestamp: Date.now(),
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session2',
        technique: 'po',
        currentStep: 2,
        totalSteps: 4,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session3',
        technique: 'scamper',
        currentStep: 0,
        totalSteps: 8,
        status: 'waiting',
        timestamp: Date.now(),
        metadata: { dependencies: ['session2'] },
      });

      // Now set up mocks for getGroupProgress
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession
        .mockReturnValueOnce({ ...mockSession, id: 'session1', technique: 'six_hats' })
        .mockReturnValueOnce({ ...mockSession, id: 'session2', technique: 'po' })
        .mockReturnValueOnce({ ...mockSession, id: 'session3', technique: 'scamper' });

      const summary = coordinator.getGroupProgress('group-123');

      expect(summary).toBeDefined();
      expect(summary?.totalSessions).toBe(3);
      expect(summary?.completedSessions).toBe(1);
      expect(summary?.inProgressSessions).toBe(1);
      expect(summary?.waitingSessions).toBe(1);
      expect(summary?.overallProgress).toBeCloseTo(8 / 18); // 8 completed steps out of 18 total
    });

    it('should return null for non-existent group', () => {
      mockSessionManager.getParallelGroup.mockReturnValue(null);

      const summary = coordinator.getGroupProgress('non-existent');
      expect(summary).toBeNull();
    });

    it('should handle missing sessions gracefully', async () => {
      // Report progress first
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      // Set up mocks - session2 is missing
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession
        .mockReturnValueOnce({ ...mockSession, id: 'session1' })
        .mockReturnValueOnce(null) // Missing session
        .mockReturnValueOnce({ ...mockSession, id: 'session3' });

      const summary = coordinator.getGroupProgress('group-123');

      expect(summary).toBeDefined();
      expect(summary?.sessionProgress.size).toBe(2); // Only 2 valid sessions
    });
  });

  describe('startGroup', () => {
    it('should start tracking a group and emit event', () => {
      const groupStartedSpy = vi.fn();
      coordinator.on('group:started', groupStartedSpy);

      coordinator.startGroup('group-123');

      expect(groupStartedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group-123',
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('streamGroupProgress', () => {
    it('should stream real-time progress updates', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession.mockReturnValue(mockSession);

      const callback = vi.fn();
      const unsubscribe = coordinator.streamGroupProgress('group-123', callback);

      // Should receive initial progress
      expect(callback).toHaveBeenCalledTimes(1);

      // Report progress update
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      // Should receive update
      expect(callback).toHaveBeenCalledTimes(2);

      // Unsubscribe
      unsubscribe();

      // Should not receive further updates
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 4,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkForDeadlock', () => {
    it('should detect deadlock when all sessions are waiting', async () => {
      const waitingGroup: ParallelGroup = {
        ...mockGroup,
        completedSessions: new Set(),
      };
      mockSessionManager.getParallelGroup.mockReturnValue(waitingGroup);

      // All sessions waiting
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'waiting',
        timestamp: Date.now(),
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session2',
        technique: 'po',
        currentStep: 2,
        totalSteps: 4,
        status: 'waiting',
        timestamp: Date.now(),
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session3',
        technique: 'scamper',
        currentStep: 0,
        totalSteps: 8,
        status: 'waiting',
        timestamp: Date.now(),
      });

      expect(coordinator.checkForDeadlock('group-123')).toBe(true);
    });

    it('should not detect deadlock when some sessions are active', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session2',
        technique: 'po',
        currentStep: 2,
        totalSteps: 4,
        status: 'waiting',
        timestamp: Date.now(),
      });

      expect(coordinator.checkForDeadlock('group-123')).toBe(false);
    });
  });

  describe('group completion', () => {
    it('should emit completion event when all sessions complete', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession.mockReturnValue({ ...mockSession });

      const completionSpy = vi.fn();
      coordinator.on('group:completed', completionSpy);
      coordinator.startGroup('group-123');

      // Complete all sessions
      for (const sessionId of mockGroup.sessionIds) {
        await coordinator.reportProgress({
          groupId: 'group-123',
          sessionId,
          technique: 'six_hats',
          currentStep: 6,
          totalSteps: 6,
          status: 'completed',
          timestamp: Date.now(),
        });
      }

      expect(completionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group-123',
          success: true,
          duration: expect.any(Number),
        })
      );

      expect(mockSessionManager.updateParallelGroupStatus).toHaveBeenCalledWith(
        'group-123',
        'completed'
      );
    });

    it('should mark as partial success when some sessions fail', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession.mockReturnValue(mockSession);

      const completionSpy = vi.fn();
      coordinator.on('group:completed', completionSpy);

      // Complete with one failure
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 6,
        totalSteps: 6,
        status: 'completed',
        timestamp: Date.now(),
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session2',
        technique: 'po',
        currentStep: 2,
        totalSteps: 4,
        status: 'failed',
        timestamp: Date.now(),
        metadata: { errorMessage: 'Test error' },
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session3',
        technique: 'scamper',
        currentStep: 8,
        totalSteps: 8,
        status: 'completed',
        timestamp: Date.now(),
      });

      expect(completionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group-123',
          success: false,
        })
      );

      expect(mockSessionManager.updateParallelGroupStatus).toHaveBeenCalledWith(
        'group-123',
        'partial_success'
      );
    });
  });

  describe('clearGroupProgress', () => {
    it('should clear all data for a group', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);

      // Add progress data
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      coordinator.clearGroupProgress('group-123');

      // Data should be cleared
      expect(coordinator.getSessionProgress('session1')).toBeNull();
    });
  });

  describe('formatProgressDisplay', () => {
    it('should format progress display correctly', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession.mockReturnValue(mockSession);

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 6,
        totalSteps: 6,
        status: 'completed',
        timestamp: Date.now(),
      });

      const display = coordinator.formatProgressDisplay('group-123');

      expect(display).toContain('Group Progress:');
      expect(display).toContain('[');
      expect(display).toContain(']');
      expect(display).toContain('1/3 completed');
    });

    it('should show failed and waiting counts', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession
        .mockReturnValueOnce({ ...mockSession, id: 'session1' })
        .mockReturnValueOnce({ ...mockSession, id: 'session2' })
        .mockReturnValueOnce({ ...mockSession, id: 'session3' });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'failed',
        timestamp: Date.now(),
      });

      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session2',
        technique: 'po',
        currentStep: 0,
        totalSteps: 4,
        status: 'waiting',
        timestamp: Date.now(),
      });

      // session3 has no progress reported, so defaults to waiting

      const display = coordinator.formatProgressDisplay('group-123');

      expect(display).toContain('(1 failed)');
      expect(display).toContain('(2 waiting)'); // session2 and session3 are waiting
    });
  });

  describe('time estimation', () => {
    it('should estimate time remaining', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession.mockReturnValue(mockSession);

      coordinator.startGroup('group-123');

      // Simulate progress over time
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      // Advance time
      vi.advanceTimersByTime(10 * 1000);

      const summary = coordinator.getGroupProgress('group-123');
      expect(summary?.estimatedTimeRemaining).toBeDefined();
      expect(summary?.estimatedTimeRemaining).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should clean up old completed groups', async () => {
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);
      mockSessionManager.getSession.mockReturnValue(mockSession);

      // Complete a group
      for (const sessionId of mockGroup.sessionIds) {
        await coordinator.reportProgress({
          groupId: 'group-123',
          sessionId,
          technique: 'six_hats',
          currentStep: 6,
          totalSteps: 6,
          status: 'completed',
          timestamp: Date.now(),
        });
      }

      // Advance time past retention period (30 minutes) + cleanup interval (5 minutes)
      vi.advanceTimersByTime(36 * 60 * 1000); // 36 minutes to ensure cleanup runs

      // Check that data is cleaned up
      const stats = coordinator.getMemoryStats();
      expect(stats.completedGroupsAwaitingCleanup).toBe(0);
    });
  });

  describe('getMemoryStats', () => {
    it('should return memory usage statistics', async () => {
      await coordinator.reportProgress({
        groupId: 'group-123',
        sessionId: 'session1',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      coordinator.startGroup('group-123');

      const stats = coordinator.getMemoryStats();

      expect(stats.sessionProgressCount).toBe(1);
      expect(stats.groupCount).toBe(1);
      expect(stats.stepDurationCount).toBeGreaterThanOrEqual(0);
      expect(stats.completedGroupsAwaitingCleanup).toBe(0);
    });
  });

  describe('error handler integration', () => {
    it('should coordinate cleanup with error handler', () => {
      const mockErrorHandler = {
        cleanupStaleRetryAttempts: vi.fn(),
      };

      coordinator.setErrorHandler(mockErrorHandler as any);

      // Trigger cleanup
      vi.advanceTimersByTime(6 * 60 * 1000); // Advance past cleanup interval

      expect(mockErrorHandler.cleanupStaleRetryAttempts).toHaveBeenCalled();
    });
  });
});
