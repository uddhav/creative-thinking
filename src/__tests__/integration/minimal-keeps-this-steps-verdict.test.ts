/**
 * The rule for what `verbosity: 'minimal'` keeps: this step's verdict stays;
 * cumulative re-sends and echoes of the caller's input drop.
 *
 * `pathImpact` is the server's reversibility judgment about THIS scamper step
 * — computed by the handler, replacing anything the caller sent, carrying a
 * per-step `reversible` boolean that nothing else in a minimal response
 * substitutes for. Minimal used to drop it while the sunset notice, in three
 * places, told callers it was dropping "echoes of your own input". Measured:
 * a fully populated caller-sent pathImpact comes back with zero of its values
 * surviving, so it was never an echo.
 *
 * `modificationHistory` stays OUT of minimal — not because it is an echo (it
 * is rebuilt by the server from history on every step, the caller's copy
 * destructured away), but because it re-sends every prior step's pathImpact
 * on every step. That is the quadratic shape minimal exists to kill, and the
 * same reason `insights` became `newInsights`: each step's verdict was
 * delivered when that step ran.
 *
 * Asserted where the caller stands, through the built server.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Reduce checkout abandonment on the mobile web app';

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
  pathImpact?: { reversible?: boolean; dependenciesCreated?: string[] };
  modificationHistory?: unknown[];
  output?: string;
  problem?: string;
  insights?: unknown;
  newInsights?: unknown;
}

async function plan(techniques: string[]): Promise<string> {
  return (
    JSON.parse(
      textOf(await client.callTool('plan_thinking_session', { problem: PROBLEM, techniques }))
    ) as { planId: string }
  ).planId;
}

async function scamperStep(
  planId: string,
  sessionId: string,
  step: number,
  action: string,
  verbosity: 'minimal' | 'full'
): Promise<StepResponse> {
  return JSON.parse(
    textOf(
      await client.callTool('execute_thinking_step', {
        planId,
        sessionId,
        technique: 'scamper',
        problem: PROBLEM,
        currentStep: step,
        totalSteps: 8,
        scamperAction: action,
        output: `Applying ${action}: replace the multi-page checkout with a single accordion form.`,
        nextStepNeeded: true,
        verbosity,
      })
    )
  ) as StepResponse;
}

describe("minimal keeps this step's verdict", () => {
  it('a scamper step under minimal carries pathImpact with its reversible boolean', async () => {
    const planId = await plan(['scamper']);
    const r = await scamperStep(
      planId,
      `session_verdict_${Date.now()}_a`,
      1,
      'substitute',
      'minimal'
    );

    expect(
      r.pathImpact,
      "pathImpact is the server's judgment about this step, not an echo; minimal must keep it"
    ).toBeDefined();
    expect(typeof r.pathImpact?.reversible, 'pathImpact.reversible must be a boolean').toBe(
      'boolean'
    );
    // Still an echo-free response.
    expect(r.output).toBeUndefined();
    expect(r.problem).toBeUndefined();
  }, 30_000);

  it('a caller-sent pathImpact is replaced, not echoed — proving it is a verdict', async () => {
    const planId = await plan(['scamper']);
    const sessionId = `session_verdict_${Date.now()}_b`;
    const r = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          planId,
          sessionId,
          technique: 'scamper',
          problem: PROBLEM,
          currentStep: 1,
          totalSteps: 8,
          scamperAction: 'substitute',
          output:
            'Applying substitute: replace the multi-page checkout with a single accordion form.',
          nextStepNeeded: true,
          verbosity: 'minimal',
          pathImpact: { reversible: false, dependenciesCreated: ['CALLER_SENTINEL'] },
        })
      )
    ) as StepResponse;

    expect(r.pathImpact).toBeDefined();
    expect(r.pathImpact?.dependenciesCreated ?? []).not.toContain('CALLER_SENTINEL');
  }, 30_000);

  it('a scamper step WITHOUT scamperAction does not echo a caller-sent pathImpact', async () => {
    // The server computes pathImpact only when scamperAction is present. On a
    // scamper step without one there is no verdict to keep — so a caller-sent
    // object must not ride through the keep list as if it were one. Found by
    // review: before this guard, the sentinel came back verbatim under minimal
    // and fieldsRecorded listed pathImpact as a field the server had read.
    const planId = await plan(['scamper']);
    const r = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          planId,
          sessionId: `session_verdict_${Date.now()}_d`,
          technique: 'scamper',
          problem: PROBLEM,
          currentStep: 1,
          totalSteps: 8,
          output: 'A scamper step sent without its action, at length.',
          nextStepNeeded: true,
          verbosity: 'minimal',
          pathImpact: { reversible: false, dependenciesCreated: ['CALLER_SENTINEL'] },
        })
      )
    ) as StepResponse & { fieldsRecorded?: string[] };

    expect(
      r.pathImpact,
      'no scamperAction means no server verdict — nothing to keep'
    ).toBeUndefined();
    expect(JSON.stringify(r)).not.toContain('CALLER_SENTINEL');
    expect(r.fieldsRecorded ?? []).not.toContain('pathImpact');
  }, 30_000);
});

describe('minimal still drops cumulative re-sends', () => {
  it('modificationHistory is absent under minimal on a second scamper step, present under full', async () => {
    const planId = await plan(['scamper']);
    const sessionId = `session_verdict_${Date.now()}_c`;
    await scamperStep(planId, sessionId, 1, 'substitute', 'full');

    const minimal = await scamperStep(planId, sessionId, 2, 'combine', 'minimal');
    expect(
      minimal.modificationHistory,
      'modificationHistory re-sends every prior pathImpact; minimal must not carry it'
    ).toBeUndefined();
    expect(minimal.pathImpact, "but this step's own verdict is there").toBeDefined();

    const full = await scamperStep(planId, sessionId, 3, 'adapt', 'full');
    expect(Array.isArray(full.modificationHistory), 'full mode still carries the history').toBe(
      true
    );
    expect((full.modificationHistory ?? []).length).toBeGreaterThan(0);
  }, 60_000);
});
