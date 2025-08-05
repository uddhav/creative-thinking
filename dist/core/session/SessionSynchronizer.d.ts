/**
 * SessionSynchronizer - Manages shared context between parallel sessions
 * Provides real-time updates and synchronization for parallel execution
 */
import { EventEmitter } from 'events';
import type { SharedContext, ContextUpdate, ContextUpdateData, Subscription } from '../../types/parallel-session.js';
import type { SessionSynchronizerConfig } from '../../types/parallel-config.js';
/**
 * Update strategy for shared context
 */
type UpdateStrategy = 'immediate' | 'batched' | 'checkpoint';
/**
 * Manages shared context and synchronization between parallel sessions
 */
export declare class SessionSynchronizer extends EventEmitter {
    private sharedContexts;
    private updateQueues;
    private batchTimers;
    private updateStrategies;
    private activeGroups;
    private updateLocks;
    private lockQueues;
    private config;
    constructor(config?: Partial<SessionSynchronizerConfig>);
    /**
     * Initialize shared context for a group
     */
    initializeSharedContext(groupId: string, strategy?: UpdateStrategy): void;
    /**
     * Update shared context for a group
     */
    updateSharedContext(sessionId: string, groupId: string, update: ContextUpdateData): Promise<void>;
    /**
     * Get shared context for a group
     */
    getSharedContext(groupId: string): SharedContext | undefined;
    /**
     * Subscribe to context updates for a group
     */
    subscribeToUpdates(groupId: string, callback: (update: ContextUpdate) => void): Subscription;
    /**
     * Get update strategy for a group
     */
    private getUpdateStrategy;
    /**
     * Apply immediate update to context
     */
    private applyImmediateUpdate;
    /**
     * Queue update for batched processing
     */
    private queueBatchedUpdate;
    /**
     * Queue update for checkpoint processing
     */
    private queueCheckpointUpdate;
    /**
     * Process batched updates
     */
    private processBatch;
    /**
     * Process checkpoint for a group
     */
    processCheckpoint(groupId: string): void;
    /**
     * Emit update event
     */
    private emitUpdate;
    /**
     * Get context summary for a group
     */
    getContextSummary(groupId: string): {
        insightCount: number;
        topThemes: Array<{
            theme: string;
            weight: number;
        }>;
        metrics: Record<string, number>;
        lastUpdate: number;
        updateCount: number;
    } | undefined;
    /**
     * Merge contexts from multiple groups (for hierarchical parallelism)
     */
    mergeContexts(groupIds: string[]): SharedContext | undefined;
    /**
     * Clear context for a group
     */
    clearContext(groupId: string): Promise<void>;
    /**
     * Get statistics about synchronization
     */
    getStats(): {
        totalGroups: number;
        totalInsights: number;
        totalThemes: number;
        averageUpdatesPerGroup: number;
        strategyDistribution: Record<UpdateStrategy, number>;
    };
    /**
     * Clean up resources for inactive groups
     */
    cleanupInactiveGroups(activeGroupIds: Set<string>): Promise<void>;
    /**
     * Clear all contexts
     */
    clear(): Promise<void>;
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
    private withLock;
    /**
     * Perform atomic theme weight update
     * Ensures thread-safe increment operations
     */
    atomicThemeUpdate(groupId: string, theme: string, weightDelta: number): Promise<void>;
    /**
     * Perform atomic metric update
     * Ensures thread-safe metric operations
     */
    atomicMetricUpdate(groupId: string, metricName: string, value: number): Promise<void>;
    /**
     * Perform atomic increment of a metric
     */
    atomicMetricIncrement(groupId: string, metricName: string, delta?: number): Promise<void>;
}
export {};
//# sourceMappingURL=SessionSynchronizer.d.ts.map