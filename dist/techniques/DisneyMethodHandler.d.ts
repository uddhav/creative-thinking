/**
 * Disney Method technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import type { DisneyRole } from '../types/index.js';
export declare class DisneyMethodHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step actually recorded, labelled by the step.
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
        disneyRole?: DisneyRole;
        dreamerVision?: string[];
        realistPlan?: string[];
        criticRisks?: string[];
        nextStepNeeded?: boolean;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=DisneyMethodHandler.d.ts.map