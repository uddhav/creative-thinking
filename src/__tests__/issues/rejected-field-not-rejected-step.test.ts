/**
 * A step whose data is refused must not be reported as a step out of range.
 *
 * `validateStep` returns a bare boolean. `ExecutionValidator` folded that
 * `false` in with "the step number was normalised", and `execution.ts` built one
 * message for both: `Step 2 is invalid for Reverse Benchmarking. Valid range is
 * 1-5`. Step 2 is inside 1-5. The caller was handed a range to fix that was
 * never wrong, with no mention of the field that was — and the step was
 * discarded, so the session could not complete either.
 *
 * The two failures are now told apart, and the culprit field is named by asking
 * the handler again without each field in turn.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { ExecuteThinkingStepInput } from '../../types/index.js';

// Through the real client, because the message a caller actually reads is the
// thing under test. `RequestHandlers` has refusal text of its own that fires
// before dispatch, so a test entering below it can assert wording the caller
// never sees.
let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
}, 30_000);

/**
 * Returns the text of the response, refusal or not. `callTool` rejects when the
 * response carries `isError`, and a refusal is exactly what most of these
 * assert, so the throw is caught and its message read instead.
 */
async function runStep(overrides: Partial<ExecuteThinkingStepInput>): Promise<string> {
  const problem = 'Where is nobody competing?';
  const technique = overrides.technique ?? 'reverse_benchmarking';
  const registry = TechniqueRegistry.getInstance();

  const planResult = await client.callTool('plan_thinking_session', {
    problem,
    techniques: [technique],
    timeframe: 'quick',
  });
  const planText = planResult.content[0];
  const plan = JSON.parse(
    planText.type === 'text' ? (planText as { text: string }).text : '{}'
  ) as { planId: string };

  try {
    const result = await client.callTool('execute_thinking_step', {
      planId: plan.planId,
      technique,
      problem,
      currentStep: 2,
      totalSteps: registry.getHandler(technique).getTechniqueInfo().totalSteps,
      output: 'Overnight support and self-serve onboarding.',
      nextStepNeeded: true,
      ...overrides,
    });
    const first = result.content[0];
    return first.type === 'text' ? (first as { text: string }).text : '';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

describe('a refused field is reported as a field', () => {
  it('names the field instead of the step number', async () => {
    // vacantSpaces entries need four keys. The schema used to describe them as
    // plain strings, so this is exactly what an obedient caller sent.
    const text = await runStep({
      vacantSpaces: ['overnight support', 'self-serve onboarding'],
    } as Partial<ExecuteThinkingStepInput>);

    expect(text).toContain('vacantSpaces');
    expect(text, 'the step number was never the problem').not.toContain('Valid range is');
    expect(text).toContain('E102');
  });

  it('still reports a genuine out-of-range step as one', async () => {
    const text = await runStep({ currentStep: 99, totalSteps: 5 });

    expect(text).toContain('exceeds total steps');
    expect(text).toContain('E206');
  });

  it('accepts the same field once it is the shape the schema now describes', async () => {
    const text = await runStep({
      vacantSpaces: [
        {
          space: 'overnight support',
          opportunityValue: 'high',
          implementationDifficulty: 'medium',
          whyVacant: 'everyone staffs to business hours',
        },
      ],
    } as Partial<ExecuteThinkingStepInput>);

    expect(text).not.toContain('E102');
    expect(text).toContain('overnight support');
  });
});
