/**
 * Type guards for execution types
 */
import type { LateralTechnique } from './index.js';
import type { ExecutionMode } from './planning.js';
/**
 * Check if a value is a valid ExecutionMode
 * Validates client-side execution mode preference
 */
export declare function isExecutionMode(value: unknown): value is ExecutionMode;
/**
 * Check if techniques can be executed in parallel together
 * All techniques can now run independently for client-side parallel execution
 */
export declare function canExecuteInParallel(techniques: LateralTechnique[]): boolean;
/**
 * Validate max parallelism value
 */
export declare function isValidMaxParallelism(value: unknown): value is number;
/**
 * Get default max parallelism based on technique count
 */
export declare function getDefaultMaxParallelism(techniqueCount: number): number;
//# sourceMappingURL=guards.d.ts.map