/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import type { SessionData } from '../types/index.js';
import type { PlanThinkingSessionOutput, ParallelPlan, ConvergenceOptions } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import type { SessionState } from '../persistence/types.js';
import type { ParallelSessionGroup, ParallelExecutionResult } from '../types/parallel-session.js';
export interface SessionConfig {
    maxSessions: number;
    maxSessionSize: number;
    sessionTTL: number;
    cleanupInterval: number;
    enableMemoryMonitoring: boolean;
}
export declare class SessionManager {
    private sessions;
    private currentSessionId;
    private memoryManager;
    private sessionCleaner;
    private sessionPersistence;
    private sessionMetrics;
    private planManager;
    private sessionIndex;
    private parallelGroupManager;
    private config;
    constructor();
    /**
     * Lazy initialization for parallel execution components
     */
    private getSessionIndex;
    private getParallelGroupManager;
    /**
     * Set the parallel execution context for metrics and monitoring
     */
    setParallelContext(context: unknown): void;
    /**
     * Update session activity time
     */
    touchSession(sessionId: string): void;
    /**
     * Clean up resources on shutdown
     */
    destroy(): void;
    /**
     * Exposed for testing - triggers cleanup manually
     */
    cleanupOldSessions(): void;
    /**
     * Create a new session
     */
    createSession(sessionData: SessionData, providedSessionId?: string): string;
    /**
     * Validate session ID format
     */
    private isValidSessionId;
    /**
     * Get a session by ID
     */
    getSession(sessionId: string): SessionData | undefined;
    /**
     * Update session data
     */
    updateSession(sessionId: string, data: Partial<SessionData>): void;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean;
    /**
     * List all sessions
     */
    listSessions(): Array<[string, SessionData]>;
    savePlan(planId: string, plan: PlanThinkingSessionOutput): void;
    storePlan(planId: string, plan: PlanThinkingSessionOutput): void;
    getPlan(planId: string): PlanThinkingSessionOutput | undefined;
    deletePlan(planId: string): boolean;
    getCurrentSessionId(): string | null;
    setCurrentSessionId(sessionId: string | null): void;
    setCurrentSession(sessionId: string): void;
    saveSessionToPersistence(sessionId: string): Promise<void>;
    loadSessionFromPersistence(sessionId: string): Promise<SessionData>;
    listPersistedSessions(options?: {
        limit?: number;
        offset?: number;
        sortBy?: 'created' | 'updated' | 'name' | 'technique';
        order?: 'asc' | 'desc';
    }): Promise<SessionState[]>;
    deletePersistedSession(sessionId: string): Promise<void>;
    getPersistenceAdapter(): PersistenceAdapter | null;
    getSessionSize(sessionId: string): number;
    getTotalMemoryUsage(): number;
    getConfig(): SessionConfig;
    getSessionCount(): number;
    getPlanCount(): number;
    getMemoryStats(): {
        sessionCount: number;
        planCount: number;
        totalMemoryUsage: number;
        averageSessionSize: number;
        largestSessionSize: number;
        memoryUsageBySession: Map<string, number>;
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    logMemoryMetrics(): void;
    /**
     * Create a parallel session group from plans
     */
    createParallelSessionGroup(problem: string, plans: ParallelPlan[], convergenceOptions?: ConvergenceOptions): string;
    /**
     * Get parallel results for a group
     */
    getParallelResults(groupId: string): Promise<ParallelExecutionResult[]>;
    /**
     * Mark a session as complete (handles parallel dependencies)
     */
    markSessionComplete(sessionId: string): void;
    /**
     * Check if a session can start based on dependencies
     */
    canSessionStart(sessionId: string): boolean;
    /**
     * Get parallel group information
     */
    getParallelGroup(groupId: string): ParallelSessionGroup | undefined;
    /**
     * Get all active parallel groups
     */
    getActiveParallelGroups(): ParallelSessionGroup[];
    /**
     * Update parallel group status
     */
    updateParallelGroupStatus(groupId: string, status: ParallelSessionGroup['status']): void;
    /**
     * Get sessions in a parallel group
     */
    getSessionsInGroup(groupId: string): SessionData[];
    /**
     * Get sessions by technique
     */
    getSessionsByTechnique(technique: SessionData['technique']): SessionData[];
    /**
     * Detect circular dependencies
     */
    detectCircularDependencies(): string[][];
    /**
     * Get dependency statistics
     */
    getDependencyStats(): {
        totalDependencies: number;
        circularDependencies: string[][];
        orphanedSessions: string[];
    };
    /**
     * Clean up old parallel groups
     */
    cleanupOldParallelGroups(): number;
}
//# sourceMappingURL=SessionManager.d.ts.map