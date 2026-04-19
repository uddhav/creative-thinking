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
        'Review the full error message above for specific details',
        'Verify your request follows the three-step workflow: discover → plan → execute',
        'If using a custom integration, ensure all parameters are correctly formatted',
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
      // Preserve the detailed message from validation handlers
      // The handlers now provide helpful, detailed messages with examples
      const details = error.details as Record<string, unknown> | undefined;
      const acceptedFields = details?.acceptedFields as string[] | undefined;
      const example = details?.example;

      return new EnhancedError({
        code: mapping.code,
        message: error.message, // Use the detailed message from the handler
        category: 'validation',
        severity: mapping.severity,
        recovery: acceptedFields
          ? [
              `Provide one of the accepted fields: ${acceptedFields.join(', ')}`,
              'Check the error message above for the exact format and example',
              'These fields help structure your thinking and improve results',
            ]
          : mapping.recovery,
        context: {
          ...enhancedContext,
          field: error.field,
          example,
        },
      });
    }

    if (error instanceof PersistenceError) {
      return this.errorFactory.persistenceError(error.operation || 'unknown', error.message);
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
        code: 'E404', // NETWORK_ERROR
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
        'Check the error stack trace for the exact failure point',
        'Verify all input parameters match expected types and formats',
        'If the error persists, it may indicate a server-side issue - retry after a moment',
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
        recovery: [
          'Ensure your input is valid JSON format',
          'Verify required fields: problem (string), techniques (array), etc.',
          'Example: { "problem": "How to innovate?", "techniques": ["six_hats"] }',
        ],
      },
      [ErrorCode.MISSING_REQUIRED_FIELD]: {
        code: 'E101',
        category: 'validation',
        severity: 'medium',
        recovery: [
          'Provide all required fields',
          'Required fields: problem, techniques (array), timeframe (optional)',
        ],
      },
      [ErrorCode.INVALID_TECHNIQUE]: {
        code: 'E103',
        category: 'validation',
        severity: 'medium',
        recovery: [
          'Use one of: six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, triz, neural_state, temporal_work, cross_cultural, collective_intel, disney_method, nine_windows',
          'Call discover_techniques first to get personalized recommendations',
          'Techniques must match those specified in your plan',
        ],
      },
      [ErrorCode.INVALID_FIELD_VALUE]: {
        code: 'E102',
        category: 'validation',
        severity: 'medium',
        recovery: [
          'Verify the field value matches the expected format',
          'Common issues: strings instead of arrays, missing quotes in JSON',
          'Use typeof to check your value type before sending',
        ],
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
        recovery: [
          'Call plan_thinking_session to create a new plan',
          'Verify your planId matches the one returned from planning',
          'Plans expire after 1 hour of inactivity',
        ],
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
        code: 'E206',
        category: 'state',
        severity: 'medium',
        recovery: [
          'Steps must be between 1 and totalSteps',
          'Current step should increment by 1 from previous step',
          'Each technique has a specific number of steps (e.g., six_hats has 6)',
        ],
      },
      [ErrorCode.INVALID_STEP_SEQUENCE]: {
        code: 'E206',
        category: 'workflow',
        severity: 'high',
        recovery: ['Follow correct step order', 'Reset to step 1'],
      },
      [ErrorCode.TECHNIQUE_MISMATCH]: {
        code: 'E204',
        category: 'workflow',
        severity: 'high',
        recovery: ['Use technique from plan', 'Create new plan with desired technique'],
      },
      [ErrorCode.TECHNIQUE_NOT_SUPPORTED]: {
        code: 'E703',
        category: 'technique',
        severity: 'medium',
        recovery: ['Use supported technique', 'Check available techniques'],
      },

      // System errors
      [ErrorCode.INTERNAL_ERROR]: {
        code: 'E999',
        category: 'system',
        severity: 'critical',
        recovery: [
          'Wait a moment and retry the operation',
          'Check system logs for more detailed error information',
          'Ensure the server has sufficient resources (memory, disk space)',
        ],
      },
      [ErrorCode.PERSISTENCE_ERROR]: {
        code: 'E401',
        category: 'system',
        severity: 'high',
        recovery: [
          'Verify storage path has write permissions',
          'Set autoSave: false to use memory-only mode',
          'Check disk space availability',
        ],
      },
      [ErrorCode.PERSISTENCE_NOT_AVAILABLE]: {
        code: 'E401',
        category: 'system',
        severity: 'medium',
        recovery: ['Use in-memory mode', 'Check configuration'],
      },
      [ErrorCode.PERSISTENCE_WRITE_FAILED]: {
        code: 'E401',
        category: 'system',
        severity: 'high',
        recovery: ['Check disk space', 'Verify permissions'],
      },
      [ErrorCode.PERSISTENCE_READ_FAILED]: {
        code: 'E401',
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
        code: 'E404',
        category: 'system',
        severity: 'medium',
        recovery: [
          'Wait 1-2 seconds before retrying',
          'If timeout persists, operation may be too complex',
          'Consider breaking down into smaller steps',
        ],
      },

      // Risk errors
      [ErrorCode.BLOCKED_ACTION]: {
        code: 'E501',
        category: 'permission',
        severity: 'critical',
        recovery: ['Review action', 'Check permissions'],
      },
      [ErrorCode.ERGODICITY_CHECK_REQUIRED]: {
        code: 'E701',
        category: 'technique',
        severity: 'high',
        recovery: ['Complete ergodicity check', 'Review risk assessment'],
      },
      [ErrorCode.INVALID_ERGODICITY_RESPONSE]: {
        code: 'E702',
        category: 'technique',
        severity: 'medium',
        recovery: ['Check response format', 'Review ergodicity documentation'],
      },
    };

    return (
      mappings[code] || {
        code: 'E999',
        category: 'system',
        severity: 'high',
        recovery: [
          'Review the specific error details provided above',
          'Ensure you are following the correct workflow sequence',
          'Verify all required parameters are present and correctly typed',
        ],
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
