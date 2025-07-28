/**
 * Tests for session management improvements (issue #54)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LateralThinkingServer } from '../index.js';

describe('Session Management', () => {
  let server: any; // Use any to access private methods for testing
  let mockStdioTransport: StdioServerTransport;

  beforeEach(() => {
    // Mock stdio transport
    mockStdioTransport = {
      start: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    } as unknown as StdioServerTransport;

    server = new LateralThinkingServer() as any;
  });

  describe('Session cleanup with TTL', () => {
    it('should clean up sessions older than TTL', async () => {
      // Create test sessions with different lastActivityTime
      const now = Date.now();
      const oldSessionId = server.initializeSession('six_hats', 'Old problem');
      const newSessionId = server.initializeSession('po', 'New problem');

      // Manually set lastActivityTime for old session
      const oldSession = (server as any).sessions.get(oldSessionId);
      oldSession.lastActivityTime = now - 25 * 60 * 60 * 1000; // 25 hours ago

      // Run cleanup
      (server as any).cleanupOldSessions();

      // Check that old session was removed, new session remains
      expect((server as any).sessions.has(oldSessionId)).toBe(false);
      expect((server as any).sessions.has(newSessionId)).toBe(true);
    });

    it('should update lastActivityTime when session is accessed', async () => {
      const sessionId = server.initializeSession('six_hats', 'Test problem');
      const session = (server as any).sessions.get(sessionId);
      const initialTime = session.lastActivityTime;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Access the session
      (server as any).touchSession(sessionId);

      // Check that lastActivityTime was updated
      expect(session.lastActivityTime).toBeGreaterThan(initialTime);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest sessions when limit is exceeded', async () => {
      // Set max sessions to 3
      (server as any).config.maxSessions = 3;

      // Create 3 sessions
      const sessionIds = [];
      for (let i = 0; i < 3; i++) {
        const id = server.initializeSession('six_hats', `Problem ${i}`);
        sessionIds.push(id);
        await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      }

      // Access the middle session to make it more recent
      (server as any).touchSession(sessionIds[1]);

      // Create a 4th session, which should trigger eviction
      const newSessionId = server.initializeSession('po', 'New problem');

      // Check that the oldest session (first one) was evicted
      expect((server as any).sessions.has(sessionIds[0])).toBe(false);
      expect((server as any).sessions.has(sessionIds[1])).toBe(true);
      expect((server as any).sessions.has(sessionIds[2])).toBe(true);
      expect((server as any).sessions.has(newSessionId)).toBe(true);
      expect((server as any).sessions.size).toBe(3);
    });

    it('should not evict if under the limit', async () => {
      (server as any).config.maxSessions = 10;

      // Create 3 sessions
      const sessionIds = [];
      for (let i = 0; i < 3; i++) {
        const id = server.initializeSession('six_hats', `Problem ${i}`);
        sessionIds.push(id);
      }

      // No eviction should occur
      (server as any).evictOldestSessions();

      // All sessions should still exist
      for (const id of sessionIds) {
        expect((server as any).sessions.has(id)).toBe(true);
      }
    });
  });

  describe('Memory monitoring', () => {
    it('should log memory metrics when enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Enable memory monitoring
      (server as any).config.enableMemoryMonitoring = true;

      // Create some sessions
      server.initializeSession('six_hats', 'Test problem 1');
      server.initializeSession('po', 'Test problem 2');

      // Log memory metrics
      (server as any).logMemoryMetrics();

      // Check that memory metrics were logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Memory Metrics]',
        expect.objectContaining({
          timestamp: expect.any(String),
          process: expect.objectContaining({
            heapUsed: expect.stringMatching(/^\d+MB$/),
            heapTotal: expect.stringMatching(/^\d+MB$/),
            rss: expect.stringMatching(/^\d+MB$/),
          }),
          sessions: expect.objectContaining({
            count: 2,
            estimatedSize: expect.stringMatching(/^\d+KB$/),
            averageSize: expect.stringMatching(/^\d+KB$/),
          }),
          plans: expect.objectContaining({
            count: expect.any(Number),
          }),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log eviction when monitoring is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Enable memory monitoring and set low limit
      (server as any).config.enableMemoryMonitoring = true;
      (server as any).config.maxSessions = 1;

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
      expect((server as any).config.maxSessions).toBe(100);
      expect((server as any).config.maxSessionSize).toBe(1024 * 1024); // 1MB (default)
      expect((server as any).config.sessionTTL).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect((server as any).config.cleanupInterval).toBe(60 * 60 * 1000); // 1 hour
      expect((server as any).config.enableMemoryMonitoring).toBe(false);
    });
  });
});