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
export declare class ExecutionModeController {
    constructor();
    /**
     * Determine execution mode (always returns sequential)
     */
    determineExecutionMode(input: DiscoverTechniquesInput, recommendedTechniques: LateralTechnique[]): ExecutionModeDecision;
    /**
     * Validate execution mode (always valid for sequential)
     */
    validateExecutionMode(mode: ExecutionMode): {
        isValid: boolean;
        error?: string;
    };
}
//# sourceMappingURL=ExecutionModeController.d.ts.map