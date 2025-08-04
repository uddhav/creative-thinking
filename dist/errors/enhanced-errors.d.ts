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
    context?: Record<string, any>;
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
    context?: Record<string, any>;
    documentation?: string;
    retryable?: boolean;
    retryDelayMs?: number;
    cause?: Error;
    constructor(config: EnhancedError);
    /**
     * Convert to JSON for serialization
     */
    toJSON(): EnhancedError;
    /**
     * Get formatted error for LLM consumption
     */
    getLLMFormat(): string;
}
/**
 * Workflow-related errors
 */
export declare class WorkflowError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, any>);
}
/**
 * Validation-related errors
 */
export declare class ValidationError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, any>);
}
/**
 * State-related errors
 */
export declare class StateError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, any>);
}
/**
 * System-related errors
 */
export declare class SystemError extends CreativeThinkingError {
    constructor(code: string, message: string, recovery: string[], context?: Record<string, any>, retryable?: boolean);
}
/**
 * Error codes for consistent identification
 */
export declare const ErrorCodes: {
    readonly WRONG_TOOL_ORDER: "E001";
    readonly MISSING_PLAN: "E002";
    readonly TECHNIQUE_MISMATCH: "E003";
    readonly INVALID_STEP: "E004";
    readonly INVALID_INPUT: "E101";
    readonly MISSING_PARAMETER: "E102";
    readonly INVALID_TYPE: "E103";
    readonly OUT_OF_RANGE: "E104";
    readonly SESSION_NOT_FOUND: "E201";
    readonly PLAN_NOT_FOUND: "E202";
    readonly INVALID_STATE: "E203";
    readonly SESSION_EXPIRED: "E204";
    readonly FILE_IO_ERROR: "E301";
    readonly MEMORY_ERROR: "E302";
    readonly NETWORK_ERROR: "E303";
    readonly PERMISSION_ERROR: "E304";
    readonly MISSING_CONFIG: "E401";
    readonly INVALID_CONFIG: "E402";
    readonly TECHNIQUE_NOT_FOUND: "E501";
    readonly TECHNIQUE_ERROR: "E502";
    readonly CONVERGENCE_FAILED: "E601";
    readonly PARALLEL_TIMEOUT: "E602";
    readonly DEPENDENCY_ERROR: "E603";
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
    static invalidInput(parameter: string, expectedType: string, actualValue: any): ValidationError;
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
}
/**
 * Error recovery helper
 */
export declare class ErrorRecovery {
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