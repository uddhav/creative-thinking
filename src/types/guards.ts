/**
 * Type guards for parallel execution types
 */

import type { LateralTechnique } from './index.js';
import type { ExecutionMode, ConvergenceMethod } from './planning.js';

/**
 * Check if a value is a valid ExecutionMode
 */
export function isExecutionMode(value: unknown): value is ExecutionMode {
  return typeof value === 'string' && ['sequential', 'parallel', 'auto'].includes(value);
}

/**
 * Check if a value is a valid ConvergenceMethod
 */
export function isConvergenceMethod(value: unknown): value is ConvergenceMethod {
  return (
    typeof value === 'string' && ['execute_thinking_step', 'llm_handoff', 'none'].includes(value)
  );
}

/**
 * Check if a technique supports parallel execution
 * @deprecated Parallel execution has been removed
 */
export function supportsParallelExecution(): boolean {
  // All techniques can run independently now
  return true;
}

/**
 * Check if techniques can be executed in parallel together
 */
export function canExecuteInParallel(techniques: LateralTechnique[]): boolean {
  // All techniques must support parallel execution
  return techniques.every(supportsParallelExecution);
}

/**
 * Check if a value is the convergence technique
 * @deprecated Convergence technique has been removed
 */
export function isConvergenceTechnique(): boolean {
  return false; // Convergence is no longer supported
}

/**
 * Validate max parallelism value
 */
export function isValidMaxParallelism(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10;
}

/**
 * Get default max parallelism based on technique count
 */
export function getDefaultMaxParallelism(techniqueCount: number): number {
  // Default to 3, but not more than the number of techniques
  return Math.min(3, techniqueCount);
}
