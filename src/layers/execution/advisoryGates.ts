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
  /** Which gate produced this: 'validation.warning' | 'fields.<technique>.step<N>' | 'stimulus.mismatch' */
  gate: string;
  technique: LateralTechnique;
  /** Technique-local step number the finding is about. */
  step: number;
  message: string;
  /** Round 1 emits 'advisory' only; 'blocking' is reserved for Round 2. */
  severity: 'advisory';
}

interface FieldGate {
  field: keyof ExecuteThinkingStepInput;
  min: number;
  message: string;
}

/** Cap per step (st-1): findings beyond this are dropped, never truncated mid-object. */
const MAX_FINDINGS_PER_STEP = 10;

/**
 * Field-presence gates, verified row by row (rule 2 above):
 * - steelman_red_team step 5 "Run the Attack": guidance asks for the attack's
 *   failure modes; `failureModes` is a schema-declared shared risk field.
 */
const FIELD_GATES: Partial<Record<LateralTechnique, Record<number, FieldGate[]>>> = {
  steelman_red_team: {
    5: [
      {
        field: 'failureModes',
        min: 1,
        message:
          'Run the Attack recorded no failureModes entries — an attack whose failure modes are ' +
          'not named as data cannot be verified in step 6 or routed into later techniques.',
      },
    ],
  },
};

export function evaluateAdvisoryGates(
  input: ExecuteThinkingStepInput,
  techniqueLocalStep: number,
  plan: PlanThinkingSessionOutput | undefined,
  validationWarnings: string[] | undefined
): AdvisoryFinding[] {
  const findings: AdvisoryFinding[] = [];
  const base = {
    technique: input.technique,
    step: techniqueLocalStep,
    severity: 'advisory' as const,
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
        message:
          `This step carries "${sent}" but the plan's assigned ${label}` +
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
export function assignedStimuliFor(
  plan: PlanThinkingSessionOutput,
  technique: LateralTechnique
): string[] {
  const values: string[] = [];
  for (const entry of plan.workflow) {
    if (entry.technique !== technique) continue;
    const first = entry.steps?.[0];
    if (first?.stimulusSource === 'assigned' && typeof first.stimulus === 'string') {
      values.push(first.stimulus);
    }
  }
  return values;
}
