/**
 * `optionSpaceSize` (#414), observed on the step response through the built
 * server.
 *
 * The v2.4.5 note said the field is omitted when unmeasured. The branch
 * existed in the adapter and the builder and was unreachable: the metric it
 * reads, `optionVelocity`, was a plain number computed as (opened − closed)
 * over the recent window, which is 0 for two empty arrays, so every step of
 * every non-SCAMPER technique published `optionSpaceSize: 0`, and a zero
 * reads as "no room left". The velocity is now undefined until some entry
 * in the window records an option, which only SCAMPER with an action does.
 * Once measured it is signed: `substitute` opens two and closes two (0);
 * `eliminate` closes more than it opens (negative).
 *
 * Breaks: `?? 0` in calculateOptionVelocity (the six_hats case reads 0);
 * drop the `serverDerived` branch in ErgodicityOrchestrator (the SCAMPER
 * cases read absent).
 *
 * Runs the BUILT server (dist/): rebuild before trusting a kill-check.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut onboarding time for new engineers in half';

interface Step {
  sessionId?: string;
  ergodicityMetrics?: { optionSpaceSize?: number; currentFlexibility?: number };
}

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content[0]?.text ?? '';
}

describe('optionSpaceSize (#414)', () => {
  let client: MCPClientTestHelper;

  beforeAll(async () => {
    client = new MCPClientTestHelper();
    await client.connect({ env: { ...process.env } });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  async function plan(techniques: string[]): Promise<string> {
    const r = await client.callTool('plan_thinking_session', { problem: PROBLEM, techniques });
    return (JSON.parse(textOf(r)) as { planId: string }).planId;
  }

  async function step(
    planId: string,
    technique: string,
    n: number,
    total: number,
    extra: Record<string, unknown>,
    sessionId?: string
  ): Promise<Step> {
    const r = await client.callTool('execute_thinking_step', {
      planId,
      ...(sessionId ? { sessionId } : {}),
      technique,
      problem: PROBLEM,
      currentStep: n,
      totalSteps: total,
      output: `${technique} step ${n}: a concrete answer about onboarding`,
      nextStepNeeded: n < total,
      ...extra,
    });
    return JSON.parse(textOf(r)) as Step;
  }

  it('is absent on a technique that records no options', async () => {
    const planId = await plan(['six_hats']);
    const s = await step(planId, 'six_hats', 1, 7, {});
    expect(s.ergodicityMetrics).toBeDefined();
    expect(s.ergodicityMetrics).not.toHaveProperty('optionSpaceSize');
    expect(s.ergodicityMetrics?.currentFlexibility).toBeGreaterThan(0);
  }, 30_000);

  it('stays present for the four steps after a SCAMPER action and leaves with the window', async () => {
    // The predicate is over the last five recorded steps, not per technique.
    const planId = await plan(['scamper', 'six_hats']);
    const s1 = await step(planId, 'scamper', 1, 8, { scamperAction: 'substitute' });
    expect(s1.ergodicityMetrics).toHaveProperty('optionSpaceSize');
    let last: Step = s1;
    for (let n = 1; n <= 4; n++) {
      last = await step(planId, 'six_hats', n, 7, {}, last.sessionId ?? s1.sessionId);
      expect(last.ergodicityMetrics, `six_hats step ${n}`).toHaveProperty('optionSpaceSize');
    }
    const out = await step(planId, 'six_hats', 5, 7, {}, last.sessionId ?? s1.sessionId);
    expect(out.ergodicityMetrics).not.toHaveProperty('optionSpaceSize');
  }, 60_000);

  it('is a measured number on SCAMPER: substitute reads 0, eliminate reads below 0', async () => {
    const planId = await plan(['scamper']);
    const s1 = await step(planId, 'scamper', 1, 8, { scamperAction: 'substitute' });
    expect(s1.ergodicityMetrics).toHaveProperty('optionSpaceSize');
    expect(s1.ergodicityMetrics?.optionSpaceSize).toBe(0);
    const s2 = await step(planId, 'scamper', 2, 8, { scamperAction: 'eliminate' }, s1.sessionId);
    expect(typeof s2.ergodicityMetrics?.optionSpaceSize).toBe('number');
    expect(s2.ergodicityMetrics?.optionSpaceSize).toBeLessThan(0);
  }, 40_000);
});
