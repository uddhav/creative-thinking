/**
 * ErrorContextBuilder - Provides reusable methods for building consistent error contexts
 * Extracted to reduce duplication across validators and error handlers
 */
import type { LateralThinkingResponse } from '../types/index.js';
export interface WorkflowErrorContext {
    planId?: string;
    technique?: string;
    expectedTechniques?: string[];
    workflow?: Array<{
        step: number;
        tool: string;
        args: Record<string, unknown>;
        returns?: string | Record<string, unknown>;
    }>;
}
export interface SessionErrorContext {
    sessionId?: string;
    errorType: 'invalid_format' | 'not_found' | 'creation_failed';
    message: string;
    guidance?: string;
}
export interface StepErrorContext {
    providedStep: number;
    validRange: string;
    technique: string;
    techniqueLocalStep?: number;
    globalStep?: number;
    message?: string;
}
export declare class ErrorContextBuilder {
    /**
     * Build workflow error response (plan not found, technique mismatch, etc.)
     */
    buildWorkflowError(errorType: 'plan_not_found' | 'technique_mismatch', context: WorkflowErrorContext): LateralThinkingResponse;
    /**
     * Build plan not found error
     */
    private buildPlanNotFoundError;
    /**
     * Build technique mismatch error
     */
    private buildTechniqueMismatchError;
    /**
     * Build session error response
     */
    buildSessionError(context: SessionErrorContext): LateralThinkingResponse;
    /**
     * Build step error context (for ExecutionMetadata)
     */
    buildStepErrorContext(context: StepErrorContext): {
        providedStep: number;
        validRange: string;
        technique: string;
        techniqueLocalStep: number;
        globalStep: number;
        message: string;
    };
    /**
     * Build generic error response
     */
    buildGenericError(message: string, details?: Record<string, unknown>): LateralThinkingResponse;
}
//# sourceMappingURL=ErrorContextBuilder.d.ts.map