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
import type { ErgodicityManager } from '../../ergodicity/index.js';
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
    };
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
    };
    /**
     * Initialize a new session
     */
    private initializeSession;
}
//# sourceMappingURL=ExecutionValidator.d.ts.map