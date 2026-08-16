/**
 * A session that jumps over a step is told so, where it is looking.
 *
 * Measured in 6 of 8 eval runs, both arms: an executor sent step-2 content
 * under `currentStep: 3`. The server accepted it, recorded the skip only in
 * buried metadata (`techniqueStatuses[].skippedSteps`) — and `nextStepGuidance`,
 * the one field the model reliably reads, then advanced to step 4, steering
 * away from the hole it had just accepted. Every executor that recovered did
 * so against the guidance. Duplicates were worse: a re-submitted step number
 * was appended with no acknowledgment at all, and the completion display
 * counted submissions rather than distinct steps, so a session with seven
 * submissions covering six steps ended showing "100% (7/7) ✓" in the same
 * response whose gate blocked it for the skipped step.
 *
 * Three claims, asserted where the caller stands:
 *   1. after an out-of-order step, guidance names the earliest missing step
 *      and carries that step's actual prompt;
 *   2. a duplicate submission is named as one;
 *   3. the end-state progress counts distinct steps, so it cannot contradict
 *      the gate that blocks on the skip.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
}, 30_000);

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

interface StepResponse {
  sessionId?: string;
  nextStepGuidance?: string;
  blocked?: boolean;
  completionMetadata?: {
    completedSteps?: number;
    techniqueStatuses?: Array<{ skippedSteps?: number[]; completedSteps?: number }>;
  };
  completionStatus?: { overallProgress?: number };
}

async function planSteelman(): Promise<string> {
  const plan = JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: ['steelman_red_team'],
        timeframe: 'thorough',
      })
    )
  ) as { planId: string };
  return plan.planId;
}

async function step(
  planId: string,
  sessionId: string | undefined,
  currentStep: number,
  nextStepNeeded = true
): Promise<StepResponse> {
  return JSON.parse(
    textOf(
      await client.callTool('execute_thinking_step', {
        planId,
        ...(sessionId ? { sessionId } : {}),
        technique: 'steelman_red_team',
        problem: PROBLEM,
        currentStep,
        totalSteps: 7,
        output: `Finding for step ${currentStep}, written plainly and at length.`,
        nextStepNeeded,
      })
    )
  ) as StepResponse;
}

describe('out-of-order and duplicate step submissions', () => {
  it('redirects guidance to the earliest missing step, then names a duplicate', async () => {
    const planId = await planSteelman();
    const first = await step(planId, undefined, 1);
    const sessionId = first.sessionId;

    // The jump: step 3 with step 2 never seen. The salient field must point
    // BACK, and carry step 2's actual prompt — not step 4's.
    const jumped = await step(planId, sessionId, 3);
    expect(jumped.nextStepGuidance, 'guidance did not name the hole').toMatch(
      /Step 2 of steelman_red_team has not been recorded/
    );
    expect(
      jumped.nextStepGuidance,
      "guidance named the hole but did not carry the missing step's prompt"
    ).toMatch(/Opposing/i);
    expect(jumped.nextStepGuidance).not.toMatch(/Step 4/);

    // The buried record agrees with the salient one.
    expect(jumped.completionMetadata?.techniqueStatuses?.[0]?.skippedSteps).toEqual([2]);

    // Heal the hole, then resubmit step 3: the duplicate is named, and the
    // guidance moves on (step 4) rather than redirecting.
    await step(planId, sessionId, 2);
    const duplicate = await step(planId, sessionId, 3);
    expect(duplicate.nextStepGuidance, 'a duplicate submission went unacknowledged').toMatch(
      /Step 3 of steelman_red_team had already been recorded/
    );
    expect(duplicate.nextStepGuidance).toMatch(/appended alongside/);

    // Distinct steps, not submissions: four calls (1, 3, 2, 3), three distinct.
    expect(
      duplicate.completionMetadata?.completedSteps,
      'a duplicate submission inflated the completed-step count'
    ).toBe(3);
  }, 60_000);

  it('cannot claim 100% while blocking for a skipped step', async () => {
    const planId = await planSteelman();
    const first = await step(planId, undefined, 1);
    const sessionId = first.sessionId;

    // Seven submissions, six distinct steps, hole at 2: 1, 3, 3, 4, 5, 6, 7.
    await step(planId, sessionId, 3);
    await step(planId, sessionId, 3);
    for (const n of [4, 5, 6]) await step(planId, sessionId, n);
    const end = await step(planId, sessionId, 7, false);

    expect(end.blocked, 'the ending with a skipped step was not blocked').toBe(true);
    // The display used to say 100% (7/7) with a ✓ in this exact state.
    expect(
      end.completionStatus?.overallProgress,
      'progress claimed completeness while the gate blocked'
    ).toBeLessThan(100);
  }, 60_000);
});
