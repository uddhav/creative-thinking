/**
 * Error Handler
 * Bridges the enhanced error system with the existing error handling
 * Provides unified error handling with recovery patterns
 */
import { ResponseBuilder } from '../core/ResponseBuilder.js';
import { CreativeThinkingError as EnhancedError, ErrorFactory, ErrorRecovery } from './enhanced-errors.js';
import { CreativeThinkingError, ValidationError, SessionError, PlanError, PersistenceError, ParallelExecutionError, ErrorCode, } from './types.js';
/**
 * Maps old error codes to enhanced error system
 */
export class ErrorHandler {
    responseBuilder;
    errorFactory;
    constructor() {
        this.responseBuilder = new ResponseBuilder();
        this.errorFactory = ErrorFactory;
    }
    /**
     * Handle any error and return appropriate response
     */
    handleError(error, layer, context) {
        // If it's already an enhanced error, use it directly
        if (error instanceof EnhancedError) {
            return this.buildEnhancedErrorResponse(error);
        }
        // Convert standard errors to enhanced errors
        if (error instanceof CreativeThinkingError) {
            const enhancedError = this.convertToEnhancedError(error, context);
            return this.buildEnhancedErrorResponse(enhancedError);
        }
        // Handle generic errors
        if (error instanceof Error) {
            const enhancedError = this.createEnhancedFromGeneric(error, layer, context);
            return this.buildEnhancedErrorResponse(enhancedError);
        }
        // Handle unknown errors
        const unknownError = new EnhancedError({
            code: 'E301', // INTERNAL_ERROR
            message: String(error),
            category: 'system',
            severity: 'high',
            recovery: [
                'Check server logs for more details',
                'Retry the operation',
                'Contact support if the issue persists',
            ],
            context,
        });
        return this.buildEnhancedErrorResponse(unknownError);
    }
    /**
     * Convert standard error to enhanced error
     */
    convertToEnhancedError(error, context) {
        const mapping = this.getErrorMapping(error.code);
        // Add specific context based on error type
        const enhancedContext = {
            ...context,
            ...error.details,
            originalError: error.name,
            timestamp: error.timestamp,
        };
        // Create appropriate enhanced error based on type
        if (error instanceof SessionError) {
            return this.errorFactory.sessionNotFound(error.sessionId || 'unknown');
        }
        if (error instanceof PlanError) {
            return this.errorFactory.planNotFound(error.planId || 'unknown');
        }
        if (error instanceof ValidationError) {
            return this.errorFactory.invalidInput(error.field || 'unknown', 'valid value', enhancedContext.actualValue);
        }
        if (error instanceof PersistenceError) {
            return this.errorFactory.fileIOError(error.operation || 'unknown', enhancedContext.path || 'unknown', error);
        }
        if (error instanceof ParallelExecutionError) {
            return this.errorFactory.convergenceError(error.message, error.failedPlans || []);
        }
        // Default enhanced error
        return new EnhancedError({
            code: mapping.code,
            message: error.message,
            category: mapping.category,
            severity: mapping.severity,
            recovery: mapping.recovery,
            context: enhancedContext,
        });
    }
    /**
     * Create enhanced error from generic error
     */
    createEnhancedFromGeneric(error, layer, context) {
        // Check if it's a retryable system error
        if (ErrorRecovery.isRetryable(error)) {
            return new EnhancedError({
                code: 'E303', // NETWORK_ERROR or similar
                message: error.message,
                category: 'system',
                severity: 'medium',
                recovery: [
                    'Wait a moment and retry the operation',
                    'Check your network connection',
                    'If the issue persists, try again later',
                ],
                context: {
                    ...context,
                    errorName: error.name,
                    stack: error.stack,
                },
                retryable: true,
                retryDelayMs: 1000,
            });
        }
        // Default system error
        return new EnhancedError({
            code: 'E301', // INTERNAL_ERROR
            message: error.message,
            category: 'system',
            severity: 'high',
            recovery: [
                'Check the error details for more information',
                'Review your input parameters',
                'Contact support if the issue persists',
            ],
            context: {
                ...context,
                errorName: error.name,
                stack: error.stack,
            },
        });
    }
    /**
     * Build response from enhanced error
     */
    buildEnhancedErrorResponse(error) {
        const errorResponse = error.toJSON();
        // Create LLM-friendly format
        const llmFormat = error.getLLMFormat();
        // Build response with both formats
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: errorResponse,
                        recovery: {
                            steps: error.recovery,
                            canRetry: error.retryable || false,
                            retryDelay: error.retryDelayMs,
                        },
                        llmGuidance: llmFormat,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
    /**
     * Map old error codes to enhanced error system
     */
    getErrorMapping(code) {
        const mappings = {
            // Validation errors
            [ErrorCode.INVALID_INPUT]: {
                code: 'E101',
                category: 'validation',
                severity: 'low',
                recovery: [
                    'Check the input format and try again',
                    'Refer to the documentation for valid input examples',
                    'Use the tool definition to see required parameters',
                ],
            },
            [ErrorCode.MISSING_REQUIRED_FIELD]: {
                code: 'E102',
                category: 'validation',
                severity: 'low',
                recovery: [
                    'Add the missing required field to your request',
                    'Check the tool documentation for all required fields',
                    'Use the example in the documentation as a template',
                ],
            },
            [ErrorCode.INVALID_TECHNIQUE]: {
                code: 'E501',
                category: 'technique',
                severity: 'low',
                recovery: [
                    'Use one of the supported techniques',
                    'Run discover_techniques to see available options',
                    'Check the spelling of the technique name',
                ],
            },
            // Session errors
            [ErrorCode.SESSION_NOT_FOUND]: {
                code: 'E201',
                category: 'state',
                severity: 'medium',
                recovery: [
                    'Start a new session with discover_techniques',
                    'Check if the sessionId is correct',
                    'List available sessions if persistence is enabled',
                ],
            },
            [ErrorCode.SESSION_EXPIRED]: {
                code: 'E204',
                category: 'state',
                severity: 'medium',
                recovery: [
                    'Start a new session with discover_techniques',
                    'Sessions expire after 1 hour of inactivity',
                    'Enable persistence to save sessions longer',
                ],
            },
            // Plan errors
            [ErrorCode.PLAN_NOT_FOUND]: {
                code: 'E202',
                category: 'state',
                severity: 'medium',
                recovery: [
                    'Create a new plan with plan_thinking_session',
                    'Check if the planId is correct',
                    'Ensure the plan was created before executing steps',
                ],
            },
            // Workflow errors
            [ErrorCode.WORKFLOW_REQUIRED]: {
                code: 'E001',
                category: 'workflow',
                severity: 'medium',
                recovery: [
                    'Use discover_techniques first',
                    'Then use plan_thinking_session',
                    'Finally use execute_thinking_step',
                ],
            },
            [ErrorCode.TECHNIQUE_MISMATCH]: {
                code: 'E003',
                category: 'workflow',
                severity: 'medium',
                recovery: [
                    'Use the technique specified in the plan',
                    'Create a new plan with the desired technique',
                    'Check if you have the correct planId',
                ],
            },
            // System errors
            [ErrorCode.INTERNAL_ERROR]: {
                code: 'E301',
                category: 'system',
                severity: 'high',
                recovery: [
                    'Retry the operation',
                    'Check server logs for details',
                    'Contact support if the issue persists',
                ],
            },
            [ErrorCode.PERSISTENCE_ERROR]: {
                code: 'E301',
                category: 'system',
                severity: 'medium',
                recovery: [
                    'Check file permissions',
                    'Ensure sufficient disk space',
                    'Try a different storage location',
                ],
            },
            // Parallel execution errors
            [ErrorCode.PARALLEL_EXECUTION_NOT_SUPPORTED]: {
                code: 'E601',
                category: 'convergence',
                severity: 'medium',
                recovery: [
                    'Use sequential execution mode instead',
                    'Check if parallel features are enabled',
                    'Review the parallel execution documentation',
                ],
            },
            [ErrorCode.CONVERGENCE_DEPENDENCIES_NOT_MET]: {
                code: 'E601',
                category: 'convergence',
                severity: 'high',
                recovery: [
                    'Wait for all parallel plans to complete',
                    'Check the status of dependent plans',
                    'Use sequential execution as a fallback',
                ],
            },
            // Default mapping for unmapped codes
            [ErrorCode.INVALID_FIELD_VALUE]: {
                code: 'E103',
                category: 'validation',
                severity: 'low',
                recovery: ['Provide a valid value for the field'],
            },
            [ErrorCode.SESSION_ALREADY_EXISTS]: {
                code: 'E203',
                category: 'state',
                severity: 'low',
                recovery: ['Use the existing session or create a new one with a different ID'],
            },
            [ErrorCode.SESSION_TOO_LARGE]: {
                code: 'E203',
                category: 'state',
                severity: 'medium',
                recovery: ['Start a new session', 'Clear old session data'],
            },
            [ErrorCode.MAX_SESSIONS_EXCEEDED]: {
                code: 'E203',
                category: 'state',
                severity: 'medium',
                recovery: ['Delete old sessions', 'Increase session limit in configuration'],
            },
            [ErrorCode.PLAN_EXPIRED]: {
                code: 'E204',
                category: 'state',
                severity: 'medium',
                recovery: ['Create a new plan', 'Plans expire after 1 hour'],
            },
            [ErrorCode.INVALID_STEP]: {
                code: 'E004',
                category: 'workflow',
                severity: 'low',
                recovery: ['Use a valid step number', 'Check the total steps for this technique'],
            },
            [ErrorCode.INVALID_STEP_SEQUENCE]: {
                code: 'E004',
                category: 'workflow',
                severity: 'medium',
                recovery: ['Execute steps in order', 'Check the current step in the session'],
            },
            [ErrorCode.TECHNIQUE_NOT_SUPPORTED]: {
                code: 'E501',
                category: 'technique',
                severity: 'low',
                recovery: ['Use a supported technique', 'Check the list of available techniques'],
            },
            [ErrorCode.BLOCKED_ACTION]: {
                code: 'E603',
                category: 'convergence',
                severity: 'high',
                recovery: ['Review the blocked action', 'Choose a different approach'],
            },
            [ErrorCode.ERGODICITY_CHECK_REQUIRED]: {
                code: 'E603',
                category: 'convergence',
                severity: 'medium',
                recovery: ['Complete the ergodicity check', 'Review path dependencies'],
            },
            [ErrorCode.INVALID_ERGODICITY_RESPONSE]: {
                code: 'E603',
                category: 'convergence',
                severity: 'medium',
                recovery: ['Provide a valid ergodicity response', 'Review the required format'],
            },
            [ErrorCode.PERSISTENCE_NOT_AVAILABLE]: {
                code: 'E402',
                category: 'configuration',
                severity: 'low',
                recovery: ['Configure persistence if needed', 'Session data is stored in memory only'],
            },
            [ErrorCode.PERSISTENCE_WRITE_FAILED]: {
                code: 'E301',
                category: 'system',
                severity: 'medium',
                recovery: ['Check write permissions', 'Ensure disk space available'],
            },
            [ErrorCode.PERSISTENCE_READ_FAILED]: {
                code: 'E301',
                category: 'system',
                severity: 'medium',
                recovery: ['Check file exists', 'Verify read permissions'],
            },
            [ErrorCode.RESOURCE_LIMIT_EXCEEDED]: {
                code: 'E302',
                category: 'system',
                severity: 'high',
                recovery: ['Reduce resource usage', 'Increase limits in configuration'],
            },
            [ErrorCode.TIMEOUT_ERROR]: {
                code: 'E303',
                category: 'system',
                severity: 'medium',
                recovery: ['Retry with shorter operation', 'Check system performance'],
            },
            [ErrorCode.MAX_PARALLELISM_EXCEEDED]: {
                code: 'E104',
                category: 'validation',
                severity: 'low',
                recovery: ['Use a lower parallelism value (max 10)', 'Use default parallelism'],
            },
            [ErrorCode.PARALLEL_SESSION_NOT_FOUND]: {
                code: 'E201',
                category: 'state',
                severity: 'medium',
                recovery: ['Check parallel session ID', 'Ensure all parallel sessions are created'],
            },
        };
        return mappings[code] || {
            code: 'E301',
            category: 'system',
            severity: 'high',
            recovery: ['An unexpected error occurred', 'Contact support'],
        };
    }
    /**
     * Execute operation with automatic retry on transient errors
     */
    async executeWithRetry(operation, maxAttempts = 3, onRetry) {
        return ErrorRecovery.executeWithRetry(operation, maxAttempts, onRetry);
    }
}
//# sourceMappingURL=ErrorHandler.js.map