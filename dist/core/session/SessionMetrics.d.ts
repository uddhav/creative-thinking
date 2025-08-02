/**
 * SessionMetrics - Handles session metrics and memory statistics
 * Extracted from SessionManager to improve maintainability
 */
import type { SessionData } from '../../types/index.js';
import type { SessionConfig } from '../SessionManager.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
export interface MemoryStats {
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
}
export declare class SessionMetrics {
    private sessions;
    private plans;
    private config;
    constructor(sessions: Map<string, SessionData>, plans: Map<string, PlanThinkingSessionOutput>, config: SessionConfig);
    /**
     * Get the number of active sessions
     */
    getSessionCount(): number;
    /**
     * Get the number of stored plans
     */
    getPlanCount(): number;
    /**
     * Calculate the size of a specific session
     */
    getSessionSize(sessionId: string): number;
    /**
     * Get total memory usage across all sessions
     */
    getTotalMemoryUsage(): number;
    /**
     * Get comprehensive memory statistics
     */
    getMemoryStats(): MemoryStats;
    /**
     * Get session configuration
     */
    getConfig(): SessionConfig;
    /**
     * Calculate approximate size of a session in bytes
     */
    private calculateSessionSize;
    /**
     * Check if session size exceeds configured limit
     */
    isSessionTooLarge(sessionId: string): boolean;
    /**
     * Get sessions sorted by size (largest first)
     */
    getSessionsBySize(): Array<{
        sessionId: string;
        size: number;
    }>;
    /**
     * Get sessions sorted by age (oldest first)
     */
    getSessionsByAge(): Array<{
        sessionId: string;
        age: number;
    }>;
    /**
     * Check if memory pressure is high
     */
    isMemoryPressureHigh(): boolean;
}
//# sourceMappingURL=SessionMetrics.d.ts.map