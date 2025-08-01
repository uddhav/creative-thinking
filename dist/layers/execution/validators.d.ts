/**
 * Validators for execution layer
 * Handles plan and technique validation
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { LateralThinkingResponse } from '../../types/index.js';
export declare class ExecutionValidator {
    /**
     * Validate plan ID if provided
     */
    static validatePlanId(input: ExecuteThinkingStepInput, sessionManager: SessionManager): {
        valid: boolean;
        error?: LateralThinkingResponse;
    };
}
//# sourceMappingURL=validators.d.ts.map