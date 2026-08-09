/**
 * Latticework of Mental Models technique handler
 *
 * A 7-step multidisciplinary technique distilled from Charlie Munger's
 * 2008 Caltech lecture: "grab all the big ideas in all the disciplines"
 * so you become a man with multiple tools, rather than the man with a
 * hammer to whom every problem looks like a nail. Forces a problem through
 * four named disciplinary lenses, then synthesizes where they agree,
 * conflict, or stack.
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class LatticeworkHandler extends BaseTechniqueHandler {
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
//# sourceMappingURL=LatticeworkHandler.d.ts.map