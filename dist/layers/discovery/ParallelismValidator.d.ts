/**
 * Parallelism Validation System
 * Validates that requested parallel execution is safe and appropriate
 */
import type { LateralTechnique } from '../../types/index.js';
/**
 * Result of parallel execution validation
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
}
/**
 * Resource usage estimation for parallel execution
 */
export interface ResourceEstimate {
    memoryMB: number;
    estimatedTimeMs: number;
    complexity: 'low' | 'medium' | 'high';
}
/**
 * Validates parallel execution requests for safety and appropriateness
 */
export declare class ParallelismValidator {
    /**
     * Maximum number of parallel techniques by default
     */
    private static readonly MAX_DEFAULT_PARALLELISM;
    /**
     * Pairs of techniques that have dependencies
     * First technique should generally complete before second
     */
    private static readonly DEPENDENT_TECHNIQUE_PAIRS;
    /**
     * Resource-intensive techniques that need special consideration
     */
    private static readonly RESOURCE_INTENSIVE_TECHNIQUES;
    /**
     * Validate a parallel execution request
     */
    validateParallelRequest(techniques: LateralTechnique[], maxParallelism?: number): ValidationResult;
    /**
     * Find dependencies between techniques
     */
    private findDependencies;
    /**
     * Estimate resource usage for parallel execution
     */
    estimateResourceUsage(techniques: LateralTechnique[]): ResourceEstimate;
    /**
     * Check if two techniques can run in parallel
     */
    canTechniquesRunInParallel(tech1: LateralTechnique, tech2: LateralTechnique): boolean;
    /**
     * Generate specific recommendations based on validation
     */
    private generateRecommendations;
    /**
     * Get optimal grouping for parallel execution
     */
    getOptimalGrouping(techniques: LateralTechnique[], maxParallelism?: number): LateralTechnique[][];
}
//# sourceMappingURL=ParallelismValidator.d.ts.map