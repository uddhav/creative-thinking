/**
 * SessionSynchronizer - Manages shared context between parallel sessions
 * Provides real-time updates and synchronization for parallel execution
 */
import { EventEmitter } from 'events';
import { DEFAULT_SYNCHRONIZER_CONFIG, mergeConfig } from '../../types/parallel-config.js';
/**
 * Manages shared context and synchronization between parallel sessions
 */
export class SessionSynchronizer extends EventEmitter {
    sharedContexts = new Map();
    updateQueues = new Map();
    batchTimers = new Map();
    updateStrategies = new Map();
    // Track active groups for cleanup
    activeGroups = new Set();
    // Atomic operation locks for concurrent access
    updateLocks = new Map();
    lockQueues = new Map();
    config;
    constructor(config) {
        super();
        this.config = mergeConfig(config, DEFAULT_SYNCHRONIZER_CONFIG);
    }
    /**
     * Initialize shared context for a group
     */
    initializeSharedContext(groupId, strategy = 'immediate') {
        // Clean up any existing group first
        if (this.activeGroups.has(groupId)) {
            // Note: clearContext is async but we're calling it sync for initialization
            // This is safe because we're only doing cleanup
            void this.clearContext(groupId);
        }
        const context = {
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
        console.error(`[SessionSynchronizer] Initialized shared context for group ${groupId} with ${strategy} strategy`);
    }
    /**
     * Update shared context for a group
     */
    async updateSharedContext(sessionId, groupId, update) {
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
        }
        else {
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
    getSharedContext(groupId) {
        return this.sharedContexts.get(groupId);
    }
    /**
     * Subscribe to context updates for a group
     */
    subscribeToUpdates(groupId, callback) {
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
    getUpdateStrategy(groupId) {
        return this.updateStrategies.get(groupId) || 'immediate';
    }
    /**
     * Apply immediate update to context
     */
    applyImmediateUpdate(context, update) {
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
    queueBatchedUpdate(groupId, update) {
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
                    }
                    catch (error) {
                        console.error(`[SessionSynchronizer] Error processing batch for group ${groupId}:`, error);
                    }
                    finally {
                        // Always remove timer reference after execution
                        this.batchTimers.delete(groupId);
                    }
                }, this.config.batchIntervalMs);
                this.batchTimers.set(groupId, timer);
            }
        }
        catch (error) {
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
    queueCheckpointUpdate(groupId, update) {
        // Similar to batched, but only processes at explicit checkpoints
        const queue = this.updateQueues.get(groupId) || [];
        queue.push(update);
        this.updateQueues.set(groupId, queue);
    }
    /**
     * Process batched updates
     */
    processBatch(groupId) {
        const queue = this.updateQueues.get(groupId);
        const context = this.sharedContexts.get(groupId);
        if (!queue || !context || queue.length === 0)
            return;
        // Clear timer
        const timer = this.batchTimers.get(groupId);
        if (timer) {
            clearTimeout(timer);
            this.batchTimers.delete(groupId);
        }
        // Merge all updates in the batch
        const mergedUpdate = {
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
    processCheckpoint(groupId) {
        const strategy = this.getUpdateStrategy(groupId);
        if (strategy !== 'checkpoint')
            return;
        this.processBatch(groupId);
    }
    /**
     * Emit update event
     */
    emitUpdate(groupId, sessionId, update) {
        const contextUpdate = {
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
    getContextSummary(groupId) {
        const context = this.sharedContexts.get(groupId);
        if (!context)
            return undefined;
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
    mergeContexts(groupIds) {
        if (groupIds.length === 0)
            return undefined;
        const contexts = groupIds
            .map(id => this.sharedContexts.get(id))
            .filter((ctx) => ctx !== undefined);
        if (contexts.length === 0)
            return undefined;
        // Create merged context
        const mergedContext = {
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
    async clearContext(groupId) {
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
    getStats() {
        let totalInsights = 0;
        let totalThemes = 0;
        let totalUpdates = 0;
        const strategyDistribution = {
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
            averageUpdatesPerGroup: this.sharedContexts.size > 0 ? totalUpdates / this.sharedContexts.size : 0,
            strategyDistribution,
        };
    }
    /**
     * Clean up resources for inactive groups
     */
    async cleanupInactiveGroups(activeGroupIds) {
        // Find groups that are no longer active
        const cleanupPromises = [];
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
    async clear() {
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
    async withLock(groupId, fn) {
        // Get or create lock promise
        const currentLock = this.updateLocks.get(groupId) || Promise.resolve();
        // Create new lock promise
        let releaseLock;
        const newLock = new Promise(resolve => {
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
    async atomicThemeUpdate(groupId, theme, weightDelta) {
        await this.withLock(groupId, () => {
            const context = this.sharedContexts.get(groupId);
            if (!context)
                return;
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
    async atomicMetricUpdate(groupId, metricName, value) {
        await this.withLock(groupId, () => {
            const context = this.sharedContexts.get(groupId);
            if (!context)
                return;
            context.sharedMetrics[metricName] = value;
            context.lastUpdate = Date.now();
        });
    }
    /**
     * Perform atomic increment of a metric
     */
    async atomicMetricIncrement(groupId, metricName, delta = 1) {
        await this.withLock(groupId, () => {
            const context = this.sharedContexts.get(groupId);
            if (!context)
                return;
            const currentValue = context.sharedMetrics[metricName] || 0;
            context.sharedMetrics[metricName] = currentValue + delta;
            context.lastUpdate = Date.now();
        });
    }
}
//# sourceMappingURL=SessionSynchronizer.js.map