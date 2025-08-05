/**
 * SessionSynchronizer - Manages shared context between parallel sessions
 * Provides real-time updates and synchronization for parallel execution
 */

import { EventEmitter } from 'events';
import type {
  SharedContext,
  ContextUpdate,
  ContextUpdateData,
  Subscription,
} from '../../types/parallel-session.js';

/**
 * Update strategy for shared context
 */
type UpdateStrategy = 'immediate' | 'batched' | 'checkpoint';

/**
 * Batch update configuration
 */
interface BatchConfig {
  maxBatchSize: number;
  batchIntervalMs: number;
}

/**
 * Manages shared context and synchronization between parallel sessions
 */
export class SessionSynchronizer extends EventEmitter {
  private sharedContexts: Map<string, SharedContext> = new Map();
  private updateQueues: Map<string, ContextUpdateData[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private updateStrategies: Map<string, UpdateStrategy> = new Map();

  private readonly defaultBatchConfig: BatchConfig = {
    maxBatchSize: 10,
    batchIntervalMs: 500,
  };

  /**
   * Initialize shared context for a group
   */
  initializeSharedContext(groupId: string, strategy: UpdateStrategy = 'immediate'): void {
    const context: SharedContext = {
      groupId,
      sharedInsights: [],
      sharedThemes: new Map(),
      sharedMetrics: {},
      lastUpdate: Date.now(),
      updateCount: 0,
    };

    this.sharedContexts.set(groupId, context);
    this.updateStrategies.set(groupId, strategy);

    if (strategy === 'batched') {
      this.updateQueues.set(groupId, []);
    }

    console.error(
      `[SessionSynchronizer] Initialized shared context for group ${groupId} with ${strategy} strategy`
    );
  }

  /**
   * Update shared context for a group
   */
  updateSharedContext(sessionId: string, groupId: string, update: ContextUpdateData): void {
    const context = this.sharedContexts.get(groupId);
    if (!context) {
      console.error(`[SessionSynchronizer] No shared context found for group ${groupId}`);
      return;
    }

    const strategy = this.getUpdateStrategy(groupId);

    switch (strategy) {
      case 'immediate':
        this.applyImmediateUpdate(context, update);
        this.emitUpdate(groupId, sessionId, update);
        break;

      case 'batched':
        this.queueBatchedUpdate(groupId, update);
        this.emitUpdate(groupId, sessionId, update);
        break;

      case 'checkpoint':
        this.queueCheckpointUpdate(groupId, update);
        break;
    }
  }

  /**
   * Get shared context for a group
   */
  getSharedContext(groupId: string): SharedContext | undefined {
    return this.sharedContexts.get(groupId);
  }

  /**
   * Subscribe to context updates for a group
   */
  subscribeToUpdates(groupId: string, callback: (update: ContextUpdate) => void): Subscription {
    const eventName = `update:${groupId}`;
    this.on(eventName, callback);

    return {
      unsubscribe: () => {
        this.off(eventName, callback);
      },
    };
  }

  /**
   * Get update strategy for a group
   */
  private getUpdateStrategy(groupId: string): UpdateStrategy {
    return this.updateStrategies.get(groupId) || 'immediate';
  }

  /**
   * Apply immediate update to context
   */
  private applyImmediateUpdate(context: SharedContext, update: ContextUpdateData): void {
    // Update insights
    if (update.insights) {
      context.sharedInsights.push(...update.insights);
    }

    // Update themes
    if (update.themes) {
      for (const { theme, weight } of update.themes) {
        const currentWeight = context.sharedThemes.get(theme) || 0;
        context.sharedThemes.set(theme, currentWeight + weight);
      }
    }

    // Update metrics
    if (update.metrics) {
      Object.assign(context.sharedMetrics, update.metrics);
    }

    // Update metadata
    context.lastUpdate = Date.now();
    context.updateCount++;
  }

  /**
   * Queue update for batched processing
   */
  private queueBatchedUpdate(groupId: string, update: ContextUpdateData): void {
    const queue = this.updateQueues.get(groupId) || [];
    queue.push(update);
    this.updateQueues.set(groupId, queue);

    // Process batch if size limit reached
    if (queue.length >= this.defaultBatchConfig.maxBatchSize) {
      this.processBatch(groupId);
      return;
    }

    // Set timer for batch processing if not already set
    if (!this.batchTimers.has(groupId)) {
      const timer = setTimeout(() => {
        this.processBatch(groupId);
      }, this.defaultBatchConfig.batchIntervalMs);

      this.batchTimers.set(groupId, timer);
    }
  }

  /**
   * Queue update for checkpoint processing
   */
  private queueCheckpointUpdate(groupId: string, update: ContextUpdateData): void {
    // Similar to batched, but only processes at explicit checkpoints
    const queue = this.updateQueues.get(groupId) || [];
    queue.push(update);
    this.updateQueues.set(groupId, queue);
  }

  /**
   * Process batched updates
   */
  private processBatch(groupId: string): void {
    const queue = this.updateQueues.get(groupId);
    const context = this.sharedContexts.get(groupId);

    if (!queue || !context || queue.length === 0) return;

    // Clear timer
    const timer = this.batchTimers.get(groupId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(groupId);
    }

    // Merge all updates in the batch
    const mergedUpdate: ContextUpdateData = {
      type: 'batched',
      insights: [],
      themes: [],
      metrics: {},
    };

    for (const update of queue) {
      if (update.insights && mergedUpdate.insights) {
        mergedUpdate.insights.push(...update.insights);
      }
      if (update.themes && mergedUpdate.themes) {
        mergedUpdate.themes.push(...update.themes);
      }
      if (update.metrics && mergedUpdate.metrics) {
        Object.assign(mergedUpdate.metrics, update.metrics);
      }
    }

    // Apply merged update
    this.applyImmediateUpdate(context, mergedUpdate);

    // Clear queue
    this.updateQueues.set(groupId, []);

    // Emit batch update event
    this.emit(`batch:${groupId}`, mergedUpdate);
  }

  /**
   * Process checkpoint for a group
   */
  processCheckpoint(groupId: string): void {
    const strategy = this.getUpdateStrategy(groupId);
    if (strategy !== 'checkpoint') return;

    this.processBatch(groupId);
  }

  /**
   * Emit update event
   */
  private emitUpdate(groupId: string, sessionId: string, update: ContextUpdateData): void {
    const contextUpdate: ContextUpdate = {
      groupId,
      sessionId,
      update,
      timestamp: Date.now(),
    };

    this.emit(`update:${groupId}`, contextUpdate);
  }

  /**
   * Get context summary for a group
   */
  getContextSummary(groupId: string):
    | {
        insightCount: number;
        topThemes: Array<{ theme: string; weight: number }>;
        metrics: Record<string, number>;
        lastUpdate: number;
        updateCount: number;
      }
    | undefined {
    const context = this.sharedContexts.get(groupId);
    if (!context) return undefined;

    // Get top themes
    const topThemes = Array.from(context.sharedThemes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, weight]) => ({ theme, weight }));

