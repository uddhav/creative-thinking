/**
 * Standard error types and interfaces for the Creative Thinking MCP Server
 */

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_TECHNIQUE = 'INVALID_TECHNIQUE',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',

  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_ALREADY_EXISTS = 'SESSION_ALREADY_EXISTS',
  SESSION_TOO_LARGE = 'SESSION_TOO_LARGE',
  MAX_SESSIONS_EXCEEDED = 'MAX_SESSIONS_EXCEEDED',

  // Plan errors
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  PLAN_EXPIRED = 'PLAN_EXPIRED',

  // Business logic errors
  INVALID_STEP = 'INVALID_STEP',
  INVALID_STEP_SEQUENCE = 'INVALID_STEP_SEQUENCE',
  TECHNIQUE_NOT_SUPPORTED = 'TECHNIQUE_NOT_SUPPORTED',
  TECHNIQUE_MISMATCH = 'TECHNIQUE_MISMATCH',
  WORKFLOW_REQUIRED = 'WORKFLOW_REQUIRED',

  // Risk and ergodicity errors
  BLOCKED_ACTION = 'BLOCKED_ACTION',
  ERGODICITY_CHECK_REQUIRED = 'ERGODICITY_CHECK_REQUIRED',
  INVALID_ERGODICITY_RESPONSE = 'INVALID_ERGODICITY_RESPONSE',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PERSISTENCE_ERROR = 'PERSISTENCE_ERROR',
  PERSISTENCE_NOT_AVAILABLE = 'PERSISTENCE_NOT_AVAILABLE',
  PERSISTENCE_WRITE_FAILED = 'PERSISTENCE_WRITE_FAILED',
  PERSISTENCE_READ_FAILED = 'PERSISTENCE_READ_FAILED',

  // Resource errors
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
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
export class CreativeThinkingError extends Error {
  public readonly timestamp: string;

  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly layer: ErrorLayer,
    public readonly details?: unknown
  ) {
    super(message);
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
  toResponse(): ErrorResponse {
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
  constructor(
    code: ErrorCode,
    message: string,
    public readonly field?: string,
    details?: unknown
  ) {
    super(code, message, 'discovery', details);
    this.name = 'ValidationError';
  }
}

/**
 * Session-related error
 */
export class SessionError extends CreativeThinkingError {
  constructor(
    code: ErrorCode,
    message: string,
    public readonly sessionId?: string,
    details?: unknown
  ) {
    super(code, message, 'session', details);
    this.name = 'SessionError';
  }
}

/**
 * Plan-related error
 */
export class PlanError extends CreativeThinkingError {
  constructor(
    code: ErrorCode,
    message: string,
    public readonly planId?: string,
    details?: unknown
  ) {
    super(code, message, 'planning', details);
    this.name = 'PlanError';
  }
}

/**
 * Execution-related error
 */
export class ExecutionError extends CreativeThinkingError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, 'execution', details);
    this.name = 'ExecutionError';
  }
}

/**
 * Persistence-related error
 */
export class PersistenceError extends CreativeThinkingError {
  constructor(
    code: ErrorCode,
    message: string,
    public readonly operation?: string,
    details?: unknown
  ) {
    super(code, message, 'persistence', details);
    this.name = 'PersistenceError';
  }
}

/**
 * Helper function to create error response from any error
 */
export function createErrorResponse(
  error: unknown,
  layer: ErrorLayer = 'execution'
): ErrorResponse {
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
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'isError' in response &&
    response.isError === true &&
    'error' in response
  );
}
