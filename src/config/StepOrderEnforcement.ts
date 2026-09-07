/**
 * Opt-in strict step order (#298).
 *
 * The default is advisory: a step sent out of order is accepted and recorded,
 * the next-step guidance redirects to the earliest hole, and a contradictory
 * numbering pairing rides `advisoryFindings` as `numbering.mismatch`. Strict
 * mode refuses both shapes instead, before anything is recorded, with E211
 * and the exact resend forms in the error envelope.
 *
 * Two switches, either one turns strict on: the process-level
 * `STEP_ORDER_ENFORCEMENT=strict`, and the per-plan `strictness: 'enforcing'`
 * declared at plan time. A plan cannot opt out of a strict process; the env
 * var is the operator's call and the field is the caller's.
 *
 * Read on every call rather than cached at import, as `CompletionGatekeeper`
 * reads `COMPLETION_ENFORCEMENT_MODE`, so the CLI (one process per call) and
 * the MCP server (one process for many) see the same value the same way.
 */
export type StepOrderMode = 'advisory' | 'strict';

let warnedAboutValue: string | undefined;

/**
 * The process-level mode. Unset, empty or `advisory` is advisory; `strict`
 * is strict; anything else warns once on stderr and runs advisory, so a typo
 * cannot silently refuse steps (or silently accept them while the operator
 * believes it is strict — the warning names the value it saw).
 */
export function loadStepOrderMode(): StepOrderMode {
  const raw = process.env.STEP_ORDER_ENFORCEMENT;
  if (raw === undefined || raw === '' || raw === 'advisory') return 'advisory';
  if (raw === 'strict') return 'strict';
  if (warnedAboutValue !== raw) {
    warnedAboutValue = raw;
    console.error(
      `[StepOrder] STEP_ORDER_ENFORCEMENT="${raw}" is neither 'advisory' nor 'strict'; running as advisory.`
    );
  }
  return 'advisory';
}

/**
 * Whether this call runs strict: the plan declared `enforcing`, or the
 * process is strict. Encoded planIds rebuild a minimal plan with no
 * `strictness`, so for them only the env var applies.
 */
export function stepOrderIsStrict(plan?: { strictness?: string }): boolean {
  return plan?.strictness === 'enforcing' || loadStepOrderMode() === 'strict';
}
