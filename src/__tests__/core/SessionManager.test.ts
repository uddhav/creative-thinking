/**
 * Tests for SessionManager
 * Focuses on memory management, cleanup, and persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../core/SessionManager.js';
import type { SessionData } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

describe('SessionManager', () => {
  let manager: SessionManager;
  let mockSession: SessionData;
  let mockPlan: PlanThinkingSessionOutput;

  beforeEach(() => {
    // Mock console methods to prevent noise during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Clear environment variables
    delete process.env.MAX_SESSIONS;
    delete process.env.MAX_SESSION_SIZE;
    delete process.env.SESSION_TTL;
    delete process.env.CLEANUP_INTERVAL;
    delete process.env.ENABLE_MEMORY_MONITORING;
    delete process.env.PERSISTENCE_TYPE;
    delete process.env.PERSISTENCE_PATH;

    manager = new SessionManager();

    mockSession = {
      technique: 'six_hats',
      problem: 'Test problem',
      history: [],
      branches: {},
      insights: [],
      lastActivityTime: Date.now(),
    };

    mockPlan = {
      planId: 'plan_123',
      workflow: [],
      estimatedSteps: 5,
      objectives: [],
      successCriteria: [],
      createdAt: Date.now(),
    };
  });

  afterEach(() => {
    // Clean up
    manager.destroy();
    vi.clearAllTimers();
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should use default configuration when no env vars set', () => {
      const manager = new SessionManager();
      const config = manager.getConfig();

      // Check defaults
      expect(config.maxSessions).toBe(100);
      expect(config.sessionTTL).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(config.cleanupInterval).toBe(60 * 60 * 1000); // 1 hour
      expect(config.enableMemoryMonitoring).toBe(false);

      // Test eviction behavior with default max sessions
      const sessionIds: string[] = [];
      for (let i = 0; i < 101; i++) {
        // Create sessions where i=0 is oldest, i=100 is newest
        const id = manager.createSession({
          ...mockSession,
          lastActivityTime: Date.now() - (101 - i) * 1000,
        });
        sessionIds.push(id);
      }

      // Should have evicted oldest session
      expect(manager.getSessionCount()).toBe(100);
      expect(manager.getSession(sessionIds[0])).toBeUndefined(); // First (oldest) was evicted
    });

    it('should respect environment variable configuration', () => {
      process.env.MAX_SESSIONS = '10';
      process.env.SESSION_TTL = '5000'; // 5 seconds
      process.env.ENABLE_MEMORY_MONITORING = 'true';

      const manager = new SessionManager();
      const config = manager.getConfig();

      expect(config.maxSessions).toBe(10);
      expect(config.sessionTTL).toBe(5000);
      expect(config.enableMemoryMonitoring).toBe(true);

      // Add 11 sessions
      for (let i = 0; i < 11; i++) {
        manager.createSession(mockSession);
      }

      // Should have evicted one session
      expect(manager.getSessionCount()).toBe(10);

      // Manually call the cleanup method to trigger memory monitoring
      // The cleanup method is private, but we can trigger it via the interval
      manager['cleanupOldSessions']();

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith('[Memory Metrics]', expect.any(Object));
    });
  });

  describe('Session Management', () => {
    it('should create and retrieve sessions', () => {
      const sessionId = manager.createSession(mockSession);
      const retrieved = manager.getSession(sessionId);

      expect(retrieved).toEqual(mockSession);
      expect(sessionId).toMatch(
        /^session_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
      );
    });

    it('should update session activity time on touch', () => {
      const originalTime = Date.now() - 1000;
      mockSession.lastActivityTime = originalTime;

      const sessionId = manager.createSession(mockSession);

      // Touch the session
      manager.touchSession(sessionId);
      const session = manager.getSession(sessionId);

      expect(session?.lastActivityTime).toBeGreaterThan(originalTime);
    });

    it('should handle non-existent session touch gracefully', () => {
      expect(() => {
        manager.touchSession('non_existent');
      }).not.toThrow();
    });

    it('should track current session ID', () => {
      const sessionId = manager.createSession(mockSession);

      // createSession automatically sets it as current
      expect(manager.getCurrentSessionId()).toBe(sessionId);

      // Can also set explicitly
      const _sessionId2 = manager.createSession(mockSession);
      manager.setCurrentSession(sessionId);
      expect(manager.getCurrentSessionId()).toBe(sessionId);
    });

    it('should clear current session ID when that session is deleted', () => {
      const sessionId = manager.createSession(mockSession);

      expect(manager.getCurrentSessionId()).toBe(sessionId);
      manager.deleteSession(sessionId);

      expect(manager.getCurrentSessionId()).toBeNull();
    });

    it('should update sessions', () => {
      const sessionId = manager.createSession(mockSession);

      manager.updateSession(sessionId, {
        insights: ['New insight'],
        metrics: { creativityScore: 5, risksCaught: 2, antifragileFeatures: 1 },
      });

      const updated = manager.getSession(sessionId);
      expect(updated?.insights).toEqual(['New insight']);
      expect(updated?.metrics?.creativityScore).toBe(5);
    });

    it('should list all sessions', () => {
      const id1 = manager.createSession({ ...mockSession, technique: 'six_hats' });
      const id2 = manager.createSession({ ...mockSession, technique: 'po' });

      const sessions = manager.listSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions.map(([id]) => id)).toContain(id1);
      expect(sessions.map(([id]) => id)).toContain(id2);
    });
  });

  describe('Plan Management', () => {
    it('should save and retrieve plans', () => {
      const planId = 'test_plan';

      manager.savePlan(planId, mockPlan);
      const retrieved = manager.getPlan(planId);

      expect(retrieved).toEqual(mockPlan);
    });

    it('should store plans with auto-cleanup', () => {
      vi.useFakeTimers();
      const planId = 'test_plan';

      manager.storePlan(planId, mockPlan);
      expect(manager.getPlan(planId)).toBeDefined();

      // Advance time past TTL (4 hours)
      vi.advanceTimersByTime(4 * 60 * 60 * 1000 + 1000);

      expect(manager.getPlan(planId)).toBeUndefined();
      vi.useRealTimers();
    });

    it('should delete plans', () => {
      const planId = 'test_plan';

      manager.savePlan(planId, mockPlan);
      const deleted = manager.deletePlan(planId);

      expect(deleted).toBe(true);
      expect(manager.getPlan(planId)).toBeUndefined();
    });

    it('should track plan count', () => {
      expect(manager.getPlanCount()).toBe(0);

      manager.savePlan('plan1', mockPlan);
      manager.savePlan('plan2', mockPlan);

      expect(manager.getPlanCount()).toBe(2);
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up old sessions based on TTL', () => {
      vi.useFakeTimers();

      // Set short TTL
      process.env.SESSION_TTL = '5000'; // 5 seconds
      const manager = new SessionManager();

      // Create sessions with different ages
      const oldSession = { ...mockSession, lastActivityTime: Date.now() - 10000 }; // 10s ago
      const newSession = { ...mockSession, lastActivityTime: Date.now() - 1000 }; // 1s ago

      const oldSessionId = manager.createSession(oldSession);
      const newSessionId = manager.createSession(newSession);

      // Trigger cleanup
      manager['cleanupOldSessions']();

      expect(manager.getSession(oldSessionId)).toBeUndefined();
      expect(manager.getSession(newSessionId)).toBeDefined();

      vi.useRealTimers();
    });

    it('should clean up old plans based on PLAN_TTL', () => {
      vi.useFakeTimers();

      const oldPlan = { ...mockPlan, createdAt: Date.now() - 5 * 60 * 60 * 1000 }; // 5 hours ago
      const newPlan = { ...mockPlan, createdAt: Date.now() - 1 * 60 * 60 * 1000 }; // 1 hour ago

      manager.savePlan('old_plan', oldPlan);
      manager.savePlan('new_plan', newPlan);

      // Trigger cleanup
      manager['cleanupOldSessions']();

      expect(manager.getPlan('old_plan')).toBeUndefined();
      expect(manager.getPlan('new_plan')).toBeDefined();

      vi.useRealTimers();
    });

    it('should run cleanup at intervals', () => {
      vi.useFakeTimers();

      process.env.CLEANUP_INTERVAL = '1000'; // 1 second
      const manager = new SessionManager();

      const cleanupSpy = vi.spyOn(manager, 'cleanupOldSessions' as keyof SessionManager);

      // Advance time
      vi.advanceTimersByTime(3000);

      // Should have been called 3 times
      expect(cleanupSpy).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe('Session Eviction (LRU)', () => {
    it('should evict oldest sessions when limit exceeded', () => {
      process.env.MAX_SESSIONS = '3';
      const manager = new SessionManager();

      // Create sessions with different activity times
      const sessionData1 = { ...mockSession, lastActivityTime: Date.now() - 3000 };
      const sessionData2 = { ...mockSession, lastActivityTime: Date.now() - 2000 };
      const sessionData3 = { ...mockSession, lastActivityTime: Date.now() - 1000 };

      const id1 = manager.createSession(sessionData1);
      const id2 = manager.createSession(sessionData2);
      const id3 = manager.createSession(sessionData3);

      // Reset current session since createSession sets it
      manager.setCurrentSessionId(null);

      // Add one more to trigger eviction
      const id4 = manager.createSession(mockSession);

      // Oldest (id1) should be evicted
      expect(manager.getSession(id1)).toBeUndefined();
      expect(manager.getSession(id2)).toBeDefined();
      expect(manager.getSession(id3)).toBeDefined();
      expect(manager.getSession(id4)).toBeDefined();
    });

    it('should clear current session ID if it gets evicted', () => {
      process.env.MAX_SESSIONS = '2';
      const manager = new SessionManager();

      // Create sessions
      const id1 = manager.createSession({ ...mockSession, lastActivityTime: Date.now() - 3000 });
      const _id2 = manager.createSession({ ...mockSession, lastActivityTime: Date.now() - 2000 });

      // Set first session as current
      manager.setCurrentSession(id1);
      expect(manager.getCurrentSessionId()).toBe(id1);

      // Add one more to trigger eviction of oldest (id1)
      const id3 = manager.createSession(mockSession);

      // id1 should be evicted, and since createSession sets new session as current,
      // current should now be id3
      expect(manager.getSession(id1)).toBeUndefined();
      expect(manager.getCurrentSessionId()).toBe(id3);
    });

    it('should log eviction when memory monitoring enabled', () => {
      process.env.MAX_SESSIONS = '2';
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      const manager = new SessionManager();

      // Create sessions
      const id1 = manager.createSession({ ...mockSession, lastActivityTime: Date.now() - 1000 });
      manager.createSession(mockSession);
      manager.createSession(mockSession); // Triggers eviction

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`[Session Eviction] Evicted session ${id1} (LRU)`)
      );
    });

    it('should not evict if within session limit', () => {
      process.env.MAX_SESSIONS = '10';
      const manager = new SessionManager();

      // Create 5 sessions
      for (let i = 0; i < 5; i++) {
        manager.createSession(mockSession);
      }

      expect(manager.getSessionCount()).toBe(5);

      // Force cleanup - no eviction should occur
      vi.useFakeTimers();
      vi.advanceTimersByTime(manager.getConfig().cleanupInterval);
      vi.useRealTimers();

      expect(manager.getSessionCount()).toBe(5);
    });
  });

  describe('Memory Monitoring', () => {
    it('should log memory metrics when enabled', () => {
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      const manager = new SessionManager();

      // Add some sessions
      for (let i = 0; i < 5; i++) {
        manager.createSession(`session_${i}`, {
          ...mockSession,
          history: Array(10).fill({ output: 'test' }),
          branches: { branch1: [], branch2: [] },
        });
      }

      // Trigger memory logging
      manager['logMemoryMetrics']();

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        '[Memory Metrics]',
        expect.objectContaining({
          timestamp: expect.any(String) as string,
          process: expect.objectContaining({
            heapUsed: expect.stringMatching(/\d+MB/) as string,
            heapTotal: expect.stringMatching(/\d+MB/) as string,
            rss: expect.stringMatching(/\d+MB/) as string,
          }) as Record<string, string>,
          sessions: expect.objectContaining({
            count: 5,
            estimatedSize: expect.stringMatching(/\d+KB/) as string,
            averageSize: expect.stringMatching(/\d+KB/) as string,
          }) as Record<string, string | number>,
          plans: expect.objectContaining({
            count: 0,
          }) as Record<string, number>,
        })
      );
    });

    it('should warn on high memory usage', () => {
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      const manager = new SessionManager();

      // Mock high memory usage by overriding memoryUsage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = () => ({
        rss: 600 * 1024 * 1024, // 600MB
        heapTotal: 550 * 1024 * 1024,
        heapUsed: 520 * 1024 * 1024, // Over 500MB
        external: 0,
        arrayBuffers: 0,
      });

      manager['logMemoryMetrics']();

      expect(console.warn).toHaveBeenCalledWith('[Memory Warning] High memory usage detected');

      // Restore
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle empty sessions in memory calculation', () => {
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      const manager = new SessionManager();

      manager['logMemoryMetrics']();

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        '[Memory Metrics]',
        expect.objectContaining({
          sessions: expect.objectContaining({
            count: 0,
            estimatedSize: '0KB',
            averageSize: '0KB',
          }) as Record<string, unknown>,
        }) as Record<string, unknown>
      );
    });

    it('should estimate session size correctly', () => {
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      const manager = new SessionManager();

      // Create a session with known content
      const bigSession: SessionData = {
        ...mockSession,
        history: Array.from({ length: 100 }, () => ({
          technique: 'six_hats' as const,
          problem: 'Test',
          currentStep: 1,
          totalSteps: 6,
          output: 'a'.repeat(1000), // ~1KB per history item
          nextStepNeeded: true,
          timestamp: new Date().toISOString(),
        })),
        branches: {
          branch1: [],
          branch2: [],
          branch3: [],
        },
      };

      manager.createSession('big_session', bigSession);
      manager['logMemoryMetrics']();

      // Should estimate size based on JSON stringification
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        '[Memory Metrics]',
        expect.objectContaining({
          sessions: expect.objectContaining({
            count: 1,
            estimatedSize: expect.stringMatching(/\d+KB/) as string,
          }) as Record<string, unknown>,
        }) as Record<string, unknown>
      );
    });

    it('should trigger garbage collection on high memory pressure', () => {
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      const manager = new SessionManager();

      // Mock global.gc
      const originalGc = global.gc;
      global.gc = vi.fn();

      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = () => ({
        rss: 1000 * 1024 * 1024,
        heapTotal: 600 * 1024 * 1024,
        heapUsed: 500 * 1024 * 1024, // > 80% of heap total
        external: 0,
        arrayBuffers: 0,
      });

      manager['logMemoryMetrics']();

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith('[Memory Usage] Triggering garbage collection...');
      expect(global.gc).toHaveBeenCalled();

      // Restore
      process.memoryUsage = originalMemoryUsage;
      global.gc = originalGc;
    });

    it('should not crash if gc is not available', () => {
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      const manager = new SessionManager();

      // Ensure gc is undefined
      const originalGc = global.gc;
      delete global.gc;

      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = () => ({
        rss: 1000 * 1024 * 1024,
        heapTotal: 600 * 1024 * 1024,
        heapUsed: 500 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      });

      expect(() => {
        manager['logMemoryMetrics']();
      }).not.toThrow();

      // Restore
      process.memoryUsage = originalMemoryUsage;
      global.gc = originalGc;
    });
  });

  describe('Persistence Initialization', () => {
    it('should handle persistence initialization failure gracefully', async () => {
      // Force an error during initialization
      process.env.PERSISTENCE_TYPE = 'invalid-type';

      const manager = new SessionManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize persistence:',
        expect.any(Error)
      );

      // Manager should still work without persistence
      expect(() => {
        manager.createSession('test', mockSession);
      }).not.toThrow();
    });

    it('should use filesystem persistence by default', async () => {
      const manager = new SessionManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have attempted to create adapter with filesystem type
      expect(manager.getPersistenceAdapter()).toBeDefined();
    });

    it('should respect PERSISTENCE_PATH environment variable', async () => {
      process.env.PERSISTENCE_PATH = '/custom/path';

      const _manager = new SessionManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      // Adapter should be initialized (though it might fail due to permissions)
      // The important thing is that it tried with the custom path
      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize persistence:',
        expect.any(Error)
      );
    });
  });

  describe('Utility Methods', () => {
    it('should get session count', () => {
      expect(manager.getSessionCount()).toBe(0);

      manager.createSession(mockSession);
      manager.createSession(mockSession);

      expect(manager.getSessionCount()).toBe(2);
    });

    it('should get plan count', () => {
      expect(manager.getPlanCount()).toBe(0);

      manager.savePlan('plan1', mockPlan);
      manager.savePlan('plan2', mockPlan);

      expect(manager.getPlanCount()).toBe(2);
    });

    it('should get memory stats', () => {
      manager.createSession(mockSession);
      manager.createSession({
        ...mockSession,
        history: Array.from({ length: 10 }, (_, i) => ({
          technique: 'six_hats' as const,
          problem: 'test',
          currentStep: i + 1,
          totalSteps: 10,
          output: 'test',
          nextStepNeeded: true,
          timestamp: new Date().toISOString(),
        })),
      });
      manager.savePlan('plan1', mockPlan);

      const stats = manager.getMemoryStats();

      expect(stats.sessionCount).toBe(2);
      expect(stats.planCount).toBe(1);
      expect(stats.totalMemoryBytes).toBeGreaterThan(0);
      expect(stats.averageSessionSize).toBeGreaterThan(0);
      expect(stats.averageSessionSize).toBe(stats.totalMemoryBytes / 2);
    });

    it('should get session size', () => {
      const sessionId = manager.createSession(mockSession);
      const size = manager.getSessionSize(sessionId);

      expect(size).toBeGreaterThan(0);
      // Size should be reasonable for the mock session
      // The new estimation method may differ from JSON.stringify
      expect(size).toBeGreaterThan(100); // Reasonable minimum for a session
      expect(size).toBeLessThan(10000); // Reasonable maximum for mock session
    });

    it('should get total memory usage', () => {
      manager.createSession(mockSession);
      manager.createSession({
        ...mockSession,
        history: Array.from({ length: 5 }, (_, i) => ({
          technique: 'six_hats' as const,
          problem: 'test',
          currentStep: i + 1,
          totalSteps: 5,
          output: 'test',
          nextStepNeeded: true,
          timestamp: new Date().toISOString(),
        })),
      });

      const totalMemory = manager.getTotalMemoryUsage();
      expect(totalMemory).toBeGreaterThan(0);
    });

    it('should list all sessions', () => {
      const id1 = manager.createSession(mockSession);
      const id2 = manager.createSession({ ...mockSession, technique: 'po' });

      const sessions = manager.listSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions.map(([id]) => id)).toContain(id1);
      expect(sessions.map(([id]) => id)).toContain(id2);
    });

    it('should destroy properly', () => {
      vi.useFakeTimers();

      manager.createSession(mockSession);
      manager.savePlan('plan1', mockPlan);

      const _initialCount = manager.getSessionCount();
      const _initialPlanCount = manager.getPlanCount();

      manager.destroy();

      // Should clear sessions and plans
      expect(manager.getSessionCount()).toBe(0);
      expect(manager.getPlanCount()).toBe(0);

      // Should stop cleanup interval
      vi.advanceTimersByTime(manager.getConfig().cleanupInterval * 2);
      // If cleanup was still running, it would have logged, but it shouldn't

      vi.useRealTimers();
    });
  });
});
