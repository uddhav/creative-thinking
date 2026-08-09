/**
 * Cognitive Bias Audit technique handler
 *
 * A 9-step debiasing checklist distilled from Charlie Munger's
 * "The Psychology of Human Misjudgment" (1995). The decider runs the standard
 * causes of misjudgment against their own judgment, detects the multiplicative
 * "lollapalooza" confluence, then inverts and seeks disconfirmation before
 * committing.
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CognitiveBiasAuditHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array. Position looks
     * equivalent and is not: `execute` appends a history entry for every call
     * including revisions, so one revision shifts every later entry and the last
     * step falls off the end — of a session reporting `completed: true`. Keying on
     * the step also means a revision supersedes the entry it revises rather than
     * reporting twice.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=CognitiveBiasAuditHandler.d.ts.map