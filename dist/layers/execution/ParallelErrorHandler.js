/**
 * ParallelErrorHandler - Enhanced error handling for parallel execution contexts
 * Provides sophisticated error recovery and partial completion strategies
 */
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import { ErrorContextBuilder } from '../../core/ErrorContextBuilder.js';
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { PartialCompletionHandler } from '../../core/session/PartialCompletionHandler.js';
/**
 * Handles errors in parallel execution contexts with recovery strategies
 */
export class ParallelErrorHandler {
    sessionManager;
    errorHandler;
    errorContextBuilder;
    responseBuilder;
    partialCompletionHandler;
    // Track retry attempts per session
    retryAttempts = new Map();
    // Maximum retry attempts
    MAX_RETRIES = 3;
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
        this.errorHandler = new ErrorHandler();
        this.errorContextBuilder = new ErrorContextBuilder();
        this.responseBuilder = new ResponseBuilder();
        this.partialCompletionHandler = new PartialCompletionHandler();
    }
    /**
     * Handle error in parallel execution context
     */
    handleParallelError(error, context) {
        try {
            // Determine error type and severity
            const errorAnalysis = this.analyzeError(error, context);
            // Get recovery strategy
            const strategy = this.determineRecoveryStrategy(errorAnalysis, context);
            // Execute recovery strategy
            return this.executeRecoveryStrategy(strategy, context, error);
        }
        catch (recoveryError) {
            // If recovery fails, return a safe error response
            return this.buildSafeErrorResponse(context, error, recoveryError);
        }
    }
    /**
     * Handle dependency failure
     */
    handleDependencyFailure(sessionId, failedDependencies, groupId) {
        const context = {
            sessionId,
            groupId,
            technique: 'unknown',
            step: 0,
            dependencies: failedDependencies,
            errorType: 'dependency_failure',
        };
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group) {
            return this.buildSafeErrorResponse(context, new Error('Group not found'));
        }
        // Check if we can proceed with partial results
        const failedSet = new Set(failedDependencies);
        const partialResult = this.partialCompletionHandler.handlePartialCompletion(group, failedSet, this.sessionManager);
        if (partialResult.canContinue) {
            return this.buildPartialSuccessResponse(sessionId, partialResult);
        }
        return this.buildDependencyFailureResponse(sessionId, failedDependencies, partialResult);
    }
    /**
     * Handle deadlock detection
     */
    handleDeadlock(groupId) {
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group) {
            return this.buildSafeErrorResponse({ sessionId: '', groupId, technique: '', step: 0, errorType: 'deadlock' }, new Error('Group not found'));
        }
        // Analyze the deadlock
        const analysis = this.analyzeDeadlock(group);
        // Build response with deadlock resolution suggestions
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Deadlock detected in parallel execution',
                        groupId,
                        analysis,
                        recommendations: [
                            'Review and adjust session dependencies',
                            'Consider breaking circular dependencies',
                            'Use partial completion strategies',
                            'Implement timeout mechanisms',
                        ],
                        affectedSessions: Array.from(group.sessionIds),
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Analyze error to determine type and severity
     */
    analyzeError(error, context) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Check for specific error patterns
        if (errorMessage.includes('timeout')) {
            return {
                severity: 'medium',
                isRecoverable: true,
                errorCategory: 'timeout',
                message: errorMessage,
            };
        }
        if (errorMessage.includes('memory') || errorMessage.includes('resource')) {
            return {
                severity: 'high',
                isRecoverable: false,
                errorCategory: 'resource_limit',
                message: errorMessage,
            };
        }
        if (context.errorType === 'dependency_failure') {
            return {
                severity: 'medium',
                isRecoverable: true,
                errorCategory: 'dependency',
                message: 'Session dependencies failed',
            };
        }
        if (context.errorType === 'deadlock') {
            return {
                severity: 'critical',
                isRecoverable: false,
                errorCategory: 'deadlock',
                message: 'Circular dependencies detected',
            };
        }
        // Default analysis
        return {
            severity: 'medium',
            isRecoverable: true,
            errorCategory: 'execution',
            message: errorMessage,
        };
    }
    /**
     * Determine recovery strategy based on error analysis
     */
    determineRecoveryStrategy(errorAnalysis, context) {
        // Get retry count for this session
        const retryCount = this.retryAttempts.get(context.sessionId) || 0;
        // If not recoverable or too many retries, fail
        if (!errorAnalysis.isRecoverable || retryCount >= this.MAX_RETRIES) {
            return {
                action: 'fail_group',
                retryCount,
            };
        }
        // Strategy based on error category
        switch (errorAnalysis.errorCategory) {
            case 'timeout':
                return {
                    action: 'retry',
                    retryCount: retryCount + 1,
                };
            case 'dependency': {
                // Check if we can proceed with partial results
                const group = this.sessionManager.getParallelGroup(context.groupId);
                if (group && group.completedSessions.size >= group.sessionIds.length * 0.5) {
                    return {
                        action: 'partial_completion',
                        partialCompletionStrategy: 'proceed_with_available',
                    };
                }
                return {
                    action: 'retry',
                    retryCount: retryCount + 1,
                };
            }
            case 'resource_limit':
                // Try with a simpler technique or skip
                return {
                    action: 'fallback',
                    fallbackTechnique: 'po', // Simpler technique
                };
            case 'deadlock':
                return {
                    action: 'fail_group',
                    skipReason: 'Circular dependencies cannot be resolved',
                };
            default:
                // Try to retry for general errors
                return {
                    action: 'retry',
                    retryCount: retryCount + 1,
                };
        }
    }
    /**
     * Execute recovery strategy
     */
    executeRecoveryStrategy(strategy, context, originalError) {
        switch (strategy.action) {
            case 'retry':
                // Update retry count
                this.retryAttempts.set(context.sessionId, strategy.retryCount || 1);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'retry_scheduled',
                                sessionId: context.sessionId,
                                retryAttempt: strategy.retryCount,
                                maxRetries: this.MAX_RETRIES,
                                message: 'Session will be retried with adjusted parameters',
                                originalError: originalError instanceof Error ? originalError.message : String(originalError),
                            }, null, 2),
                        },
                    ],
                };
            case 'skip':
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'skipped',
                                sessionId: context.sessionId,
                                reason: strategy.skipReason,
                                recommendation: 'Continue with available results',
                            }, null, 2),
                        },
                    ],
                };
            case 'partial_completion': {
                const group = this.sessionManager.getParallelGroup(context.groupId);
                if (!group) {
                    return this.buildSafeErrorResponse(context, originalError);
                }
                const partialResult = this.partialCompletionHandler.handlePartialCompletion(group, new Set([context.sessionId]), this.sessionManager);
                return this.buildPartialSuccessResponse(context.sessionId, partialResult);
            }
            case 'fallback':
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'fallback',
                                sessionId: context.sessionId,
                                originalTechnique: context.technique,
                                fallbackTechnique: strategy.fallbackTechnique,
                                message: 'Switching to simpler technique due to resource constraints',
                            }, null, 2),
                        },
                    ],
                };
            case 'fail_group':
            default:
                // Update group status
                this.sessionManager.updateParallelGroupStatus(context.groupId, 'failed');
                return this.buildGroupFailureResponse(context, originalError);
        }
    }
    /**
     * Analyze deadlock situation
     */
    analyzeDeadlock(group) {
        // This would use the SessionIndex to detect circular dependencies
        // For now, return a simplified analysis
        const waitingChains = [];
        for (const sessionId of group.sessionIds) {
            if (!group.completedSessions.has(sessionId)) {
                const session = this.sessionManager.getSession(sessionId);
                if (session?.dependsOn) {
                    waitingChains.push({
                        session: sessionId,
                        waitingFor: session.dependsOn.filter(dep => !group.completedSessions.has(dep)),
                    });
                }
            }
        }
        return {
            circularDependencies: [], // Would be populated by circular dependency detection
            waitingChains,
            possibleResolutions: [
                'Remove or relax some dependencies',
                'Execute some sessions without dependencies',
                'Use partial completion strategies',
            ],
        };
    }
    /**
     * Build safe error response
     */
    buildSafeErrorResponse(context, error, recoveryError) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const recoveryMessage = recoveryError instanceof Error ? recoveryError.message : undefined;
        return this.errorContextBuilder.buildGenericError(`Parallel execution error: ${errorMessage}`, {
            sessionId: context.sessionId,
            groupId: context.groupId,
            technique: context.technique,
            step: context.step,
            errorType: context.errorType,
            recoveryError: recoveryMessage,
            fallbackMessage: 'Unable to recover from error. Manual intervention may be required.',
        });
    }
    /**
     * Build partial success response
     */
    buildPartialSuccessResponse(sessionId, partialResult) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'partial_success',
                        sessionId,
                        strategy: partialResult.strategy,
                        canContinue: partialResult.canContinue,
                        warnings: partialResult.warnings,
                        recommendations: partialResult.recommendations,
                        availableResultsCount: partialResult.availableResults.length,
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Build dependency failure response
     */
    buildDependencyFailureResponse(sessionId, failedDependencies, partialResult) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Dependency failure',
                        sessionId,
                        failedDependencies,
                        cannotProceed: true,
                        partialCompletionAttempted: true,
                        strategy: partialResult.strategy,
                        recommendations: partialResult.recommendations,
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Build group failure response
     */
    buildGroupFailureResponse(context, error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Parallel group execution failed',
                        groupId: context.groupId,
                        sessionId: context.sessionId,
                        errorType: context.errorType,
                        message: error instanceof Error ? error.message : String(error),
                        recommendations: [
                            'Review error logs for all sessions',
                            'Consider sequential execution',
                            'Adjust resource limits or timeouts',
                            'Simplify problem or reduce parallelism',
                        ],
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Clear retry attempts for a session
     */
    clearRetryAttempts(sessionId) {
        this.retryAttempts.delete(sessionId);
    }
    /**
     * Clear all retry attempts for a group
     */
    clearGroupRetryAttempts(groupId) {
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group)
            return;
        for (const sessionId of group.sessionIds) {
            this.retryAttempts.delete(sessionId);
        }
    }
}
//# sourceMappingURL=ParallelErrorHandler.js.map