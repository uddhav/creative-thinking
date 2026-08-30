/**
 * SessionCompletionTracker - Tracks session progress and completion status
 * Provides warnings and guidance for incomplete execution flows
 */
import type { SessionData, LateralTechnique } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
/**
 * Technique completion status
 */
export interface TechniqueCompletionStatus {
    technique: LateralTechnique;
    totalSteps: number;
    completedSteps: number;
    completionPercentage: number;
    skippedSteps: number[];
    criticalStepsSkipped: string[];
}
/**
 * Session completion metadata
 */
export interface SessionCompletionMetadata {
    overallProgress: number;
    totalPlannedSteps: number;
    completedSteps: number;
    techniqueStatuses: TechniqueCompletionStatus[];
    skippedTechniques: LateralTechnique[];
    missedPerspectives: string[];
    criticalGapsIdentified: string[];
    completionWarnings: string[];
    minimumThresholdMet: boolean;
}
/**
 * Tracks session completion and provides warnings
 */
export declare class SessionCompletionTracker {
    private readonly DEFAULT_MINIMUM_THRESHOLD;
    private readonly WARNING_THRESHOLD;
    private readonly CRITICAL_THRESHOLD;
    /**
     * Calculate session completion metadata
     */
    /**
     * @param isTerminating whether this step ends the session. Incompleteness is
     * only a problem when there will be no further steps; mid-session it is just
     * progress, and saying otherwise on every early step taught callers to ignore
     * the warnings entirely.
     */
    calculateCompletionMetadata(session: SessionData, plan?: PlanThinkingSessionOutput, isTerminating?: boolean): SessionCompletionMetadata;
    /**
     * Check if session should be allowed to proceed to synthesis
     */
    canProceedToSynthesis(metadata: SessionCompletionMetadata): {
        allowed: boolean;
        reason?: string;
        requiredActions?: string[];
    };
    /**
     * Generate progress display string
     */
    formatProgressDisplay(metadata: SessionCompletionMetadata): string;
    /**
     * Calculate statuses for each technique
     */
    private calculateTechniqueStatuses;
    /**
     * Group history entries by technique (only when needed for performance)
     */
    /**
     * Split one technique's history into its separate runs.
     *
     * A new instance begins where a step number recurs, because step numbers
     * restart per run: `1,2,3,4,1,2,4` is a complete run followed by one missing
     * step 3, not a single run of seven.
     *
     * Revisions are the case that makes this more than a `Set` check. A revision
     * re-sends a step number it has already sent, and that must NOT open a new
     * instance — so a repeat only counts as a boundary when the step number is
     * one the run has seen AND the run has moved past it, i.e. the number is not
     * simply the previous entry repeated.
     */
    private groupHistoryByTechnique;
    /**
     * Count completed steps for a technique with proper validation
     */
    private countTechniqueCompletedSteps;
    /**
     * Technique-local progress for one technique of a plan, for callers outside
     * this tracker — notably next-step guidance, which needs to know whether an
     * earlier step was passed over before pointing the caller further ahead.
     *
     * This is the ONLY sanctioned way to read per-technique step coverage from
     * outside: it reuses the same numbering-convention disambiguation as the
     * completion metadata (the validator carries the third copy), so a fourth
     * hand-rolled copy cannot drift.
     */
    techniqueLocalProgress(session: SessionData, plan: PlanThinkingSessionOutput, technique: string, techniqueIndex: number): {
        completedStepNumbers: Set<number>;
        submissionsByStep: Map<number, number>;
        techniqueSteps: number;
    };
    /**
     * Check if a step number is valid for a technique
     */
    private isValidStepForTechnique;
    /**
     * Find skipped steps in technique execution
     */
    private findSkippedSteps;
    /**
     * Calculate overall progress
     */
    private calculateOverallProgress;
    /**
     * Identify skipped techniques.
     *
     * Returns every unstarted technique, mid-run included. That is deliberate
     * and guarded by completion-warning-timing.test.ts: the completion
     * gatekeeper reads this data, and withholding it here would change
     * enforcement rather than presentation.
     *
     * "No steps yet" is not the same as "skipped" for a CALLER, though — the
     * first step of a two-technique plan reported the second one skipped. That
     * is suppressed where the response is built, not here, so the data stays
     * whole for the gatekeeper. See ExecutionResponseBuilder.addCompletionMetadata.
     */
    private identifySkippedTechniques;
    /**
     * Identify missed perspectives.
     *
     * Gated on the same condition as skipped techniques, and for the same
     * reason: a perspective a session has not reached yet has not been missed.
     * Reported unconditionally, this named "Systematic modification strategies"
     * as missed on the first step of a plan whose second technique was scamper.
     */
    private identifyMissedPerspectives;
    /**
     * Identify critical gaps based on problem type
     */
    private identifyCriticalGaps;
    /**
     * Generate completion warnings
     */
    private generateCompletionWarnings;
    /**
     * Create visual progress bar
     */
    private createProgressBar;
    /**
     * Format technique statuses for display
     */
    private formatTechniqueStatuses;
    /**
     * Detect problem type for critical step identification
     */
    private detectProblemType;
    /**
     * Identify critical skipped steps for a technique
     */
    private identifyCriticalSkippedSteps;
    /**
     * Calculate completion for single technique execution
     */
    private calculateSingleTechniqueCompletion;
    /**
     * Get the step count for a technique.
     *
     * Asks the registry. This used to be a hand-copied table of every technique's
     * totalSteps, which nothing compared against the handlers — a technique whose
     * step count changed left the table stale, and the `|| 5` fallback turned a
     * missing entry into a plausible wrong number rather than an error. Progress
     * is reported as completedSteps / this, so a stale entry silently misreports
     * how far along a session is.
     */
    private getEstimatedStepsForTechnique;
    /**
     * Count total completed steps
     */
    private countCompletedSteps;
}
//# sourceMappingURL=SessionCompletionTracker.d.ts.map