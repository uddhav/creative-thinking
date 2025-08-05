/**
 * Tests for configurable timeout mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TimeoutConfigManager,
  DEFAULT_TIMEOUTS,
  loadTimeoutConfigFromEnv,
} from '../../../config/timeouts.js';
import { SessionTimeoutMonitor } from '../SessionTimeoutMonitor.js';
import { ProgressCoordinator } from '../ProgressCoordinator.js';
import { SessionManager } from '../../../core/SessionManager.js';
import type { TimeoutEvent } from '../SessionTimeoutMonitor.js';

describe('Configurable Timeouts', () => {
  describe('TimeoutConfigManager', () => {
    let configManager: TimeoutConfigManager;

    beforeEach(() => {
      configManager = TimeoutConfigManager.getInstance();
      configManager.reset();
    });

    it('should provide default configuration', () => {
      const config = configManager.getConfig();
      expect(config).toEqual(DEFAULT_TIMEOUTS);
    });

    it('should update configuration partially', () => {
      configManager.updateConfig({
        sessionExecution: {
          quick: 60 * 1000,
          thorough: 10 * 60 * 1000,
          comprehensive: 30 * 60 * 1000,
        },
      });

      const config = configManager.getConfig();
      expect(config.sessionExecution.quick).toBe(60 * 1000);
      expect(config.sessionExecution.thorough).toBe(10 * 60 * 1000);
      expect(config.sessionExecution.comprehensive).toBe(30 * 60 * 1000);
      // Other configs should remain default
      expect(config.retry.maxAttempts).toBe(DEFAULT_TIMEOUTS.retry.maxAttempts);
    });

    it('should calculate backoff correctly', () => {
      const backoff1 = configManager.calculateBackoff(1);
      const backoff2 = configManager.calculateBackoff(2);
      const backoff3 = configManager.calculateBackoff(3);

      expect(backoff1).toBe(1000); // 1 second
      expect(backoff2).toBe(2000); // 2 seconds
      expect(backoff3).toBe(4000); // 4 seconds
    });

    it('should respect max backoff', () => {
      const backoff10 = configManager.calculateBackoff(10);
      expect(backoff10).toBeLessThanOrEqual(DEFAULT_TIMEOUTS.retry.maxBackoff);
    });

    it('should determine retry eligibility', () => {
      expect(configManager.shouldRetry(0)).toBe(true);
      expect(configManager.shouldRetry(1)).toBe(true);
      expect(configManager.shouldRetry(2)).toBe(true);
      expect(configManager.shouldRetry(3)).toBe(false); // max is 3
    });

    it('should get session timeout based on estimated time', () => {
      expect(configManager.getSessionTimeout('quick')).toBe(
        DEFAULT_TIMEOUTS.sessionExecution.quick
      );
      expect(configManager.getSessionTimeout('thorough')).toBe(
        DEFAULT_TIMEOUTS.sessionExecution.thorough
      );
      expect(configManager.getSessionTimeout('comprehensive')).toBe(
        DEFAULT_TIMEOUTS.sessionExecution.comprehensive
      );
    });
  });

  describe('Environment Variable Loading', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should load configuration from environment variables', () => {
      process.env.CREATIVE_THINKING_SESSION_TIMEOUT_QUICK = '45000';
      process.env.CREATIVE_THINKING_SESSION_TIMEOUT_THOROUGH = '600000';
      process.env.CREATIVE_THINKING_DEPENDENCY_TIMEOUT = '180000';
      process.env.CREATIVE_THINKING_MAX_RETRIES = '5';

      const config = loadTimeoutConfigFromEnv();

      expect(config.sessionExecution?.quick).toBe(45000);
      expect(config.sessionExecution?.thorough).toBe(600000);
      expect(config.dependencyWait?.default).toBe(180000);
      expect(config.retry?.maxAttempts).toBe(5);
    });
  });

  describe('SessionTimeoutMonitor', () => {
    let sessionManager: SessionManager;
    let progressCoordinator: ProgressCoordinator;
    let timeoutMonitor: SessionTimeoutMonitor;
    let timeoutEvents: TimeoutEvent[] = [];

    beforeEach(() => {
      vi.useFakeTimers();
      sessionManager = new SessionManager();
      progressCoordinator = new ProgressCoordinator(sessionManager);
      timeoutMonitor = new SessionTimeoutMonitor(sessionManager, progressCoordinator);

      // Capture timeout events
      timeoutMonitor.on('timeout', event => {
        timeoutEvents.push(event);
      });

      timeoutEvents = [];
    });

    afterEach(() => {
      timeoutMonitor.stopMonitoring();
      vi.useRealTimers();
    });

    it('should monitor session execution timeout', () => {
      const sessionId = 'timeout-test-session';
      const groupId = 'timeout-test-group';

      // Create session
      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'six_hats',
          currentStep: 0,
          totalSteps: 6,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      // Start monitoring with quick timeout
      timeoutMonitor.startMonitoringSession(sessionId, groupId, 'quick');

      // Fast forward past timeout
      vi.advanceTimersByTime(DEFAULT_TIMEOUTS.sessionExecution.quick + 1000);

      // Should have timeout event
      expect(timeoutEvents.length).toBe(1);
      expect(timeoutEvents[0].timeoutType).toBe('execution');
      expect(timeoutEvents[0].sessionId).toBe(sessionId);
    });

    it('should handle dependency timeout', () => {
      const sessionId = 'dependency-timeout-session';
      const groupId = 'dependency-timeout-group';

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

      // Start monitoring
      timeoutMonitor.startMonitoringSession(sessionId, groupId, 'quick');

      // Set to waiting state
      timeoutMonitor.setSessionWaiting(sessionId, ['dependency-1', 'dependency-2']);

      // Fast forward past dependency timeout
      vi.advanceTimersByTime(DEFAULT_TIMEOUTS.dependencyWait.default + 1000);

      // Should have dependency timeout event
      expect(timeoutEvents.length).toBe(1);
      expect(timeoutEvents[0].timeoutType).toBe('dependency');
      expect(timeoutEvents[0].sessionId).toBe(sessionId);
    });

    it('should track progress staleness', () => {
      const sessionId = 'stale-progress-session';
      const groupId = 'stale-progress-group';
      const staleEvents: TimeoutEvent[] = [];

      timeoutMonitor.on('progress-stale', event => {
        staleEvents.push(event);
      });

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

      // Start monitoring with 'comprehensive' timeout which is much longer than stale threshold
      timeoutMonitor.startMonitoringSession(sessionId, groupId, 'comprehensive');

      // Get the stale threshold (30 seconds)
      const staleThreshold = DEFAULT_TIMEOUTS.progressUpdate.staleThreshold;

      // To get a stale event:
      // 1. The interval fires every staleThreshold ms
      // 2. It checks if (Date.now() - lastProgressTime) > staleThreshold
      // 3. Since lastProgressTime is set when monitoring starts, we need to:
      //    - Wait for interval to fire (after staleThreshold ms)
      //    - AND ensure more than staleThreshold has passed since start

      // Advance to just after the first interval would fire
      // At staleThreshold ms: interval fires, but time since last progress = staleThreshold (not >)
      // So we advance to staleThreshold * 2 to ensure the second interval catches it
      vi.advanceTimersByTime(staleThreshold * 2 + 100);

      // Now the check should have emitted a stale event
      expect(staleEvents.length).toBeGreaterThan(0);
      expect(staleEvents[0].timeoutType).toBe('progress');
      expect(staleEvents[0].sessionId).toBe(sessionId);
    });

    it('should extend timeout when requested', () => {
      const sessionId = 'extend-timeout-session';
      const groupId = 'extend-timeout-group';

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

      // Start monitoring with quick timeout
      timeoutMonitor.startMonitoringSession(sessionId, groupId, 'quick');

      // Extend timeout by 30 seconds
      timeoutMonitor.extendTimeout(sessionId, 30 * 1000);

      // Fast forward past original timeout but before extended
      vi.advanceTimersByTime(DEFAULT_TIMEOUTS.sessionExecution.quick + 1000);

      // Should not have timeout yet
      expect(timeoutEvents.length).toBe(0);

      // Fast forward past extended timeout
      vi.advanceTimersByTime(30 * 1000);

      // Now should have timeout
      expect(timeoutEvents.length).toBe(1);
    });

    it('should provide monitoring statistics', () => {
      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        const sessionId = `stats-session-${i}`;
        sessionManager.createSession(
          {
            problem: 'Test',
            technique: 'six_hats',
            currentStep: i,
            totalSteps: 6,
            output: 'Test',
            nextStepNeeded: true,
          },
          sessionId
        );
        timeoutMonitor.startMonitoringSession(sessionId, `group-${i}`, 'quick');
      }

      // Set one to waiting
      timeoutMonitor.setSessionWaiting('stats-session-1', ['dep-1']);

      // Advance time a bit to have elapsed time
      vi.advanceTimersByTime(1000);

      const stats = timeoutMonitor.getMonitoringStats();
      expect(stats.activeSessions).toBe(2);
      expect(stats.waitingSessions).toBe(1);
      expect(stats.averageElapsedTime).toBeGreaterThan(0);
      expect(stats.longestRunningSession).toBeDefined();
    });

    it('should emit warning at 80% of timeout', () => {
      const sessionId = 'warning-session';
      const groupId = 'warning-group';
      const warnings: any[] = [];

      timeoutMonitor.on('timeout-warning', warning => {
        warnings.push(warning);
      });

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

      // Start monitoring
      timeoutMonitor.startMonitoringSession(sessionId, groupId, 'quick');

      // Fast forward to 80% of timeout
      vi.advanceTimersByTime(DEFAULT_TIMEOUTS.sessionExecution.quick * 0.8 + 1000);

      // Should have warning
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].sessionId).toBe(sessionId);
      expect(warnings[0].percentComplete).toBeGreaterThan(80);
    });
  });
});
