export declare const STIMULUS_TECHNIQUES: readonly ["random_entry", "po"];
export declare function isStimulusTechnique(technique: string): boolean;
export declare function stimulusLabel(technique: string): string;
/** The plan's assigned stimulus for a technique instance; undefined for non-stimulus techniques. */
export declare function drawAssignedStimulus(planId: string, technique: string, techniqueIndex: number): string | undefined;
/**
 * Apply an assignment to a technique's generated steps: structured fields on
 * step 1 plus a description prefix that explicitly overrides the handler's
 * own choose-your-own step-1 text (which is not assignment-aware). Shared by
 * the main planning workflow and debate persona plans — the two plan-building
 * paths must not drift.
 */
export declare function applyAssignedStimulus(technique: string, techniqueIndex: number, planId: string, steps: Array<{
    stimulus?: string;
    stimulusSource?: 'assigned';
    description: string;
}>): void;
//# sourceMappingURL=assignment.d.ts.map