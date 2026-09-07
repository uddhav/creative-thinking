/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import type { SessionData, LateralTechnique } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import type { SessionState } from '../persistence/types.js';
import { SessionCleaner } from './session/SessionCleaner.js';
import { type SkipDetectionResult, type SkipPattern } from './session/SkipDetector.js';
import { type SessionLock } from './session/SessionLock.js';
import { ReflexivityTracker } from './ReflexivityTracker.js';
import type { ConstraintProvenance, ReflexivityWarning } from './ReflexivityTracker.js';
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
    /** The construction-time retention sweep; resolves to the count removed. */
    readonly startupSweep: Promise<number>;
    /**
     * PERSISTENCE_TTL_DAYS, parsed once: a whole number of days, minimum 1.
     * Unset, empty, 0, negative, fractional or NaN all mean never delete, which
     * is the documented promise that plans and sessions survive month-long
     * gaps. A set-but-invalid value is said once on stderr rather than silently
     * meaning never.
     */
    private readonly persistenceTtlDays;
    private static parseTtlDays;
    /**
     * Delete persisted sessions and plans older than PERSISTENCE_TTL_DAYS.
     * Fire-and-forget from the constructor and the cleaner tick; never from the
     * memory-pressure path. Returns the count so tests can observe it.
     */
    sweepPersistence(): Promise<number>;
    /** The cleaner, for tests that drive the memory-pressure path directly. */
    getSessionCleaner(): SessionCleaner;
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
     * Delete a session
     */
    deleteSession(sessionId: string): boolean;
    /**
     * List all sessions
     */
    listSessions(): Array<[string, SessionData]>;
    savePlan(planId: string, plan: PlanThinkingSessionOutput): void;
    storePlan(planId: string, plan: PlanThinkingSessionOutput): void;
    /**
     * Look a plan up, falling back to the persistence adapter for one this
     * process did not issue.
     *
     * The fallback lives here rather than at the call sites because there are
     * three of them and they need different things: `WorkflowGuard` treats a
     * found plan as proof that discovery ran, `ExecutionValidator` needs the
     * workflow, `index.ts` needs the problem text. Hydrating in only one of them
     * fixes execution and still refuses the call at the guard (#316).
     *
     * Async since plans went through the adapter (#358): one Map lookup when
     * the plan is in memory, which is the normal case, one adapter read on a
     * miss. Runs outside the session lock; two concurrent misses both load the
     * same immutable record, which is two reads and no corruption.
     */
    getPlan(planId: string): Promise<PlanThinkingSessionOutput | undefined>;
    /**
     * The in-memory plan only, no adapter fallback. For the writer that has
     * just registered the plan and for tests of the cache itself. This is the
     * accessor `persistPlan` must use: reading through the async `getPlan`
     * there would hand `JSON.stringify` a Promise and write `{}` to every plan.
     */
    getInMemoryPlan(planId: string): PlanThinkingSessionOutput | undefined;
    savePlanToPersistence(planId: string, plan: PlanThinkingSessionOutput): Promise<void>;
    loadPlanFromPersistence(planId: string): Promise<PlanThinkingSessionOutput | null>;
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
    /**
     * Whether an adapter is configured, read only after initialisation has
     * settled. `getPersistenceAdapter` answers from whatever state init has
     * reached, which for a session operation issued right after start was
     * "none yet": a confirmed delete reported "nothing was deleted" while the
     * file was in fact gone.
     */
    persistenceReady(): Promise<boolean>;
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
     * Track reflexivity for a step execution. Returns the edge-triggered
     * warning (if this step produced one) so the execution layer can emit it
     * once — to stderr and into the response — instead of two call sites
     * recomputing it at different points in the step.
     */
    trackReflexivity(sessionId: string, technique: string, stepNumber: number, stepType?: 'thinking' | 'action', reflexiveEffects?: ReflexiveEffects, provenance?: ConstraintProvenance, callerConstraints?: string[]): ReflexivityWarning | null;
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