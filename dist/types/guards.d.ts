/**
 * Type guards for parallel execution types
 */
import type { LateralTechnique } from './index.js';
import type { ExecutionMode, ConvergenceMethod } from './planning.js';
/**
 * Check if a value is a valid ExecutionMode
 */
export declare function isExecutionMode(value: unknown): value is ExecutionMode;
/**
 * Check if a value is a valid ConvergenceMethod
 */
export declare function isConvergenceMethod(value: unknown): value is ConvergenceMethod;
/**
 * Check if a technique supports parallel execution
 */
export declare function supportsParallelExecution(technique: LateralTechnique): boolean;
/**
 * Check if techniques can be executed in parallel together
 */
export declare function canExecuteInParallel(techniques: LateralTechnique[]): boolean;
/**
 * Check if a value is the convergence technique
 */
export declare function isConvergenceTechnique(technique: LateralTechnique): technique is 'convergence';
/**
 * Validate max parallelism value
 */
export declare function isValidMaxParallelism(value: unknown): value is number;
/**
 * Get default max parallelism based on technique count
 */
export declare function getDefaultMaxParallelism(techniqueCount: number): number;
//# sourceMappingURL=guards.d.ts.map