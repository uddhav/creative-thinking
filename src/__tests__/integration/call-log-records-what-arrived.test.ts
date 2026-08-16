/**
 * `CT_CALL_LOG` records the calls the server received, not the calls a caller
 * says it made.
 *
 * The distinction is the whole reason it exists. An eval that grades a run
 * against a log the run wrote about itself is grading the run's account: a
 * session that omitted a field and then reported sending it scores identically
 * to one that sent it. Asking the executor to write a structured `calls.jsonl`
 * instead of prose changes the format and not the evidence — the file is still
 * written by the party whose claim is in question.
 *
 * Written by the server, the record can contradict the caller. That is the
 * property being guarded here, and the two assertions that matter are: an
 * argument appears as it actually arrived, and a call the server REFUSED is
 * still recorded. A log that only captured accepted calls would hide precisely
 * the runs worth investigating.
 *
 * There is no third test asserting the feature is opt-in, and the absence is
 * deliberate. Two attempts were made. The first asserted a freshly-made temp
 * path did not exist — a path the server was never given, so nothing in
 * `recordCallToLog` could have created it. The second watched the log this
 * suite's own server writes, which the quiet server has no channel to either.
 * Both could not fail.
 *
 * The property is real and not observable from outside: a server told to write
 * nowhere writes nowhere, and there is no file to check. Every break —
 * dropping the early return, defaulting the path, removing the swallow — either
 * writes somewhere neither assertion is looking or throws into a catch. An
 * assertion that cannot fail is worse than none, because it reads as coverage.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

interface LoggedCall {
  tool: string;
  arguments: Record<string, unknown> | null;
}

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

describe('the server records the calls it was given', () => {
  let client: MCPClientTestHelper;
  let dir: string;
  let logPath: string;

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'ct-call-log-'));
    logPath = path.join(dir, 'calls.jsonl');

    client = new MCPClientTestHelper();
    await client.connect({ env: { ...process.env, CT_CALL_LOG: logPath } });
  }, 30_000);

  afterAll(async () => {
    await client.disconnect();
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);

  function logged(): LoggedCall[] {
    if (!existsSync(logPath)) return [];
    return readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line) as LoggedCall);
  }

  it('records each call with the arguments that actually arrived', async () => {
    const plan = JSON.parse(
      textOf(
        await client.callTool('plan_thinking_session', {
          problem: PROBLEM,
          techniques: ['six_hats'],
          timeframe: 'thorough',
        })
      )
    ) as { planId: string };

    await client.callTool('execute_thinking_step', {
      planId: plan.planId,
      technique: 'six_hats',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 7,
      output: 'A recorded finding for this step, written plainly and at length.',
      nextStepNeeded: true,
      hatColor: 'blue',
    });

    const calls = logged();
    expect(calls.map(c => c.tool)).toEqual(['plan_thinking_session', 'execute_thinking_step']);

    const step = calls[1].arguments ?? {};
    expect(step.hatColor).toBe('blue');
    expect(step.currentStep).toBe(1);
    expect(step.technique).toBe('six_hats');
  }, 30_000);

  it('records a call the server refused', async () => {
    // `purple` is a real hat on the wrong step, so the handler rejects the data.
    // A log that dropped this would hide exactly the runs worth looking at.
    const before = logged().length;
    let refused = false;
    try {
      const result = await client.callTool('execute_thinking_step', {
        planId: 'no-such-plan',
        technique: 'six_hats',
        problem: PROBLEM,
        currentStep: 2,
        totalSteps: 7,
        output: 'A recorded finding for this step, written plainly and at length.',
        nextStepNeeded: true,
        hatColor: 'purple',
      });
      refused = result.isError === true;
    } catch {
      /* the helper throws on isError responses; either way it was refused */
      refused = true;
    }

    // Pinned, so this test cannot silently become "records an accepted call" —
    // if a change makes this fixture succeed, the refused-call property would
    // otherwise stop being covered while the log assertions stayed green.
    expect(refused, 'the fixture stopped being a refusal').toBe(true);

    const calls = logged();
    expect(calls.length, 'a refused call left no trace').toBe(before + 1);
    expect(calls.at(-1)?.arguments?.hatColor).toBe('purple');
  }, 30_000);
});
