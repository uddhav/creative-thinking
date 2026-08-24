/** Cap per step (st-1): findings beyond this are dropped, never truncated mid-object. */
const MAX_FINDINGS_PER_STEP = 10;
/**
 * Field-presence gates, verified row by row (rule 2 above):
 * - steelman_red_team step 5 "Run the Attack": guidance asks for the attack's
 *   failure modes; `failureModes` is a schema-declared shared risk field.
 */
const FIELD_GATES = {
    steelman_red_team: {
        5: [
            {
                field: 'failureModes',
                min: 1,
                message: 'Run the Attack recorded no failureModes entries — an attack whose failure modes are ' +
                    'not named as data cannot be verified in step 6 or routed into later techniques.',
            },
        ],
    },
};
export function evaluateAdvisoryGates(input, techniqueLocalStep, plan, validationWarnings) {
    const findings = [];
    const base = {
        technique: input.technique,
        step: techniqueLocalStep,
        severity: 'advisory',
    };
    // Source 1: validator warnings — computed for years, discarded on the valid
    // path until now.
    for (const message of validationWarnings ?? []) {
        findings.push({ gate: 'validation.warning', message, ...base });
    }
    // Source 2: declarative field-presence gates.
    const gates = FIELD_GATES[input.technique]?.[techniqueLocalStep] ?? [];
    for (const gate of gates) {
        const value = input[gate.field];
        const count = Array.isArray(value) ? value.length : value !== undefined ? 1 : 0;
        if (count < gate.min) {
            findings.push({
                gate: `fields.${input.technique}.step${techniqueLocalStep}`,
                message: gate.message,
                ...base,
            });
        }
    }
    // Source 3: assigned-stimulus mismatch — structured equality ONLY. Fires
    // when the caller sent a stimulus field that matches NO instance's
    // assignment; an absent field stays silent (a caller working with the value
    // in prose is compliant in spirit, and absence-firing would be the chronic
    // false finding rule 2 exists to prevent).
    //
    // ALL instances, not workflow[techniqueIndex]: a technique-local step number
    // cannot name which repeated instance it belongs to (the resolver falls
    // back to the first — issue #301), so keying one instance made the gate
    // fire a FALSE mismatch against a caller using the second instance's own
    // assigned value. Matching any instance's assignment is compliant; only a
    // value the plan never assigned anywhere draws the finding.
    const sent = input.technique === 'po' ? input.provocation : input.randomStimulus;
    if (typeof sent === 'string' && sent.length > 0 && plan) {
        const assigned = assignedStimuliFor(plan, input.technique);
        if (assigned.length > 0 && !assigned.includes(sent)) {
            const label = input.technique === 'po' ? 'provocation' : 'stimulus';
            const listed = assigned.map(v => `"${v}"`).join(' / ');
            findings.push({
                gate: 'stimulus.mismatch',
                message: `This step carries "${sent}" but the plan's assigned ${label}` +
                    (assigned.length > 1
                        ? `s for this technique's instances are ${listed}`
                        : ` is ${listed}`) +
                    ' — assignments are not re-rollable within a plan; work with the assigned value.',
                ...base,
            });
        }
    }
    return findings.slice(0, MAX_FINDINGS_PER_STEP);
}
/** Every assigned stimulus for a technique across the plan's workflow, in instance order. */
export function assignedStimuliFor(plan, technique) {
    const values = [];
    for (const entry of plan.workflow) {
        if (entry.technique !== technique)
            continue;
        const first = entry.steps?.[0];
        if (first?.stimulusSource === 'assigned' && typeof first.stimulus === 'string') {
            values.push(first.stimulus);
        }
    }
    return values;
}
//# sourceMappingURL=advisoryGates.js.map