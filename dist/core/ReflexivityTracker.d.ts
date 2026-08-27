/**
 * Reflexivity Tracker
 * Tracks post-action reflexive effects during creative thinking execution
 */
import type { StepType, ReflexiveEffects } from '../techniques/types.js';
import type { NLPService } from '../nlp/NLPService.js';
/**
 * Represents the state of reality after actions have been taken
 */
export interface RealityState {
    stakeholderExpectations: string[];
    resourceCommitments: string[];
    relationshipDynamics: string[];
    technicalDependencies: string[];
    pathsForeclosed: string[];
    optionsCreated: string[];
    lastModified: number;
    constraintCount: number;
    /**
     * Constraints traceable to caller content (e.g. a declared commitment).
     * Warning thresholds read ONLY this count: every handler-declared
     * reflexiveEffect is server-authored boilerplate, and a threshold fed by
     * boilerplate manufactured a critical warning on every step.
     */
    contentConstraintCount: number;
    /** Constraints from handler-static templates — descriptive, never alarming. */
    templateConstraintCount: number;
    lastConstraintUpdate: number;
}
/** Who authored a constraint: the server's step templates, or the caller. */
export type ConstraintProvenance = 'template' | 'content';
/**
 * Memory statistics for monitoring
 */
export interface MemoryStats {
    sessionCount: number;
    totalActions: number;
    totalConstraints: number;
    estimatedMemoryBytes: number;
    oldestSession: number;
    newestSession: number;
}
/**
 * Warning types for reflexivity tracking
 */
export type ReflexivityWarningType = 'constraint_threshold' | 'path_foreclosed' | 'low_reversibility';
/**
 * Warning levels for severity. Two, not four: the tracker emits 'warning'
 * and the execution layer escalates to 'critical' on a stop-worthy verdict.
 * 'info' and 'caution' were advertised for years and never produced.
 */
export type ReflexivityWarningLevel = 'warning' | 'critical';
/**
 * Reflexivity warning for real-time feedback
 */
export interface ReflexivityWarning {
    level: ReflexivityWarningLevel;
    type: ReflexivityWarningType;
    message: string;
    currentConstraints: number;
    pathsForeclosed: string[];
    suggestions?: string[];
}
/**
 * Represents an action taken and its reflexive impact
 */
export interface ActionRecord {
    sessionId: string;
    technique: string;
    step: number;
    stepType: StepType;
    actionDescription: string;
    timestamp: number;
    reflexiveEffects?: ReflexiveEffects;
    realityChanges: Partial<RealityState>;
}
/**
 * One action, reduced to what a later process cannot recompute cheaply.
 *
 * `reflexiveEffects` and `realityChanges` are dropped: the first is a static
 * handler declaration recoverable from (technique, step), and the second is
 * already folded into the persisted `RealityState`. `reversibility` is the one
 * scalar kept out of the effects, because `getSessionSummary` averages it to
 * report `overallReversibility` — without it every restored session would come
 * back reading 'low', which is a wrong number rather than a missing one.
 */
export interface PersistedActionRecord {
    technique: string;
    step: number;
    stepType: StepType;
    timestamp: number;
    reversibility?: ReflexiveEffects['reversibility'];
}
/**
 * The tracker state that belongs to a session rather than to the process.
 *
 * Both halves matter and they break differently. `realityState` carries
 * `pathsForeclosed`, which is the set a re-declared commitment is deduplicated
 * against, and the three constraint counters the 5/10 warning buckets read.
 * `actionHistory` carries the step tally `getSessionSummary` reports.
 *
 * `realityState` is optional because the two halves do not begin at the same
 * time. `trackStep` records every step it is called for, but only creates a
 * reality state on the first ACTION step carrying effects or a declared
 * constraint — so a session that has run three thinking steps has history and
 * no reality state. Requiring both here made the export return nothing in that
 * window and silently drop the history with it.
 */
export interface PersistedReflexivity {
    realityState?: RealityState;
    actionHistory: PersistedActionRecord[];
}
/**
 * Tracks reflexive effects across a session
 */
