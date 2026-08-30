/**
 * A technique run as its own parallel branch has to be able to finish.
 *
 * The plan advertises cross-technique parallelism through
 * `executionGraph.metadata.parallelizableGroups`, and running those branches
 * concurrently requires a distinct sessionId each: two concurrent
 * cross-process executions naming ONE session lose a step, measured five runs
 * out of five, while the same two under distinct sessionIds lose nothing.
 *
 * But a branch session could not then complete. `CompletionGatekeeper` scored
 * termination against the whole PLAN, so a session holding all four `po` steps
 * of a `po` + `triz` plan reported "4 steps were skipped" — the `triz` steps,
 * which were never this branch's business — and refused to end. Every branch
 * was blocked at its own final step, so the advertised schedule had no valid
 * execution: shared session loses work, separate sessions cannot finish (#308).
 *
 * Termination is now scored over the techniques the session actually STARTED.
 * The anti-skip protection is unchanged for those: a branch that runs po steps
 * 1, 2 and 4 still cannot end.
 *
 * The cost, stated rather than hidden: a caller running one technique of five
 * in a single session can now terminate where before it was refused. That is
 * the same loosening in both directions — the gate can no longer tell a
 * deliberate branch from an abandoned plan — so the unstarted techniques stay
 * in the response for the caller to see.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

interface StepResponse {
  blocked?: boolean;
  reason?: string;
  completed?: boolean;
  insights?: string[];
  sessionId?: string;
  completionMetadata?: { skippedTechniques?: string[] };
}

describe('a parallel branch can reach its own end', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  function planFor(techniques: string[]): string {
    const result = server.planThinkingSession({ problem: 'Branch completion probe', techniques });
    expect(result.isError).toBeFalsy();
    return (JSON.parse(result.content[0].text) as { planId: string }).planId;
  }

  /** Run `technique` end to end in its own session, terminating on its last step. */
  async function runBranch(
    planId: string,
    technique: string,
    steps: number,
    opts: { skip?: number } = {}
  ): Promise<StepResponse> {
    const sessionId = `session_branch_${technique}`;
    let last: StepResponse = {};
    for (let step = 1; step <= steps; step++) {
      if (opts.skip === step) continue;
      const result = await server.executeThinkingStep({
        planId,
        sessionId,
        technique,
        problem: 'Branch completion probe',
        currentStep: step,
        totalSteps: steps,
        output: `${technique} step ${step}, written at enough length to count as work.`,
        nextStepNeeded: step < steps,
      });
      last = JSON.parse(result.content[0].text) as StepResponse;
    }
    return last;
  }

  it('completes a branch that ran every step of its own technique', async () => {
    const planId = planFor(['po', 'triz']);
    const last = await runBranch(planId, 'po', 4);

    expect(last.blocked, `branch refused: ${last.reason ?? ''}`).not.toBe(true);
    expect(last.completed, 'the branch did not report completion').toBe(true);
    expect(last.insights?.length, 'a completed branch emits no synthesis').toBeGreaterThan(0);
  });

  it('still refuses a branch that skipped a step of its own technique', async () => {
    // The protection that matters is unchanged. Scoping to started techniques
    // must not become "anything the caller sends is complete".
    const planId = planFor(['po', 'triz']);
    const last = await runBranch(planId, 'po', 4, { skip: 3 });

    expect(last.blocked, 'a branch with an internal gap was allowed to end').toBe(true);
    expect(last.reason ?? '').toMatch(/skipped/i);
  });

  it('pins the cost: one technique of five can now end a session', async () => {
    // This is the loosening, asserted deliberately rather than left to the
    // suite's silence. Scoring termination over started techniques cannot tell
    // a branch from an abandoned plan, so a caller who runs one technique of
    // five and stops is now allowed to end where the gate previously refused.
    //
    // Pinned so that tightening it back is a decision someone makes on purpose,
    // with this comment in front of them, rather than a regression nothing
    // notices — the suite had no test either way.
    const planId = planFor(['po', 'triz', 'six_hats', 'scamper', 'random_entry']);
    const last = await runBranch(planId, 'po', 4);

    expect(last.blocked, `refused: ${last.reason ?? ''}`).not.toBe(true);
    expect(last.completed, 'the one-of-five session did not complete').toBe(true);

    // The four it never ran must still be named, which is what keeps this
    // honest rather than silent.
    const skipped = last.completionMetadata?.skippedTechniques ?? [];
    expect(skipped.length, 'the unrun techniques were not reported').toBeGreaterThanOrEqual(4);
  });

  it('still names the techniques the branch never ran', async () => {
    // Scoping changes what BLOCKS, not what is reported. A caller ending a
    // branch should still be able to see that the plan holds more.
    const planId = planFor(['po', 'triz']);
    const last = await runBranch(planId, 'po', 4);

    const skipped = last.completionMetadata?.skippedTechniques ?? [];
    expect(skipped, 'the unrun technique vanished from the response').toContain('triz');
  });
});
