/**
 * Error Handler
 * Bridges the enhanced error system with the existing error handling
 * Provides unified error handling with recovery patterns
 */
import type { LateralThinkingResponse } from '../types/index.js';
import { CreativeThinkingError as EnhancedError, type ErrorSeverity } from './enhanced-errors.js';
import { ErrorCode, type ErrorLayer } from './types.js';
/**
 * Maps old error codes to enhanced error system
 */
export declare class ErrorHandler {
    private responseBuilder;
    private errorFactory;
    constructor();
    /**
     * Handle any error and return appropriate response
     */
    handleError(error: unknown, layer: ErrorLayer, context?: Record<string, unknown>): LateralThinkingResponse;
    /**
     * Convert standard error to enhanced error
     */
    private convertToEnhancedError;
    /**
     * Create enhanced error from generic error
     */
    private createEnhancedFromGeneric;
    /**
     * Build test error response for compatibility with existing tests
     */
    private buildTestErrorResponse;
    /**
     * Build response from enhanced error
     */
    private buildEnhancedErrorResponse;
    /**
     * Execute operation with automatic retry on transient errors
     */
    executeWithRetry<T>(operation: () => Promise<T>, maxAttempts?: number, onRetry?: (error: Error, attempt: number) => void): Promise<T>;
    /**
     * Wrap a standard error with an enhanced error
     */
    wrapError(error: Error, context?: Record<string, unknown>): EnhancedError;
    /**
     * Get recovery suggestions for an error code
     */
    getRecoverySuggestions(code: ErrorCode | string): string[];
    /**
     * Map error code to enhanced error properties
     * Made public for testing
     */
    private mapErrorCode;
    /**
     * Check if an error code is retryable
     */
    isRetryable(code: ErrorCode): boolean;
    /**
     * Get severity for an error code
     */
    getSeverity(code: ErrorCode): ErrorSeverity;
}
//# sourceMappingURL=ErrorHandler.d.ts.map