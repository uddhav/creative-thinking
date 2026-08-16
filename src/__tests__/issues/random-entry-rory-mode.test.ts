/**
 * `roryMode` was an input the server accepted, validated strictly, and could
 * not act on.
 *
 * `RandomEntryHandler.getStepGuidance` takes a third argument carrying the
 * flag, and about ninety lines of Rory Mode guidance sit behind it. The
 * `TechniqueHandler` interface declared two parameters, so every call site
 * passed two, so `context` was always undefined and every one of those branches
 * was unreachable. Meanwhile `validateStep` rejected any step whose `roryMode`
 * was not a boolean, and `extractInsights` read the flag — the feature was
 * live everywhere except where it did anything.
 *
 * Step 3 had a second fault of its own: it counted occurrences of "could",
 * "might" and "perhaps" in the prose and reported that count as the number of
 * ideas. Ideas written in the imperative counted zero and were reported as
 * nothing at all.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';

const PROBLEM = 'Nobody upgrades to the paid tier';

// The guidance a caller reads is the subject of the first describe, so it runs
// through the real client. The second describe calls `extractInsights` directly
// and stays there: it is handler internals, and nothing in the request path can
// change them.
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

async function runStep1(roryMode: boolean | undefined): Promise<string> {
  const plan = JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: ['random_entry'],
        timeframe: 'quick',
      })
    )
  ) as { planId: string };

  return textOf(
    await client.callTool('execute_thinking_step', {
      planId: plan.planId,
      technique: 'random_entry',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 3,
      output: 'Picked a stimulus without looking at the problem.',
      nextStepNeeded: true,
      ...(roryMode === undefined ? {} : { roryMode }),
    })
  );
}

describe('Rory Mode reaches the guidance', () => {
  it('gives the behavioural branch when the session asked for it', async () => {
    const text = await runStep1(true);

    expect(text).toContain('Rory Mode');
    expect(text).toContain('Humans are not logical');
  });

  it('leaves the ordinary branch alone when it did not', async () => {
    const text = await runStep1(false);

    expect(text).not.toContain('Humans are not logical');
    expect(text).toContain('Force Connections');
  });

  it('treats an absent flag as off', async () => {
    const text = await runStep1(undefined);

    expect(text).not.toContain('Humans are not logical');
  });
});

describe('random_entry reports what its steps recorded', () => {
  const handler = TechniqueRegistry.getInstance().getHandler('random_entry');

  it('reports step 3 whether or not the prose hedges', () => {
    // "Ship a shadow deploy" contains none of could/might/perhaps, and used to
    // count as zero ideas and produce nothing.
    const insights = handler.extractInsights([
      {
        currentStep: 3,
        output: 'Ship a shadow deploy; charge for the slow lane.',
      },
    ]);

    expect(insights.join(' ')).toContain('Ship a shadow deploy');
    expect(insights.join(' ')).not.toMatch(/Generated \d+ potential ideas/);
  });

  it('reports every forced connection, not the first', () => {
    const insights = handler.extractInsights([
      {
        currentStep: 2,
        output: 'Three links.',
        connections: ['status anxiety', 'loss aversion', 'social proof'],
      },
    ]);

    const text = insights.join(' ');
    expect(text).toContain('status anxiety');
    expect(text).toContain('loss aversion');
    expect(text).toContain('social proof');
  });

  it('does not close with a banner asserting non-obvious solutions', () => {
    const insights = handler.extractInsights([
      { currentStep: 1, output: 'A.', randomStimulus: 'anchoring', roryMode: true },
      { currentStep: 2, output: 'B.', connections: ['anchor high'] },
      { currentStep: 3, output: 'C.' },
    ]);

    // It fired on any three-entry history and asserted the outcome regardless
    // of what the three steps said.
    expect(insights.join(' ')).not.toContain('non-obvious solutions');
  });
});
