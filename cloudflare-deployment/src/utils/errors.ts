/**
 * Structured error handling for Cloudflare deployment
 */

import { randomUUID } from 'node:crypto';

export enum ErrorCode {
  // Validation errors (400-499)
  INVALID_TECHNIQUE = 'INVALID_TECHNIQUE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_STEP_NUMBER = 'INVALID_STEP_NUMBER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',

  // Resource errors (404)
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',

  // State errors (409)
  SESSION_LOCKED = 'SESSION_LOCKED',
  STEP_ALREADY_COMPLETED = 'STEP_ALREADY_COMPLETED',

  // System errors (500-599)
  KV_OPERATION_FAILED = 'KV_OPERATION_FAILED',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface StructuredError {
  code: ErrorCode;
  message: string;
  details?: any;
  recovery?: string;
  httpStatus?: number;
  timestamp: string;
  requestId?: string;
}

export class McpError extends Error {
  public code: ErrorCode;
  public details?: any;
  public recovery?: string;
  public httpStatus: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    recovery?: string,
    httpStatus: number = 500
  ) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.details = details;
    this.recovery = recovery;
    this.httpStatus = httpStatus;
  }

  toJSON(): StructuredError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      recovery: this.recovery,
      httpStatus: this.httpStatus,
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
    };
  }
}

/**
 * Error factory functions for common scenarios
 */
export const Errors = {
  invalidTechnique(technique: string, validTechniques: string[]): McpError {
    return new McpError(
      ErrorCode.INVALID_TECHNIQUE,
      `Invalid technique: ${technique}`,
      { technique, validTechniques },
      `Use one of the valid techniques: ${validTechniques.join(', ')}`,
      400
    );
  },

  missingRequiredField(field: string, context?: string): McpError {
    return new McpError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${field}`,
      { field, context },
      `Provide the required field '${field}' in your request`,
      400
    );
  },

  invalidStepNumber(step: number, totalSteps: number): McpError {
    return new McpError(
      ErrorCode.INVALID_STEP_NUMBER,
      `Invalid step number: ${step}`,
      { currentStep: step, totalSteps },
      `Step must be between 1 and ${totalSteps}`,
      400
    );
  },

  sessionNotFound(sessionId: string): McpError {
    return new McpError(
      ErrorCode.SESSION_NOT_FOUND,
      `Session not found: ${sessionId}`,
      { sessionId },
      'Create a new session or check the session ID',
      404
    );
  },

  planNotFound(planId: string): McpError {
    return new McpError(
      ErrorCode.PLAN_NOT_FOUND,
      `Plan not found: ${planId}`,
      { planId },
      'Create a new plan using plan_thinking_session',
      404
    );
  },

  kvOperationFailed(operation: string, error: any): McpError {
    return new McpError(
      ErrorCode.KV_OPERATION_FAILED,
      `KV operation failed: ${operation}`,
      { operation, originalError: error?.message },
      'Retry the operation or contact support if the issue persists',
      500
    );
  },

  rateLimitExceeded(limit: number, window: string): McpError {
    return new McpError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      { limit, window },
      `Wait before making more requests. Limit: ${limit} requests per ${window}`,
      429
    );
  },

  internalError(error: any): McpError {
    return new McpError(
      ErrorCode.INTERNAL_ERROR,
      'An internal error occurred',
      { originalError: error?.message },
      'Please try again later or contact support',
      500
    );
  },
};

/**
 * Sanitize stack traces to remove sensitive information
 */
function sanitizeStackTrace(stack?: string): string | undefined {
  if (!stack) return undefined;

  // Remove absolute paths and keep only relative paths
  return stack
    .split('\n')
    .map(line => {
      // Remove absolute paths (e.g., /home/user/project/...)
      return line.replace(/\/[\w\-\/\.]+\/(src|dist|node_modules)/g, '/$1');
    })
    .join('\n');
}

/**
 * Error response formatter for MCP protocol
 */
export function formatErrorResponse(error: unknown, environment?: string): any {
  const isDevelopment = environment === 'development';

  if (error instanceof McpError) {
    const errorJson = error.toJSON();
    // Only include stack traces in development
    if (!isDevelopment && errorJson.details?.stack) {
      errorJson.details.stack = sanitizeStackTrace(errorJson.details.stack);
    }
    return {
      isError: true,
      error: errorJson,
    };
  }

  if (error instanceof Error) {
    return {
      isError: true,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: randomUUID(),
        // Only include stack trace in development
        stack: isDevelopment ? error.stack : undefined,
      },
    };
  }

  return {
    isError: true,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unknown error occurred',
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
    },
  };
}
