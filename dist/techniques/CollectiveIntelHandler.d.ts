/**
 * Collective Intelligence technique handler with reflexivity tracking
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CollectiveIntelHandler extends BaseTechniqueHandler {
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
        wisdomSources?: string[];
        emergentPatterns?: string[];
        synergyCombinations?: string[];
        collectiveInsights?: string[];
        output?: string;
    }>): string[];
}
//# sourceMappingURL=CollectiveIntelHandler.d.ts.map