/**
 * Apply an assignment to a technique's generated steps: structured fields on
 * step 1 plus a step-1 description that REPLACES the handler's own
 * choose-your-own text. It used to be prefixed as a notice ("ignore any
 * instruction below") on top of the handler's "Select from a book, dictionary,
 * or random generator", so the step contradicted itself (#417). The text is
 * self-sufficient: one apply site builds the step with an empty description.
 * Shared by the main planning workflow and debate persona plans — the two
 * plan-building paths must not drift.
 */
export declare function applyAssignedStimulus(technique: string, techniqueIndex: number, planId: string, steps: Array<{
    stimulus?: string;
    stimulusSource?: 'assigned';
    description: string;
}>): void;
//# sourceMappingURL=assignment.d.ts.map