    return {
      insightCount: context.sharedInsights.length,
      topThemes,
      metrics: context.sharedMetrics,
      lastUpdate: context.lastUpdate,
      updateCount: context.updateCount,
    };
  }

  /**
   * Merge contexts from multiple groups (for hierarchical parallelism)
   */
  mergeContexts(groupIds: string[]): SharedContext | undefined {
    if (groupIds.length === 0) return undefined;

    const contexts = groupIds
      .map(id => this.sharedContexts.get(id))
      .filter((ctx): ctx is SharedContext => ctx !== undefined);

    if (contexts.length === 0) return undefined;

    // Create merged context
    const mergedContext: SharedContext = {
      groupId: `merged_${Date.now()}`,
      sharedInsights: [],
      sharedThemes: new Map(),
      sharedMetrics: {},
      lastUpdate: Date.now(),
      updateCount: 0,
    };

    // Merge all contexts
    for (const context of contexts) {
      // Merge insights
      mergedContext.sharedInsights.push(...context.sharedInsights);

      // Merge themes
      for (const [theme, weight] of context.sharedThemes.entries()) {
        const currentWeight = mergedContext.sharedThemes.get(theme) || 0;
        mergedContext.sharedThemes.set(theme, currentWeight + weight);
      }

      // Merge metrics (last write wins)
      Object.assign(mergedContext.sharedMetrics, context.sharedMetrics);

      // Update count
      mergedContext.updateCount += context.updateCount;
    }

    return mergedContext;
  }

  /**
   * Clear context for a group
   */
  clearContext(groupId: string): void {
    // Clean up timers
    const timer = this.batchTimers.get(groupId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(groupId);
    }

    // Clear data
    this.sharedContexts.delete(groupId);
    this.updateQueues.delete(groupId);
    this.updateStrategies.delete(groupId);

    // Remove all listeners for this group
    this.removeAllListeners(`update:${groupId}`);
    this.removeAllListeners(`batch:${groupId}`);
  }

  /**
   * Get statistics about synchronization
   */
  getStats(): {
    totalGroups: number;
    totalInsights: number;
    totalThemes: number;
    averageUpdatesPerGroup: number;
    strategyDistribution: Record<UpdateStrategy, number>;
  } {
    let totalInsights = 0;
    let totalThemes = 0;
    let totalUpdates = 0;
    const strategyDistribution: Record<UpdateStrategy, number> = {
      immediate: 0,
      batched: 0,
      checkpoint: 0,
    };

    for (const [groupId, context] of this.sharedContexts.entries()) {
      totalInsights += context.sharedInsights.length;
      totalThemes += context.sharedThemes.size;
      totalUpdates += context.updateCount;

      const strategy = this.getUpdateStrategy(groupId);
      strategyDistribution[strategy]++;
    }

    return {
      totalGroups: this.sharedContexts.size,
      totalInsights,
      totalThemes,
      averageUpdatesPerGroup:
        this.sharedContexts.size > 0 ? totalUpdates / this.sharedContexts.size : 0,
      strategyDistribution,
    };
  }

  /**
   * Clear all contexts
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    // Clear all data
    this.sharedContexts.clear();
    this.updateQueues.clear();
    this.updateStrategies.clear();
    this.batchTimers.clear();

    // Remove all listeners
    this.removeAllListeners();
  }
}
