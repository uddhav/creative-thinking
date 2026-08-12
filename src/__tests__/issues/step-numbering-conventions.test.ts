/**
 * A step can be numbered two ways, and both have to arrive at the same step.
 *
 * `execute_thinking_step` accepts either numbering: within the technique
 * (`currentStep` 1..n with `totalSteps` = that technique's own count) or across
 * the whole plan (`currentStep` 1..N with `totalSteps` = the plan's). The
 * existing suite exercised the first; the CLI and the skill use the second.
 *
 * For any technique after the first the two ranges OVERLAP — with a 4-step
 * block ahead of a 7-step one, local steps 4..7 are also global steps 4..7 —
 * and the resolution guessed from `currentStep` alone, which meant it always
 * chose the global reading. Under plan-wide numbering the handlers then
 * indexed their own step tables with a plan-wide number: a technique of n
 * steps behind a first block of k loses its last k steps and mislabels the
 * rest, reporting nothing at all only when k >= n. Under per-technique
 * numbering the overlapping steps folded back onto earlier ones instead.
 *
 * `totalSteps` is what distinguishes them, and it was not being read.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import type { LateralTechnique } from '../../types/index.js';

const PROBLEM = 'Shorten the time it takes a new engineer to ship';

// Driven through the real client: this is the convention the skill and the CLI
// actually send, and what it reports back is a caller-visible fact.
let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
  // Explicit timeout: vitest's hook default is 10s, and tearing down a spawned
  // server under full-suite load exceeded it. Only ever failed in the whole
  // run, never when the file was run alone.
}, 30_000);

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

/**
 * Runs a two-technique plan under one numbering convention and returns the
 * insights the completed session reported.
 */
async function runPlan(
  techniques: LateralTechnique[],
  numbering: 'per-technique' | 'plan-wide'
): Promise<string[]> {
  const plan = JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques,
        timeframe: 'thorough',
      })
    )
  ) as { planId: string; workflow: Array<{ technique: LateralTechnique; steps?: unknown[] }> };

  // Block lengths come from the plan, not the handler: the plan is what lays
  // the blocks out, and a timeframe can change how many steps it gives each.
  // The response flattens the workflow to one entry per step, so count the
  // consecutive runs rather than reading a per-block length that is not there.
  const blocks: Array<{ technique: LateralTechnique; steps: number }> = [];
  for (const entry of plan.workflow) {
    const last = blocks.at(-1);
    if (last && last.technique === entry.technique) last.steps += 1;
    else blocks.push({ technique: entry.technique, steps: 1 });
  }
  const planSteps = blocks.reduce((sum, b) => sum + b.steps, 0);

  let sessionId: string | undefined;
  let insights: string[] = [];
  let globalStep = 0;

  for (const block of blocks) {
    for (let local = 1; local <= block.steps; local++) {
      globalStep += 1;
      const isFinal = globalStep === planSteps;
      const data = JSON.parse(
        textOf(
          await client.callTool('execute_thinking_step', {
            planId: plan.planId,
            ...(sessionId ? { sessionId } : {}),
            technique: block.technique,
            problem: PROBLEM,
            currentStep: numbering === 'per-technique' ? local : globalStep,
            totalSteps: numbering === 'per-technique' ? block.steps : planSteps,
            output: `${block.technique} step ${local} recorded a finding. Second sentence.`,
            nextStepNeeded: !isFinal,
          })
        )
      ) as Record<string, unknown>;
      sessionId = (data.sessionId as string) ?? sessionId;
      insights = (data.insights as string[]) ?? insights;
    }
  }

  return insights;
}

describe('both step-numbering conventions reach the same step', () => {
  // six_hats is the legible case: its labels name the hat, so a step resolved
  // to the wrong number is visible rather than merely absent.
  const HATS = ['Blue Hat', 'White Hat', 'Red Hat', 'Yellow Hat', 'Black Hat', 'Green Hat'];

  it('reports every hat when six_hats runs second and steps are numbered plan-wide', async () => {
    const insights = await runPlan(['triz', 'six_hats'], 'plan-wide');

    // This is what the skill and the CLI send, and it reported nothing at all.
    for (const hat of [...HATS, 'Purple Hat']) {
      expect(
        insights.some(i => i.startsWith(`${hat}:`)),
        `${hat} missing`
      ).toBe(true);
    }
  });

  it('reports every hat when six_hats runs second and steps are numbered per technique', async () => {
    const insights = await runPlan(['triz', 'six_hats'], 'per-technique');

    for (const hat of [...HATS, 'Purple Hat']) {
      expect(
        insights.some(i => i.startsWith(`${hat}:`)),
        `${hat} missing`
      ).toBe(true);
    }
  });

  it('pairs each hat with the output of its own step, under both conventions', async () => {
    for (const numbering of ['plan-wide', 'per-technique'] as const) {
      const insights = await runPlan(['triz', 'six_hats'], numbering);

      // hatOrder is blue, white, red, yellow, black, green, purple — so the
      // Nth hat must carry the text of six_hats' own step N.
      [...HATS, 'Purple Hat'].forEach((hat, index) => {
        const line = insights.find(i => i.startsWith(`${hat}:`));
        expect(line, `${hat} missing under ${numbering}`).toBeDefined();
        expect(line, `${hat} carries another step's output under ${numbering}`).toContain(
          `six_hats step ${index + 1} `
        );
      });
    }
  });

  it('does not lose the trailing steps of a longer second technique', async () => {
    // nine_windows has nine steps behind triz's four, so under plan-wide
    // numbering its steps run 5..13. Steps 5-9 land inside its own table under
    // the wrong labels; 10-13 fall off the end entirely.
    const insights = await runPlan(['triz', 'nine_windows'], 'plan-wide');

    for (let step = 1; step <= 9; step++) {
      expect(
        insights.some(i => i.includes(`nine_windows step ${step} `)),
        `nine_windows step ${step} missing`
      ).toBe(true);
    }
  });
});
