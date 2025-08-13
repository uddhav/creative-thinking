/**
 * Reflexivity Tracker
 * Tracks post-action reflexive effects during creative thinking execution
 */
import type { StepType, ReflexiveEffects } from '../techniques/types.js';
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
    constructor();
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
     * Get reflexivity assessment for future actions
     */
    assessFutureAction(sessionId: string, proposedAction: string): {
        currentConstraints: string[];
        likelyEffects: string[];
        reversibilityAssessment: 'high' | 'medium' | 'low';
        recommendation: string;
    };
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