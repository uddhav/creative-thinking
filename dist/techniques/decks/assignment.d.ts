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