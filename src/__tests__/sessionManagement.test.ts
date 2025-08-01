/**
 * Tests for session management improvements (issue #54)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LateralThinkingServer } from '../index.js';

// Type for session data in tests
interface TestSessionData {
  lastActivityTime: number;
  [key: string]: unknown;
}

// Type to access private properties for testing
interface TestServer extends LateralThinkingServer {
  sessions: Map<string, TestSessionData>;
  config: {
    maxSessions: number;
    maxSessionSize: number;
    sessionTTL: number;
    cleanupInterval: number;
    enableMemoryMonitoring: boolean;
  };
  initializeSession(technique: string, problem: string): string;
  touchSession(sessionId: string): void;
  cleanupOldSessions(): void;
  evictOldestSessions(): void;
  logMemoryMetrics(): void;
}

describe('Session Management', () => {
  let server: TestServer;

  beforeEach(() => {
    server = new LateralThinkingServer() as TestServer;
  });

  describe('Session cleanup with TTL', () => {
    it('should clean up sessions older than TTL', () => {
      // Create test sessions with different lastActivityTime
      const now = Date.now();
      const oldSessionId = server.initializeSession('six_hats', 'Old problem');
      const newSessionId = server.initializeSession('po', 'New problem');

      // Manually set lastActivityTime for old session
      const oldSession = server.sessions.get(oldSessionId);
      if (oldSession) {
        oldSession.lastActivityTime = now - 25 * 60 * 60 * 1000; // 25 hours ago
      }

      // Run cleanup
      server.cleanupOldSessions();

      // Check that old session was removed, new session remains
      expect(server.sessions.has(oldSessionId)).toBe(false);
      expect(server.sessions.has(newSessionId)).toBe(true);
    });

    it('should update lastActivityTime when session is accessed', async () => {
      const sessionId = server.initializeSession('six_hats', 'Test problem');
      const session = server.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      const initialTime = session.lastActivityTime;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Access the session
      server.touchSession(sessionId);

      // Check that lastActivityTime was updated
      expect(session.lastActivityTime).toBeGreaterThan(initialTime);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest sessions when limit is exceeded', async () => {
      // Set max sessions to 3
      server.config.maxSessions = 3;

      // Create 3 sessions
      const sessionIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const id = server.initializeSession('six_hats', `Problem ${i}`);
        sessionIds.push(id);
        await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      }

      // Access the middle session to make it more recent
      server.touchSession(sessionIds[1]);

      // Create a 4th session, which should trigger eviction
      const newSessionId = server.initializeSession('po', 'New problem');

      // Check that the oldest session (first one) was evicted
      expect(server.sessions.has(sessionIds[0])).toBe(false);
      expect(server.sessions.has(sessionIds[1])).toBe(true);
      expect(server.sessions.has(sessionIds[2])).toBe(true);
      expect(server.sessions.has(newSessionId)).toBe(true);
      expect(server.sessions.size).toBe(3);
    });

    it('should not evict if under the limit', () => {
      server.config.maxSessions = 10;

      // Create 3 sessions
      const sessionIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const id = server.initializeSession('six_hats', `Problem ${i}`);
        sessionIds.push(id);
      }

      // No eviction should occur
      server.evictOldestSessions();

      // All sessions should still exist
      for (const id of sessionIds) {
        expect(server.sessions.has(id)).toBe(true);
      }
    });
  });

  describe('Memory monitoring', () => {
    it('should log memory metrics when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Enable memory monitoring
      server.config.enableMemoryMonitoring = true;

      // Create some sessions
      server.initializeSession('six_hats', 'Test problem 1');
      server.initializeSession('po', 'Test problem 2');

      // Log memory metrics
      server.logMemoryMetrics();

      // Check that memory metrics were logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Memory Metrics]',
        expect.objectContaining({
          timestamp: expect.any(String) as string,
          process: expect.objectContaining({
            heapUsed: expect.stringMatching(/^\d+MB$/) as string,
            heapTotal: expect.stringMatching(/^\d+MB$/) as string,
            rss: expect.stringMatching(/^\d+MB$/) as string,
          }) as Record<string, string>,
          sessions: expect.objectContaining({
            count: 2,
            estimatedSize: expect.stringMatching(/^\d+KB$/) as string,
            averageSize: expect.stringMatching(/^\d+KB$/) as string,
          }) as Record<string, string | number>,
          plans: expect.objectContaining({
            count: expect.any(Number) as number,
          }) as Record<string, number>,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log eviction when monitoring is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Enable memory monitoring and set low limit
      server.config.enableMemoryMonitoring = true;
      server.config.maxSessions = 1;

      // Create 2 sessions to trigger eviction
      const sessionId1 = server.initializeSession('six_hats', 'Problem 1');
      server.initializeSession('po', 'Problem 2');

      // Check that eviction was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Session Eviction] Evicted session ${sessionId1} (LRU)`
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Session configuration', () => {
    it('should load configuration from environment variables', () => {
      // Test default values
      expect(server.config.maxSessions).toBe(100);
      expect(server.config.maxSessionSize).toBe(1024 * 1024); // 1MB (default)
      expect(server.config.sessionTTL).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(server.config.cleanupInterval).toBe(60 * 60 * 1000); // 1 hour
      expect(server.config.enableMemoryMonitoring).toBe(false);
    });
  });
});
