/**
 * Enhanced Error System with Recovery Patterns
 * Provides detailed error information with recovery suggestions
 */

import type { LateralTechnique } from '../types/index.js';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for classification
 */
export type ErrorCategory =
  | 'workflow' // Wrong tool order, invalid workflow
  | 'validation' // Invalid input, missing parameters
  | 'state' // Session not found, invalid state
  | 'system' // File I/O, memory, network
  | 'permission' // Access denied, unauthorized
  | 'configuration' // Missing config, invalid settings
  | 'technique'; // Technique-specific errors

/**
 * Enhanced error interface with recovery information
 */
export interface EnhancedError {
  /**
   * Unique error code for identification
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Error category for classification
   */
  category: ErrorCategory;

  /**
   * Severity level
   */
  severity: ErrorSeverity;

  /**
   * Recovery suggestions in order of preference
   */
  recovery: string[];

  /**
   * Additional context about the error
   */
  context?: Record<string, unknown>;

  /**
   * Link to documentation
   */
  documentation?: string;

  /**
   * Whether this error can be automatically retried
   */
  retryable?: boolean;

  /**
   * Suggested retry delay in milliseconds
   */
  retryDelayMs?: number;

  /**
   * Original error if this wraps another error
   */
  cause?: Error;
}

/**
 * Base class for enhanced errors
 */
export class CreativeThinkingError extends Error implements EnhancedError {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recovery: string[];
  context?: Record<string, unknown>;
  documentation?: string;
  retryable?: boolean;
  retryDelayMs?: number;
  cause?: Error;
  timestamp: number;

  constructor(config: EnhancedError) {
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
  toJSON(): EnhancedError & { timestamp: number } {
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
  getLLMFormat(): string {
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
  constructor(
    code: string,
    message: string,
    recovery: string[],
    context?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      category: 'workflow',
      severity: 'medium',
      recovery,
      context,
      // documentation: URL will be added when deployed
    });
    this.name = 'WorkflowError';
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends CreativeThinkingError {
  constructor(
    code: string,
    message: string,
    recovery: string[],
    context?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      category: 'validation',
      severity: 'medium',
      recovery,
      context,
      // documentation: URL will be added when deployed
    });
    this.name = 'ValidationError';
  }
}

/**
 * State-related errors
 */
export class StateError extends CreativeThinkingError {
  constructor(
    code: string,
    message: string,
    recovery: string[],
    context?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      category: 'state',
      severity: 'medium',
      recovery,
      context,
      // documentation: URL will be added when deployed
    });
    this.name = 'StateError';
  }
}

/**
 * System-related errors
 */
export class SystemError extends CreativeThinkingError {
  constructor(
    code: string,
    message: string,
    recovery: string[],
    context?: Record<string, unknown>,
    retryable: boolean = false
  ) {
    super({
      code,
      message,
      category: 'system',
      severity: 'high',
      recovery,
      context,
      retryable,
      retryDelayMs: retryable ? 1000 : undefined,
      // documentation: URL will be added when deployed
    });
    this.name = 'SystemError';
  }
}

/**
 * Error codes for consistent identification
 */
export const ErrorCodes = {
  // Validation errors (E100-E199)
  INVALID_INPUT: 'E101',
  MISSING_PARAMETER: 'E102',
  INVALID_TYPE: 'E103',
  OUT_OF_RANGE: 'E104',

  // Workflow errors (E200-E299)
  WRONG_TOOL_ORDER: 'E201',
  PLAN_NOT_FOUND: 'E202',
  WORKFLOW_SKIP: 'E203',
  TECHNIQUE_MISMATCH: 'E204',
  MISSING_PLAN: 'E205',
  INVALID_STEP: 'E206',
  DISCOVERY_SKIPPED: 'E207',
  PLANNING_SKIPPED: 'E208',
  UNAUTHORIZED_TECHNIQUE: 'E209',
  WORKFLOW_BYPASS_ATTEMPT: 'E210',

  // State errors (E300-E399)
  SESSION_NOT_FOUND: 'E301',
  SESSION_EXPIRED: 'E302',
  INVALID_STATE: 'E303',

  // System errors (E400-E499)
  FILE_IO_ERROR: 'E401',
  MEMORY_ERROR: 'E402',
  PERMISSION_ERROR: 'E403',
  NETWORK_ERROR: 'E404',

  // Permission errors (E500-E599)
  ACCESS_DENIED: 'E501',
  RATE_LIMIT_EXCEEDED: 'E502',

  // Configuration errors (E600-E699)
  MISSING_CONFIG: 'E601',
  INVALID_CONFIG: 'E602',

  // Technique errors (E700-E799)
  TECHNIQUE_EXECUTION_FAILED: 'E701',
  TECHNIQUE_DEPENDENCY_MISSING: 'E702',
  TECHNIQUE_NOT_FOUND: 'E703',
  TECHNIQUE_MISCONFIGURED: 'E704',

  // Reserved for future use (E800-E899)
  // Currently unused
} as const;

