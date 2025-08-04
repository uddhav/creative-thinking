/**
 * Enhanced Error System with Recovery Patterns
 * Provides detailed error information with recovery suggestions
 */
/**
 * Base class for enhanced errors
 */
export class CreativeThinkingError extends Error {
    code;
    category;
    severity;
    recovery;
    context;
    documentation;
    retryable;
    retryDelayMs;
    cause;
    timestamp;
    constructor(config) {
        super(config.message);
        this.name = 'CreativeThinkingError';
        this.code = config.code;
        this.category = config.category;
        this.severity = config.severity;
        this.recovery = config.recovery;
        this.context = config.context;
        this.documentation = config.documentation;
        this.retryable = config.retryable;
        this.retryDelayMs = config.retryDelayMs;
        this.cause = config.cause;
        this.timestamp = Date.now();
    }
    /**
     * Convert to JSON for serialization
     */
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            category: this.category,
            severity: this.severity,
            recovery: this.recovery,
            context: this.context,
            documentation: this.documentation,
            retryable: this.retryable,
            retryDelayMs: this.retryDelayMs,
            timestamp: this.timestamp,
        };
    }
    /**
     * Get formatted error for LLM consumption
     */
    getLLMFormat() {
        let formatted = `Error: ${this.message} (Code: ${this.code})\n`;
        formatted += `Category: ${this.category}, Severity: ${this.severity}\n`;
        if (this.recovery.length > 0) {
            formatted += '\nRecovery Options:\n';
            this.recovery.forEach((step, index) => {
                formatted += `${index + 1}. ${step}\n`;
            });
        }
        if (this.context) {
            formatted += '\nContext:\n';
            formatted += JSON.stringify(this.context, null, 2);
        }
        if (this.documentation) {
            formatted += `\nDocumentation: ${this.documentation}`;
        }
        return formatted;
    }
}
/**
 * Workflow-related errors
 */
export class WorkflowError extends CreativeThinkingError {
    constructor(code, message, recovery, context) {
        super({
            code,
            message,
            category: 'workflow',
            severity: 'medium',
            recovery,
            context,
            documentation: 'https://docs.creative-thinking.dev/errors#workflow',
        });
        this.name = 'WorkflowError';
    }
}
/**
 * Validation-related errors
 */
export class ValidationError extends CreativeThinkingError {
    constructor(code, message, recovery, context) {
        super({
            code,
            message,
            category: 'validation',
            severity: 'medium',
            recovery,
            context,
            documentation: 'https://docs.creative-thinking.dev/errors#validation',
        });
        this.name = 'ValidationError';
    }
}
/**
 * State-related errors
 */
export class StateError extends CreativeThinkingError {
    constructor(code, message, recovery, context) {
        super({
            code,
            message,
            category: 'state',
            severity: 'medium',
            recovery,
            context,
            documentation: 'https://docs.creative-thinking.dev/errors#state',
        });
        this.name = 'StateError';
    }
}
/**
 * System-related errors
 */
export class SystemError extends CreativeThinkingError {
    constructor(code, message, recovery, context, retryable = false) {
        super({
            code,
            message,
            category: 'system',
            severity: 'high',
            recovery,
            context,
            retryable,
            retryDelayMs: retryable ? 1000 : undefined,
            documentation: 'https://docs.creative-thinking.dev/errors#system',
        });
        this.name = 'SystemError';
    }
}
/**
 * Error codes for consistent identification
 */
export const ErrorCodes = {
    // Workflow errors
    WRONG_TOOL_ORDER: 'E001',
    MISSING_PLAN: 'E002',
    TECHNIQUE_MISMATCH: 'E003',
    INVALID_STEP: 'E004',
    // Validation errors
    INVALID_INPUT: 'E101',
    MISSING_PARAMETER: 'E102',
    INVALID_TYPE: 'E103',
    OUT_OF_RANGE: 'E104',
    // State errors
    SESSION_NOT_FOUND: 'E301',
    PLAN_NOT_FOUND: 'E202',
    INVALID_STATE: 'E303',
    SESSION_EXPIRED: 'E302',
    // System errors
    FILE_IO_ERROR: 'E403',
    MEMORY_ERROR: 'E402',
    NETWORK_ERROR: 'E303',
    PERMISSION_ERROR: 'E304',
    // Configuration errors
    MISSING_CONFIG: 'E401',
    INVALID_CONFIG: 'E402',
    // Technique errors
    TECHNIQUE_NOT_FOUND: 'E501',
    TECHNIQUE_ERROR: 'E502',
    // Convergence errors
    CONVERGENCE_FAILED: 'E601',
    PARALLEL_TIMEOUT: 'E602',
    DEPENDENCY_ERROR: 'E603',
};
/**
 * Factory for creating common errors
 */
