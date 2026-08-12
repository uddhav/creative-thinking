/**
 * Three claims this branch makes about what a caller sees, asserted where the
 * caller stands.
 *
 * Each was previously guarded only below `RequestHandlers` and the response
 * allowlist, which is where the last three defects lived:
 *
 *   1. The completion nag does not fire on an early step. Guarded at
 *      `SessionCompletionTracker` level. But the warnings ship inside
 *      `completionMetadata`, and no test read that off a response — so the
 *      allowlist could have dropped the field, or a false alarm could have
 *      returned, with every existing guard green.
 *
 *   2. The caller cannot assert its own flexibility. That is a claim about what
 *      the request path does with an input, and it was tested by calling the
 *      layer directly — below the point where an old client's `flexibilityScore`
 *      would have to be ignored.
 *
 *   3. The request-path array table type-checks the fields it lists. Asserted
 *      by probing `ObjectFieldValidator` without entering the request path, so
 *      nothing showed the refusal reaching a caller at all.
 *
 * None of the three was broken when this file was written — all three pass on
 * first run. They are here because the guards that covered them could not have
 * told the difference.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';
const HATS = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'] as const;

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
  completionMetadata?: {
    completionWarnings?: string[];
    overallProgress?: number;
    completedSteps?: number;
  };
  ergodicityMetrics?: { currentFlexibility?: number };
  nextStepGuidance?: string;
}

async function plan(techniques: string[]): Promise<{ planId: string; estimatedSteps: number }> {
  return JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques,
        timeframe: 'thorough',
      })
    )
  ) as { planId: string; estimatedSteps: number };
}

describe('the completion nag does not reach the caller on an early step', () => {
  it('says nothing alarming on step 1 of seven', async () => {
    const { planId } = await plan(['six_hats']);
    const raw = textOf(
      await client.callTool('execute_thinking_step', {
        planId,
        technique: 'six_hats',
        problem: PROBLEM,
        currentStep: 1,
        totalSteps: 7,
        output: 'A recorded finding for this step, written plainly and at length.',
        nextStepNeeded: true,
        hatColor: 'blue',
      })
    );
    const data = JSON.parse(raw) as StepResponse;

    // Over the whole response, not just the field: these used to arrive by
    // three different routes and the skill was told to ignore all of them.
    expect(raw).not.toContain('CRITICAL FAILURE');
    expect(raw).not.toContain('CRITICAL GAPS');
    expect(data.nextStepGuidance ?? '').not.toContain('MANDATORY');

    // The field itself has to be present, or the assertions above pass by the
    // response simply not carrying completion information at all.
    expect(data.completionMetadata, 'completionMetadata never reached the caller').toBeDefined();

    // Nothing at all on step 1. This carried "Black Hat thinking skipped" until
    // `findSkippedSteps` was corrected: it counted every incomplete step as
    // skipped, so a session reported having skipped the steps it had not yet
    // reached. A warning true of every session at step 1 carries no
    // information and teaches the reader to discount the ones that do.
    expect(
      data.completionMetadata?.completionWarnings,
      'a warning fired about a step the session had not reached'
    ).toEqual([]);
  }, 30_000);

  it('reports a finished session as finished', async () => {
    const { planId } = await plan(['six_hats']);
    let sessionId: string | undefined;
    let last: StepResponse = {};

    for (let step = 1; step <= 7; step++) {
      last = JSON.parse(
        textOf(
          await client.callTool('execute_thinking_step', {
            planId,
            ...(sessionId ? { sessionId } : {}),
            technique: 'six_hats',
            problem: PROBLEM,
            currentStep: step,
            totalSteps: 7,
            output: `Finding ${step}, written plainly and at length for the record.`,
            nextStepNeeded: step < 7,
            hatColor: HATS[step - 1],
          })
        )
      ) as StepResponse;
      sessionId = last.sessionId ?? sessionId;
    }

    expect(last.completionMetadata?.completedSteps).toBe(7);
    expect(last.completionMetadata?.overallProgress).toBe(1);
    expect(
      last.completionMetadata?.completionWarnings,
      'a completed session still warned about itself'
    ).toEqual([]);
  }, 30_000);
});

describe('the caller cannot assert its own flexibility', () => {
  it('ignores a flexibilityScore sent by an old client', async () => {
    // The field is no longer in the schema, but undeclared fields still pass
    // through — an old caller following the previous skill sends this. What
    // matters is that the number the server reports is its own.
    const runs: Array<number | undefined> = [];
    for (const sent of [undefined, 0.05]) {
      const { planId } = await plan(['six_hats']);
      const data = JSON.parse(
        textOf(
          await client.callTool('execute_thinking_step', {
            planId,
            technique: 'six_hats',
            problem: PROBLEM,
            currentStep: 1,
            totalSteps: 7,
            output: 'A recorded finding for this step, written plainly and at length.',
            nextStepNeeded: true,
            hatColor: 'blue',
            ...(sent === undefined ? {} : { flexibilityScore: sent }),
          })
        )
      ) as StepResponse;
      runs.push(data.ergodicityMetrics?.currentFlexibility);
    }

    const [measured, withCallerValue] = runs;
    expect(measured, 'no flexibility reading reached the caller').toBeGreaterThan(0);
    expect(withCallerValue, "the caller's number displaced the measurement").toBe(measured);
  }, 30_000);
});

describe('a malformed array is refused, and the caller is told which field', () => {
  it('names the field rather than failing somewhere downstream', async () => {
    // The request-path table's coverage is asserted by probing the validator.
    // This is the end-to-end anchor: a string where an array of strings is
    // declared has to be refused, and the refusal has to say which field.
    const { planId } = await plan(['biomimetic_path']);

    let refusal = '';
    try {
      const result = await client.callTool('execute_thinking_step', {
        planId,
        technique: 'biomimetic_path',
        problem: PROBLEM,
        currentStep: 4,
        totalSteps: 6,
        output: 'A recorded finding for this step, written plainly and at length.',
        nextStepNeeded: true,
        swarmBehavior: 'a string, not an array',
      });
      refusal = textOf(result);
    } catch (error) {
      refusal = error instanceof Error ? error.message : String(error);
    }

    expect(refusal).toMatch(/swarmBehavior/);
  }, 30_000);
});
