/**
 * Tests for SessionSynchronizer - Shared context and memory leak prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionSynchronizer } from '../../../core/session/SessionSynchronizer.js';
import type { ContextUpdate } from '../../../types/parallel-session.js';

describe('SessionSynchronizer', () => {
  let synchronizer: SessionSynchronizer;

  beforeEach(() => {
    synchronizer = new SessionSynchronizer();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await synchronizer.clear();
    vi.useRealTimers();
  });

  describe('Shared Context Initialization', () => {
    it('should initialize shared context with default immediate strategy', () => {
      synchronizer.initializeSharedContext('group1');

      const context = synchronizer.getSharedContext('group1');
      expect(context).toBeDefined();
      expect(context?.groupId).toBe('group1');
      expect(context?.sharedInsights).toEqual([]);
      expect(context?.sharedThemes).toBeInstanceOf(Object);
      expect(context?.sharedMetrics).toEqual({});
      expect(context?.updateCount).toBe(0);
    });

    it('should initialize with batched strategy', () => {
      synchronizer.initializeSharedContext('group1', 'batched');

      const context = synchronizer.getSharedContext('group1');
      expect(context).toBeDefined();
    });

    it('should clean up existing group when reinitializing', () => {
      synchronizer.initializeSharedContext('group1', 'batched');
      const firstContext = synchronizer.getSharedContext('group1');

      synchronizer.initializeSharedContext('group1', 'immediate');
      const secondContext = synchronizer.getSharedContext('group1');

      expect(secondContext).not.toBe(firstContext);
    });
  });

  describe('Immediate Updates', () => {
    it('should apply updates immediately', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['New insight'],
        themes: [{ theme: 'innovation', weight: 1 }],
        metrics: { score: 10 },
        type: 'immediate',
      });

      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedInsights).toContain('New insight');
      expect(context?.sharedThemes['innovation']).toBe(1);
      expect(context?.sharedMetrics.score).toBe(10);
      expect(context?.updateCount).toBe(1);
    });

    it('should accumulate theme weights', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      await synchronizer.updateSharedContext('session1', 'group1', {
        themes: [{ theme: 'innovation', weight: 2 }],
        type: 'immediate',
      });

      await synchronizer.updateSharedContext('session2', 'group1', {
        themes: [{ theme: 'innovation', weight: 3 }],
        type: 'immediate',
      });

      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedThemes['innovation']).toBe(5);
    });
  });

  describe('Batched Updates', () => {
    it('should queue updates for batch processing', () => {
      synchronizer.initializeSharedContext('group1', 'batched');

      void synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Insight 1'],
        type: 'batched',
      });

      void synchronizer.updateSharedContext('session2', 'group1', {
        insights: ['Insight 2'],
        type: 'batched',
      });

      // Updates should be queued, not applied yet
      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedInsights).toHaveLength(0);

      // Fast forward to trigger batch processing
      vi.advanceTimersByTime(500);

      // Now updates should be applied
      expect(context?.sharedInsights).toContain('Insight 1');
      expect(context?.sharedInsights).toContain('Insight 2');
    });

    it('should process batch immediately when size limit reached', () => {
      synchronizer.initializeSharedContext('group1', 'batched');

      // Add 10 updates (max batch size)
      for (let i = 0; i < 10; i++) {
        void synchronizer.updateSharedContext(`session${i}`, 'group1', {
          insights: [`Insight ${i}`],
          type: 'batched',
        });
      }

      // Should process immediately without waiting for timer
      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedInsights).toHaveLength(10);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up timers when group is cleared', async () => {
      synchronizer.initializeSharedContext('group1', 'batched');

      // Start a batch timer
      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Test'],
        type: 'batched',
      });

      // Clear the context
      await synchronizer.clearContext('group1');

      // Verify timer is cleaned up by checking that advancing time doesn't cause issues
      expect(() => {
        vi.advanceTimersByTime(1000);
      }).not.toThrow();

      // Context should be gone
      expect(synchronizer.getSharedContext('group1')).toBeUndefined();
    });

    it('should handle errors in batch processing without leaking timers', () => {
      synchronizer.initializeSharedContext('group1', 'batched');

      // Mock console.error to suppress error output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Override applyImmediateUpdate to throw an error
      const originalMethod = synchronizer['applyImmediateUpdate'];
      synchronizer['applyImmediateUpdate'] = () => {
        throw new Error('Test error');
      };

      void synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Test'],
        type: 'batched',
      });

      // Advance timers to trigger batch processing
      vi.advanceTimersByTime(500);

      // Restore original method
      synchronizer['applyImmediateUpdate'] = originalMethod;

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SessionSynchronizer] Error processing batch'),
        expect.any(Error)
      );

      // Verify timer was cleaned up by checking internal state
      expect(synchronizer['batchTimers'].has('group1')).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should clean up resources when clearing all contexts', async () => {
      // Initialize multiple groups
      synchronizer.initializeSharedContext('group1', 'batched');
      synchronizer.initializeSharedContext('group2', 'batched');
      synchronizer.initializeSharedContext('group3', 'immediate');

      // Add some updates to create timers
      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Test1'],
        type: 'batched',
      });
      await synchronizer.updateSharedContext('session2', 'group2', {
        insights: ['Test2'],
        type: 'batched',
      });

      // Clear all
      await synchronizer.clear();

      // Verify everything is cleaned up
      expect(synchronizer.getSharedContext('group1')).toBeUndefined();
      expect(synchronizer.getSharedContext('group2')).toBeUndefined();
      expect(synchronizer.getSharedContext('group3')).toBeUndefined();

      // Verify internal state is cleared
      expect(synchronizer['sharedContexts'].size).toBe(0);
      expect(synchronizer['batchTimers'].size).toBe(0);
      expect(synchronizer['activeGroups'].size).toBe(0);
    });

    it('should clean up inactive groups', async () => {
      // Initialize multiple groups
      synchronizer.initializeSharedContext('group1');
      synchronizer.initializeSharedContext('group2');
      synchronizer.initializeSharedContext('group3');

      // Clean up groups not in active set
      await synchronizer.cleanupInactiveGroups(new Set(['group1', 'group3']));

      // group2 should be removed
      expect(synchronizer.getSharedContext('group1')).toBeDefined();
      expect(synchronizer.getSharedContext('group2')).toBeUndefined();
      expect(synchronizer.getSharedContext('group3')).toBeDefined();
    });
  });

  describe('Event Subscriptions', () => {
    it('should emit update events', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      const updateHandler = vi.fn();
      const subscription = synchronizer.subscribeToUpdates('group1', updateHandler);

      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Test insight'],
        type: 'immediate',
      });

      expect(updateHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group1',
          sessionId: 'session1',
          update: expect.objectContaining({
            insights: ['Test insight'],
          }),
        })
      );

      // Unsubscribe
      subscription.unsubscribe();

      // Should not receive more events
      updateHandler.mockClear();
      await synchronizer.updateSharedContext('session2', 'group1', {
        insights: ['Another insight'],
        type: 'immediate',
      });
      expect(updateHandler).not.toHaveBeenCalled();
    });

    it('should remove all listeners when clearing context', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      const updateHandler = vi.fn();
      synchronizer.subscribeToUpdates('group1', updateHandler);

      await synchronizer.clearContext('group1');

      // Try to emit an event (shouldn't work since context is cleared)
      synchronizer.emit('update:group1', {} as ContextUpdate);

      expect(updateHandler).not.toHaveBeenCalled();
    });
  });

  describe('Context Summary', () => {
    it('should provide context summary', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');

      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Insight 1', 'Insight 2'],
        themes: [
          { theme: 'innovation', weight: 5 },
          { theme: 'efficiency', weight: 3 },
          { theme: 'sustainability', weight: 7 },
        ],
        metrics: { score: 100, quality: 85 },
        type: 'immediate',
      });

      const summary = synchronizer.getContextSummary('group1');
      expect(summary).toBeDefined();
      expect(summary?.insightCount).toBe(2);
      expect(summary?.topThemes).toHaveLength(3);
      expect(summary?.topThemes[0]).toEqual({ theme: 'sustainability', weight: 7 });
      expect(summary?.metrics.score).toBe(100);
      expect(summary?.updateCount).toBe(1);
    });

    it('should return undefined for non-existent group', () => {
      const summary = synchronizer.getContextSummary('nonexistent');
      expect(summary).toBeUndefined();
    });
  });

  describe('Context Merging', () => {
    it('should merge contexts from multiple groups', async () => {
      synchronizer.initializeSharedContext('group1');
      synchronizer.initializeSharedContext('group2');

      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Insight 1'],
        themes: [{ theme: 'innovation', weight: 3 }],
        metrics: { score: 50 },
        type: 'immediate',
      });

      await synchronizer.updateSharedContext('session2', 'group2', {
        insights: ['Insight 2'],
        themes: [{ theme: 'innovation', weight: 2 }],
        metrics: { score: 75, quality: 90 },
        type: 'immediate',
      });

      const merged = synchronizer.mergeContexts(['group1', 'group2']);
      expect(merged).toBeDefined();
      expect(merged?.sharedInsights).toContain('Insight 1');
      expect(merged?.sharedInsights).toContain('Insight 2');
      expect(merged?.sharedThemes['innovation']).toBe(5);
      expect(merged?.sharedMetrics.score).toBe(75); // Last write wins
      expect(merged?.sharedMetrics.quality).toBe(90);
      expect(merged?.updateCount).toBe(2);
    });

    it('should handle empty group list', () => {
      const merged = synchronizer.mergeContexts([]);
      expect(merged).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    it('should provide comprehensive statistics', async () => {
      synchronizer.initializeSharedContext('group1', 'immediate');
      synchronizer.initializeSharedContext('group2', 'batched');
      synchronizer.initializeSharedContext('group3', 'checkpoint');

      // Add some data
      await synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['A', 'B'],
        themes: [{ theme: 'test', weight: 1 }],
        type: 'immediate',
      });

      await synchronizer.updateSharedContext('session2', 'group2', {
        insights: ['C'],
        themes: [{ theme: 'test2', weight: 1 }],
        type: 'batched',
      });

      const stats = synchronizer.getStats();
      expect(stats.totalGroups).toBe(3);
      expect(stats.totalInsights).toBe(2); // Only immediate updates are applied
      expect(stats.totalThemes).toBe(1); // Only immediate updates are applied
      expect(stats.strategyDistribution.immediate).toBe(1);
      expect(stats.strategyDistribution.batched).toBe(1);
      expect(stats.strategyDistribution.checkpoint).toBe(1);
    });
  });

  describe('Checkpoint Processing', () => {
    it('should process updates only at checkpoints', () => {
      synchronizer.initializeSharedContext('group1', 'checkpoint');

      void synchronizer.updateSharedContext('session1', 'group1', {
        insights: ['Checkpoint insight'],
        type: 'checkpoint',
      });

      // Should not be applied yet
      const context = synchronizer.getSharedContext('group1');
      expect(context?.sharedInsights).toHaveLength(0);

      // Process checkpoint
      synchronizer.processCheckpoint('group1');

      // Now should be applied
      expect(context?.sharedInsights).toContain('Checkpoint insight');
    });
  });
});
