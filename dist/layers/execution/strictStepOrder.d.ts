/**
 * Strict step order (#298): refuse an out-of-order step before it is recorded.
 *
 * Advisory mode, the default, accepts the step and steers afterwards: the
 * next-step guidance redirects to the earliest hole and a contradictory
 * numbering pairing rides `advisoryFindings`. Both are built AFTER the push,
 * so by the time the caller reads them the step is in the history. Strict
 * mode is for callers who would rather lose the step than keep it in the
 * wrong place, and it has to run before anything is written.
 *
 * Three shapes are refused. The first two go together: #404 recorded why a
 * hole refusal alone loops. The completion counter reads numbering from
 * `totalSteps` only, so six_hats behind po(4) sent as currentStep 1 with
 * totalSteps 11 executes as step 1 but is discarded by the counter — a hole
 * refusal then rejects the next step for a step the caller did send, forever.
 *
 *   order.skipped        an earlier step of this technique, in this run, was
 *                        never recorded
 *   numbering.mismatch   the step would execute under one numbering and be
 *                        counted under another (the same predicate the
 *                        advisory finding uses)
 *   stimulus.mismatch    the step carries a random_entry stimulus or po
 *                        provocation the plan never assigned (same predicate
 *                        as the advisory finding; a controlled retest showed
 *                        a deliberately wrong stimulus accepted, recorded and
 *                        flagged only afterwards)
 *
 * Stated so nobody rediscovers them: a revision (`isRevision`) of a step whose
 * predecessor is missing is refused like any other; a terminating step
 * (`nextStepNeeded: false`) with a hole is refused here, where advisory mode
 * would let the gatekeeper block it after the push; and under technique-local
 * numbering a run-2 step 2 sent when run 2's step 1 was never sent reads as a
 * re-send of run 1's step 2 and is accepted, the one shape
 * `resolveTechniqueInstance` declares undecidable from the input.
 *
 * Placement: called from executeThinkingStep between step validation and the
 * ergodicity prompt, inside the session lock, before `assessRisks` writes
 * `session.riskDiscoveryData` and before path memory is touched. Throwing
 * exits through the lock's `finally`; nothing has been persisted.
 *
 * The run is resolved for the INCOMING step, not read off the last history
 * entry. `techniqueLocalProgress` reads the run from the last entry because
 * its other caller runs after the push; here the step is not pushed yet, so
 * under plan-wide numbering a run-2 step with run-2's step 1 missing would be
 * judged against run 1's completed steps and pass — strict weaker than the
 * redirect it replaces. `resolveTechniqueInstance` is what stamps the entry
 * at push time, so it is the run the counter will read back.
 */
import type { ExecuteThinkingStepInput, SessionData } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { TechniqueHandler } from '../../techniques/types.js';
import { type NumberingMismatch } from './advisoryGates.js';
export interface StrictStepOrderArgs {
    input: ExecuteThinkingStepInput;
    session: SessionData;
    plan: PlanThinkingSessionOutput | undefined;
    handler: TechniqueHandler;
    techniqueLocalStep: number;
    techniqueIndex: number;
    stepsBeforeThisTechnique: number;
    numberingMismatch: NumberingMismatch | undefined;
    /** The run the incoming step will be stamped with; undefined when the technique does not repeat. */
    techniqueInstance: number | undefined;
}
/**
 * Throws an E211 `WorkflowError` when strict mode is on and the step is out of
 * order, contradictorily numbered, or carries an unassigned stimulus. Returns
 * normally otherwise. A session without a plan has no order to enforce.
 */
export declare function refuseIfStrict(args: StrictStepOrderArgs): void;
//# sourceMappingURL=strictStepOrder.d.ts.map