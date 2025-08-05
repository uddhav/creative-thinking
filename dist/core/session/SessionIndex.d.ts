/**
 * SessionIndex - Provides fast lookups for sessions and their relationships
 * Maintains multiple indexes for efficient querying of parallel sessions
 */
import type { LateralTechnique } from '../../types/index.js';
import type { SessionData } from '../../types/index.js';
import type { ParallelSessionGroup, IndexEntry } from '../../types/parallel-session.js';
/**
 * Manages indexes for fast session lookups and dependency tracking
 */
export declare class SessionIndex {
    private groupToSessions;
    private sessionToGroup;
    private techniqueToSessions;
    private dependencyGraph;
    private reverseDependencyGraph;
    private sessionStatus;
    /**
     * Index a parallel group and its sessions
     */
    indexGroup(group: ParallelSessionGroup): void;
    /**
     * Index an individual session
     */
    indexSession(sessionId: string, session: SessionData): void;
    /**
     * Add dependencies between sessions
     */
    addDependencies(sessionId: string, dependencies: string[]): void;
    /**
     * Get all sessions that depend on a given session
     */
    getDependentSessions(sessionId: string): string[];
    /**
     * Get all dependencies of a session
     */
    getDependencies(sessionId: string): string[];
    /**
     * Check if a session can start based on completed dependencies
     */
    canSessionStart(sessionId: string, completedSessions: Set<string>): boolean;
    /**
     * Get all sessions in a group
     */
    getSessionsInGroup(groupId: string): string[];
    /**
     * Get the group ID for a session
     */
    getGroupForSession(sessionId: string): string | undefined;
    /**
     * Get all sessions using a specific technique
     */
    getSessionsByTechnique(technique: LateralTechnique): string[];
    /**
     * Update session status
     */
    updateSessionStatus(sessionId: string, status: IndexEntry['status']): void;
    /**
     * Get session status
     */
    getSessionStatus(sessionId: string): IndexEntry['status'] | undefined;
    /**
     * Get all sessions with a specific status
     */
    getSessionsByStatus(status: IndexEntry['status']): string[];
    /**
     * Check for circular dependencies
     * @returns Array of session IDs involved in cycles, empty if no cycles
     */
    detectCircularDependencies(): string[][];
    /**
     * Get topological order of sessions (respecting dependencies)
     * @returns Array of session IDs in execution order, or null if cycles exist
     */
    getTopologicalOrder(sessionIds: string[]): string[] | null;
    /**
     * Remove a session from all indexes
     */
    removeSession(sessionId: string): void;
    /**
     * Clear all indexes
     */
    clear(): void;
    /**
     * Get index statistics
     */
    getStats(): {
        totalGroups: number;
        totalSessions: number;
        totalDependencies: number;
        techniqueDistribution: Record<LateralTechnique, number>;
        statusDistribution: Record<string, number>;
    };
}
//# sourceMappingURL=SessionIndex.d.ts.map