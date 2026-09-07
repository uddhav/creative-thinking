/**
 * SessionCleaner - Handles session cleanup and memory management
 * Extracted from SessionManager to improve maintainability
 */
import type { SessionData } from '../../types/index.js';
import type { SessionConfig } from '../SessionManager.js';
import type { MemoryManager } from '../MemoryManager.js';
import type { PlanManager } from './PlanManager.js';
export declare class SessionCleaner {
    private sessions;
    private planManager;
    private config;
    private memoryManager;
    private touchSession;
    private onTick?;
    private cleanupInterval;
    /**
     * @param onTick runs on every timer tick after the in-memory cleanup, and
     * ONLY on the timer: `cleanupOldSessions` is also called directly under
     * memory pressure, and the disk retention sweep must not fire from there.
     */
    constructor(sessions: Map<string, SessionData>, planManager: PlanManager, config: SessionConfig, memoryManager: MemoryManager, touchSession: (sessionId: string) => void, onTick?: (() => void) | undefined);
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