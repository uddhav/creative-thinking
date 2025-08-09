/**
 * Execution Mode Controller - Simplified for sequential execution only
 * Always returns sequential execution mode
 */

import type { LateralTechnique } from '../../types/index.js';
import type { DiscoverTechniquesInput, ExecutionMode } from '../../types/planning.js';

/**
 * Decision result for execution mode
 */
export interface ExecutionModeDecision {
  mode: ExecutionMode;
  reason: string;
  warnings?: string[];
}

/**
 * Simplified execution mode controller that always selects sequential mode
 */
export class ExecutionModeController {
  constructor() {
    // No dependencies needed for sequential-only mode
  }

  /**
   * Determine execution mode (always returns sequential)
   */
  determineExecutionMode(
    input: DiscoverTechniquesInput,
    recommendedTechniques: LateralTechnique[]
  ): ExecutionModeDecision {
    const warnings: string[] = [];

    // Add warnings based on input analysis
    if (recommendedTechniques.length > 7) {
      warnings.push(
        `${recommendedTechniques.length} techniques recommended - consider if all are necessary`
      );
    }

    if (input.constraints && input.constraints.some(c => c.toLowerCase().includes('time'))) {
      warnings.push('Time constraint detected - sequential execution may take longer');
    }

    // Always use sequential mode
    const decision: ExecutionModeDecision = {
      mode: 'sequential',
      reason: 'Sequential execution is the only supported mode in this simplified version',
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return decision;
  }

  /**
   * Validate execution mode (always valid for sequential)
   */
  validateExecutionMode(mode: ExecutionMode): { isValid: boolean; error?: string } {
    if (mode === 'sequential') {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: `Execution mode "${mode}" is not supported. Only "sequential" mode is available.`,
    };
  }
}
