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
     * Name the steps a caller still owes, numbered across the whole plan.
     *
     * Plan-wide is the numbering that can always be acted on. A technique-local
     * number cannot say WHICH run of a repeated technique it means:
     * resolveTechniqueInstance (layers/execution.ts) stamps a run from a cursor
     * that only advances, so once a second run has begun a technique-local step
     * lands on it and a hole in the first run can never be filled — this same
     * block then fires again, unchanged, for as long as the caller keeps
     * following it. A plan-wide number resolves by global range instead, so it
     * names one run and only that one.
     *
     * The total is load-bearing, not decoration. SessionCompletionTracker reads
     * an entry's numbering off that entry's own `totalSteps`, so the total has
     * to travel with the numbers or they are ambiguous at the point of use.
     *
     * Statuses arrive one per workflow occurrence, in order, each carrying that
     * occurrence's own step count — so the offset is the running sum of the
     * ones before it, and the final sum is the plan total.
     *
     * A technique that never started is NOT also read from `skippedTechniques`.
     * Both gatekeeper paths build metadata with isTerminating=true, which makes
     * findSkippedSteps enumerate every unrun step, so an unstarted technique is
     * already in `techniqueStatuses` with a full list. Reading both lists named
     * it twice in one sentence: "po steps 1, 2, 3, 4; six_hats steps 4; po
     * steps 1-4" was the measured output.
     */
    private describeOutstandingWork;
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