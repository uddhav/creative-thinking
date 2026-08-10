/**
 * PO (Provocative Operation) technique handler with reflexivity
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class POHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     *
     * Every step reports. Step 2 used to be gated on the output containing the
     * word "could", and step 3 had no branch at all, so a movement phrased
     * without that word and every concept developed in step 3 vanished.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        provocation?: string;
        principles?: string[];
        output?: string;
    }>): string[];
}
//# sourceMappingURL=POHandler.d.ts.map