/**
 * Type guards for execution types
 */

import type { LateralTechnique } from './index.js';
import type { ExecutionMode } from './planning.js';

/**
 * Check if a value is a valid ExecutionMode
 * Validates client-side execution mode preference
 */
export function isExecutionMode(value: unknown): value is ExecutionMode {
  return typeof value === 'string' && ['sequential', 'parallel', 'auto'].includes(value);
}

/**
 * Check if techniques can be executed in parallel together
 * All techniques can now run independently for client-side parallel execution
 */
export function canExecuteInParallel(techniques: LateralTechnique[]): boolean {
  // All techniques can run independently in the client's execution model
  return techniques.length > 0;
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
