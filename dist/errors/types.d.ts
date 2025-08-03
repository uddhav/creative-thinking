/**
 * Standard error types and interfaces for the Creative Thinking MCP Server
 */
/**
 * Error codes for different types of errors
 */
export declare enum ErrorCode {
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_TECHNIQUE = "INVALID_TECHNIQUE",
    INVALID_FIELD_VALUE = "INVALID_FIELD_VALUE",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    SESSION_ALREADY_EXISTS = "SESSION_ALREADY_EXISTS",
    SESSION_TOO_LARGE = "SESSION_TOO_LARGE",
    MAX_SESSIONS_EXCEEDED = "MAX_SESSIONS_EXCEEDED",
    PLAN_NOT_FOUND = "PLAN_NOT_FOUND",
    PLAN_EXPIRED = "PLAN_EXPIRED",
    INVALID_STEP = "INVALID_STEP",
    INVALID_STEP_SEQUENCE = "INVALID_STEP_SEQUENCE",
    TECHNIQUE_NOT_SUPPORTED = "TECHNIQUE_NOT_SUPPORTED",
    TECHNIQUE_MISMATCH = "TECHNIQUE_MISMATCH",
    WORKFLOW_REQUIRED = "WORKFLOW_REQUIRED",
    BLOCKED_ACTION = "BLOCKED_ACTION",
    ERGODICITY_CHECK_REQUIRED = "ERGODICITY_CHECK_REQUIRED",
    INVALID_ERGODICITY_RESPONSE = "INVALID_ERGODICITY_RESPONSE",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    PERSISTENCE_ERROR = "PERSISTENCE_ERROR",
    PERSISTENCE_NOT_AVAILABLE = "PERSISTENCE_NOT_AVAILABLE",
    PERSISTENCE_WRITE_FAILED = "PERSISTENCE_WRITE_FAILED",
    PERSISTENCE_READ_FAILED = "PERSISTENCE_READ_FAILED",
    RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    /**
     * Parallel execution errors
     */
    /** Requested parallel execution but feature not enabled/supported */
    PARALLEL_EXECUTION_NOT_SUPPORTED = "PARALLEL_EXECUTION_NOT_SUPPORTED",
    /** Convergence attempted before all dependencies completed */
    CONVERGENCE_DEPENDENCIES_NOT_MET = "CONVERGENCE_DEPENDENCIES_NOT_MET",
    /** Requested parallelism exceeds maximum allowed (10) */
    MAX_PARALLELISM_EXCEEDED = "MAX_PARALLELISM_EXCEEDED",
    /** Referenced parallel session not found in group */
    PARALLEL_SESSION_NOT_FOUND = "PARALLEL_SESSION_NOT_FOUND"
}
/**
 * Layer where the error occurred
 */
export type ErrorLayer = 'discovery' | 'planning' | 'execution' | 'session' | 'persistence';
/**
 * Standard error response structure
 */
export interface ErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
        details?: unknown;
        layer: ErrorLayer;
        timestamp: string;
    };
    isError: true;
}
/**
 * Custom error class for Creative Thinking errors
 */
export declare class CreativeThinkingError extends Error {
    readonly code: ErrorCode;
    readonly layer: ErrorLayer;
    readonly details?: unknown | undefined;
    readonly timestamp: string;
    constructor(code: ErrorCode, message: string, layer: ErrorLayer, details?: unknown | undefined);
    /**
     * Convert to standard error response format
     */
    toResponse(): ErrorResponse;
}
/**
 * Validation error with field information
 */
export declare class ValidationError extends CreativeThinkingError {
    readonly field?: string | undefined;
    constructor(code: ErrorCode, message: string, field?: string | undefined, details?: unknown);
}
/**
 * Session-related error
 */
export declare class SessionError extends CreativeThinkingError {
    readonly sessionId?: string | undefined;
    constructor(code: ErrorCode, message: string, sessionId?: string | undefined, details?: unknown);
}
/**
 * Plan-related error
 */
export declare class PlanError extends CreativeThinkingError {
    readonly planId?: string | undefined;
    constructor(code: ErrorCode, message: string, planId?: string | undefined, details?: unknown);
}
/**
 * Execution-related error
 */
export declare class ExecutionError extends CreativeThinkingError {
    constructor(code: ErrorCode, message: string, details?: unknown);
}
/**
 * Persistence-related error
 */
export declare class PersistenceError extends CreativeThinkingError {
    readonly operation?: string | undefined;
    constructor(code: ErrorCode, message: string, operation?: string | undefined, details?: unknown);
}
/**
 * Helper function to create error response from any error
 */
export declare function createErrorResponse(error: unknown, layer?: ErrorLayer): ErrorResponse;
/**
 * Type guard to check if a response is an error
 */
export declare function isErrorResponse(response: unknown): response is ErrorResponse;
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
export declare class ParallelExecutionError extends CreativeThinkingError {
    readonly failedPlans?: string[] | undefined;
    readonly partialResults?: unknown[] | undefined;
    constructor(code: ErrorCode.PARALLEL_EXECUTION_NOT_SUPPORTED | ErrorCode.MAX_PARALLELISM_EXCEEDED | ErrorCode.CONVERGENCE_DEPENDENCIES_NOT_MET | ErrorCode.PARALLEL_SESSION_NOT_FOUND, message: string, failedPlans?: string[] | undefined, partialResults?: unknown[] | undefined, details?: unknown);
}
//# sourceMappingURL=types.d.ts.map