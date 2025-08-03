/**
 * Standard error types and interfaces for the Creative Thinking MCP Server
 */
/**
 * Error codes for different types of errors
 */
export var ErrorCode;
(function (ErrorCode) {
    // Validation errors
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    ErrorCode["INVALID_TECHNIQUE"] = "INVALID_TECHNIQUE";
    ErrorCode["INVALID_FIELD_VALUE"] = "INVALID_FIELD_VALUE";
    // Session errors
    ErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    ErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    ErrorCode["SESSION_ALREADY_EXISTS"] = "SESSION_ALREADY_EXISTS";
    ErrorCode["SESSION_TOO_LARGE"] = "SESSION_TOO_LARGE";
    ErrorCode["MAX_SESSIONS_EXCEEDED"] = "MAX_SESSIONS_EXCEEDED";
    // Plan errors
    ErrorCode["PLAN_NOT_FOUND"] = "PLAN_NOT_FOUND";
    ErrorCode["PLAN_EXPIRED"] = "PLAN_EXPIRED";
    // Business logic errors
    ErrorCode["INVALID_STEP"] = "INVALID_STEP";
    ErrorCode["INVALID_STEP_SEQUENCE"] = "INVALID_STEP_SEQUENCE";
    ErrorCode["TECHNIQUE_NOT_SUPPORTED"] = "TECHNIQUE_NOT_SUPPORTED";
    ErrorCode["TECHNIQUE_MISMATCH"] = "TECHNIQUE_MISMATCH";
    ErrorCode["WORKFLOW_REQUIRED"] = "WORKFLOW_REQUIRED";
    // Risk and ergodicity errors
    ErrorCode["BLOCKED_ACTION"] = "BLOCKED_ACTION";
    ErrorCode["ERGODICITY_CHECK_REQUIRED"] = "ERGODICITY_CHECK_REQUIRED";
    ErrorCode["INVALID_ERGODICITY_RESPONSE"] = "INVALID_ERGODICITY_RESPONSE";
    // System errors
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["PERSISTENCE_ERROR"] = "PERSISTENCE_ERROR";
    ErrorCode["PERSISTENCE_NOT_AVAILABLE"] = "PERSISTENCE_NOT_AVAILABLE";
    ErrorCode["PERSISTENCE_WRITE_FAILED"] = "PERSISTENCE_WRITE_FAILED";
    ErrorCode["PERSISTENCE_READ_FAILED"] = "PERSISTENCE_READ_FAILED";
    // Resource errors
    ErrorCode["RESOURCE_LIMIT_EXCEEDED"] = "RESOURCE_LIMIT_EXCEEDED";
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    /**
     * Parallel execution errors
     */
    /** Requested parallel execution but feature not enabled/supported */
    ErrorCode["PARALLEL_EXECUTION_NOT_SUPPORTED"] = "PARALLEL_EXECUTION_NOT_SUPPORTED";
    /** Convergence attempted before all dependencies completed */
    ErrorCode["CONVERGENCE_DEPENDENCIES_NOT_MET"] = "CONVERGENCE_DEPENDENCIES_NOT_MET";
    /** Requested parallelism exceeds maximum allowed (10) */
    ErrorCode["MAX_PARALLELISM_EXCEEDED"] = "MAX_PARALLELISM_EXCEEDED";
    /** Referenced parallel session not found in group */
    ErrorCode["PARALLEL_SESSION_NOT_FOUND"] = "PARALLEL_SESSION_NOT_FOUND";
})(ErrorCode || (ErrorCode = {}));
/**
 * Custom error class for Creative Thinking errors
 */
export class CreativeThinkingError extends Error {
    code;
    layer;
    details;
    timestamp;
    constructor(code, message, layer, details) {
        super(message);
        this.code = code;
        this.layer = layer;
        this.details = details;
        this.name = 'CreativeThinkingError';
        this.timestamp = new Date().toISOString();
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CreativeThinkingError);
        }
    }
    /**
     * Convert to standard error response format
     */
    toResponse() {
        return {
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                layer: this.layer,
                timestamp: this.timestamp,
            },
            isError: true,
        };
    }
}
/**
 * Validation error with field information
 */
export class ValidationError extends CreativeThinkingError {
    field;
    constructor(code, message, field, details) {
        super(code, message, 'discovery', details);
        this.field = field;
        this.name = 'ValidationError';
    }
}
/**
 * Session-related error
 */
export class SessionError extends CreativeThinkingError {
    sessionId;
    constructor(code, message, sessionId, details) {
        super(code, message, 'session', details);
        this.sessionId = sessionId;
        this.name = 'SessionError';
    }
}
/**
 * Plan-related error
 */
export class PlanError extends CreativeThinkingError {
    planId;
    constructor(code, message, planId, details) {
        super(code, message, 'planning', details);
        this.planId = planId;
        this.name = 'PlanError';
    }
}
/**
 * Execution-related error
 */
export class ExecutionError extends CreativeThinkingError {
    constructor(code, message, details) {
        super(code, message, 'execution', details);
        this.name = 'ExecutionError';
    }
}
/**
 * Persistence-related error
 */
export class PersistenceError extends CreativeThinkingError {
    operation;
    constructor(code, message, operation, details) {
        super(code, message, 'persistence', details);
        this.operation = operation;
        this.name = 'PersistenceError';
    }
}
/**
 * Helper function to create error response from any error
 */
export function createErrorResponse(error, layer = 'execution') {
    if (error instanceof CreativeThinkingError) {
        return error.toResponse();
    }
    if (error instanceof Error) {
        return {
            error: {
                code: ErrorCode.INTERNAL_ERROR,
                message: error.message,
                details: { name: error.name, stack: error.stack },
                layer,
                timestamp: new Date().toISOString(),
            },
            isError: true,
        };
    }
    return {
        error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: String(error),
            details: error,
            layer,
            timestamp: new Date().toISOString(),
        },
        isError: true,
    };
}
/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response) {
    return (typeof response === 'object' &&
        response !== null &&
        'isError' in response &&
        response.isError === true &&
        'error' in response);
}
/**
 * Parallel execution-related error
 * Used for errors during parallel technique execution or convergence
 * @example
 * ```typescript
 * throw new ParallelExecutionError(
 *   ErrorCode.CONVERGENCE_DEPENDENCIES_NOT_MET,
 *   'Cannot converge: 2 of 3 parallel plans still running',
 *   ['plan1', 'plan2'],
 *   [{ technique: 'six_hats', insights: ['partial'] }]
 * );
 * ```
 */
export class ParallelExecutionError extends CreativeThinkingError {
    failedPlans;
    partialResults;
    constructor(code, message, failedPlans, partialResults, details) {
        super(code, message, 'execution', details);
        this.failedPlans = failedPlans;
        this.partialResults = partialResults;
        this.name = 'ParallelExecutionError';
    }
}
//# sourceMappingURL=types.js.map