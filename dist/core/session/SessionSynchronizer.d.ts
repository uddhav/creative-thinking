/**
 * SessionSynchronizer - Manages shared context between parallel sessions
 * Provides real-time updates and synchronization for parallel execution
 */
import { EventEmitter } from 'events';
import type { SharedContext, ContextUpdate, ContextUpdateData, Subscription } from '../../types/parallel-session.js';
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
    private readonly defaultBatchConfig;
    /**
     * Initialize shared context for a group
     */
    initializeSharedContext(groupId: string, strategy?: UpdateStrategy): void;
    /**
     * Update shared context for a group
     */
    updateSharedContext(sessionId: string, groupId: string, update: ContextUpdateData): void;
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
    clearContext(groupId: string): void;
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
     * Clear all contexts
     */
    clear(): void;
}
export {};
//# sourceMappingURL=SessionSynchronizer.d.ts.map