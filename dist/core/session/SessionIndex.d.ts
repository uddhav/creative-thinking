/**
 * SessionIndex - Provides fast lookups for sessions and their relationships
 */
import type { LateralTechnique } from '../../types/index.js';
import type { SessionData } from '../../types/index.js';
/**
 * Manages indexes for fast session lookups
 */
export declare class SessionIndex {
    private techniqueToSessions;
    private sessionStatus;
    /**
     * Index an individual session
     */
    indexSession(sessionId: string, session: SessionData): void;
    /**
     * Get all sessions using a specific technique
     */
    getSessionsByTechnique(technique: LateralTechnique): string[];
    /**
     * Update session status
     */
    updateSessionStatus(sessionId: string, status: 'pending' | 'running' | 'completed' | 'failed'): void;
    /**
     * Get session status
     */
    getSessionStatus(sessionId: string): 'pending' | 'running' | 'completed' | 'failed' | undefined;
    /**
     * Get all sessions with a specific status
     */
    getSessionsByStatus(status: 'pending' | 'running' | 'completed' | 'failed'): string[];
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
        totalSessions: number;
        techniqueDistribution: Record<LateralTechnique, number>;
        statusDistribution: Record<string, number>;
    };
}
//# sourceMappingURL=SessionIndex.d.ts.map