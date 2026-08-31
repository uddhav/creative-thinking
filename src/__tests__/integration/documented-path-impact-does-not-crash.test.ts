/**
 * A `pathImpact` shaped like the one README documents must not kill the session
 * it appears in.
 *
 * README showed a caller sending `pathImpact` with three keys — `systemLevel`,
 * `constraints`, `flexibilityScore` — and no `dependenciesCreated`. That is
 * legal input: the tool schema marks none of `pathImpact`'s properties
 * required, and its description says the server "REPLACES anything sent here"
 * and that "sending it has no effect".
 *
 * Sending it had a considerable effect. `MemoryAnalyzer` checked that
 * `pathImpact` existed and then read `pathImpact.dependenciesCreated.length`
 * without checking the array did, so completing the session threw and the
 * caller got `E999 Cannot read properties of undefined (reading 'length')`
 * with an empty stdout — after nine steps of work. `ExecutionResponseBuilder`
 * guards the same field correctly one file over, so this was a missed guard
 * rather than a decision.
 *
 * The analyzer only runs once the session actually completes, which is why
 * this drives all nine steps: a partial session is refused by the completion
 * gate long before anything reads history, and the bug hides behind that
 * refusal. The control at the end runs the identical session without
 * `pathImpact`, so a failure here means the field caused it rather than the
 * technique.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Improve urban transportation';

// Verbatim the shape README documented: no dependenciesCreated, no optionsClosed.
const DOCUMENTED_PATH_IMPACT = {
  systemLevel: 'current',
  constraints: ['Infrastructure limits', 'Budget restrictions'],
  flexibilityScore: 0.6,
};

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
  completed?: boolean;
  blocked?: boolean;
  error?: { code?: string; message?: string };
  isError?: boolean;
}

async function runNineWindows(pathImpactOnStepFive: object | undefined): Promise<StepResponse> {
  const { planId } = JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: ['nine_windows'],
      })
    )
  ) as { planId: string };

  let last = '';
  for (let step = 1; step <= 9; step++) {
    last = textOf(
      await client.callTool('execute_thinking_step', {
        planId,
        technique: 'nine_windows',
        problem: PROBLEM,
        currentStep: step,
        totalSteps: 9,
        output: `Cell ${step}: a concrete observation about urban transport at this scale.`,
        nextStepNeeded: step < 9,
        ...(step === 5 && pathImpactOnStepFive ? { pathImpact: pathImpactOnStepFive } : {}),
      })
    );
  }
  return JSON.parse(last) as StepResponse;
}

describe('a documented pathImpact survives session completion', () => {
  it('completes the session instead of returning E999', async () => {
    const final = await runNineWindows(DOCUMENTED_PATH_IMPACT);

    expect(
      final.error?.code,
      `completing a session carrying README's pathImpact returned ${final.error?.code}: ` +
        `${final.error?.message}. A caller-supplied field the schema says is ignored ` +
        `must not be able to end the session.`
    ).toBeUndefined();
    expect(final.completed, 'the nine-step session did not complete').toBe(true);
  }, 60_000);

  it('control: the same session without pathImpact also completes', async () => {
    // Without this, a technique-level regression would read as the pathImpact
    // bug returning, and a fix could be aimed at the wrong field.
    const final = await runNineWindows(undefined);

    expect(final.error?.code).toBeUndefined();
    expect(final.completed).toBe(true);
  }, 60_000);
});
