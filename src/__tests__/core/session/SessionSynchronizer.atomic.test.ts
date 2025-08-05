/**
 * Tests for SessionSynchronizer atomic operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionSynchronizer } from '../../../core/session/SessionSynchronizer.js';

describe('SessionSynchronizer Atomic Operations', () => {
  let synchronizer: SessionSynchronizer;

  beforeEach(() => {
    synchronizer = new SessionSynchronizer();
  });

  afterEach(async () => {
    await synchronizer.clear();
  });

  describe('Concurrent Updates', () => {
    it('should handle concurrent theme updates atomically', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Launch multiple concurrent updates
      const updates = Array.from({ length: 100 }, (_, i) =>
        synchronizer.updateSharedContext(`session${i}`, 'group1', {
          themes: [{ theme: 'test', weight: 1 }],
          type: 'immediate',
        })
      );

      // Wait for all updates to complete
      await Promise.all(updates);

      // Check that all updates were applied
      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedThemes['test']).toBe(100);
    });

    it('should handle mixed concurrent operations', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Mix of different update types
      const operations = [
        // Regular updates
        ...Array.from({ length: 30 }, (_, i) =>
          synchronizer.updateSharedContext(`session${i}`, 'group1', {
            insights: [`Insight ${i}`],
            themes: [{ theme: 'innovation', weight: 1 }],
            metrics: { count: 1 },
            type: 'immediate',
          })
        ),
        // Atomic theme updates
        ...Array.from({ length: 20 }, () =>
          synchronizer.atomicThemeUpdate('group1', 'innovation', 2)
        ),
        // Atomic metric increments
        ...Array.from({ length: 25 }, () =>
          synchronizer.atomicMetricIncrement('group1', 'count', 1)
        ),
      ];

      // Shuffle operations to simulate random ordering
      const shuffled = operations.sort(() => Math.random() - 0.5);

      // Execute all operations concurrently
      await Promise.all(shuffled);

      // Verify results
      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedInsights).toHaveLength(30);
      expect(context?.sharedThemes['innovation']).toBe(70); // 30 * 1 + 20 * 2
      // Metrics get overwritten by regular updates, then incremented by atomic operations
      // The final value depends on execution order, but should be at least 25 (from atomic increments)
      expect(context?.sharedMetrics.count).toBeGreaterThanOrEqual(25);
      expect(context?.sharedMetrics.count).toBeLessThanOrEqual(26); // 1 (from last regular update) + 25
    });

    it('should prevent race conditions in theme updates', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Create competing updates that would cause race conditions without locks
      const updates: Promise<void>[] = [];

      // 50 increments
      for (let i = 0; i < 50; i++) {
        updates.push(
          synchronizer.updateSharedContext(`inc${i}`, 'group1', {
            themes: [{ theme: 'counter', weight: 1 }],
            type: 'immediate',
          })
        );
      }

      // 50 decrements (simulated by negative weight)
      for (let i = 0; i < 50; i++) {
        updates.push(
          synchronizer.updateSharedContext(`dec${i}`, 'group1', {
            themes: [{ theme: 'counter', weight: -1 }],
            type: 'immediate',
          })
        );
      }

      // Execute all concurrently
      await Promise.all(updates);

      // Should sum to 0
      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedThemes['counter']).toBe(0);
    });
  });

  describe('Atomic Methods', () => {
    it('should perform atomic theme updates', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Set initial value
      await synchronizer.updateSharedContext('session1', 'group1', {
        themes: [{ theme: 'test', weight: 10 }],
        type: 'immediate',
      });

      // Atomic update
      await synchronizer.atomicThemeUpdate('group1', 'test', 5);

      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedThemes['test']).toBe(15);
    });

    it('should perform atomic metric updates', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Set initial metric
      await synchronizer.atomicMetricUpdate('group1', 'score', 100);

      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedMetrics.score).toBe(100);

      // Update again
      await synchronizer.atomicMetricUpdate('group1', 'score', 200);
      expect(context?.sharedMetrics.score).toBe(200);
    });

    it('should perform atomic metric increments', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Multiple increments
      await synchronizer.atomicMetricIncrement('group1', 'counter', 5);
      await synchronizer.atomicMetricIncrement('group1', 'counter', 3);
      await synchronizer.atomicMetricIncrement('group1', 'counter'); // Default 1

      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedMetrics.counter).toBe(9);
    });

    it('should handle theme limits atomically', async () => {
      // Create synchronizer with low theme limit
      const limitedSync = new SessionSynchronizer({ maxThemes: 3 });
      limitedSync.initializeSharedContext('group1', 'immediate');

      // Add many themes concurrently
      const updates = Array.from({ length: 10 }, (_, i) =>
        limitedSync.atomicThemeUpdate('group1', `theme${i}`, i + 1)
      );

      await Promise.all(updates);

      const context = limitedSync.getSharedContext('group1');
      const themes = Object.keys(context?.sharedThemes || {});

      // Should only keep top 3 themes by weight
      expect(themes).toHaveLength(3);
      expect(themes).toContain('theme9'); // Weight 10
      expect(themes).toContain('theme8'); // Weight 9
      expect(themes).toContain('theme7'); // Weight 8
    });
  });

  describe('Lock Cleanup', () => {
    it('should clean up locks after operations', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Perform operations
      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Test'],
        type: 'immediate',
      });

      // Check that locks are cleaned up
      expect(synchronizer['updateLocks'].size).toBe(0);
    });

    it('should clean up locks even on errors', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Create an update that will fail (no context)
      try {
        await synchronizer.updateSharedContext('session1', 'nonexistent', {
          insights: ['Test'],
          type: 'immediate',
        });
      } catch {
        // Expected to fail
      }

      // Locks should still be cleaned up
      expect(synchronizer['updateLocks'].size).toBe(0);
    });

    it('should handle clearing context with pending operations', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      // Start operations but don't wait
      const operations = Array.from({ length: 10 }, (_, i) =>
        synchronizer.updateSharedContext(`session${i}`, 'group1', {
          insights: [`Insight ${i}`],
          type: 'immediate',
        })
      );

      // Clear context while operations are pending
      await synchronizer.clearContext('group1');

      // Wait for operations to complete
      await Promise.allSettled(operations);

      // Context should be cleared
      expect(synchronizer.getSharedContext('group1')).toBeUndefined();
      expect(synchronizer['updateLocks'].size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations on non-existent groups', async () => {
      // Should not throw
      await expect(synchronizer.atomicThemeUpdate('nonexistent', 'test', 1)).resolves.not.toThrow();

      await expect(
        synchronizer.atomicMetricUpdate('nonexistent', 'test', 1)
      ).resolves.not.toThrow();

      await expect(
        synchronizer.atomicMetricIncrement('nonexistent', 'test', 1)
      ).resolves.not.toThrow();
    });

    it('should handle concurrent clear operations', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');
      synchronizer.initializeSharedContext('group2', 'immediate');

      // Multiple concurrent clears
      await Promise.all([synchronizer.clear(), synchronizer.clear(), synchronizer.clear()]);

      // Everything should be cleared
      expect(synchronizer.getSharedContext('group1')).toBeUndefined();
      expect(synchronizer.getSharedContext('group2')).toBeUndefined();
      expect(synchronizer['updateLocks'].size).toBe(0);
    });
  });
});
