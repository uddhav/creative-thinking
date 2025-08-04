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
export type ErrorCategory = 'workflow' | 'validation' | 'state' | 'system' | 'permission' | 'configuration' | 'technique' | 'convergence';
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
export declare class CreativeThinkingError extends Error implements EnhancedError {
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
    constructor(config: EnhancedError);
    /**
     * Convert to JSON for serialization
     */
    toJSON(): EnhancedError & {
        timestamp: number;
    };
    /**
     * Get formatted error for LLM consumption
     */
    getLLMFormat(): string;
}
/**
 * Workflow-related errors
 */
export declare class WorkflowError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, unknown>);
}
/**
 * Validation-related errors
 */
export declare class ValidationError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, unknown>);
}
/**
 * State-related errors
 */
export declare class StateError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, unknown>);
}
/**
 * System-related errors
 */
export declare class SystemError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, unknown>, retryable?: boolean);
}
/**
 * Error codes for consistent identification
 */
export declare const ErrorCodes: {
    readonly INVALID_INPUT: "E101";
    readonly MISSING_PARAMETER: "E102";
    readonly INVALID_TYPE: "E103";
    readonly OUT_OF_RANGE: "E104";
    readonly WRONG_TOOL_ORDER: "E201";
    readonly PLAN_NOT_FOUND: "E202";
    readonly WORKFLOW_SKIP: "E203";
    readonly TECHNIQUE_MISMATCH: "E204";
    readonly MISSING_PLAN: "E205";
    readonly INVALID_STEP: "E206";
    readonly DISCOVERY_SKIPPED: "E207";
    readonly PLANNING_SKIPPED: "E208";
    readonly UNAUTHORIZED_TECHNIQUE: "E209";
    readonly WORKFLOW_BYPASS_ATTEMPT: "E210";
    readonly SESSION_NOT_FOUND: "E301";
    readonly SESSION_EXPIRED: "E302";
    readonly INVALID_STATE: "E303";
    readonly FILE_IO_ERROR: "E401";
    readonly MEMORY_ERROR: "E402";
    readonly PERMISSION_ERROR: "E403";
    readonly NETWORK_ERROR: "E404";
    readonly ACCESS_DENIED: "E501";
    readonly RATE_LIMIT_EXCEEDED: "E502";
    readonly MISSING_CONFIG: "E601";
    readonly INVALID_CONFIG: "E602";
    readonly TECHNIQUE_EXECUTION_FAILED: "E701";
    readonly TECHNIQUE_DEPENDENCY_MISSING: "E702";
    readonly TECHNIQUE_NOT_FOUND: "E703";
    readonly TECHNIQUE_MISCONFIGURED: "E704";
    readonly CONVERGENCE_FAILED: "E801";
    readonly PARALLEL_TIMEOUT: "E802";
    readonly DEPENDENCY_ERROR: "E803";
};
/**
 * Factory for creating common errors
 */
export declare class ErrorFactory {
    /**
     * Create a session not found error
     */
    static sessionNotFound(sessionId: string): StateError;
    /**
     * Create a plan not found error
     */
    static planNotFound(planId: string): StateError;
    /**
     * Create a wrong tool order error
     */
    static wrongToolOrder(currentTool: string, expectedTools: string[]): WorkflowError;
    /**
     * Create a technique mismatch error
     */
    static techniqueMismatch(planTechnique: LateralTechnique, requestedTechnique: LateralTechnique, planId: string): WorkflowError;
    /**
     * Create an invalid input error
     */
    static invalidInput(parameter: string, expectedType: string, actualValue: unknown): ValidationError;
    /**
     * Create a missing parameter error
     */
    static missingParameter(parameter: string, tool: string): ValidationError;
    /**
     * Create a file I/O error
     */
    static fileIOError(operation: string, path: string, originalError?: Error): SystemError;
    /**
     * Create a memory error
     */
    static memoryError(operation: string, memoryUsageMB?: number): SystemError;
    /**
     * Create a convergence error
     */
    static convergenceError(reason: string, parallelPlans: string[]): CreativeThinkingError;
    /**
     * Create a missing field error
     */
    static missingField(fieldName: string): ValidationError;
    /**
     * Create an invalid field type error
     */
    static invalidFieldType(fieldName: string, expectedType: string, actualType: string): ValidationError;
    /**
     * Create an invalid technique error
     */
    static invalidTechnique(technique: string): ValidationError;
    /**
     * Create a workflow order error
     */
    static workflowOrder(currentTool: string, expectedTool: string): WorkflowError;
    /**
     * Create a missing workflow step error
     */
    static missingWorkflowStep(missingStep: string): WorkflowError;
    /**
     * Create a workflow skip detected error
     */
    static workflowSkipDetected(): WorkflowError;
    /**
     * Create a discovery skipped error
     */
    static discoverySkipped(): WorkflowError;
    /**
     * Create a planning skipped error
     */
    static planningSkipped(): WorkflowError;
    /**
     * Create an unauthorized technique error
     */
    static unauthorizedTechnique(technique: string, recommendedTechniques: string[]): WorkflowError;
    /**
     * Create a workflow bypass attempt error
     */
    static workflowBypassAttempt(attemptType: string): WorkflowError;
    /**
     * Create a session expired error
     */
    static sessionExpired(sessionId: string, expiryMinutes: number): StateError;
    /**
     * Create an invalid step error
     */
    static invalidStep(requestedStep: number, maxSteps: number): StateError;
    /**
     * Create a file access error
     */
    static fileAccessError(filePath: string, reason: string): SystemError;
    /**
     * Create a memory limit exceeded error
     */
    static memoryLimitExceeded(usagePercent: number): SystemError;
    /**
     * Create a persistence error
     */
    static persistenceError(operation: string, reason: string): SystemError;
    /**
     * Create an access denied error
     */
    static accessDenied(resource: string): CreativeThinkingError;
    /**
     * Create a rate limit exceeded error
     */
    static rateLimitExceeded(retryAfterSeconds: number): CreativeThinkingError;
    /**
     * Create a missing configuration error
     */
    static missingConfiguration(configKey: string): CreativeThinkingError;
    /**
     * Create an invalid configuration error
     */
    static invalidConfiguration(configKey: string, value: string, expectedFormat: string): CreativeThinkingError;
    /**
     * Create a technique execution failed error
     */
    static techniqueExecutionFailed(technique: string, reason: string): CreativeThinkingError;
    /**
     * Create a technique dependency missing error
     */
    static techniqueDependencyMissing(technique: string, dependency: string): CreativeThinkingError;
    /**
     * Create a parallel execution error
     */
    static parallelExecutionError(failedPlans: string[], reason: string): CreativeThinkingError;
    /**
     * Create a convergence failure error
     */
    static convergenceFailure(totalPlans: number, completedPlans: number): CreativeThinkingError;
    /**
     * Create a convergence dependency not met error
     */
    static convergenceDependencyNotMet(planId: string, missingDependencies: string[]): CreativeThinkingError;
}
/**
 * Error recovery helper
 */
export declare class ErrorRecovery {
    /**
     * Check if an error is recoverable
     */
    static isRecoverable(error: Error): boolean;
    /**
     * Check if an error is retryable
     */
    static isRetryable(error: Error): boolean;
    /**
     * Get retry delay for an error
     */
    static getRetryDelay(error: Error, attemptNumber: number): number;
    /**
     * Execute with retry
     */
    static executeWithRetry<T>(operation: () => Promise<T>, maxAttempts?: number, onRetry?: (error: Error, attempt: number) => void): Promise<T>;
}
//# sourceMappingURL=enhanced-errors.d.ts.map