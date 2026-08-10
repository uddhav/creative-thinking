/**
 * Biomimetic Path Management technique handler
 * Applies biological solutions and evolutionary strategies to innovation challenges
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class BiomimeticPathHandler extends BaseTechniqueHandler {
    private readonly stepsWithReflexivity;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    /**
     * The first alias that actually carries content, rendered.
     *
     * `validateStep` accepts either name for each step, so both have to report
     * the same thing — a session that sent `antibodies` instead of
     * `immuneResponse` passed validation and must not then be reported as having
     * recorded nothing. `a ?? b` is not enough: an empty array is neither null
     * nor undefined, so it would win over a populated alias.
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
     * this far recorded antibodies, mutations, symbioses, swarm rules, resilience
     * patterns and a synthesis; reporting none of them was the defect this fixes.
     */
    extractInsights(history: unknown[]): string[];
    getPromptContext(step: number): Record<string, unknown>;
}
//# sourceMappingURL=BiomimeticPathHandler.d.ts.map