export class ErrorFactory {
    /**
     * Create a session not found error
     */
    static sessionNotFound(sessionId) {
        return new StateError(ErrorCodes.SESSION_NOT_FOUND, `Session '${sessionId}' not found. The session may have expired or been deleted.`, [
            "Start a new session with 'plan_thinking_session'",
            'Check if the sessionId is correct',
            'If using persistence, ensure the session was saved',
            'List available sessions if persistence is enabled',
        ], { sessionId });
    }
    /**
     * Create a plan not found error
     */
    static planNotFound(planId) {
        return new StateError(ErrorCodes.PLAN_NOT_FOUND, `Plan '${planId}' not found. The plan may have been deleted or not created yet.`, [
            'Create a new plan with plan_thinking_session',
            'Check if the planId is correct',
            'Ensure the plan was created before executing steps',
        ], { planId });
    }
    /**
     * Create a wrong tool order error
     */
    static wrongToolOrder(currentTool, expectedTools) {
        return new WorkflowError(ErrorCodes.WRONG_TOOL_ORDER, `Wrong tool order. Used '${currentTool}' but expected one of: ${expectedTools.join(', ')}`, [
            `Use ${expectedTools[0]} first`,
            'Check the workflow documentation',
            'Reset and start from the beginning',
        ], { currentTool, expectedTools });
    }
    /**
     * Create a technique mismatch error
     */
    static techniqueMismatch(planTechnique, requestedTechnique, planId) {
        return new WorkflowError(ErrorCodes.TECHNIQUE_MISMATCH, `Technique mismatch. Plan uses '${planTechnique}' but requested '${requestedTechnique}'`, [
            `Use technique '${planTechnique}' as specified in the plan`,
            'Create a new plan with the desired technique',
            'Check if you have the correct planId',
        ], { planTechnique, requestedTechnique, planId });
    }
    /**
     * Create an invalid input error
     */
    static invalidInput(parameter, expectedType, actualValue) {
        return new ValidationError(ErrorCodes.INVALID_INPUT, `Invalid input for '${parameter}'. Expected ${expectedType} but got ${typeof actualValue}`, [
            `Provide a valid ${expectedType} for ${parameter}`,
            'Check the parameter documentation',
            'Use the example in the documentation',
        ], { parameter, expectedType, actualValue: String(actualValue) });
    }
    /**
     * Create a missing parameter error
     */
    static missingParameter(parameter, tool) {
        return new ValidationError(ErrorCodes.MISSING_PARAMETER, `Missing required parameter '${parameter}' for tool '${tool}'`, [
            `Add the '${parameter}' parameter to your request`,
            `Check the documentation for '${tool}' tool`,
            'Use the tool definition to see all required parameters',
        ], { parameter, tool });
    }
    /**
     * Create a file I/O error
     */
    static fileIOError(operation, path, originalError) {
        return new SystemError(ErrorCodes.FILE_IO_ERROR, `File ${operation} failed for path: ${path}`, [
            'Check if the file/directory exists',
            'Verify file permissions',
            'Ensure sufficient disk space',
            'Try a different file path',
        ], { operation, path, error: originalError?.message }, true // retryable
        );
    }
    /**
     * Create a memory error
     */
    static memoryError(operation, memoryUsageMB) {
        return new SystemError(ErrorCodes.MEMORY_ERROR, `Memory error during ${operation}. System may be running low on memory.`, [
            'Close other applications to free memory',
            'Reduce the number of concurrent sessions',
            'Clear old sessions with cleanup functionality',
            'Restart the server',
        ], { operation, memoryUsageMB }, true // retryable
        );
    }
    /**
     * Create a convergence error
     */
    static convergenceError(reason, parallelPlans) {
        return new CreativeThinkingError({
            code: ErrorCodes.CONVERGENCE_FAILED,
            message: `Convergence failed: ${reason}`,
            category: 'convergence',
            severity: 'high',
            recovery: [
                'Check if all parallel plans completed successfully',
                'Retry with sequential execution mode',
                'Review the convergence configuration',
                'Check individual plan results for errors',
            ],
            context: { reason, parallelPlans },
            documentation: 'https://docs.creative-thinking.dev/errors#convergence',
        });
    }
    /**
     * Create a missing field error
     */
    static missingField(fieldName) {
        return new ValidationError('E101', `Missing required field: '${fieldName}'`, [
            `Provide the '${fieldName}' field`,
            'Check the API documentation for required fields',
            'Review the error context for expected format',
        ], { field: fieldName });
    }
    /**
     * Create an invalid field type error
     */
    static invalidFieldType(fieldName, expectedType, actualType) {
        return new ValidationError('E102', `Invalid field type for '${fieldName}': expected ${expectedType}, got ${actualType}`, [
            `Change '${fieldName}' to be of type ${expectedType}`,
            'Check the API documentation for field types',
            'Validate input before sending',
        ], { field: fieldName, expectedType, actualType });
    }
    /**
     * Create an invalid technique error
     */
    static invalidTechnique(technique) {
        const validTechniques = [
            'six_hats',
            'po',
            'random_entry',
            'scamper',
            'concept_extraction',
            'yes_and',
            'design_thinking',
            'triz',
            'neural_state',
            'temporal_work',
            'cross_cultural',
            'collective_intel',
            'disney_method',
            'nine_windows',
        ];
        return new ValidationError('E103', `Invalid technique: '${technique}'`, [
            'Use one of the valid techniques',
            `Valid techniques: ${validTechniques.slice(0, 5).join(', ')}, ...`,
            "Call 'discover_techniques' to get recommendations",
        ], { technique, validTechniques });
    }
    /**
     * Create a workflow order error
     */
    static workflowOrder(currentTool, expectedTool) {
        return new WorkflowError('E201', `Workflow error: Called '${currentTool}' but should call '${expectedTool}' first`, [
            `Call '${expectedTool}' first`,
            'Follow the three-step workflow',
            'Reset and start from discovery',
        ], { currentTool, expectedTool });
    }
    /**
     * Create a missing workflow step error
     */
    static missingWorkflowStep(missingStep) {
        return new WorkflowError('E202', `Missing workflow step: '${missingStep}' must be called first`, [
            `Call '${missingStep}' first`,
            'Check the workflow documentation',
            'Start from the beginning with discovery',
        ], { missingStep });
    }
    /**
     * Create a workflow skip detected error
     */
    static workflowSkipDetected() {
        return new WorkflowError('E203', 'Workflow skip detected: Attempting to bypass the three-layer architecture', [
            'Use the proper workflow: discover → plan → execute',
            'Do not skip directly to execution',
            'Call discover_techniques first',
        ], { severity: 'critical' });
    }
    /**
     * Create a session expired error
     */
    static sessionExpired(sessionId, expiryMinutes) {
        return new StateError('E302', `Session '${sessionId}' has expired after ${expiryMinutes} minutes of inactivity`, [
            'Create a new session',
            'Increase session timeout in configuration',
            'Use session persistence for longer sessions',
        ], { sessionId, expiryMinutes });
    }
    /**
     * Create an invalid step error
     */
    static invalidStep(requestedStep, maxSteps) {
        return new StateError('E303', `Invalid step: Step ${requestedStep} requested but technique only has ${maxSteps} steps`, [
            `Use a step between 1 and ${maxSteps}`,
            'Check the technique documentation',
            'Verify your step counter logic',
        ], { requestedStep, maxSteps });
    }
    /**
     * Create a file access error
     */
    static fileAccessError(filePath, reason) {
        return new SystemError('E401', `Cannot access file: ${filePath}`, [
            'Check file permissions',
            'Ensure the file exists',
            'Verify the file path is correct',
            'Check disk space and availability',
        ], { filePath, reason }, true // retryable
        );
    }
    /**
     * Create a memory limit exceeded error
     */
    static memoryLimitExceeded(usagePercent) {
        return new SystemError('E402', `Memory limit exceeded: ${usagePercent}% of available memory in use`, [
            'Reduce session count',
            'Clear old sessions',
            'Increase memory allocation',
            'Restart the server',
        ], { usagePercent }, false // not retryable
        );
    }
    /**
     * Create a persistence error
     */
    static persistenceError(operation, reason) {
        return new SystemError('E403', `Persistence error during ${operation}: ${reason}`, [
            'Check storage availability',
            'Verify write permissions',
            'Use in-memory mode temporarily',
            'Retry the operation',
        ], { operation, reason }, true // retryable
        );
    }
    /**
     * Create an access denied error
     */
    static accessDenied(resource) {
        return new CreativeThinkingError({
            code: 'E501',
            message: `Access denied to resource: ${resource}`,
            category: 'permission',
            severity: 'high',
            recovery: ['Check your permissions', 'Contact an administrator', 'Use a different resource'],
            context: { resource },
        });
    }
    /**
     * Create a rate limit exceeded error
     */
    static rateLimitExceeded(retryAfterSeconds) {
        return new CreativeThinkingError({
            code: 'E502',
            message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds`,
            category: 'permission',
            severity: 'medium',
            recovery: [
                `Wait ${retryAfterSeconds} seconds before retrying`,
                'Reduce request frequency',
                'Use batch operations where possible',
            ],
            context: { retryAfterSeconds },
            retryable: true,
        });
    }
    /**
     * Create a missing configuration error
     */
    static missingConfiguration(configKey) {
        return new CreativeThinkingError({
            code: 'E601',
            message: `Missing required configuration: ${configKey}`,
            category: 'configuration',
            severity: 'high',
            recovery: [
                `Set the ${configKey} configuration value`,
                'Check environment variables',
                'Review configuration documentation',
            ],
            context: { configKey },
        });
    }
    /**
     * Create an invalid configuration error
     */
    static invalidConfiguration(configKey, value, expectedFormat) {
        return new CreativeThinkingError({
            code: 'E602',
            message: `Invalid configuration for '${configKey}': ${value} (expected ${expectedFormat})`,
            category: 'configuration',
            severity: 'high',
            recovery: [
                `Update ${configKey} to match ${expectedFormat}`,
                'Check configuration documentation',
                'Use default values if unsure',
            ],
            context: { configKey, value, expectedFormat },
        });
    }
    /**
     * Create a technique execution failed error
     */
    static techniqueExecutionFailed(technique, reason) {
        return new CreativeThinkingError({
            code: 'E701',
            message: `Technique '${technique}' execution failed: ${reason}`,
            category: 'technique',
            severity: 'medium',
            recovery: [
                'Check technique parameters',
                'Review technique documentation',
                'Try a different technique',
                'Simplify the problem statement',
            ],
            context: { technique, reason },
        });
    }
    /**
     * Create a technique dependency missing error
     */
    static techniqueDependencyMissing(technique, dependency) {
        return new CreativeThinkingError({
            code: 'E702',
            message: `Technique '${technique}' requires '${dependency}' to be executed first`,
            category: 'technique',
            severity: 'medium',
            recovery: [
                `Execute '${dependency}' first`,
                'Check technique dependencies',
                'Use a technique without dependencies',
            ],
            context: { technique, dependency },
        });
    }
    /**
     * Create a parallel execution error
     */
    static parallelExecutionError(failedPlans, reason) {
        return new CreativeThinkingError({
            code: 'E801',
            message: `Parallel execution failed for plans: ${failedPlans.join(', ')}`,
            category: 'convergence',
            severity: 'high',
            recovery: [
                'Retry failed plans individually',
                'Use sequential execution mode',
                'Check individual plan errors',
                'Reduce parallelism level',
            ],
            context: { failedPlans, reason },
        });
    }
    /**
     * Create a convergence failure error
     */
    static convergenceFailure(totalPlans, completedPlans) {
        return new CreativeThinkingError({
            code: 'E802',
            message: `Convergence failed: Only ${completedPlans} of ${totalPlans} plans completed`,
            category: 'convergence',
            severity: 'high',
            recovery: [
                'Retry failed plans',
                'Continue with partial results',
                'Use sequential execution',
                'Check plan dependencies',
            ],
            context: { totalPlans, completedPlans },
        });
    }
    /**
     * Create a convergence dependency not met error
     */
    static convergenceDependencyNotMet(planId, missingDependencies) {
        return new CreativeThinkingError({
            code: 'E803',
            message: `Convergence plan '${planId}' dependencies not met`,
            category: 'convergence',
            severity: 'high',
            recovery: [
                'Complete required dependencies first',
                'Check dependency configuration',
                'Use independent plans only',
            ],
            context: { planId, missingDependencies },
        });
    }
}
/**
 * Error recovery helper
 */
export class ErrorRecovery {
    /**
     * Check if an error is recoverable
     */
    static isRecoverable(error) {
        if (error instanceof CreativeThinkingError) {
            // Critical errors are not recoverable
            if (error.severity === 'critical') {
                return false;
            }
            // Errors with recovery suggestions are generally recoverable
            return error.recovery.length > 0;
        }
        return true; // Assume unknown errors might be recoverable
    }
    /**
     * Check if an error is retryable
     */
    static isRetryable(error) {
        if (error instanceof CreativeThinkingError) {
            return error.retryable || false;
        }
        // Check for common retryable system errors
        const retryableMessages = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'EPIPE'];
        return retryableMessages.some(msg => error.message.includes(msg));
    }
    /**
     * Get retry delay for an error
     */
    static getRetryDelay(error, attemptNumber) {
        const maxDelay = 30000; // 30 seconds maximum
        let delay;
        if (error instanceof CreativeThinkingError && error.retryDelayMs) {
            // Exponential backoff with jitter
            delay = error.retryDelayMs * Math.pow(2, attemptNumber - 1);
        }
        else {
            // Default exponential backoff
            delay = 1000 * Math.pow(2, attemptNumber - 1);
        }
        // Cap at maximum delay
        return Math.min(delay, maxDelay);
    }
    /**
     * Execute with retry
     */
    static async executeWithRetry(operation, maxAttempts = 3, onRetry) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (!this.isRetryable(error) || attempt === maxAttempts) {
                    throw error;
                }
                const delay = this.getRetryDelay(error, attempt);
                if (onRetry) {
                    onRetry(error, attempt);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError || new Error('Operation failed after max attempts');
    }
}
//# sourceMappingURL=enhanced-errors.js.map