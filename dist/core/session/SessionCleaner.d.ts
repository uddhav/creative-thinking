/**
 * SessionCleaner - Handles session cleanup and memory management
 * Extracted from SessionManager to improve maintainability
 */
import type { SessionData } from '../../types/index.js';
import type { SessionConfig } from '../SessionManager.js';
import type { MemoryManager } from '../MemoryManager.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
export declare class SessionCleaner {
    private sessions;
    private plans;
    private config;
    private memoryManager;
    private touchSession;
    private cleanupInterval;
    private readonly PLAN_TTL;
    constructor(sessions: Map<string, SessionData>, plans: Map<string, PlanThinkingSessionOutput>, config: SessionConfig, memoryManager: MemoryManager, touchSession: (sessionId: string) => void);
    /**
     * Start the session cleanup interval
     */
    startCleanup(): void;
    /**
     * Stop the cleanup interval
     */
    stopCleanup(): void;
    /**
     * Clean up old sessions based on TTL and memory constraints
     */
    cleanupOldSessions(): void;
    /**
     * Evict oldest sessions when memory pressure is high
     */
    private evictOldestSessions;
    /**
     * Log memory metrics for monitoring
     */
    logMemoryMetrics(): void;
    /**
     * Calculate approximate size of a session in bytes
     */
    private calculateSessionSize;
    /**
     * Get session size for a specific session
     */
    getSessionSize(sessionId: string): number;
    /**
     * Get total memory usage across all sessions
     */
    getTotalMemoryUsage(): number;
}
//# sourceMappingURL=SessionCleaner.d.ts.map