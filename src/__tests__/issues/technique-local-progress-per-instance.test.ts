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
