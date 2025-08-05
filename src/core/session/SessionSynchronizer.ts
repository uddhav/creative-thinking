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
import type { SessionSynchronizerConfig } from '../../types/parallel-config.js';
import { DEFAULT_SYNCHRONIZER_CONFIG, mergeConfig } from '../../types/parallel-config.js';

/**
 * Update strategy for shared context
 */
type UpdateStrategy = 'immediate' | 'batched' | 'checkpoint';

/**
 * Manages shared context and synchronization between parallel sessions
 */
export class SessionSynchronizer extends EventEmitter {
  private sharedContexts: Map<string, SharedContext> = new Map();
  private updateQueues: Map<string, ContextUpdateData[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private updateStrategies: Map<string, UpdateStrategy> = new Map();

  // Track active groups for cleanup
  private activeGroups: Set<string> = new Set();

  // Atomic operation locks for concurrent access
  private updateLocks: Map<string, Promise<void>> = new Map();
  private lockQueues: Map<string, Array<() => void>> = new Map();

  private config: SessionSynchronizerConfig;

  constructor(config?: Partial<SessionSynchronizerConfig>) {
    super();
    this.config = mergeConfig(config, DEFAULT_SYNCHRONIZER_CONFIG);
  }

  /**
   * Initialize shared context for a group
   */
  initializeSharedContext(groupId: string, strategy: UpdateStrategy = 'immediate'): void {
    // Clean up any existing group first
    if (this.activeGroups.has(groupId)) {
      // Note: clearContext is async but we're calling it sync for initialization
      // This is safe because we're only doing cleanup
      void this.clearContext(groupId);
    }

    const context: SharedContext = {
      groupId,
      sharedInsights: [],
      sharedThemes: {},
      sharedMetrics: {},
      lastUpdate: Date.now(),
      updateCount: 0,
    };

    this.sharedContexts.set(groupId, context);
    this.updateStrategies.set(groupId, strategy);
    this.activeGroups.add(groupId);

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
  async updateSharedContext(
    sessionId: string,
    groupId: string,
    update: ContextUpdateData
  ): Promise<void> {
    const context = this.sharedContexts.get(groupId);
    if (!context) {
      console.error(`[SessionSynchronizer] No shared context found for group ${groupId}`);
      return;
    }

    const strategy = this.getUpdateStrategy(groupId);

    // Use atomic operations for immediate updates
    if (strategy === 'immediate') {
      await this.withLock(groupId, () => {
        this.applyImmediateUpdate(context, update);
        this.emitUpdate(groupId, sessionId, update);
      });
    } else {
      // Batched and checkpoint updates handle their own synchronization
      switch (strategy) {
        case 'batched':
          this.queueBatchedUpdate(groupId, update);
          this.emitUpdate(groupId, sessionId, update);
          break;

        case 'checkpoint':
          this.queueCheckpointUpdate(groupId, update);
          break;
      }
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

      // Limit insights array size
      if (context.sharedInsights.length > this.config.maxInsights) {
        context.sharedInsights = context.sharedInsights.slice(-this.config.maxInsights);
      }
    }

    // Update themes
    if (update.themes) {
      for (const { theme, weight } of update.themes) {
        const currentWeight = context.sharedThemes[theme] || 0;
        context.sharedThemes[theme] = currentWeight + weight;
      }

      // Limit number of themes
      if (Object.keys(context.sharedThemes).length > this.config.maxThemes) {
        // Keep only top themes by weight
        const sortedThemes = Object.entries(context.sharedThemes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, this.config.maxThemes);
        context.sharedThemes = Object.fromEntries(sortedThemes);
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
    try {
      const queue = this.updateQueues.get(groupId) || [];
      queue.push(update);
      this.updateQueues.set(groupId, queue);

      // Process batch if size limit reached
      if (queue.length >= this.config.maxBatchSize) {
        this.processBatch(groupId);
        return;
      }

      // Set timer for batch processing if not already set
      if (!this.batchTimers.has(groupId)) {
        const timer = setTimeout(() => {
          try {
            this.processBatch(groupId);
          } catch (error) {
            console.error(
              `[SessionSynchronizer] Error processing batch for group ${groupId}:`,
              error
            );
          } finally {
            // Always remove timer reference after execution
            this.batchTimers.delete(groupId);
          }
        }, this.config.batchIntervalMs);

        this.batchTimers.set(groupId, timer);
      }
    } catch (error) {
      // Clean up timer on error
      const timer = this.batchTimers.get(groupId);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(groupId);
      }
      throw error;
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
    const topThemes = Object.entries(context.sharedThemes)
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
      sharedThemes: {},
      sharedMetrics: {},
      lastUpdate: Date.now(),
      updateCount: 0,
    };

    // Merge all contexts
    for (const context of contexts) {
      // Merge insights
      mergedContext.sharedInsights.push(...context.sharedInsights);

      // Merge themes
      for (const [theme, weight] of Object.entries(context.sharedThemes)) {
        const currentWeight = mergedContext.sharedThemes[theme] || 0;
        mergedContext.sharedThemes[theme] = currentWeight + weight;
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
  async clearContext(groupId: string): Promise<void> {
    // Wait for any pending operations
    await this.withLock(groupId, () => {
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
      this.activeGroups.delete(groupId);

      // Remove all listeners for this group
      this.removeAllListeners(`update:${groupId}`);
      this.removeAllListeners(`batch:${groupId}`);
    });

    // Clean up lock references
    this.updateLocks.delete(groupId);
    this.lockQueues.delete(groupId);
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
      totalThemes += Object.keys(context.sharedThemes).length;
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
   * Clean up resources for inactive groups
   */
  async cleanupInactiveGroups(activeGroupIds: Set<string>): Promise<void> {
    // Find groups that are no longer active
    const cleanupPromises: Promise<void>[] = [];
    for (const groupId of this.activeGroups) {
      if (!activeGroupIds.has(groupId)) {
        cleanupPromises.push(this.clearContext(groupId));
      }
    }
    await Promise.all(cleanupPromises);
  }

  /**
   * Clear all contexts
   */
  async clear(): Promise<void> {
    // Wait for all pending operations to complete
    const pendingOps = Array.from(this.updateLocks.values());
    await Promise.all(pendingOps);

    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    // Clear all data
    this.sharedContexts.clear();
    this.updateQueues.clear();
    this.updateStrategies.clear();
    this.batchTimers.clear();
    this.activeGroups.clear();
    this.updateLocks.clear();
    this.lockQueues.clear();

    // Remove all listeners
    this.removeAllListeners();
  }

  /**
   * Execute a function with a lock on a specific group
   *
   * Implements a promise-based locking mechanism to ensure atomic operations
   * for concurrent updates. Each group has its own lock queue, allowing
   * parallel operations on different groups while serializing operations
   * within a group.
   *
   * @param groupId - The group ID to lock
   * @param fn - The function to execute atomically
   * @returns Promise resolving to the function's return value
   *
   * @example
   * // Ensures theme updates are atomic
   * await this.withLock(groupId, () => {
   *   const current = context.sharedThemes[theme] || 0;
   *   context.sharedThemes[theme] = current + delta;
   * });
   *
   * Algorithm:
   * 1. Get current lock promise for the group (or create if none)
   * 2. Create new lock promise that will be resolved when operation completes
   * 3. Chain operation after current lock resolves
   * 4. Update lock map to new promise for subsequent operations
   * 5. Clean up lock if it's the last operation
   *
   * Thread-safety:
   * - JavaScript's single-threaded nature ensures atomicity at promise level
   * - Operations are queued and executed sequentially per group
   * - Lock cleanup prevents memory leaks from completed operations
   */
  private async withLock<T>(groupId: string, fn: () => T | Promise<T>): Promise<T> {
    // Get or create lock promise
    const currentLock = this.updateLocks.get(groupId) || Promise.resolve();

    // Create new lock promise
    let releaseLock: () => void;
    const newLock = new Promise<void>(resolve => {
      releaseLock = resolve;
    });

    // Chain operation after current lock
    const operation = currentLock
      .then(() => fn())
      .finally(() => {
        // Release lock when done
        releaseLock();

        // Clean up if this was the last operation
        if (this.updateLocks.get(groupId) === newLock) {
          this.updateLocks.delete(groupId);
        }
      });

    // Set new lock
    this.updateLocks.set(groupId, newLock);

    return operation;
  }

  /**
   * Perform atomic theme weight update
   * Ensures thread-safe increment operations
   */
  async atomicThemeUpdate(groupId: string, theme: string, weightDelta: number): Promise<void> {
    await this.withLock(groupId, () => {
      const context = this.sharedContexts.get(groupId);
      if (!context) return;

      const currentWeight = context.sharedThemes[theme] || 0;
      context.sharedThemes[theme] = currentWeight + weightDelta;

      // Apply theme limit if needed
      if (Object.keys(context.sharedThemes).length > this.config.maxThemes) {
        const sortedThemes = Object.entries(context.sharedThemes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, this.config.maxThemes);
        context.sharedThemes = Object.fromEntries(sortedThemes);
      }

      context.lastUpdate = Date.now();
    });
  }

  /**
   * Perform atomic metric update
   * Ensures thread-safe metric operations
   */
  async atomicMetricUpdate(groupId: string, metricName: string, value: number): Promise<void> {
    await this.withLock(groupId, () => {
      const context = this.sharedContexts.get(groupId);
      if (!context) return;

      context.sharedMetrics[metricName] = value;
      context.lastUpdate = Date.now();
    });
  }

  /**
   * Perform atomic increment of a metric
   */
  async atomicMetricIncrement(
    groupId: string,
    metricName: string,
    delta: number = 1
  ): Promise<void> {
    await this.withLock(groupId, () => {
      const context = this.sharedContexts.get(groupId);
      if (!context) return;

      const currentValue = context.sharedMetrics[metricName] || 0;
      context.sharedMetrics[metricName] = currentValue + delta;
      context.lastUpdate = Date.now();
    });
  }
}
