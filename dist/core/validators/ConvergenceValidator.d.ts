/**
 * ConvergenceValidator - Centralized validation for convergence technique
 * Handles all convergence-specific validation logic
 */
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import type { ExecuteThinkingStepInput, LateralThinkingResponse } from '../../types/index.js';
export interface ValidationResult {
    isValid: boolean;
    error?: LateralThinkingResponse;
}
export interface ParallelResult {
    technique: string;
    insights: string[];
    results?: Record<string, unknown>;
    metrics?: Record<string, unknown>;
    planId?: string;
}
export interface ConvergenceValidationOptions {
    requireMetrics?: boolean;
    requireResults?: boolean;
    minInsights?: number;
    maxInsights?: number;
}
/**
 * Dedicated validator for convergence technique
 */
export declare class ConvergenceValidator {
    private errorHandler;
    constructor(errorHandler?: ErrorHandler);
    /**
     * Main validation entry point for convergence
     */
    validateConvergence(input: ExecuteThinkingStepInput, options?: ConvergenceValidationOptions): ValidationResult;
    /**
     * Validate that parallel results exist and are non-empty
     */
    private validateParallelResultsExist;
    /**
     * Validate the structure of parallel results
     */
    private validateParallelResultsStructure;
    /**
     * Validate result is a proper object
     */
    private validateResultObject;
    /**
     * Validate result technique field
     */
    private validateResultTechnique;
    /**
     * Validate result insights array
     */
    private validateResultInsights;
    /**
     * Validate optional fields (results, metrics)
     */
    private validateOptionalFields;
    /**
     * Validate convergence strategy
     */
    private validateConvergenceStrategy;
    /**
     * Check if a value is a serializable object
     */
    private isSerializableObject;
    /**
     * Get list of valid techniques
     */
    private getValidTechniques;
    /**
     * Extract insights from parallel results for synthesis
     */
    extractInsights(parallelResults: ParallelResult[]): string[];
    /**
     * Extract metrics for analysis
     */
    extractMetrics(parallelResults: ParallelResult[]): Record<string, unknown>[];
}
//# sourceMappingURL=ConvergenceValidator.d.ts.map