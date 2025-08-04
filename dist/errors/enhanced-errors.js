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
            severity: 'low',
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
    SESSION_NOT_FOUND: 'E201',
    PLAN_NOT_FOUND: 'E202',
    INVALID_STATE: 'E203',
    SESSION_EXPIRED: 'E204',
    // System errors
    FILE_IO_ERROR: 'E301',
    MEMORY_ERROR: 'E302',
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
            'Start a new session with discover_techniques',
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
        ], { parameter, expectedType, actualValue });
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
}
/**
 * Error recovery helper
 */
export class ErrorRecovery {
    /**
     * Check if an error is retryable
     */
    static isRetryable(error) {
        if (error instanceof CreativeThinkingError) {
            return error.retryable || false;
        }
        // Check for common retryable system errors
        const retryableMessages = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNREFUSED',
            'EPIPE',
        ];
        return retryableMessages.some(msg => error.message.includes(msg));
    }
    /**
     * Get retry delay for an error
     */
    static getRetryDelay(error, attemptNumber) {
        if (error instanceof CreativeThinkingError && error.retryDelayMs) {
            // Exponential backoff
            return error.retryDelayMs * Math.pow(2, attemptNumber - 1);
        }
        // Default exponential backoff
        return 1000 * Math.pow(2, attemptNumber - 1);
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
        throw lastError;
    }
}
//# sourceMappingURL=enhanced-errors.js.map