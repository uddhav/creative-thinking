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
    calculateCompletionMetadata(session: SessionData, plan?: PlanThinkingSessionOutput): SessionCompletionMetadata;
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
     * Calculate overall progress
     */
    private calculateOverallProgress;
    /**
     * Identify skipped techniques
     */
    private identifySkippedTechniques;
    /**
     * Identify missed perspectives
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
     * Get estimated steps for a technique
     */
    private getEstimatedStepsForTechnique;
    /**
     * Count total completed steps
     */
    private countCompletedSteps;
}
//# sourceMappingURL=SessionCompletionTracker.d.ts.map