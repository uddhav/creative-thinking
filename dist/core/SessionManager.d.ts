/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import type { SessionData } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
export interface SessionConfig {
    maxSessions: number;
    maxSessionSize: number;
    sessionTTL: number;
    cleanupInterval: number;
    enableMemoryMonitoring: boolean;
}
export declare class SessionManager {
    private sessions;
    private plans;
    private currentSessionId;
    private cleanupInterval;
    private persistenceAdapter;
    private readonly PLAN_TTL;
    private config;
    constructor();
    private initializePersistence;
    private startSessionCleanup;
    /**
     * Update session activity time
     */
    touchSession(sessionId: string): void;
    private cleanupOldSessions;
    /**
     * Evict oldest sessions using LRU (Least Recently Used) strategy
     */
    private evictOldestSessions;
    /**
     * Log memory usage metrics
     */
    private logMemoryMetrics;
    destroy(): void;
    createSession(sessionData: SessionData): string;
    getSession(sessionId: string): SessionData | undefined;
    updateSession(sessionId: string, data: Partial<SessionData>): void;
    deleteSession(sessionId: string): boolean;
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
        technique?: string;
        status?: string;
    }): Promise<Array<{
        id: string;
        data: SessionData;
    }>>;
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
        totalMemoryBytes: number;
        averageSessionSize: number;
    };
    private convertToSessionState;
    private convertFromSessionState;
}
//# sourceMappingURL=SessionManager.d.ts.map