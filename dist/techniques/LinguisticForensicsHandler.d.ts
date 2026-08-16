/**
 * Linguistic Forensics technique handler
 *
 * A 6-step technique for analyzing communication patterns to reveal
 * hidden insights, cognitive states, and authenticity markers
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class LinguisticForensicsHandler extends BaseTechniqueHandler {
    private readonly steps;
    private readonly linguisticMarkers;
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
     *
     * Detecting linguistic markers is this technique's job, so the marker checks
     * stay — but as an *addition* to the step's own output, never as the gate
     * deciding whether that output is reported at all. Gated on the markers, a
     * finding phrased without the words "distancing" or "hedging" produced no
     * insight whatsoever.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        output?: string;
        coherenceScore?: number;
        pronounRatios?: Record<string, number>;
    }>): string[];
    getLinguisticMarkers(): typeof this.linguisticMarkers;
}
//# sourceMappingURL=LinguisticForensicsHandler.d.ts.map