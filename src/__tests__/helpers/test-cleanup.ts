/**
 * Test cleanup utilities
 */

import { ParallelExecutionContext } from '../../layers/execution/ParallelExecutionContext.js';

/**
 * Clean up singletons and global state between tests
 */
export function cleanupSingletons(): void {
  // Reset parallel execution context singleton
  ParallelExecutionContext.reset();
}

/**
 * Setup cleanup hooks for test suites
 */
export function setupTestCleanup(afterEachFn: (fn: () => void | Promise<void>) => void): void {
  afterEachFn(() => {
    cleanupSingletons();
  });
}
