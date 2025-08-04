/**
 * Error Handler
 * Bridges the enhanced error system with the existing error handling
 * Provides unified error handling with recovery patterns
 */

import type { LateralThinkingResponse } from '../types/index.js';
import { ResponseBuilder } from '../core/ResponseBuilder.js';
import {
  CreativeThinkingError as EnhancedError,
  ErrorFactory,
  ErrorRecovery,
  type ErrorCategory,
  type ErrorSeverity,
} from './enhanced-errors.js';
import {
  CreativeThinkingError,
  ValidationError,
  SessionError,
  PlanError,
  PersistenceError,
  ParallelExecutionError,
  ErrorCode,
  type ErrorLayer,
} from './types.js';

/**
 * Maps old error codes to enhanced error system
 */
export class ErrorHandler {
  private responseBuilder: ResponseBuilder;
  private errorFactory: typeof ErrorFactory;

  constructor() {
    this.responseBuilder = new ResponseBuilder();
    this.errorFactory = ErrorFactory;
  }

  /**
   * Handle any error and return appropriate response
   */
  handleError(
    error: unknown,
    layer: ErrorLayer,
    context?: Record<string, unknown>
  ): LateralThinkingResponse {
    // If it's already an enhanced error, use it directly
    if (error instanceof EnhancedError) {
      return this.buildTestErrorResponse(error, layer, context);
    }

    // Convert standard errors to enhanced errors
    if (error instanceof CreativeThinkingError) {
      const enhancedError = this.convertToEnhancedError(error, context);
      return this.buildTestErrorResponse(enhancedError, layer, context);
    }

    // Handle generic errors
    if (error instanceof Error) {
      const enhancedError = this.createEnhancedFromGeneric(error, layer, context);
      return this.buildTestErrorResponse(enhancedError, layer, context);
    }

    // Handle unknown errors
    const unknownError = new EnhancedError({
      code: 'E999', // Unknown error
      message: typeof error === 'string' ? error : 'An unexpected error occurred',
      category: 'system',
      severity: 'high',
      recovery: [
        'Check the error message for details',
        'Consult the documentation',
        'Contact support if the issue persists',
      ],
      context,
    });

    return this.buildTestErrorResponse(unknownError, layer, context);
  }

