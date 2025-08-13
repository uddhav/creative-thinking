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
    lastConstraintUpdate: number;
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
     * Track a step execution and assess reflexivity
     */
    trackStep(sessionId: string, technique: string, step: number, stepType: StepType, actionDescription: string, reflexiveEffects?: ReflexiveEffects): ActionRecord;
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
}
//# sourceMappingURL=ReflexivityTracker.d.ts.map