/**
 * Factory for creating common errors
 */
export class ErrorFactory {
  /**
   * Create a session not found error
   */
  static sessionNotFound(sessionId: string): StateError {
    return new StateError(
      ErrorCodes.SESSION_NOT_FOUND,
      `Session '${sessionId}' not found. The session may have expired or been deleted.`,
      [
        "Start a new session with 'plan_thinking_session'",
        'Check if the sessionId is correct',
        'If using persistence, ensure the session was saved',
        'List available sessions if persistence is enabled',
      ],
      { sessionId }
    );
  }

  /**
   * Create a plan not found error
   */
  static planNotFound(planId: string): StateError {
    return new StateError(
      ErrorCodes.PLAN_NOT_FOUND,
      `Plan '${planId}' not found. The plan may have been deleted or not created yet.`,
      [
        'Create a new plan with plan_thinking_session',
        'Check if the planId is correct',
        'Ensure the plan was created before executing steps',
      ],
      { planId }
    );
  }

  /**
   * Create a wrong tool order error
   */
  static wrongToolOrder(currentTool: string, expectedTools: string[]): WorkflowError {
    return new WorkflowError(
      ErrorCodes.WRONG_TOOL_ORDER,
      `Wrong tool order. Used '${currentTool}' but expected one of: ${expectedTools.join(', ')}`,
      [
        `Use ${expectedTools[0]} first`,
        'Check the workflow documentation',
        'Reset and start from the beginning',
      ],
      { currentTool, expectedTools }
    );
  }

  /**
   * Create a technique mismatch error
   */
  static techniqueMismatch(
    planTechnique: LateralTechnique,
    requestedTechnique: LateralTechnique,
    planId: string
  ): WorkflowError {
    return new WorkflowError(
      ErrorCodes.TECHNIQUE_MISMATCH,
      `Technique mismatch. Plan uses '${planTechnique}' but requested '${requestedTechnique}'`,
      [
        `Use technique '${planTechnique}' as specified in the plan`,
        'Create a new plan with the desired technique',
        'Check if you have the correct planId',
      ],
      { planTechnique, requestedTechnique, planId }
    );
  }

  /**
   * Create an invalid input error
   */
  static invalidInput(
    parameter: string,
    expectedType: string,
    actualValue: unknown
  ): ValidationError {
    return new ValidationError(
      ErrorCodes.INVALID_INPUT,
      `Invalid input for '${parameter}'. Expected ${expectedType} but got ${typeof actualValue}`,
      [
        `Provide a valid ${expectedType} for ${parameter}`,
        'Check the parameter documentation',
        'Use the example in the documentation',
      ],
      { parameter, expectedType, actualValue: String(actualValue) }
    );
  }

  /**
   * Create a missing parameter error
   */
  static missingParameter(parameter: string, tool: string): ValidationError {
    return new ValidationError(
      ErrorCodes.MISSING_PARAMETER,
      `Missing required parameter '${parameter}' for tool '${tool}'`,
      [
        `Add the '${parameter}' parameter to your request`,
        `Check the documentation for '${tool}' tool`,
        'Use the tool definition to see all required parameters',
      ],
      { parameter, tool }
    );
  }

  /**
   * Create a file I/O error
   */
  static fileIOError(operation: string, path: string, originalError?: Error): SystemError {
    return new SystemError(
      ErrorCodes.FILE_IO_ERROR,
      `File ${operation} failed for path: ${path}`,
      [
        'Check if the file/directory exists',
        'Verify file permissions',
        'Ensure sufficient disk space',
        'Try a different file path',
      ],
      { operation, path, error: originalError?.message },
      true // retryable
    );
  }

  /**
   * Create a memory error
   */
  static memoryError(operation: string, memoryUsageMB?: number): SystemError {
    return new SystemError(
      ErrorCodes.MEMORY_ERROR,
      `Memory error during ${operation}. System may be running low on memory.`,
      [
        'Close other applications to free memory',
        'Reduce the number of concurrent sessions',
        'Clear old sessions with cleanup functionality',
        'Restart the server',
      ],
      { operation, memoryUsageMB },
      true // retryable
    );
  }

  /**
   * Create a missing field error
   */
  static missingField(fieldName: string): ValidationError {
    return new ValidationError(
      ErrorCodes.INVALID_INPUT,
      `Missing required field: '${fieldName}'`,
      [
        `Provide the '${fieldName}' field in your request`,
        'Ensure all required fields are included: problem, techniques, etc.',
        'Example: { "problem": "your problem", "techniques": ["six_hats"] }',
      ],
      { field: fieldName }
    );
  }

