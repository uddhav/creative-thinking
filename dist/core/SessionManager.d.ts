/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import type { SessionData } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import type { SessionState } from '../persistence/types.js';
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
    private config;
    constructor();
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
}
//# sourceMappingURL=SessionManager.d.ts.map