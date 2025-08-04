/**
 * Error Handler
 * Bridges the enhanced error system with the existing error handling
 * Provides unified error handling with recovery patterns
 */
import type { LateralThinkingResponse } from '../types/index.js';
import { type ErrorLayer } from './types.js';
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
    handleError(error: unknown, layer: ErrorLayer, context?: Record<string, any>): LateralThinkingResponse;
    /**
     * Convert standard error to enhanced error
     */
    private convertToEnhancedError;
    /**
     * Create enhanced error from generic error
     */
    private createEnhancedFromGeneric;
    /**
     * Build response from enhanced error
     */
    private buildEnhancedErrorResponse;
    /**
     * Map old error codes to enhanced error system
     */
    private getErrorMapping;
    /**
     * Execute operation with automatic retry on transient errors
     */
    executeWithRetry<T>(operation: () => Promise<T>, maxAttempts?: number, onRetry?: (error: Error, attempt: number) => void): Promise<T>;
}
//# sourceMappingURL=ErrorHandler.d.ts.map