/**
 * Graceful Shutdown Tests
 * Verifies that the server properly cleans up resources on shutdown
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import { getSessionLock } from '../../core/session/SessionLock.js';

describe('Graceful Shutdown', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  afterEach(() => {
    // Clean up after each test
    if (server) {
      server.destroy();
    }
  });

  it('should properly clean up sessions on destroy', async () => {
    // Create some sessions
    const planResponse = server.planThinkingSession({
      problem: 'Test problem',
      techniques: ['six_hats'],
    });
    const plan = JSON.parse(planResponse.content[0].text);

    // Create a session
    const sessionResponse = await server.executeThinkingStep({
      planId: plan.planId,
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      hatColor: 'blue',
      output: 'Test output',
      nextStepNeeded: true,
    });
    const session = JSON.parse(sessionResponse.content[0].text);

    // Verify session exists
    expect(server.getSessionManager().getSession(session.sessionId)).toBeDefined();

    // Destroy the server
    server.destroy();

    // Verify all resources are cleaned up
    expect(server.getSessionManager().getSessionCount()).toBe(0);
    expect(server.getSessionManager().getPlanCount()).toBe(0);
  });

  it('should clear all session locks on destroy', async () => {
    const sessionLock = getSessionLock();

    // Create some locks
    const release1 = await sessionLock.acquireLock('session1');
    const release2Promise = sessionLock.acquireLock('session1'); // This will wait

    // Verify locks exist
    expect(sessionLock.getActiveLockCount()).toBe(1);
    expect(sessionLock.isLocked('session1')).toBe(true);

    // Destroy should clear all locks
    sessionLock.destroy();

    // Verify all locks are cleared
    expect(sessionLock.getActiveLockCount()).toBe(0);
    expect(sessionLock.isLocked('session1')).toBe(false);

    // Clean up
    release1();
    const release2 = await release2Promise;
    release2();
  });

  it('should handle multiple rapid destroy calls gracefully', () => {
    // Create a session
    server.planThinkingSession({
      problem: 'Test problem',
      techniques: ['scamper'],
    });

    // Call destroy multiple times rapidly
    expect(() => {
      server.destroy();
      server.destroy();
      server.destroy();
    }).not.toThrow();

    // Verify cleanup still worked
    expect(server.getSessionManager().getSessionCount()).toBe(0);
  });

  it('should clean up SessionCleaner interval on destroy', () => {
    // Create server and let it initialize
    const testServer = new LateralThinkingServer();

    // Get initial state
    const sessionManager = testServer.getSessionManager();

    // Create a session to ensure cleanup interval is active
    testServer.planThinkingSession({
      problem: 'Test cleanup',
      techniques: ['po'],
    });

    // Destroy the server
    testServer.destroy();

    // Verify cleanup - sessionCleaner should have stopped
    // We can't directly check the interval, but we can verify no errors on destroy
    expect(sessionManager.getSessionCount()).toBe(0);
  });

  it('should log cleanup progress during destroy', () => {
    // Spy on console.error to verify logging
    const errorLogs: string[] = [];
    const originalError = console.error;
    console.error = (message: string) => {
      errorLogs.push(message);
    };

    try {
      // Create some data
      server.planThinkingSession({
        problem: 'Test logging',
        techniques: ['random_entry'],
      });

      // Destroy and check logs
      server.destroy();

      // Verify cleanup logs
      expect(errorLogs.some(log => log.includes('[SessionManager] Starting cleanup'))).toBe(true);
      expect(errorLogs.some(log => log.includes('[SessionManager] Stopped cleanup interval'))).toBe(
        true
      );
      expect(
        errorLogs.some(log => log.includes('[SessionManager] Cleared all session locks'))
      ).toBe(true);
      expect(errorLogs.some(log => log.includes('[SessionManager] Cleanup complete'))).toBe(true);
    } finally {
      // Restore console.error
      console.error = originalError;
    }
  });
});
