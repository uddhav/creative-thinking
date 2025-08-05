/**
 * PartialCompletionHandler - Handles scenarios where some parallel sessions fail
 * Provides strategies for continuing with partial results or retrying critical sessions
 */
import type { ParallelSessionGroup, PartialCompletionResult } from '../../types/parallel-session.js';
import type { SessionManager } from '../SessionManager.js';
import type { PartialCompletionConfig } from '../../types/parallel-config.js';
/**
 * Handles partial completion scenarios in parallel execution
 */
export declare class PartialCompletionHandler {
    private config;
    constructor(config?: Partial<PartialCompletionConfig>);
    /**
     * Handle partial completion of a parallel group
     */
    handlePartialCompletion(group: ParallelSessionGroup, failedSessions: Set<string>, sessionManager: SessionManager): PartialCompletionResult;
    /**
     * Categorize sessions by status and criticality
     */
    private categorizeSessions;
    /**
     * Determine if a session is critical (has many dependents)
     */
    private isCriticalSession;
    /**
     * Get sessions that depend on a given session
     */
    private getDependentSessions;
    /**
     * Determine strategy based on completion rate and criticality
     */
    private determineStrategy;
    /**
     * Strategy: Proceed with available results
     */
    private proceedWithAvailable;
    /**
     * Strategy: Retry critical sessions
     */
    private retryCriticalSessions;
    /**
     * Strategy: Fallback to simplified convergence
     */
    private fallbackConvergence;
    /**
     * Strategy: Abort the group
     */
    private abortGroup;
    /**
     * Default strategy (shouldn't reach here)
     */
    private defaultStrategy;
    /**
     * Get completed results from sessions
     */
    private getCompletedResults;
    /**
     * Check if we can proceed with convergence
     */
    private canProceedWithConvergence;
    /**
     * Get missing techniques from failed/pending sessions
     */
    private getMissingTechniques;
    /**
     * Generate recommendations for partial results
     */
    private generatePartialRecommendations;
}
//# sourceMappingURL=PartialCompletionHandler.d.ts.map