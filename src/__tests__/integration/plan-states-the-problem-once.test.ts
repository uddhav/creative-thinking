/**
 * The plan response states the problem once, and the plan stays executable.
 *
 * `plan_thinking_session` copied the caller's problem into every step
 * description AND every execution-graph node's parameters — 51 copies on a
 * five-technique plan. Measured with a 622-byte problem: 31,722 of 62,715
 * payload bytes, 50.6%, and the response optimizer was already truncating.
 * A field report hit the host's tool-result limit at 78 KB on a 1,137-byte
 * problem and could not read the plan inline at all, which is step 2 of a
 * mandatory 3-step protocol failing on ordinary input (#319).
 *
 * The copies were load-bearing in two different ways, so removing them takes
 * two different mechanisms:
 *
 *   - Step descriptions are `handler.getStepGuidance(step, problem)`. Rather
 *     than rewriting interpolated output, plan time passes a REFERENCE phrase
 *     as the problem; execute time keeps passing the real one. The guidance a
 *     caller acts on per step is still concrete — it is generated fresh at
 *     execute time — while the plan carries the phrase.
 *   - Node parameters are executable verbatim by contract, so `problem` was
 *     required to be there. It is now optional on `execute_thinking_step` and
 *     backfilled from the plan when `planId` resolves.
 *
 * `nextSteps.firstCall.parameters.problem` is kept deliberately: one copy, and
 * it is the one call a new integrator makes, so it stays self-contained rather
 * than depending on backfill the caller has not yet seen work.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM =
  'Plan a thirteen-night multi-country family rail itinerary reconciling seven competing wants against limited stamina, unpredictable weather, and a fixed deposit already paid';
const TECHNIQUES = ['temporal_creativity', 'triz', 'temporal_work'];

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

interface PlanResponse {
  planId: string;
  problem?: string;
  estimatedSteps: number;
  workflow: Array<{ description?: string }>;
  executionGraph?: {
    nodes: Array<{
      technique: string;
      stepNumber: number;
      parameters: Record<string, unknown>;
    }>;
  };
  nextSteps?: { firstCall?: { parameters?: Record<string, unknown> } };
}

/** Every JSON path whose string value contains the problem. */
function pathsCarryingProblem(value: unknown, problem: string, path = ''): string[] {
  if (typeof value === 'string') {
    return value.includes(problem) ? [path] : [];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      pathsCarryingProblem(v, problem, `${path}.${k}`)
    );
  }
  return [];
}

async function plan(): Promise<PlanResponse> {
  return JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: TECHNIQUES,
        timeframe: 'thorough',
      })
    )
  ) as PlanResponse;
}

describe('the plan response states the problem once', () => {
  it('carries it at plan scope, not in every step and node', async () => {
    const data = await plan();

    // The single authoritative copy has to exist, or "stated once" is
    // satisfied by a response that does not state it at all.
    expect(data.problem, 'the plan did not carry the problem at plan scope').toBe(PROBLEM);

    const carriers = pathsCarryingProblem(data, PROBLEM).map(p => p.replace(/\.\d+/g, '[]'));

    // Exactly the two sanctioned homes: plan scope, and the worked example of
    // the first call, which is kept self-contained on purpose.
    expect(new Set(carriers)).toEqual(
      new Set(['.problem', '.nextSteps.firstCall.parameters.problem'])
    );

    // Named separately so a failure says which surface regressed rather than
    // just reporting a set mismatch.
    expect(carriers.filter(p => p === '.workflow[].description')).toEqual([]);
    expect(carriers.filter(p => p === '.executionGraph.nodes[].parameters.problem')).toEqual([]);
  }, 30_000);

  it('still describes each step, without the problem inlined', async () => {
    const data = await plan();
    // Guards the reference phrase against the degenerate fix of emitting
    // nothing: the descriptions must still say what the step asks for.
    for (const step of data.workflow) {
      expect(step.description ?? '', 'a step lost its description entirely').not.toBe('');
      expect((step.description ?? '').length).toBeGreaterThan(20);
    }
  }, 30_000);
});

describe('a plan whose nodes omit the problem is still executable', () => {
  it('runs a graph node verbatim and gets concrete guidance back', async () => {
    const data = await plan();
    const node = data.executionGraph?.nodes?.[0];
    if (!node) {
      throw new Error('the plan carried no execution graph');
    }
    expect(
      node.parameters?.problem,
      'the node still carries a problem copy, so resolution is untested'
    ).toBeUndefined();

    const stepResponse = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          ...node.parameters,
          output: 'A recorded finding for this step, written plainly and at length.',
        })
      )
    ) as { sessionId?: string; nextStepGuidance?: string; problem?: string };

    expect(
      stepResponse.sessionId,
      'executing the node verbatim did not start a session'
    ).toBeDefined();

    // Resolution reached the response at all.
    expect(stepResponse.problem, 'the server never resolved the problem from the plan').toBe(
      PROBLEM
    );

    // And separately, the guidance the caller acts on names the problem
    // concretely. Asserted on nextStepGuidance ALONE on purpose: an earlier
    // version concatenated it with the `problem` echo before matching, so it
    // passed on the echo and proved nothing about interpolation — which is the
    // central claim of moving the reference to plan time only.
    expect(
      stepResponse.nextStepGuidance ?? '',
      'execute-time guidance was not interpolated with the real problem'
    ).toContain(PROBLEM);

    // The plan-time stand-in must never reach a caller at execute time. If a
    // stored step description were surfaced here, the caller would be told to
    // work on "the problem stated in this plan" instead of their problem.
    expect(
      JSON.stringify(stepResponse),
      'the plan-time reference phrase leaked into an execute response'
    ).not.toContain('the problem stated in this plan');
  }, 60_000);

  it('refuses when the problem is absent and the plan is unknown', async () => {
    let refusal = '';
    let refused = false;
    try {
      const result = await client.callTool('execute_thinking_step', {
        planId: 'plan_00000000-0000-4000-8000-000000000000',
        technique: 'triz',
        currentStep: 1,
        totalSteps: 4,
        output: 'A recorded finding for this step, written plainly and at length.',
        nextStepNeeded: true,
      });
      refusal = textOf(result);
      refused = result.isError === true;
    } catch (error) {
      refused = true;
      refusal = error instanceof Error ? error.message : String(error);
    }

    // The invariant: making `problem` optional must not turn an unresolvable
    // call into a silent one. With no plan to resolve from there is no problem
    // anywhere, and the step must not run against an empty string.
    //
    // Deliberately not asserting the wording. An earlier version of this
    // required the message to name the plan, which is a message improvement
    // rather than part of the contract — and an unknown planId is caught by
    // the workflow guard first, which refuses for its own (also correct)
    // reason. Pinning that text would couple this guard to which of two
    // refusals happens to win.
    expect(refused, 'an unresolvable step was accepted without a problem').toBe(true);
    // A refusal, not a step: no session may have been started.
    expect(refusal).not.toMatch(/"sessionId"/);
  }, 30_000);
});
