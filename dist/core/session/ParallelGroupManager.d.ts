/**
 * ParallelGroupManager - Manages the lifecycle of parallel session groups
 * Handles group creation, status tracking, and completion management
 */
import type { SessionData } from '../../types/index.js';
import type { ParallelSessionGroup, ParallelExecutionResult } from '../../types/parallel-session.js';
import type { ParallelPlan, ConvergenceOptions } from '../../types/planning.js';
import type { SessionIndex } from './SessionIndex.js';
/**
 * Manages parallel session groups and their lifecycle
 */
export declare class ParallelGroupManager {
    private parallelGroups;
    private sessionIndex;
    constructor(sessionIndex: SessionIndex);
    /**
     * Create a new parallel session group
     */
    createParallelSessionGroup(problem: string, plans: ParallelPlan[], convergenceOptions?: ConvergenceOptions, sessions?: Map<string, SessionData>): {
        groupId: string;
        sessionIds: string[];
    };
    /**
     * Create a parallel session from a plan
     */
    private createParallelSession;
    /**
     * Mark a session as complete
     */
    markSessionComplete(sessionId: string, sessions: Map<string, SessionData>): void;
    /**
     * Check if dependent sessions can now start
     */
    private checkAndEnableDependentSessions;
    /**
     * Handle group completion
     */
    private handleGroupCompletion;
    /**
     * Get parallel results for a group
     */
    getParallelResults(groupId: string, sessions: Map<string, SessionData>): ParallelExecutionResult[];
    /**
     * Extract result from a session
     */
    private extractSessionResult;
    /**
     * Get a parallel group by ID
     */
    getGroup(groupId: string): ParallelSessionGroup | undefined;
    /**
     * Update group status
     */
    updateGroupStatus(groupId: string, status: ParallelSessionGroup['status']): void;
    /**
     * Check if a session can start based on dependencies
     */
    canSessionStart(sessionId: string, groupId: string): boolean;
    /**
     * Get all active groups
     */
    getActiveGroups(): ParallelSessionGroup[];
    /**
     * Clean up completed groups older than TTL
     */
    cleanupOldGroups(ttlMs: number): number;
    /**
     * Extract unique techniques from plans
     */
    private extractUniqueTechniques;
    /**
     * Estimate group completion time
     */
    private estimateGroupCompletion;
    /**
     * Get statistics about parallel groups
     */
    getStats(): {
        totalGroups: number;
        activeGroups: number;
        completedGroups: number;
        failedGroups: number;
        averageSessionsPerGroup: number;
        averageCompletionTime: number;
    };
    /**
     * Clear all groups
     */
    clear(): void;
}
//# sourceMappingURL=ParallelGroupManager.d.ts.map