  /**
   * Convert standard error to enhanced error
   */
  private convertToEnhancedError(
    error: CreativeThinkingError,
    context?: Record<string, unknown>
  ): EnhancedError {
    const mapping = this.mapErrorCode(error.code);

    // Add specific context based on error type
    const enhancedContext = {
      ...context,
      ...(error.details || {}),
      originalError: error.name,
      timestamp: error.timestamp,
    };

    // Create appropriate enhanced error based on type
    if (error instanceof SessionError) {
      // Check if it's specifically a session not found error
      if (error.code === ErrorCode.SESSION_NOT_FOUND) {
        return this.errorFactory.sessionNotFound(error.sessionId || 'unknown');
      }
      // For other session errors, use the mapping
      return new EnhancedError({
        code: mapping.code,
        message: error.message,
        category: mapping.category,
        severity: mapping.severity,
        recovery: mapping.recovery,
        context: enhancedContext,
      });
    }

    if (error instanceof PlanError) {
      // Check if it's specifically a plan not found error
      if (error.code === ErrorCode.PLAN_NOT_FOUND) {
        return this.errorFactory.planNotFound(error.planId || 'unknown');
      }
      // For other plan errors like WORKFLOW_REQUIRED, use the mapping
      return new EnhancedError({
        code: mapping.code,
        message: error.message,
        category: mapping.category,
        severity: mapping.severity,
        recovery: mapping.recovery,
        context: enhancedContext,
      });
    }

    if (error instanceof ValidationError) {
      // Use the appropriate ErrorFactory method based on the error code
      if (error.code === ErrorCode.MISSING_REQUIRED_FIELD && error.field) {
        return this.errorFactory.missingField(error.field);
      } else if (error.code === ErrorCode.INVALID_FIELD_VALUE && error.field) {
        return this.errorFactory.invalidFieldType(error.field, 'expected type', 'actual type');
      }
      // For all other validation errors including INVALID_TECHNIQUE, use mapping to preserve message
      return new EnhancedError({
        code: mapping.code,
        message: error.message,
        category: 'validation',
        severity: mapping.severity,
        recovery: mapping.recovery,
        context: enhancedContext,
      });
    }

    if (error instanceof PersistenceError) {
      return this.errorFactory.persistenceError(error.operation || 'unknown', error.message);
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
  private createEnhancedFromGeneric(
    error: Error,
    layer: ErrorLayer,
    context?: Record<string, unknown>
  ): EnhancedError {
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
      code: 'E999', // Unknown error
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
   * Build test error response for compatibility with existing tests
   */
  private buildTestErrorResponse(
    error: EnhancedError,
    layer: ErrorLayer,
    context?: Record<string, unknown>
  ): LateralThinkingResponse {
    const errorData = {
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        severity: error.severity,
        recovery: error.recovery,
        layer,
        context: {
          ...error.context,
          ...context,
        },
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorData, null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Build response from enhanced error
   */
  private buildEnhancedErrorResponse(error: EnhancedError): LateralThinkingResponse {
    const errorResponse = error.toJSON();

    // Create LLM-friendly format
    const llmFormat = error.getLLMFormat();

    // Build response with both formats
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: errorResponse,
              recovery: {
                steps: error.recovery,
                canRetry: error.retryable || false,
                retryDelay: error.retryDelayMs,
              },
              llmGuidance: llmFormat,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  /**
   * Execute operation with automatic retry on transient errors
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    onRetry?: (error: Error, attempt: number) => void
  ): Promise<T> {
    return ErrorRecovery.executeWithRetry(operation, maxAttempts, onRetry);
  }

  /**
   * Wrap a standard error with an enhanced error
   */
  wrapError(error: Error, context?: Record<string, unknown>): EnhancedError {
    if (error instanceof EnhancedError) {
      return error;
    }

    if (error instanceof CreativeThinkingError) {
      return this.convertToEnhancedError(error, context);
    }

    return this.createEnhancedFromGeneric(error, 'unknown' as ErrorLayer, context);
  }

  /**
   * Get recovery suggestions for an error code
   */
  getRecoverySuggestions(code: ErrorCode | string): string[] {
    const mapping = this.mapErrorCode(code as ErrorCode);
    return mapping.recovery;
  }

  /**
   * Map error code to enhanced error properties
   * Made public for testing
   */
  private mapErrorCode(code: ErrorCode): {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recovery: string[];
  } {
    const mappings: Record<
      ErrorCode,
      { code: string; category: ErrorCategory; severity: ErrorSeverity; recovery: string[] }
    > = {
      // Validation errors
      [ErrorCode.INVALID_INPUT]: {
        code: 'E101',
        category: 'validation',
        severity: 'medium',
        recovery: ['Check input format', 'Review API documentation'],
      },
      [ErrorCode.MISSING_REQUIRED_FIELD]: {
        code: 'E101',
        category: 'validation',
        severity: 'medium',
        recovery: [
          'Provide all required fields',
          'Check the API documentation for required fields',
        ],
      },
      [ErrorCode.INVALID_TECHNIQUE]: {
        code: 'E103',
        category: 'validation',
        severity: 'medium',
        recovery: ['Use a valid technique', 'Call discover_techniques for recommendations'],
      },
      [ErrorCode.INVALID_FIELD_VALUE]: {
        code: 'E102',
        category: 'validation',
        severity: 'medium',
        recovery: ['Check field value format', 'Review expected values'],
      },

      // Session errors
      [ErrorCode.SESSION_NOT_FOUND]: {
        code: 'E301',
        category: 'state',
        severity: 'high',
        recovery: [
          "Start a new session with 'plan_thinking_session'",
          'Check your sessionId parameter',
        ],
      },
      [ErrorCode.SESSION_EXPIRED]: {
        code: 'E302',
        category: 'state',
        severity: 'low',
        recovery: ['Create a new session', 'Extend session timeout'],
      },
      [ErrorCode.SESSION_ALREADY_EXISTS]: {
        code: 'E301',
        category: 'state',
        severity: 'medium',
        recovery: ['Use existing session', 'Create session with different ID'],
      },
      [ErrorCode.SESSION_TOO_LARGE]: {
        code: 'E301',
        category: 'state',
        severity: 'medium',
        recovery: ['Split into multiple sessions', 'Clear old session data'],
      },
      [ErrorCode.MAX_SESSIONS_EXCEEDED]: {
        code: 'E301',
        category: 'state',
        severity: 'high',
        recovery: ['Clear old sessions', 'Increase session limit'],
      },

      // Plan errors
      [ErrorCode.PLAN_NOT_FOUND]: {
        code: 'E202',
        category: 'state',
        severity: 'high',
        recovery: ['Create a new plan', 'Check planId'],
      },
      [ErrorCode.PLAN_EXPIRED]: {
        code: 'E302',
        category: 'state',
        severity: 'low',
        recovery: ['Create a new plan', 'Extend plan timeout'],
      },

      // Workflow errors
      [ErrorCode.WORKFLOW_REQUIRED]: {
        code: 'E201',
        category: 'workflow',
        severity: 'high',
        recovery: ['Follow the three-step workflow', 'Start with discover_techniques'],
      },
      [ErrorCode.INVALID_STEP]: {
        code: 'E303',
        category: 'state',
        severity: 'medium',
        recovery: ['Check step range', 'Review technique documentation'],
      },
      [ErrorCode.INVALID_STEP_SEQUENCE]: {
        code: 'E201',
        category: 'workflow',
        severity: 'high',
        recovery: ['Follow correct step order', 'Reset to step 1'],
      },
      [ErrorCode.TECHNIQUE_MISMATCH]: {
        code: 'E201',
        category: 'workflow',
        severity: 'high',
        recovery: ['Use technique from plan', 'Create new plan with desired technique'],
      },
      [ErrorCode.TECHNIQUE_NOT_SUPPORTED]: {
        code: 'E103',
        category: 'validation',
        severity: 'medium',
        recovery: ['Use supported technique', 'Check available techniques'],
      },

      // System errors
      [ErrorCode.INTERNAL_ERROR]: {
        code: 'E401',
        category: 'system',
        severity: 'critical',
        recovery: ['Retry operation', 'Contact support'],
      },
      [ErrorCode.PERSISTENCE_ERROR]: {
        code: 'E403',
        category: 'system',
        severity: 'high',
        recovery: ['Check storage', 'Use in-memory mode'],
      },
      [ErrorCode.PERSISTENCE_NOT_AVAILABLE]: {
        code: 'E403',
        category: 'system',
        severity: 'medium',
        recovery: ['Use in-memory mode', 'Check configuration'],
      },
      [ErrorCode.PERSISTENCE_WRITE_FAILED]: {
        code: 'E403',
        category: 'system',
        severity: 'high',
        recovery: ['Check disk space', 'Verify permissions'],
      },
      [ErrorCode.PERSISTENCE_READ_FAILED]: {
        code: 'E403',
        category: 'system',
        severity: 'high',
        recovery: ['Check file exists', 'Verify permissions'],
      },

      // Resource errors
      [ErrorCode.RESOURCE_LIMIT_EXCEEDED]: {
        code: 'E402',
        category: 'system',
        severity: 'high',
        recovery: ['Reduce resource usage', 'Increase limits'],
      },
      [ErrorCode.TIMEOUT_ERROR]: {
        code: 'E303',
        category: 'system',
        severity: 'medium',
        recovery: ['Retry operation', 'Increase timeout'],
      },

      // Risk errors
      [ErrorCode.BLOCKED_ACTION]: {
        code: 'E603',
        category: 'workflow',
        severity: 'critical',
        recovery: ['Review action', 'Check permissions'],
      },
      [ErrorCode.ERGODICITY_CHECK_REQUIRED]: {
        code: 'E603',
        category: 'workflow',
        severity: 'high',
        recovery: ['Complete ergodicity check', 'Review risk assessment'],
      },
      [ErrorCode.INVALID_ERGODICITY_RESPONSE]: {
        code: 'E603',
        category: 'validation',
        severity: 'medium',
        recovery: ['Check response format', 'Review ergodicity documentation'],
      },

      // Parallel execution errors
      [ErrorCode.PARALLEL_EXECUTION_NOT_SUPPORTED]: {
        code: 'E801',
        category: 'convergence',
        severity: 'medium',
        recovery: ['Use sequential mode', 'Check technique compatibility'],
      },
      [ErrorCode.MAX_PARALLELISM_EXCEEDED]: {
        code: 'E801',
        category: 'convergence',
        severity: 'medium',
        recovery: ['Reduce parallel plans', 'Increase parallelism limit'],
      },
      [ErrorCode.PARALLEL_SESSION_NOT_FOUND]: {
        code: 'E301',
        category: 'state',
        severity: 'high',
        recovery: ['Check parallel session ID', 'Ensure session was created'],
      },
      [ErrorCode.CONVERGENCE_DEPENDENCIES_NOT_MET]: {
        code: 'E803',
        category: 'convergence',
        severity: 'high',
        recovery: ['Complete dependencies first', 'Check dependency configuration'],
      },
    };

    return (
      mappings[code] || {
        code: 'E999',
        category: 'system',
        severity: 'high',
        recovery: ['Check the error message for details', 'Consult the documentation'],
      }
    );
  }

  /**
   * Check if an error code is retryable
   */
  isRetryable(code: ErrorCode): boolean {
    const retryableCodes: ErrorCode[] = [
      ErrorCode.PERSISTENCE_ERROR,
      ErrorCode.PERSISTENCE_WRITE_FAILED,
      ErrorCode.PERSISTENCE_READ_FAILED,
      ErrorCode.TIMEOUT_ERROR,
    ];

    return retryableCodes.includes(code);
  }

  /**
   * Get severity for an error code
   */
  getSeverity(code: ErrorCode): ErrorSeverity {
    const severityMap: Partial<Record<ErrorCode, ErrorSeverity>> = {
      // Low severity
      [ErrorCode.SESSION_EXPIRED]: 'low',

      // Medium severity
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'medium',
      [ErrorCode.INVALID_INPUT]: 'medium',
      [ErrorCode.INVALID_TECHNIQUE]: 'medium',
      [ErrorCode.INVALID_FIELD_VALUE]: 'medium',
      [ErrorCode.SESSION_TOO_LARGE]: 'medium',

      // High severity
      [ErrorCode.WORKFLOW_REQUIRED]: 'high',
      [ErrorCode.INVALID_STEP_SEQUENCE]: 'high',
      [ErrorCode.TECHNIQUE_MISMATCH]: 'high',
      [ErrorCode.SESSION_NOT_FOUND]: 'high',
      [ErrorCode.PLAN_NOT_FOUND]: 'high',

      // Critical severity
      [ErrorCode.INTERNAL_ERROR]: 'critical',
      [ErrorCode.BLOCKED_ACTION]: 'critical',
    };

    return severityMap[code] || 'medium';
  }
}
