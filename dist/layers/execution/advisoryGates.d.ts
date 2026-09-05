/**
 * Advisory findings — the server's substance judgments, surfaced instead of
 * discarded (design/round-0-1-steering.md, DM-4).
 *
 * Round 1 contract: severity is 'advisory' only; nothing here rejects a step.
 * 'blocking' is reserved for Round 2, gated on M0 evidence. Two hard rules,
 * both scar tissue from removed features (#217; ErgodicityOrchestrator's
 * substring-matching eulogy):
 *
 *  1. No prose reading. Gates check structured fields the caller sent, or
 *     compare them for equality — never the step's output text.
 *  2. Every FIELD_GATES row must be verified against what the technique's
 *     getStepGuidance actually instructs the caller to send AND what
 *     ToolDefinitions declares, before it ships. A row keyed to a field the
 *     handler never asks for fires on every session — chronic false findings
 *     are how an advisory channel dies. (The first draft of this table had
 *     exactly that bug: an earlyWarnings clause on steelman step 5, a field
 *     only anecdotal_signal is instructed to send.)
 */
import type { ExecuteThinkingStepInput, LateralTechnique } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
export interface AdvisoryFinding {
    /**
     * Which gate produced this: 'numbering.mismatch' | 'validation.warning' |
     * 'fields.<technique>.step<N>' | 'stimulus.mismatch'
     */
    gate: string;
    technique: LateralTechnique;
    /** Technique-local step number the finding is about. */
    step: number;
    message: string;
    /** Round 1 emits 'advisory' only; 'blocking' is reserved for Round 2. */
    severity: 'advisory';
}
/**
 * The completion counter and the numbering ladder resolved the same entry to
 * different steps. `counted: false` means the counter discarded it;
 * `counted: true` means it filed the entry under `counterStep`, a step other
 * than the one that ran. Produced by ExecutionValidator, which is the only
 * place that has the plan; consumed by evaluateAdvisoryGates as Source 0.
 */
export interface NumberingMismatch {
    counted: boolean;
    /** Step the counter filed it under; null when discarded. */
    counterStep: number | null;
    /** This technique block's own step count. */
    techniqueSteps: number;
    /** Plan-wide step total. */
    planTotal: number;
    /** Steps in the plan before this technique block. */
    stepsBefore: number;
}
export declare function evaluateAdvisoryGates(input: ExecuteThinkingStepInput, techniqueLocalStep: number, plan: PlanThinkingSessionOutput | undefined, validationWarnings: string[] | undefined, numberingMismatch?: NumberingMismatch): AdvisoryFinding[];
/** Every assigned stimulus for a technique across the plan's workflow, in instance order. */
export declare function assignedStimuliFor(plan: PlanThinkingSessionOutput, technique: LateralTechnique): string[];
//# sourceMappingURL=advisoryGates.d.ts.map