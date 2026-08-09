/**
 * Criteria-Based Analysis technique handler
 *
 * A 5-step technique for evaluating authenticity and validity
 * based on established criteria from deception detection research
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CriteriaBasedAnalysisHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    /**
     * Report what each step actually assessed, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array. Position looks
     * equivalent and is not: `execute` appends a history entry for every call
     * including revisions, so one revision shifts every later entry and the last
     * step falls off the end — a session reporting `completed: true` silently
     * loses its final output. Keying on the step also means a revision supersedes
     * the entry it revises rather than reporting twice.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        output?: string;
        validityScore?: number;
    }>): string[];
}
//# sourceMappingURL=CriteriaBasedAnalysisHandler.d.ts.map