/**
 * Tests for SessionTimeoutMonitor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionTimeoutMonitor } from '../../../layers/execution/SessionTimeoutMonitor.js';
import type { SessionManager } from '../../../core/SessionManager.js';
import type {
  ProgressCoordinator,
  ProgressUpdate,
} from '../../../layers/execution/ProgressCoordinator.js';
import type { SessionData } from '../../../types/index.js';
import { EventEmitter } from 'events';

// Mock dependencies
const mockSessionManager = {
  getSession: vi.fn(),
} as unknown as SessionManager;

class MockProgressCoordinator extends EventEmitter implements ProgressCoordinator {
  reportProgress = vi.fn().mockResolvedValue(undefined);
  getGroupProgress = vi.fn();
  getSessionProgress = vi.fn();
  clearGroupProgress = vi.fn();
  on = vi.fn((event: string, handler: (update: ProgressUpdate) => void) => {
    return super.on(event, handler);
  }) as any;
}

// Mock timers
vi.useFakeTimers();

describe('SessionTimeoutMonitor', () => {
  let monitor: SessionTimeoutMonitor;
  let mockProgressCoordinator: MockProgressCoordinator;
  let mockSession: SessionData;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    mockProgressCoordinator = new MockProgressCoordinator();
    monitor = new SessionTimeoutMonitor(mockSessionManager, mockProgressCoordinator);

    mockSession = {
      id: 'test-session',
      technique: 'six_hats',
      problem: 'Test problem',
      startTime: Date.now(),
      history: [],
      insights: [],
      branches: {},
    };
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('startMonitoringSession', () => {
    it('should start monitoring a session with correct timeout', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Should not timeout immediately
      expect(mockProgressCoordinator.reportProgress).not.toHaveBeenCalled();

      // Fast forward to just before timeout (30 seconds for quick)
      vi.advanceTimersByTime(29 * 1000);
      expect(mockProgressCoordinator.reportProgress).not.toHaveBeenCalled();

      // Fast forward past timeout
      vi.advanceTimersByTime(2 * 1000);
      expect(mockProgressCoordinator.reportProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          metadata: expect.objectContaining({
            errorMessage: expect.stringContaining('timed out'),
          }),
        })
      );
    });

    it('should not start monitoring if session not found', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(null);

      const timeoutSpy = vi.fn();
      monitor.on('timeout', timeoutSpy);

      monitor.startMonitoringSession('non-existent', 'group-123', 'quick');

      vi.advanceTimersByTime(20 * 60 * 1000);
      expect(timeoutSpy).not.toHaveBeenCalled();
    });

    it('should emit timeout event when session times out', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const timeoutSpy = vi.fn();
      monitor.on('timeout', timeoutSpy);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      vi.advanceTimersByTime(31 * 1000);

      expect(timeoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          groupId: 'group-123',
          technique: 'six_hats',
          timeoutType: 'execution',
        })
      );
    });

    it('should check for stale progress periodically', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const staleSpy = vi.fn();
      monitor.on('progress-stale', staleSpy);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Initially no stale progress
      expect(staleSpy).not.toHaveBeenCalled();

      // The interval checks every staleThreshold (30 seconds)
      // So we advance time to trigger the interval check
      // The check will see if time since last progress > threshold
      // Since we start at time 0 and lastProgressTime = startTime,
      // we need to advance past the stale threshold for it to be detected
      vi.advanceTimersByTime(31 * 1000);

      // Now the interval should have fired and detected stale progress
      expect(staleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          timeoutType: 'progress',
          elapsed: expect.any(Number),
          threshold: 30 * 1000,
        })
      );
    });
  });

  describe('setSessionWaiting', () => {
    it('should switch session to waiting state and set dependency timeout', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');
      monitor.setSessionWaiting('test-session', ['dep1', 'dep2']);

      const depTimeoutSpy = vi.fn();
      monitor.on('dependency-timeout', depTimeoutSpy);

      // Should not trigger execution timeout
      vi.advanceTimersByTime(11 * 60 * 1000);
      expect(mockProgressCoordinator.reportProgress).not.toHaveBeenCalled();

      // Should trigger dependency timeout (5 minutes default)
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(depTimeoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          dependencies: ['dep1', 'dep2'],
        })
      );
    });
  });

  describe('stopMonitoringSession', () => {
    it('should stop monitoring and clear all timers', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const timeoutSpy = vi.fn();
      monitor.on('timeout', timeoutSpy);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');
      monitor.stopMonitoringSession('test-session');

      // Fast forward past timeout
      vi.advanceTimersByTime(20 * 60 * 1000);
      expect(timeoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('progress updates', () => {
    it('should update last progress time on progress event', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const staleSpy = vi.fn();
      monitor.on('progress-stale', staleSpy);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Emit progress update
      mockProgressCoordinator.emit('progress', {
        groupId: 'group-123',
        sessionId: 'test-session',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'in_progress',
        timestamp: Date.now(),
      });

      // Fast forward past stale threshold
      vi.advanceTimersByTime(31 * 1000);
      expect(staleSpy).not.toHaveBeenCalled();
    });

    it('should stop monitoring on completion', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Emit completion
      mockProgressCoordinator.emit('progress', {
        groupId: 'group-123',
        sessionId: 'test-session',
        technique: 'six_hats',
        currentStep: 6,
        totalSteps: 6,
        status: 'completed',
        timestamp: Date.now(),
      });

      const stats = monitor.getMonitoringStats();
      expect(stats.activeSessions).toBe(0);
    });

    it('should switch to waiting on waiting status', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      const depTimeoutSpy = vi.fn();
      monitor.on('dependency-timeout', depTimeoutSpy);

      // Emit waiting status
      mockProgressCoordinator.emit('progress', {
        groupId: 'group-123',
        sessionId: 'test-session',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'waiting',
        timestamp: Date.now(),
        metadata: {
          dependencies: ['dep1'],
        },
      });

      // Should trigger dependency timeout, not execution timeout
      vi.advanceTimersByTime(11 * 60 * 1000);
      expect(mockProgressCoordinator.reportProgress).not.toHaveBeenCalled();
      expect(depTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('monitoring interval', () => {
    it('should emit timeout warning at 80% of timeout', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const warningSpy = vi.fn();
      monitor.on('timeout-warning', warningSpy);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Fast forward to 80% of timeout (8 minutes of 10)
      vi.advanceTimersByTime(8 * 60 * 1000 + 1000);

      expect(warningSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          percentComplete: expect.any(Number),
        })
      );
      expect(warningSpy.mock.calls[0][0].percentComplete).toBeGreaterThan(80);
    });
  });

  describe('getMonitoringStats', () => {
    it('should return correct statistics', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      // Start multiple sessions
      monitor.startMonitoringSession('session1', 'group-123', 'quick');
      monitor.startMonitoringSession('session2', 'group-123', 'thorough');
      monitor.setSessionWaiting('session2', ['dep1']);

      // Advance time to ensure elapsed time > 0
      vi.advanceTimersByTime(1000);

      const stats = monitor.getMonitoringStats();

      expect(stats.activeSessions).toBe(1);
      expect(stats.waitingSessions).toBe(1);
      expect(stats.averageElapsedTime).toBeGreaterThan(0);
      expect(stats.longestRunningSession).toBeDefined();
      expect(stats.longestRunningSession?.sessionId).toBeDefined();
    });

    it('should handle empty monitoring state', () => {
      const stats = monitor.getMonitoringStats();

      expect(stats.activeSessions).toBe(0);
      expect(stats.waitingSessions).toBe(0);
      expect(stats.averageElapsedTime).toBe(0);
      expect(stats.longestRunningSession).toBeUndefined();
    });
  });

  describe('extendTimeout', () => {
    it('should extend timeout for active session', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const timeoutSpy = vi.fn();
      monitor.on('timeout', timeoutSpy);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Extend by 10 seconds
      monitor.extendTimeout('test-session', 10 * 1000);

      // Original timeout (30 sec) should not trigger
      vi.advanceTimersByTime(35 * 1000);
      expect(timeoutSpy).not.toHaveBeenCalled();

      // Extended timeout (40 sec total) should trigger
      vi.advanceTimersByTime(6 * 1000);
      expect(timeoutSpy).toHaveBeenCalled();
    });

    it('should handle extension for non-existent session', () => {
      // Should not throw
      expect(() => {
        monitor.extendTimeout('non-existent', 5 * 60 * 1000);
      }).not.toThrow();
    });

    it('should handle extension when already timed out', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Fast forward past timeout
      vi.advanceTimersByTime(11 * 60 * 1000);

      // Extension should not cause issues
      expect(() => {
        monitor.extendTimeout('test-session', 5 * 60 * 1000);
      }).not.toThrow();
    });
  });

  describe('stopMonitoring', () => {
    it('should stop all monitoring and clear all sessions', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const timeoutSpy = vi.fn();
      monitor.on('timeout', timeoutSpy);

      // Start multiple sessions
      monitor.startMonitoringSession('session1', 'group-123', 'quick');
      monitor.startMonitoringSession('session2', 'group-123', 'thorough');

      monitor.stopMonitoring();

      // Fast forward past all timeouts
      vi.advanceTimersByTime(60 * 60 * 1000);
      expect(timeoutSpy).not.toHaveBeenCalled();

      const stats = monitor.getMonitoringStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.waitingSessions).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid progress updates', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Emit many rapid progress updates
      for (let i = 1; i <= 6; i++) {
        mockProgressCoordinator.emit('progress', {
          groupId: 'group-123',
          sessionId: 'test-session',
          technique: 'six_hats',
          currentStep: i,
          totalSteps: 6,
          status: i === 6 ? 'completed' : 'in_progress',
          timestamp: Date.now(),
        });
        vi.advanceTimersByTime(100);
      }

      const stats = monitor.getMonitoringStats();
      expect(stats.activeSessions).toBe(0);
    });

    it('should handle session failure', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const timeoutSpy = vi.fn();
      monitor.on('timeout', timeoutSpy);

      monitor.startMonitoringSession('test-session', 'group-123', 'quick');

      // Emit failure
      mockProgressCoordinator.emit('progress', {
        groupId: 'group-123',
        sessionId: 'test-session',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        status: 'failed',
        timestamp: Date.now(),
        metadata: {
          errorMessage: 'User error',
        },
      });

      // Should not trigger timeout after failure
      vi.advanceTimersByTime(20 * 60 * 1000);
      expect(timeoutSpy).not.toHaveBeenCalled();
    });

    it('should handle different timeout configurations', () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const timeoutSpy = vi.fn();
      monitor.on('timeout', timeoutSpy);

      // Test different time estimates
      const sessions = [
        { id: 'quick-session', time: 'quick' as const, timeout: 10 },
        { id: 'thorough-session', time: 'thorough' as const, timeout: 30 },
        { id: 'comprehensive-session', time: 'comprehensive' as const, timeout: 60 },
      ];

      for (const session of sessions) {
        monitor.startMonitoringSession(session.id, 'group-123', session.time);
      }

      // Fast forward to quick timeout (30 seconds)
      vi.advanceTimersByTime(31 * 1000);
      expect(timeoutSpy).toHaveBeenCalledTimes(1);
      expect(timeoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'quick-session' })
      );

      // Fast forward to thorough timeout (5 minutes = 300 seconds)
      vi.advanceTimersByTime((5 * 60 - 0.5) * 1000);
      expect(timeoutSpy).toHaveBeenCalledTimes(2);
      expect(timeoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'thorough-session' })
      );

      // Fast forward to comprehensive timeout (15 minutes = 900 seconds)
      vi.advanceTimersByTime(10 * 60 * 1000);
      expect(timeoutSpy).toHaveBeenCalledTimes(3);
      expect(timeoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'comprehensive-session' })
      );
    });
  });
});
