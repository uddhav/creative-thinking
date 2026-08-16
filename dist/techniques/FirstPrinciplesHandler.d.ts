/**
 * First Principles Thinking technique handler
 * Break down to fundamental truths and rebuild from the ground up
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class FirstPrinciplesHandler extends BaseTechniqueHandler {
    private readonly stepsWithReflexivity;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    /**
     * The first alias that actually carries content, rendered.
     *
     * `validateStep` accepts any of the names listed for a step, so all of them
     * have to report the same thing — a session that sent `foundations` instead
     * of `fundamentalTruths` passed validation and must not then be reported as
     * having recorded nothing. `a ?? b` is not enough: an empty array is neither
     * null nor undefined, so it would win over a populated alias.
     */
    private renderAlias;
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     *
     * `validateStep` rejects a step that omits its field, so a session that got
     * this far named its components, its fundamental truths, the assumptions it
     * challenged and what it rebuilt; reporting none of them was the defect this
     * fixes.
     */
    extractInsights(history: unknown[]): string[];
}
//# sourceMappingURL=FirstPrinciplesHandler.d.ts.map