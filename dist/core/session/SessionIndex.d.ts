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
     * Check for circular dependencies using Depth-First Search (DFS)
     *
     * Detects all cycles in the dependency graph using a modified DFS algorithm
     * with recursion stack tracking. This is critical for preventing deadlocks
     * in parallel execution.
     *
     * @returns Array of cycles, where each cycle is an array of session IDs
     *
     * @example
     * // Given dependencies: A -> B -> C -> A
     * const cycles = index.detectCircularDependencies();
     * // Returns: [['A', 'B', 'C']]
     *
     * Algorithm:
     * - Uses DFS with three states: unvisited, visiting (in recursion stack), visited
     * - Time complexity: O(V + E) where V is sessions, E is dependencies
     * - Space complexity: O(V) for visited sets and recursion stack
     */
    detectCircularDependencies(): string[][];
    /**
     * Get topologically sorted order of sessions using Kahn's algorithm
     *
     * Performs a topological sort on the dependency graph to determine a valid
     * execution order that respects all dependencies. This is essential for
     * parallel execution planning.
     *
     * @param sessionIds - List of session IDs to sort
     * @returns Array of session IDs in valid execution order, or null if circular dependency exists
     *
     * @example
     * // With dependencies: A -> B -> C, D -> C
     * const order = index.getTopologicalOrder(['A', 'B', 'C', 'D']);
     * // Returns: ['A', 'D', 'B', 'C'] or ['D', 'A', 'B', 'C']
     *
     * Algorithm (Kahn's algorithm):
     * 1. Calculate in-degree (number of dependencies) for each session
     * 2. Start with sessions that have no dependencies (in-degree = 0)
     * 3. Process each session, reducing in-degree of dependent sessions
     * 4. Add sessions to result as their in-degree reaches 0
     *
     * Complexity:
     * - Time: O(V + E) where V is number of sessions, E is number of dependencies
     * - Space: O(V) for in-degree map and queue
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