/**
 * ParallelErrorHandler - Enhanced error handling for parallel execution contexts
 * Provides sophisticated error recovery and partial completion strategies
 */
import type { LateralThinkingResponse } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
/**
 * Error context for parallel execution
 */
export interface ParallelErrorContext {
    sessionId: string;
    groupId: string;
    technique: string;
    step: number;
    dependencies?: string[];
    failedSessions?: string[];
    errorType: 'dependency_failure' | 'timeout' | 'resource_limit' | 'execution_error' | 'deadlock';
}
/**
 * Recovery strategy for parallel errors
 */
export interface RecoveryStrategy {
    action: 'retry' | 'skip' | 'fail_group' | 'partial_completion' | 'fallback';
    retryCount?: number;
    fallbackTechnique?: string;
    skipReason?: string;
    partialCompletionStrategy?: 'proceed_with_available' | 'retry_critical' | 'fallback_convergence';
}
/**
 * Handles errors in parallel execution contexts with recovery strategies
 */
export declare class ParallelErrorHandler {
    private sessionManager;
    private errorHandler;
    private errorContextBuilder;
    private responseBuilder;
    private partialCompletionHandler;
    private retryAttempts;
    private readonly MAX_RETRIES;
    constructor(sessionManager: SessionManager);
    /**
     * Handle error in parallel execution context
     */
    handleParallelError(error: unknown, context: ParallelErrorContext): LateralThinkingResponse;
    /**
     * Handle dependency failure
     */
    handleDependencyFailure(sessionId: string, failedDependencies: string[], groupId: string): LateralThinkingResponse;
    /**
     * Handle deadlock detection
     */
    handleDeadlock(groupId: string): LateralThinkingResponse;
    /**
     * Analyze error to determine type and severity
     */
    private analyzeError;
    /**
     * Determine recovery strategy based on error analysis
     */
    private determineRecoveryStrategy;
    /**
     * Execute recovery strategy
     */
    private executeRecoveryStrategy;
    /**
     * Analyze deadlock situation
     */
    private analyzeDeadlock;
    /**
     * Build safe error response
     */
    private buildSafeErrorResponse;
    /**
     * Build partial success response
     */
    private buildPartialSuccessResponse;
    /**
     * Build dependency failure response
     */
    private buildDependencyFailureResponse;
    /**
     * Build group failure response
     */
    private buildGroupFailureResponse;
    /**
     * Clear retry attempts for a session
     */
    clearRetryAttempts(sessionId: string): void;
    /**
     * Clear all retry attempts for a group
     */
    clearGroupRetryAttempts(groupId: string): void;
}
//# sourceMappingURL=ParallelErrorHandler.d.ts.map