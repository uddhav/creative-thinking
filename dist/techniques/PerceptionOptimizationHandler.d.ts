/**
 * Perception Optimization technique handler
 *
 * A 5-step technique inspired by Rory Sutherland's principle
 * "optimize for perception, not reality" - recognizing that human
 * experience is fundamentally subjective
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class PerceptionOptimizationHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     */
    extractInsights(history: unknown[]): string[];
}
//# sourceMappingURL=PerceptionOptimizationHandler.d.ts.map