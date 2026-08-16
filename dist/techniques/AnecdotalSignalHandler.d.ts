/**
 * Anecdotal Signal Detection technique handler
 *
 * A 6-step technique inspired by Rory Sutherland's argument that
 * "the most important information about the future first arrives
 * in anecdotal form" - using outliers as early change indicators
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class AnecdotalSignalHandler extends BaseTechniqueHandler {
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
//# sourceMappingURL=AnecdotalSignalHandler.d.ts.map