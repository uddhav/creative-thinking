/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import type { SessionData, LateralTechnique } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import type { SessionState } from '../persistence/types.js';
import { type SkipDetectionResult, type SkipPattern } from './session/SkipDetector.js';
import { type SessionLock } from './session/SessionLock.js';
import { ReflexivityTracker } from './ReflexivityTracker.js';
import type { ReflexiveEffects } from '../techniques/types.js';
import type { SamplingManager } from '../sampling/SamplingManager.js';
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
    private sessionLock;
    private reflexivityTracker;
    private nlpService;
    private telemetry;
    private sessionCleaner;
    private sessionPersistence;
    private sessionMetrics;
    private planManager;
    private skipDetector;
    private sessionIndex;
    private static readonly MAX_RECOMMENDATION_ENTRIES;
    private lastRecommendations;
    private config;
    constructor(samplingManager?: SamplingManager);
    /**
     * Lazy initialization for parallel execution components
     */
    private getSessionIndex;
    /**
     * Update session activity time
     */
    touchSession(sessionId: string): Promise<void>;
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
    updateSession(sessionId: string, data: Partial<SessionData>): Promise<void>;
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
    /**
     * Get reflexivity-specific memory statistics
     * Provides type-safe access to reflexivity tracker's memory stats
     */
    getReflexivityMemoryStats(): {
        estimatedMemoryBytes: number;
        sessionCount: number;
        totalActions: number;
        totalConstraints: number;
    };
    logMemoryMetrics(): void;
    /**
     * Create a parallel session group from plans
     */
    /**
     * Mark a session as complete
     */
    markSessionComplete(sessionId: string): void;
    /**
     * Get all sessions (simplified replacement for group functionality)
     */
    getAllSessions(): Map<string, SessionData>;
    /**
     * Get sessions by technique
     */
    getSessionsByTechnique(technique: SessionData['technique']): SessionData[];
    /**
     * Get simplified session statistics
     */
    getSessionStats(): {
        totalSessions: number;
        completedSessions: number;
        activeSessions: number;
    };
    /**
     * Analyze skip patterns for a specific session
     */
    analyzeSessionSkipPatterns(sessionId: string): SkipDetectionResult | null;
    /**
     * Analyze skip patterns across all sessions for a user
     */
    analyzeUserSkipPatterns(limit?: number): {
        consistentPatterns: SkipPattern[];
        problematicTechniques: LateralTechnique[];
        overallSkipRate: number;
        improvementTrend: 'improving' | 'declining' | 'stable';
    };
    /**
     * Get skip pattern recommendations for current session
     */
    getSkipPatternRecommendations(sessionId: string): string[];
    /**
     * Check if session has concerning skip patterns
     */
    hasHighRiskSkipPatterns(sessionId: string): boolean;
    /**
     * Get the session lock instance for external use
     */
    getSessionLock(): SessionLock;
    /**
     * Get reflexivity data for a session
     */
    getSessionReflexivity(sessionId: string): {
        realityState: ReturnType<ReflexivityTracker['getRealityState']>;
        actionHistory: ReturnType<ReflexivityTracker['getActionHistory']>;
        summary: ReturnType<ReflexivityTracker['getSessionSummary']>;
    } | null;
    /**
     * Track reflexivity for a step execution
     */
    trackReflexivity(sessionId: string, technique: string, stepNumber: number, stepType?: 'thinking' | 'action', reflexiveEffects?: ReflexiveEffects): void;
    /**
     * Store recommendations for a session (for later comparison with selected techniques)
     */
    setLastRecommendations(problemOrSessionId: string, recommendations: LateralTechnique[]): void;
    /**
     * Get stored recommendations for a session
     */
    getLastRecommendations(problemOrSessionId: string): LateralTechnique[] | undefined;
    /**
     * Clear stored recommendations for a session
     */
    clearLastRecommendations(problemOrSessionId: string): void;
}
//# sourceMappingURL=SessionManager.d.ts.map