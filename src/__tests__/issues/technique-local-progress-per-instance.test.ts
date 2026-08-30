/**
 * The out-of-order guidance has to read the run it is guiding.
 *
 * `techniqueLocalProgress` pooled history by technique name, so in the second
 * run of a repeated technique it saw the first run's step numbers as its own.
 * Both of its outputs then went wrong, in opposite directions (#371):
 *
 *   legitimate step 1 of run 2   ->  "Step 1 of po had already been recorded"
 *   run 2 skips step 2, sends 3  ->  silent, plus a false duplicate for step 3
 *
 * The second is the worse one. Its caller exists precisely to stop the guidance
 * steering past a hole — the comment above it records that in 6 of 8 eval runs
 * an executor sent step-2 content under `currentStep` 3 and the guidance
 * pointed at step 4, "actively pointing away from the hole it had just
 * accepted". Inside a repeated technique's second run that protection was
 * silently off.
 *
 * Entries carry `techniqueInstance` since #369, so this reader filters on it
 * with the same fallback: unstamped entries pool, which is what sessions
 * written before that carry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

interface StepResponse {
  nextStepGuidance?: string;
}

describe('out-of-order guidance reads the run it is guiding', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  function planFor(techniques: string[]): string {
    const result = server.planThinkingSession({
      problem: 'Per-instance guidance probe',
      techniques,
    });
    expect(result.isError).toBeFalsy();
    return (JSON.parse(result.content[0].text) as { planId: string }).planId;
  }

  async function step(
    planId: string,
    sessionId: string,
    technique: string,
    n: number
  ): Promise<StepResponse> {
    const result = await server.executeThinkingStep({
      planId,
      sessionId,
      technique,
      problem: 'Per-instance guidance probe',
      currentStep: n,
      totalSteps: 4,
      output: `${technique} step ${n}, written at a length that counts as real work.`,
      nextStepNeeded: true,
    });
    return JSON.parse(result.content[0].text) as StepResponse;
  }

  /** Run 1 of po and all of triz, leaving the session at the start of run 2. */
  async function upToSecondRun(planId: string, sessionId: string): Promise<void> {
    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'po', i);
    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'triz', i);
  }

  it('does not call the first step of a second run a duplicate', async () => {
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_guidance_dup';
    await upToSecondRun(planId, sessionId);

    const first = await step(planId, sessionId, 'po', 1);
    expect(
      first.nextStepGuidance ?? '',
      'a legitimate first step of the second run was called a duplicate'
    ).not.toMatch(/had already been recorded/);
  });

  it('names a hole in the second run instead of steering past it', async () => {
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_guidance_hole';
    await upToSecondRun(planId, sessionId);

    await step(planId, sessionId, 'po', 1);
    // Step 2 of the second run is never sent.
    const third = await step(planId, sessionId, 'po', 3);

    expect(third.nextStepGuidance ?? '', 'the hole in the second run went unreported').toMatch(
      /Step 2 of po has not been recorded/
    );
  });

  it('works when the FIRST run was left incomplete', async () => {
    // The shape that defeated the previous rule, and the one that matters most:
    // the guidance exists to catch a hole, so it must work when a hole is
    // already present. Advancing the stamp only once a run held every step
    // meant an incomplete run 1 never advanced, so run 2's entries were stamped
    // as run 1 — confidently wrong rather than absent, which defeats the
    // pool-on-doubt fallback.
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_incomplete_first_run';

    // Run 1 leaves a hole at step 3.
    await step(planId, sessionId, 'po', 1);
    await step(planId, sessionId, 'po', 2);
    await step(planId, sessionId, 'po', 4);
    for (let i = 1; i <= 4; i++) await step(planId, sessionId, 'triz', i);

    const first = await step(planId, sessionId, 'po', 1);
    expect(
      first.nextStepGuidance ?? '',
      'run 2 step 1 was called a duplicate because the stamp pointed at run 1'
    ).not.toMatch(/had already been recorded/);

    const third = await step(planId, sessionId, 'po', 3);
    expect(
      third.nextStepGuidance ?? '',
      "run 2's own hole went unreported after an incomplete run 1"
    ).toMatch(/Step 2 of po has not been recorded/);
  });

  it('does not treat an unflagged re-send as the start of a new run', async () => {
    // The shape that defeated the rule before that one. A re-sent step 2 is not
    // a run boundary; only a step 1 is. `isRevision` cannot be relied on — it
    // is caller-supplied and defaults to false.
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_unflagged_resend';

    await step(planId, sessionId, 'po', 1);
    await step(planId, sessionId, 'po', 2);
    await step(planId, sessionId, 'po', 3);
    await step(planId, sessionId, 'po', 2); // re-sent, no isRevision
    const fourth = await step(planId, sessionId, 'po', 4);

    // Still run 1: step 4 completes it, so nothing is missing and the guidance
    // must not claim a hole.
    expect(
      fourth.nextStepGuidance ?? '',
      'a re-sent step opened a new run, inventing a hole'
    ).not.toMatch(/has not been recorded/);
  });

  it('still reports a real duplicate within one run', async () => {
    // The warning must not simply be switched off — that would be the other
    // failure, and this is the case it exists for.
    const planId = planFor(['po', 'triz', 'po']);
    const sessionId = 'session_guidance_real_dup';
    await upToSecondRun(planId, sessionId);

    await step(planId, sessionId, 'po', 1);
    await step(planId, sessionId, 'po', 2);
    const again = await step(planId, sessionId, 'po', 2);

    expect(again.nextStepGuidance ?? '', 'a real duplicate went unreported').toMatch(
      /had already been recorded/
    );
  });

  it('leaves an unrepeated technique alone', async () => {
    const planId = planFor(['po', 'triz']);
    const sessionId = 'session_guidance_single';

    await step(planId, sessionId, 'po', 1);
    const third = await step(planId, sessionId, 'po', 3);

    expect(third.nextStepGuidance ?? '', 'the hole was not reported').toMatch(
      /Step 2 of po has not been recorded/
    );
  });
});
