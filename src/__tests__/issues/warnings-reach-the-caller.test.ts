/**
 * What the monitoring concludes has to reach the caller.
 *
 * `recordThinkingStep` returned an `EarlyWarningState` and, when things got bad
 * enough, an `EscapeProtocol` — the exact types `SessionData` declares fields
 * for. Nothing assigned them. A note in the orchestrator explained that session
 * state was not updated "due to type incompatibility between simplified adapted
 * types and full SessionData interface requirements": true of the adapted
 * result, and beside the point, because the raw result was already the right
 * shape and the adapter is what flattens it.
 *
 * So `ResponseBuilder`, `ExecutionResponseBuilder.addWarnings` and
 * `MetricsCollector` all read these fields, all read undefined, and a session
 * could reach `escape` internally while reporting nothing at all. Measured
 * before the fix: zero of twenty responses carried a warning state on a chain
 * whose internal state said escape on eleven of them.
 *
 * The second half matters as much. The response carried a list of warnings and
 * a count, and withheld the verdict — `overallRisk` and `recommendedAction` —
 * so a caller could see that something was flagged but not whether the server
 * thought it should continue, change course, or stop. A caller inferring that
 * from message strings is doing the server's job for it.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import type { LateralTechnique } from '../../types/index.js';

const PROBLEM = 'Retire the legacy pipeline';

interface StepReading {
  step: number;
  risk?: string;
  action?: string;
  hasEscape: boolean;
  /** What the caller received for this step, whole. */
  response: Record<string, unknown>;
}

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

/** Walks a plan and reports what each response actually carried. */
async function walk(techniques: LateralTechnique[]): Promise<StepReading[]> {
  const plan = JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques,
        timeframe: 'thorough',
      })
    )
  ) as { planId: string; estimatedSteps: number; workflow: Array<{ technique: LateralTechnique }> };

  const steps = plan.workflow.map(block => block.technique);
  let sessionId: string | undefined;
  const readings: StepReading[] = [];

  for (let index = 0; index < steps.length; index++) {
    const data = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          planId: plan.planId,
          ...(sessionId ? { sessionId } : {}),
          technique: steps[index],
          problem: PROBLEM,
          currentStep: index + 1,
          totalSteps: plan.estimatedSteps,
          output: 'A recorded finding for this step, written plainly.',
          nextStepNeeded: index < steps.length - 1,
        })
      )
    ) as Record<string, unknown>;

    sessionId = (data.sessionId as string) ?? sessionId;
    const warning = data.earlyWarningState as
      | { overallRisk?: string; recommendedAction?: string }
      | undefined;

    readings.push({
      step: index + 1,
      risk: warning?.overallRisk,
      action: warning?.recommendedAction,
      hasEscape: data.escapeRecommendation !== undefined,
      response: data,
    });
  }

  return readings;
}

/** Fifteen steps of low-reversibility work; reaches escape. */
const COMMITTING: LateralTechnique[] = [
  'context_reframing',
  'context_reframing',
  'context_reframing',
];

/** Thirteen steps that commit to nothing. */
const REFLECTIVE: LateralTechnique[] = ['neural_state', 'random_entry', 'six_hats'];

describe('a session that is running out of room says so', () => {
  it('records the warning state on the session, where every reader looks', async () => {
    const readings = await walk(COMMITTING);

    // Assigned from the raw result, not the adapter, so the readers that have
    // always been complete finally have something to read.
    // Read off the response, not the session object. The fields were assigned
    // to the session all along in one earlier version and still never reached a
    // caller, because the response allowlist did not carry them.
    expect(
      readings.some(r => r.risk !== undefined),
      'no response carried a warning'
    ).toBe(true);
    expect(readings.at(-1)?.hasEscape, 'no escape protocol reached the caller').toBe(true);
  });

  it('reports the verdict, not only the evidence', async () => {
    const readings = await walk(COMMITTING);
    const withVerdict = readings.filter(r => r.risk !== undefined);

    expect(withVerdict.length, 'no response carried a risk level').toBeGreaterThan(0);
    for (const reading of withVerdict) {
      expect(reading.action, `step ${reading.step} reported a risk with no action`).toBeDefined();
    }
  });

  it('escalates as the session spends its room, and offers a way out at the end', async () => {
    const readings = await walk(COMMITTING);
    const actions = readings.map(r => r.action).filter(Boolean);

    expect(actions).toContain('pivot');
    expect(actions).toContain('escape');
    expect(readings.at(-1)?.hasEscape, 'no escape protocol offered at the end').toBe(true);

    // The escape must not arrive before the pivot.
    expect(readings.findIndex(r => r.action === 'escape')).toBeGreaterThan(
      readings.findIndex(r => r.action === 'pivot')
    );
  });

  it('says nothing of the kind about a session that has committed to nothing', async () => {
    // The control. Longer than the committing chain, and it must stay quiet —
    // a warning channel that fires on reflection is one a caller learns to
    // ignore, which costs the warnings that matter.
    const readings = await walk(REFLECTIVE);

    expect(readings.length).toBeGreaterThanOrEqual(13);
    expect(readings.some(r => r.action === 'pivot' || r.action === 'escape')).toBe(false);
    expect(readings.some(r => r.hasEscape)).toBe(false);
  });

  it('withdraws the escape protocol when the reading no longer calls for one', async () => {
    // The assignment had no else-branch, so a protocol outlived the condition
    // that produced it. Measured: escape fired at step 15, and step 19 reported
    // `recommendedAction: 'pivot'` with the escape protocol still attached —
    // the response contradicting itself about what to do next.
    const readings = await walk([...COMMITTING, 'six_hats']);

    const contradictory = readings.filter(r => r.hasEscape && r.action !== 'escape');
    expect(
      contradictory.map(r => `step ${r.step}: ${r.action} + escape protocol`),
      'an escape protocol outlived the reading that produced it'
    ).toEqual([]);
  });
});
