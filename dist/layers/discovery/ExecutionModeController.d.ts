/**
 * Execution Mode Controller
 * Central controller for execution mode decisions
 */
import type { LateralTechnique } from '../../types/index.js';
import type { DiscoverTechniquesInput, ExecutionMode, ConvergenceOptions } from '../../types/planning.js';
import type { ParallelismDetector } from './ParallelismDetector.js';
import type { ParallelismValidator } from './ParallelismValidator.js';
/**
 * Decision result for execution mode
 */
export interface ExecutionModeDecision {
    mode: ExecutionMode;
    reason: string;
    warnings?: string[];
    confidence: number;
    convergenceOptions?: ConvergenceOptions;
}
/**
 * Analysis result for execution mode
 */
export interface ExecutionModeAnalysis {
    mode: ExecutionMode;
    confidence: number;
    reason: string;
    warnings?: string[];
    detectedKeywords?: string[];
    validationResult?: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        recommendations: string[];
    };
}
/**
 * Controller for determining execution mode based on various inputs
 */
export declare class ExecutionModeController {
    private detector;
    private validator;
    constructor(detector: ParallelismDetector, validator: ParallelismValidator);
    /**
     * Determine the execution mode for a set of techniques
     */
    determineExecutionMode(input: DiscoverTechniquesInput, recommendedTechniques: LateralTechnique[]): ExecutionModeDecision;
    /**
     * Validate an explicitly requested execution mode
     */
    private validateExplicitMode;
    /**
     * Determine if auto mode should select parallel execution
     */
    private shouldAutoSelectParallel;
    /**
     * Determine convergence options for parallel execution
     */
    private determineConvergence;
    /**
     * Get execution mode analysis (detailed information for debugging)
     */
    analyzeExecutionMode(input: DiscoverTechniquesInput, recommendedTechniques: LateralTechnique[]): ExecutionModeAnalysis;
}
//# sourceMappingURL=ExecutionModeController.d.ts.map