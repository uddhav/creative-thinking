/**
 * CompletionGatekeeper - Enforces completion requirements and prevents premature termination
 * Provides configurable enforcement levels and technique-specific requirements
 */
import type { ExecuteThinkingStepInput, SessionData, LateralThinkingResponse } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import { EnforcementLevel, type CompletionGatekeeperConfig } from '../../types/enforcement.js';
export { EnforcementLevel, type CompletionGatekeeperConfig };
/**
 * Enforces completion requirements for thinking sessions
 */
export declare class CompletionGatekeeper {
    private config;
    private completionTracker;
    private responseBuilder;
    constructor(config?: Partial<CompletionGatekeeperConfig>);
    /**
     * Check if execution can proceed to next step
     */
    canProceedToNextStep(input: ExecuteThinkingStepInput, session: SessionData, plan?: PlanThinkingSessionOutput): {
        allowed: boolean;
        response?: LateralThinkingResponse;
    };
    /**
     * Check if synthesis is allowed based on completion status
     */
    canProceedToSynthesis(session: SessionData, plan?: PlanThinkingSessionOutput): {
        allowed: boolean;
        response?: LateralThinkingResponse;
    };
    /**
     * Handle early termination attempt
     */
    private handleEarlyTermination;
    /**
     * Block termination with response
     */
    private blockTermination;
    /**
     * Require confirmation for termination
     */
    private requireConfirmation;
    /**
     * Build blocking response
     */
    private buildBlockingResponse;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<CompletionGatekeeperConfig>): void;
    /**
     * Get current enforcement level
     */
    getEnforcementLevel(): EnforcementLevel;
    /**
     * Check if a specific technique is critical
     */
    isCriticalTechnique(technique: string): boolean;
    /**
     * Get mandatory steps for a problem type
     */
    getMandatorySteps(problemType: string): string[];
}
//# sourceMappingURL=CompletionGatekeeper.d.ts.map