/**
 * Two runs of one technique in a plan are two things, not one pool.
 *
 * `SessionCompletionTracker` grouped history by technique NAME, so a plan of
 * `['po', 'triz', 'po']` handed both `po` workflow entries the same pooled
 * history. Measured before the fix: instance 1 complete, `triz` complete,
 * instance 2 missing step 3 — and the session terminated with
 * `completed: true` and `skippedSteps: []` on every status. The union of
 * {1,2,3,4} and {1,2,4} has no gap, so a step that was never run reported as
 * done. That is the exact failure the gate exists to prevent (#301).
 *
 * Instances are separated by filling them in order: a technique's history is
 * walked in arrival order and a new instance begins when a step number recurs,
 * since step numbers restart per instance. The alternative designs both cost
 * more than they are worth here — requiring plan-wide numbering would break a
 * convention documented as interchangeable, and an optional instance field
 * would go unpopulated, which this repo has already measured once with
 * `pathImpact` ("zero caller sentinels survive").
 *
 * The cost of filling in order, stated: a caller who genuinely interleaves two
 * instances of one technique gets them attributed by arrival, so the gap is
 * still caught but may be named against the wrong instance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

interface StepResponse {
  blocked?: boolean;
  reason?: string;
  completed?: boolean;
  completionMetadata?: {
    techniqueStatuses?: Array<{ technique: string; skippedSteps?: number[] }>;
  };
}

describe('repeated instances of one technique are tracked separately', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  function planFor(techniques: string[]): string {
    const result = server.planThinkingSession({ problem: 'Repeat instance probe', techniques });
    expect(result.isError).toBeFalsy();
    return (JSON.parse(result.content[0].text) as { planId: string }).planId;
  }

  async function step(
    planId: string,
    sessionId: string,
    technique: string,
    n: number,
    total: number,
    last = false
  ): Promise<StepResponse> {
    const result = await server.executeThinkingStep({
      planId,
      sessionId,
      technique,
      problem: 'Repeat instance probe',
      currentStep: n,
      totalSteps: total,
      output: `${technique} step ${n}, written at a length that counts as real work.`,
      nextStepNeeded: !last,
    });
    return JSON.parse(result.content[0].text) as StepResponse;
  }

  it('catches a gap in the SECOND instance that the first would mask', async () => {
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_repeat_gap';

    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'po', i, 4);
    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'triz', i, 4);
    // Instance 2 of po: step 3 is never sent.
    await step(planId, sessionId, 'po', 1, 4);
    await step(planId, sessionId, 'po', 2, 4);
    const last = await step(planId, sessionId, 'po', 4, 4, true);

    expect(last.blocked, 'a session missing a real step was allowed to end').toBe(true);
    expect(last.reason ?? '').toMatch(/skipped/i);
    expect(last.completed, 'it reported completion despite the gap').not.toBe(true);
  });

  it('catches the same gap under plan-wide step numbering', async () => {
    // Both numbering conventions are accepted, and they fail differently.
    //
    // Under technique-local numbering the instances collide on step numbers, so
    // one masks the other. Under plan-wide numbering they never collide — po is
    // steps 1-4 then 9-12 — so splitting on a recurring number finds only ONE
    // instance, the second workflow entry gets an empty history, and the
    // "score only techniques the session started" rule from #364 then excludes
    // it from the gate entirely. Two separate changes combining to let a real
    // gap through.
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_planwide_gap';
    const total = 12;

    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'po', i, total);
    for (let i = 5; i <= 8; i++) await step(planId, sessionId, 'triz', i, total);
    // Instance 2 of po occupies 9-12; step 11 is never sent.
    await step(planId, sessionId, 'po', 9, total);
    await step(planId, sessionId, 'po', 10, total);
    const last = await step(planId, sessionId, 'po', 12, total, true);

    expect(last.blocked, 'a plan-wide-numbered session with a gap was allowed to end').toBe(true);
    expect(last.completed, 'it reported completion despite the gap').not.toBe(true);
  });

  it('still completes when both instances ran every step', async () => {
    // The separation must not make a genuinely complete plan look incomplete —
    // that is the failure in the other direction.
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_repeat_full';

    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'po', i, 4);
    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'triz', i, 4);
    for (let i = 1; i <= 3; i++) await step(planId, sessionId, 'po', i, 4);
    const last = await step(planId, sessionId, 'po', 4, 4, true);

    expect(last.blocked, `a complete plan was refused: ${last.reason ?? ''}`).not.toBe(true);
    expect(last.completed, 'a complete plan did not report completion').toBe(true);
  });

  it('does not invent a gap when a step is re-sent without the revision flag', async () => {
    // This is what killed the first design. Inferring instances from step
    // numbers meant a re-sent step looked exactly like the start of a new run,
    // so a session in which EVERY step of both instances had actually been
    // executed was refused with "2 steps were skipped" — a hard block on
    // working input, traded for the false negative it was meant to fix.
    //
    // `isRevision` does not save it: the flag is caller-supplied and defaults
    // to false (`ErgodicityOrchestrator` writes `input.isRevision === true`),
    // so the shape that breaks is the one where the caller simply does not set
    // it. The executor stamps the instance instead, with the plan and the
    // history both in hand.
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_resend';

    await step(planId, sessionId, 'po', 1, 4);
    await step(planId, sessionId, 'po', 2, 4);
    await step(planId, sessionId, 'po', 3, 4);
    await step(planId, sessionId, 'po', 2, 4); // re-sent, no isRevision
    await step(planId, sessionId, 'po', 4, 4);
    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'triz', i, 4);
    for (let i = 1; i <= 3; i++) await step(planId, sessionId, 'po', i, 4);
    const last = await step(planId, sessionId, 'po', 4, 4, true);

    expect(last.blocked, `a complete session was refused: ${last.reason ?? ''}`).not.toBe(true);
    expect(last.completed, 'a complete session did not report completion').toBe(true);
  });

  it('catches a gap in run 2 when run 1 predates the stamp', async () => {
    // A session started under a plan with NO repeats writes no stamp — there is
    // nothing to disambiguate. Resumed under a plan that repeats the technique,
    // its history is mixed: unstamped, then stamped. The tracker treated the
    // stamp as all-or-nothing and pooled the whole session on seeing one
    // unstamped entry, so run 1's steps masked run 2's hole — the original
    // #301 defect, reachable today rather than only from legacy data.
    //
    // An unstamped entry is run 0, because the pre-stamp world only ever had
    // one run. That is what lets the two halves of this session be told apart.
    const sessionId = 'session_mixed_stamp_gap';
    const single = planFor(['po']);
    for (let i = 1; i <= 4; i++) await step(single, sessionId, 'po', i, 4);

    const repeated = planFor(['po', 'triz', 'po']);
    for (let i = 1; i <= 4; i++) await step(repeated, sessionId, 'triz', i, 4);
    // Run 2 leaves a hole at step 3.
    await step(repeated, sessionId, 'po', 1, 4);
    await step(repeated, sessionId, 'po', 2, 4);
    const last = await step(repeated, sessionId, 'po', 4, 4, true);

    expect(last.blocked, "run 2's gap was masked by the unstamped run 1").toBe(true);
    expect(last.reason ?? '').toMatch(/skipped/i);
    // Exactly one step is missing across the whole plan: run 2's step 3. A
    // pooled read reports zero; a read that mis-assigned the unstamped entries
    // would report more.
    expect(
      (last as { completionStatus?: { skippedSteps?: number } }).completionStatus?.skippedSteps,
      'expected exactly the one hole in run 2'
    ).toBe(1);
  });

  it('leaves single-instance plans alone', async () => {
    const planId = planFor(['po', 'triz']);
    const sessionId = 'session_no_repeat';

    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'po', i, 4);
    for (let i = 1; i <= 3; i++) await step(planId, sessionId, 'triz', i, 4);
    const last = await step(planId, sessionId, 'triz', 4, 4, true);

    expect(last.blocked, `an unrepeated plan was refused: ${last.reason ?? ''}`).not.toBe(true);
    expect(last.completed).toBe(true);
  });
});