  /**
   * Create an invalid field type error
   */
  static invalidFieldType(
    fieldName: string,
    expectedType: string,
    actualType: string
  ): ValidationError {
    return new ValidationError(
      ErrorCodes.MISSING_PARAMETER,
      `Invalid field type for '${fieldName}': expected ${expectedType}, got ${actualType}`,
      [
        `Change '${fieldName}' from ${actualType} to ${expectedType}`,
        `Example: if techniques is a string, change to array: ["${fieldName}"]`,
        'Use JSON.stringify() to verify your data structure',
      ],
      { field: fieldName, expectedType, actualType }
    );
  }

  /**
   * Create an invalid technique error
   */
  static invalidTechnique(technique: string): ValidationError {
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
      'cultural_integration',
      'collective_intel',
      'disney_method',
      'nine_windows',
    ];
    return new ValidationError(
      ErrorCodes.INVALID_TYPE,
      `Invalid technique: '${technique}'`,
      [
        'Use one of the valid techniques',
        `Valid techniques: ${validTechniques.slice(0, 5).join(', ')}, ...`,
        "Call 'discover_techniques' to get recommendations",
      ],
      { technique, validTechniques }
    );
  }

  /**
   * Create a workflow order error
   */
  static workflowOrder(currentTool: string, expectedTool: string): WorkflowError {
    return new WorkflowError(
      ErrorCodes.WRONG_TOOL_ORDER,
      `Workflow error: Called '${currentTool}' but should call '${expectedTool}' first`,
      [
        `Call '${expectedTool}' first`,
        'Follow the three-step workflow',
        'Reset and start from discovery',
      ],
      { currentTool, expectedTool }
    );
  }

  /**
   * Create a missing workflow step error
   */
  static missingWorkflowStep(missingStep: string): WorkflowError {
    return new WorkflowError(
      ErrorCodes.PLAN_NOT_FOUND,
      `Missing workflow step: '${missingStep}' must be called first`,
      [
        `Call '${missingStep}' first`,
        'Check the workflow documentation',
        'Start from the beginning with discovery',
      ],
      { missingStep }
    );
  }

  /**
   * Create a workflow skip detected error
   */
  static workflowSkipDetected(): WorkflowError {
    return new WorkflowError(
      ErrorCodes.WORKFLOW_SKIP,
      'Workflow skip detected: Attempting to bypass the three-layer architecture',
      [
        'Use the proper workflow: discover → plan → execute',
        'Do not skip directly to execution',
        'Call discover_techniques first',
      ],
      { severity: 'critical' }
    );
  }

  /**
   * Create a discovery skipped error
   */
  static discoverySkipped(): WorkflowError {
    return new WorkflowError(
      ErrorCodes.DISCOVERY_SKIPPED,
      'Discovery phase skipped: Cannot proceed without technique recommendations',
      [
        'Call discover_techniques with your problem statement',
        'Discovery provides personalized technique recommendations',
        'Example: discover_techniques({ problem: "How to innovate?" })',
      ],
      { requiredTool: 'discover_techniques', severity: 'high' }
    );
  }

  /**
   * Create a planning skipped error
   */
  static planningSkipped(): WorkflowError {
    return new WorkflowError(
      ErrorCodes.PLANNING_SKIPPED,
      'Planning phase skipped: Cannot execute without a plan',
      [
        'Call plan_thinking_session after discovery',
        'Planning creates a structured workflow for execution',
        'Use techniques recommended by discovery phase',
      ],
      { requiredTool: 'plan_thinking_session', severity: 'high' }
    );
  }

  /**
   * Create an unauthorized technique error
   */
  static unauthorizedTechnique(technique: string, recommendedTechniques: string[]): WorkflowError {
    return new WorkflowError(
      ErrorCodes.UNAUTHORIZED_TECHNIQUE,
      `Technique '${technique}' was not recommended by discovery phase`,
      [
        'Use one of the recommended techniques: ' + recommendedTechniques.join(', '),
        'Run discovery again if you need different recommendations',
        'Techniques should align with your problem type',
      ],
      { attemptedTechnique: technique, recommendedTechniques, severity: 'medium' }
    );
  }

  /**
   * Create a workflow bypass attempt error
   */
  static workflowBypassAttempt(attemptType: string): WorkflowError {
    return new WorkflowError(
      ErrorCodes.WORKFLOW_BYPASS_ATTEMPT,
      `Workflow bypass attempt detected: ${attemptType}`,
      [
        'Follow the mandatory three-step workflow',
        'Each phase builds on the previous one',
        'Bypassing steps leads to suboptimal results',
        'Start with discover_techniques',
      ],
      { attemptType, severity: 'critical' }
    );
  }

  /**
   * Create a session expired error
   */
  static sessionExpired(sessionId: string, expiryMinutes: number): StateError {
    return new StateError(
      ErrorCodes.SESSION_EXPIRED,
      `Session '${sessionId}' has expired after ${expiryMinutes} minutes of inactivity`,
      [
        'Create a new session',
        'Increase session timeout in configuration',
        'Use session persistence for longer sessions',
      ],
      { sessionId, expiryMinutes }
    );
  }

  /**
   * Create an invalid step error
   */
  static invalidStep(requestedStep: number, maxSteps: number): StateError {
    return new StateError(
      ErrorCodes.INVALID_STATE,
      `Invalid step: Step ${requestedStep} requested but technique only has ${maxSteps} steps`,
      [
        `Use a step between 1 and ${maxSteps}`,
        'Check the technique documentation',
        'Verify your step counter logic',
      ],
      { requestedStep, maxSteps }
    );
  }

  /**
   * Create a file access error
   */
  static fileAccessError(filePath: string, reason: string): SystemError {
    return new SystemError(
      ErrorCodes.FILE_IO_ERROR,
      `Cannot access file: ${filePath}`,
      [
        'Check file permissions',
        'Ensure the file exists',
        'Verify the file path is correct',
        'Check disk space and availability',
      ],
      { filePath, reason },
      true // retryable
    );
  }

  /**
   * Create a memory limit exceeded error
   */
  static memoryLimitExceeded(usagePercent: number): SystemError {
    return new SystemError(
      ErrorCodes.MEMORY_ERROR,
      `Memory limit exceeded: ${usagePercent}% of available memory in use`,
      [
        'Reduce session count',
        'Clear old sessions',
        'Increase memory allocation',
        'Restart the server',
      ],
      { usagePercent },
      false // not retryable
    );
  }

  /**
   * Create a persistence error
   */
  static persistenceError(operation: string, reason: string): SystemError {
    return new SystemError(
      ErrorCodes.PERMISSION_ERROR,
      `Persistence error during ${operation}: ${reason}`,
      [
        'Check storage availability',
        'Verify write permissions',
        'Use in-memory mode temporarily',
        'Retry the operation',
      ],
      { operation, reason },
      true // retryable
    );
  }

  /**
   * Create an access denied error
   */
  static accessDenied(resource: string): CreativeThinkingError {
    return new CreativeThinkingError({
      code: ErrorCodes.ACCESS_DENIED,
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
  static rateLimitExceeded(retryAfterSeconds: number): CreativeThinkingError {
    return new CreativeThinkingError({
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
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
  static missingConfiguration(configKey: string): CreativeThinkingError {
    return new CreativeThinkingError({
      code: ErrorCodes.MISSING_CONFIG,
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
  static invalidConfiguration(
    configKey: string,
    value: string,
    expectedFormat: string
  ): CreativeThinkingError {
    return new CreativeThinkingError({
      code: ErrorCodes.INVALID_CONFIG,
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
  static techniqueExecutionFailed(technique: string, reason: string): CreativeThinkingError {
    return new CreativeThinkingError({
      code: ErrorCodes.TECHNIQUE_EXECUTION_FAILED,
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
  static techniqueDependencyMissing(technique: string, dependency: string): CreativeThinkingError {
    return new CreativeThinkingError({
      code: ErrorCodes.TECHNIQUE_DEPENDENCY_MISSING,
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
}

/**
 * Error recovery helper
 */
export class ErrorRecovery {
  /**
   * Check if an error is recoverable
   */
  static isRecoverable(error: Error): boolean {
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
  static isRetryable(error: Error): boolean {
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
  static getRetryDelay(error: Error, attemptNumber: number): number {
    const maxDelay = 30000; // 30 seconds maximum
    let delay: number;

    if (error instanceof CreativeThinkingError && error.retryDelayMs) {
      // Exponential backoff with jitter
      delay = error.retryDelayMs * Math.pow(2, attemptNumber - 1);
    } else {
      // Default exponential backoff
      delay = 1000 * Math.pow(2, attemptNumber - 1);
    }

    // Cap at maximum delay
    return Math.min(delay, maxDelay);
  }

  /**
   * Execute with retry
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    onRetry?: (error: Error, attempt: number) => void
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error as Error) || attempt === maxAttempts) {
          throw error;
        }

        const delay = this.getRetryDelay(error as Error, attempt);

        if (onRetry) {
          onRetry(error as Error, attempt);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Operation failed after max attempts');
  }
}
