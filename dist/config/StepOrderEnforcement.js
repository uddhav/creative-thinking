let warnedAboutValue;
/**
 * The process-level mode. Unset, empty or `advisory` is advisory; `strict`
 * is strict; anything else warns once on stderr and runs advisory, so a typo
 * cannot silently refuse steps (or silently accept them while the operator
 * believes it is strict — the warning names the value it saw).
 */
export function loadStepOrderMode() {
    const raw = process.env.STEP_ORDER_ENFORCEMENT;
    if (raw === undefined || raw === '' || raw === 'advisory')
        return 'advisory';
    if (raw === 'strict')
        return 'strict';
    if (warnedAboutValue !== raw) {
        warnedAboutValue = raw;
        console.error(`[StepOrder] STEP_ORDER_ENFORCEMENT="${raw}" is neither 'advisory' nor 'strict'; running as advisory.`);
    }
    return 'advisory';
}
/**
 * Whether this call runs strict: the plan declared `enforcing`, or the
 * process is strict. Encoded planIds rebuild a minimal plan with no
 * `strictness`, so for them only the env var applies.
 */
export function stepOrderIsStrict(plan) {
    return plan?.strictness === 'enforcing' || loadStepOrderMode() === 'strict';
}
//# sourceMappingURL=StepOrderEnforcement.js.map