export declare class ReflexivityTracker {
    private realityStates;
    private actionHistory;
    private sessionTimestamps;
    private cleanupTimer;
    private nlpService;
    private actionAnalysisCache;
    private readonly cacheTimeout;
    constructor(nlpService: NLPService);
    /**
     * Validate input parameters for security and correctness
     */
    private validateTrackingInput;
    /**
     * Start periodic cleanup of old sessions
     */
    private startCleanupTimer;
    /**
     * Clean up sessions older than TTL
     */
    private cleanupOldSessions;
    /**
     * Stop the cleanup timer
     */
    destroy(): void;
    /**
     * Categorize a change using pattern matching
     */
    private categorizeChange;
    /**
     * Get or initialize reality state for a session
     */
    private getOrInitRealityState;
    /**
     * Track a step execution and assess reflexivity.
     *
     * Returns the record plus an edge-triggered warning, computed here — the
     * one place that knows both the pre-step and post-step state. It used to be
     * a separate `generateWarning(sessionId)` that reported the threshold
     * STATE, so once a session crossed a threshold, an identical "critical"
     * fired on every remaining step; two call sites also read it at different
     * points in the step and could disagree by one step.
     */
    trackStep(sessionId: string, technique: string, step: number, stepType: StepType, actionDescription: string, reflexiveEffects?: ReflexiveEffects, provenance?: ConstraintProvenance, callerConstraints?: string[]): {
        record: ActionRecord;
        warning: ReflexivityWarning | null;
    };
    /**
     * Assess how an action's reflexive effects change reality
     */
    private assessReflexiveImpact;
    /**
     * Update the reality state with changes from an action
     */
    private updateRealityState;
    /**
     * Get current reality state for a session
     */
    getRealityState(sessionId: string): RealityState | undefined;
    /**
     * Get action history for a session
     */
    getActionHistory(sessionId: string): ActionRecord[];
    /**
     * Snapshot a session's tracker state for persistence, or undefined if the
     * session has neither half yet.
     *
     * Gated on EITHER half being present, not on `realityState` alone. That
     * earlier gate discarded `actionHistory` for every step before the first
     * action step — `trackStep` records all of them, but only creates a reality
     * state once a step carries effects or a declared constraint. A five-step
     * session run one process per step came back reporting three tracked steps
     * where one process reports five, and the guard that was meant to catch it
     * asserted only `> 1`, which three satisfies.
     */
    exportSessionState(sessionId: string): PersistedReflexivity | undefined;
    /**
     * Restore a session's tracker state after a restart.
     *
     * Refuses to overwrite state this process has already built. A load can
     * arrive after tracking has begun — the execution layer hydrates a session
     * mid-request — and the in-memory state is then strictly newer than the file.
     * Dropping a stale restore loses nothing; applying it would roll the session
     * back to the last save and re-open commitments the caller has already made.
     */
    importSessionState(sessionId: string, state: PersistedReflexivity | undefined): void;
    /**
     * Bucket index for the content-constraint count: 0 below the warning
     * threshold, 1 up to the caution threshold, then geometric (×1.25) — a
     * stateless encoding of "re-fire only on a material increase".
     */
    private constraintBucket;
    /**
     * Edge-triggered warning: fires when the content-derived constraint count
     * crosses a bucket boundary, or when this step forecloses new paths from
     * caller content — never merely for the count being above a threshold.
     * The tracker emits at most 'warning'; escalation to 'critical' is the
     * execution layer's call, made only when the server holds a stop-worthy
     * verdict (an escape recommendation or a pivot/escape early warning).
     */
    private computeEdgeWarning;
    /**
     * Analyze action with timeout protection
     */
    private analyzeActionWithTimeout;
    /**
     * Local action analysis fallback using patterns
     */
    private localActionAnalysis;
    /**
     * Get reflexivity assessment for future actions using NLP analysis
     */
    assessFutureAction(sessionId: string, proposedAction: string): Promise<{
        currentConstraints: string[];
        likelyEffects: string[];
        reversibilityAssessment: 'high' | 'medium' | 'low';
        recommendation: string;
    }>;
    /**
     * Synchronous version for backward compatibility (uses local NLP only)
     */
    assessFutureActionSync(sessionId: string, proposedAction: string): {
        currentConstraints: string[];
        likelyEffects: string[];
        reversibilityAssessment: 'high' | 'medium' | 'low';
        recommendation: string;
    };
    /**
     * Build assessment from action analysis
     */
    private buildAssessment;
    /**
     * Clean old entries from action analysis cache
     */
    private cleanActionCache;
    /**
     * Lazily iterate over all constraints without creating arrays
     */
    private getConstraintsIterator;
    /**
     * Generate recommendation based on current state
     */
    private generateRecommendation;
    /**
     * Clear data for a session
     */
    clearSession(sessionId: string): void;
    /**
     * Get reflexivity summary for a session
     */
    getSessionSummary(sessionId: string): {
        totalActions: number;
        thinkingSteps: number;
        actionSteps: number;
        currentConstraints: number;
        optionsCreated: number;
        overallReversibility: 'high' | 'medium' | 'low';
    };
    /**
     * Get memory statistics for monitoring
     */
    getMemoryStats(): MemoryStats;
}
//# sourceMappingURL=ReflexivityTracker.d.ts.map