/**
 * ExecutionValidator - Handles validation logic for thinking step execution
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData, LateralThinkingResponse } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { TechniqueHandler } from '../../techniques/types.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import type { NumberingMismatch } from './advisoryGates.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
export interface ValidationResult {
    isValid: boolean;
    error?: LateralThinkingResponse;
    plan?: PlanThinkingSessionOutput;
    session?: SessionData;
    sessionId?: string;
    techniqueLocalStep?: number;
    techniqueIndex?: number;
    stepsBeforeThisTechnique?: number;
    handler?: TechniqueHandler;
    stepInfo?: {
        name: string;
        focus: string;
        emoji: string;
    } | null;
}
export declare class ExecutionValidator {
    private sessionManager;
    private techniqueRegistry;
    private visualFormatter;
    private errorBuilder;
    private telemetry;
    private errorHandler;
    constructor(sessionManager: SessionManager, techniqueRegistry: TechniqueRegistry, visualFormatter: VisualFormatter);
    /**
     * Validate plan exists and technique matches
     */
    validatePlan(input: ExecuteThinkingStepInput): {
        isValid: boolean;
        error?: LateralThinkingResponse;
        plan?: PlanThinkingSessionOutput;
    };
    /**
     * Get or create session
     */
    validateAndGetSession(input: ExecuteThinkingStepInput, ergodicityManager: ErgodicityManager): {
        session?: SessionData;
        sessionId?: string;
        error?: LateralThinkingResponse;
    };
    /**
     * Calculate technique-local step from cumulative step
     */
    calculateTechniqueLocalStep(input: ExecuteThinkingStepInput, plan?: PlanThinkingSessionOutput): {
        techniqueLocalStep: number;
        techniqueIndex: number;
        stepsBeforeThisTechnique: number;
        originalStep: number;
        wasNormalized: boolean;
        numberingMismatch?: NumberingMismatch;
    };
    /**
     * Name the fields a rejected step objected to.
     *
     * `validateStep` returns a bare boolean, so a handler that rejects
     * `vacantSpaces` for a missing `whyVacant` cannot say so. It is a pure
     * function of (step, data) though, so asking it again with one field removed
     * at a time identifies the culprit: a field whose absence makes the step
     * validate is a field whose value the handler refused.
     *
     * Only ever runs on the error path, and only over the fields the caller
     * actually sent. A handler that throws instead of returning false already
     * reports its own field, so a throw here just means "not this one".
     */
    private findRejectedFields;
    /**
     * Validate step and get step info
     */
    validateStepAndGetInfo(input: ExecuteThinkingStepInput, techniqueLocalStep: number, handler: TechniqueHandler): {
        isValid: boolean;
        stepInfo?: {
            name: string;
            focus: string;
            emoji: string;
        } | null;
        normalizedStep: number;
        /**
         * Which of the two ways a step can fail. `range` is a step number outside
         * the technique; `data` is a step number the technique accepts carrying
         * fields it does not. Both used to be reported as `range`, so a mis-shaped
         * field produced "Valid range is 1-5" for a step that was already in 1-5 —
         * advice the caller could follow forever without getting anywhere.
         */
        failure?: 'range' | 'data';
        /** Fields whose removal makes the step validate. See findRejectedFields. */
        rejectedFields?: string[];
    };
    /**
     * Initialize a new session
     */
    private initializeSession;
}
//# sourceMappingURL=ExecutionValidator.d.ts.map