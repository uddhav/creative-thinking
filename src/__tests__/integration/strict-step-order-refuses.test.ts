/**
 * Opt-in strict step order refuses, and records nothing (#298).
 *
 * The default stays advisory and is pinned elsewhere: out-of-order-steps.test.ts
 * pins accept-and-redirect for a hole (a single-technique plan, so it says
 * nothing about numbering), and numbering-mismatch-reaches-the-caller.test.ts
 * pins the `numbering.mismatch` advisory finding. This file is the other
 * switch position: `STEP_ORDER_ENFORCEMENT=strict` in the spawned server's env,
 * or `strictness: 'enforcing'` on the plan.
 *
 * Every assertion is made where the caller stands, through the built server,
 * and the load-bearing one is negative: after a refusal, re-sending the
 * missing step and then the refused step must produce NO duplicate notice.
 * That is the only proof visible from outside that the refused call left
 * nothing in the history — `completedSteps` cannot tell, because 1, 2, 3 are
 * distinct either way.
 *
 * Three shapes: a skipped step, a contradictory numbering pairing, and a
 * stimulus the plan did not assign.
 *
 * Plan `['po','six_hats']` for the first two so the numbering conventions differ
 * (po 4, six_hats 7: technique-local 1/7 versus plan-wide 5/11). WorkflowGuard
 * does not refuse running the second technique first (a found plan satisfies
 * it), so six_hats-first is a supported shape here, not a bug to fix.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

let strict: MCPClientTestHelper;
let plain: MCPClientTestHelper;
let seq = 0;

beforeAll(async () => {
  const base = { ...process.env };
  delete base.STEP_ORDER_ENFORCEMENT;
  strict = new MCPClientTestHelper();
  await strict.connect({ env: { ...base, STEP_ORDER_ENFORCEMENT: 'strict' } });
  plain = new MCPClientTestHelper();
  await plain.connect({ env: base });
}, 60_000);

afterAll(async () => {
  await strict.disconnect();
  await plain.disconnect();
}, 30_000);

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    recovery?: string[];
    context?: { gate?: string; missingStep?: number; refusedStep?: number };
  };
}

interface StepResponse {
  nextStepGuidance?: string;
  techniqueProgress?: { currentTechnique?: string; techniqueStep?: number };
  completionMetadata?: { completedSteps?: number };
  advisoryFindings?: Array<{ gate: string }>;
}

async function planOn(
  client: MCPClientTestHelper,
  techniques: string[],
  extra: Record<string, unknown> = {}
): Promise<string> {
  const result = await client.callTool('plan_thinking_session', {
    problem: PROBLEM,
    techniques,
    ...extra,
  });
  return (JSON.parse(textOf(result)) as { planId: string }).planId;
}

interface StepArgs {
  currentStep: number;
  totalSteps: number;
  technique?: string;
  nextStepNeeded?: boolean;
}

async function step(
  client: MCPClientTestHelper,
  planId: string,
  sessionId: string,
  args: StepArgs
): Promise<{ isError: boolean; body: StepResponse & ErrorEnvelope }> {
  const result = await client.callTool('execute_thinking_step', {
    planId,
    sessionId,
    technique: args.technique ?? 'six_hats',
    problem: PROBLEM,
    currentStep: args.currentStep,
    totalSteps: args.totalSteps,
    output: `Step ${args.currentStep} of ${args.technique ?? 'six_hats'}, written at length.`,
    nextStepNeeded: args.nextStepNeeded ?? true,
  });
  return {
    isError: result.isError === true,
    body: JSON.parse(textOf(result)) as StepResponse & ErrorEnvelope,
  };
}

function freshSession(): string {
  seq += 1;
  return `session_strict_${Date.now()}_${seq}`;
}

describe('STEP_ORDER_ENFORCEMENT=strict', () => {
  it('refuses a hole with E211, names the missing step in both forms, and records nothing', async () => {
    const planId = await planOn(strict, ['po', 'six_hats']);
    const sessionId = freshSession();

    const first = await step(strict, planId, sessionId, { currentStep: 1, totalSteps: 7 });
    expect(first.isError, 'step 1 must be accepted').toBe(false);

    const refused = await step(strict, planId, sessionId, { currentStep: 3, totalSteps: 7 });
    expect(refused.isError, 'step 3 with step 2 missing must be refused').toBe(true);
    expect(refused.body.error?.code).toBe('E211');
    expect(refused.body.error?.context?.gate).toBe('order.skipped');
    expect(refused.body.error?.context?.missingStep).toBe(2);
    expect(refused.body.error?.message ?? '').toMatch(
      /Step 3 of six_hats refused: step 2 has not been recorded/
    );
    expect(refused.body.error?.message ?? '').toMatch(/nothing from this call was recorded/i);
    const recovery = (refused.body.error?.recovery ?? []).join('\n');
    expect(recovery).toContain('currentStep 2 with totalSteps 7');
    expect(recovery).toContain('currentStep 6 with totalSteps 11');
    // The missing step's own prompt travels with the refusal, as the advisory
    // redirect's does. Step 2 of six_hats is the White Hat.
    expect(recovery.toLowerCase()).toContain('white hat');

    // The proof that the refused call recorded nothing: no duplicate notice
    // when step 3 arrives again after step 2.
    const second = await step(strict, planId, sessionId, { currentStep: 2, totalSteps: 7 });
    expect(second.isError).toBe(false);
    const third = await step(strict, planId, sessionId, { currentStep: 3, totalSteps: 7 });
    expect(third.isError).toBe(false);
    expect(third.body.nextStepGuidance ?? '').not.toMatch(/had already been recorded/);
    expect(third.body.completionMetadata?.completedSteps).toBe(3);
  }, 60_000);

  it('refuses the contradictory numbering pairing, then accepts the corrected form', async () => {
    const planId = await planOn(strict, ['po', 'six_hats']);
    const sessionId = freshSession();

    // six_hats step 1 numbered within the technique but paired with the
    // plan-wide total: executes as step 1, counted as nothing (#404).
    const refused = await step(strict, planId, sessionId, { currentStep: 1, totalSteps: 11 });
    expect(refused.isError).toBe(true);
    expect(refused.body.error?.code).toBe('E211');
    expect(refused.body.error?.context?.gate).toBe('numbering.mismatch');
    const recovery = (refused.body.error?.recovery ?? []).join('\n');
    expect(recovery).toContain('currentStep 1 with totalSteps 7');
    expect(recovery).toContain('currentStep 5 with totalSteps 11');

    const accepted = await step(strict, planId, sessionId, { currentStep: 1, totalSteps: 7 });
    expect(accepted.isError).toBe(false);
    expect(accepted.body.techniqueProgress?.techniqueStep).toBe(1);
    expect((accepted.body.advisoryFindings ?? []).map(f => f.gate)).not.toContain(
      'numbering.mismatch'
    );
  }, 60_000);

  it('refuses a hole in the second run of a repeated technique under plan-wide numbering', async () => {
    // The pre-push run resolution case. `techniqueLocalProgress` reads the run
    // off the LAST history entry, which before the push is the previous step;
    // for ['po','six_hats','po'] with run 1 of po complete, run 2's step 2 sent
    // as 13/15 with run 2's step 1 never sent would be judged against run 1's
    // steps and pass. The advisory redirect catches it after the push; strict
    // must catch it before.
    const planId = await planOn(strict, ['po', 'six_hats', 'po']);
    const sessionId = freshSession();
    for (let s = 1; s <= 4; s++) {
      const r = await step(strict, planId, sessionId, {
        technique: 'po',
        currentStep: s,
        totalSteps: 4,
      });
      expect(r.isError, `po run 1 step ${s}`).toBe(false);
    }
    // Run 2 of po, plan-wide numbering: steps 12..15. Step 13 with 12 missing.
    const refused = await step(strict, planId, sessionId, {
      technique: 'po',
      currentStep: 13,
      totalSteps: 15,
    });
    expect(refused.isError, 'run 2 step 2 with run 2 step 1 missing').toBe(true);
    expect(refused.body.error?.code).toBe('E211');
    expect(refused.body.error?.context?.gate).toBe('order.skipped');
    expect(refused.body.error?.context?.missingStep).toBe(1);

    // And run 2's step 1 is never refused: the range below it is empty.
    const runTwoStart = await step(strict, planId, sessionId, {
      technique: 'po',
      currentStep: 12,
      totalSteps: 15,
    });
    expect(runTwoStart.isError, 'run 2 step 1 must be accepted').toBe(false);
  }, 90_000);

  it('names run 2 resend forms for a repeated technique numbered locally', async () => {
    // Review finding: the plan-wide form came from the validator's
    // first-occurrence block, so run 2 step 2 of ['po','six_hats','po'] was
    // named as 2/15 instead of 13/15, and following it looped forever.
    const planId = await planOn(strict, ['po', 'six_hats', 'po']);
    const sessionId = freshSession();
    for (let s = 1; s <= 4; s++) {
      const r = await step(strict, planId, sessionId, {
        technique: 'po',
        currentStep: s,
        totalSteps: 4,
      });
      expect(r.isError, `po run 1 step ${s}`).toBe(false);
    }
    const runTwoStart = await step(strict, planId, sessionId, {
      technique: 'po',
      currentStep: 1,
      totalSteps: 4,
    });
    expect(runTwoStart.isError, 'run 2 step 1 (local) must be accepted').toBe(false);

    const refused = await step(strict, planId, sessionId, {
      technique: 'po',
      currentStep: 3,
      totalSteps: 4,
    });
    expect(refused.isError, 'run 2 step 3 with step 2 missing').toBe(true);
    expect(refused.body.error?.context?.missingStep).toBe(2);
    const recovery = (refused.body.error?.recovery ?? []).join('\n');
    expect(recovery).toContain('currentStep 2 with totalSteps 4');
    expect(recovery, 'the plan-wide form must name run 2, not run 1').toContain(
      'currentStep 13 with totalSteps 15'
    );
    expect(recovery).not.toContain('currentStep 2 with totalSteps 15');

    // Following the plan-wide form exits the loop.
    const followed = await step(strict, planId, sessionId, {
      technique: 'po',
      currentStep: 13,
      totalSteps: 15,
    });
    expect(followed.isError, 'the named plan-wide form must be accepted').toBe(false);
    const again = await step(strict, planId, sessionId, {
      technique: 'po',
      currentStep: 3,
      totalSteps: 4,
    });
    expect(again.isError, 'step 3 after the named form').toBe(false);
  }, 90_000);

  it('records errorCode and errorGate on the call-log result line', async () => {
    // The analyser counts by these; nothing else asserted they were written.
    const { mkdtempSync, readFileSync, rmSync } = await import('fs');
    const { tmpdir } = await import('os');
    const path = await import('path');
    const dir = mkdtempSync(path.join(tmpdir(), 'ct-strict-log-'));
    const log = path.join(dir, 'calls.jsonl');
    const base = { ...process.env };
    delete base.STEP_ORDER_ENFORCEMENT;
    const logged = new MCPClientTestHelper();
    await logged.connect({ env: { ...base, STEP_ORDER_ENFORCEMENT: 'strict', CT_CALL_LOG: log } });
    try {
      const planId = await planOn(logged, ['po', 'six_hats']);
      const sessionId = freshSession();
      await step(logged, planId, sessionId, { currentStep: 1, totalSteps: 7 });
      await step(logged, planId, sessionId, { currentStep: 3, totalSteps: 7 });
      const lines = readFileSync(log, 'utf8')
        .trim()
        .split('\n')
        .map(
          l =>
            JSON.parse(l) as {
              kind?: string;
              isError?: boolean;
              errorCode?: string;
              errorGate?: string;
            }
        );
      const refusal = lines.find(l => l.kind === 'result' && l.isError === true);
      expect(refusal?.errorCode).toBe('E211');
      expect(refusal?.errorGate).toBe('order.skipped');
    } finally {
      await logged.disconnect();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('refuses a stimulus the plan did not assign, then accepts the assigned one', async () => {
    // Advisory mode records the wrong stimulus to history and flags it after
    // the fact; a controlled retest sent "a falconer's glove" against an
    // assigned "irrigation" and found it persisted. Strict refuses it first.
    const planResult = await strict.callTool('plan_thinking_session', {
      problem: PROBLEM,
      techniques: ['random_entry'],
    });
    const plan = JSON.parse(textOf(planResult)) as {
      planId: string;
      workflow: Array<{ stimulus?: string }>;
    };
    const assigned = plan.workflow[0]?.stimulus;
    expect(typeof assigned, 'the plan assigns a random_entry stimulus').toBe('string');
    const sessionId = freshSession();

    const refused = await strict.callTool('execute_thinking_step', {
      planId: plan.planId,
      sessionId,
      technique: 'random_entry',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 3,
      randomStimulus: "a falconer's glove",
      output: 'Working from a stimulus of my own choosing, at length.',
      nextStepNeeded: true,
    });
    expect(refused.isError === true, 'an unassigned stimulus must be refused').toBe(true);
    const env = JSON.parse(textOf(refused)) as ErrorEnvelope;
    expect(env.error?.code).toBe('E211');
    expect(env.error?.context?.gate).toBe('stimulus.mismatch');
    expect((env.error?.recovery ?? []).join('\n')).toContain(`"${assigned}"`);

    const accepted = await strict.callTool('execute_thinking_step', {
      planId: plan.planId,
      sessionId,
      technique: 'random_entry',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 3,
      randomStimulus: assigned,
      output: `Working from the assigned stimulus ${assigned}, at length.`,
      nextStepNeeded: true,
    });
    expect(accepted.isError === true).toBe(false);
    const body = JSON.parse(textOf(accepted)) as StepResponse;
    expect((body.advisoryFindings ?? []).map(f => f.gate)).not.toContain('stimulus.mismatch');
  }, 60_000);

  it('a plan declared with strictness enforcing is strict without the env var', async () => {
    const planId = await planOn(plain, ['po', 'six_hats'], { strictness: 'enforcing' });
    const sessionId = freshSession();
    const first = await step(plain, planId, sessionId, { currentStep: 1, totalSteps: 7 });
    expect(first.isError).toBe(false);
    const refused = await step(plain, planId, sessionId, { currentStep: 3, totalSteps: 7 });
    expect(refused.isError).toBe(true);
    expect(refused.body.error?.code).toBe('E211');
  }, 60_000);

  it('the same plan without enforcing is advisory in the same process', async () => {
    const planId = await planOn(plain, ['po', 'six_hats']);
    const sessionId = freshSession();
    await step(plain, planId, sessionId, { currentStep: 1, totalSteps: 7 });
    const accepted = await step(plain, planId, sessionId, { currentStep: 3, totalSteps: 7 });
    expect(accepted.isError).toBe(false);
    expect(accepted.body.nextStepGuidance ?? '').toMatch(
      /Step 2 of six_hats has not been recorded/
    );
  }, 60_000);

  it('an unrecognised STEP_ORDER_ENFORCEMENT value runs advisory', async () => {
    const base = { ...process.env };
    delete base.STEP_ORDER_ENFORCEMENT;
    const bogus = new MCPClientTestHelper();
    await bogus.connect({ env: { ...base, STEP_ORDER_ENFORCEMENT: 'bogus' } });
    try {
      const planId = await planOn(bogus, ['po', 'six_hats']);
      const sessionId = freshSession();
      await step(bogus, planId, sessionId, { currentStep: 1, totalSteps: 7 });
      const accepted = await step(bogus, planId, sessionId, { currentStep: 3, totalSteps: 7 });
      expect(accepted.isError).toBe(false);
      expect(accepted.body.nextStepGuidance ?? '').toMatch(/has not been recorded/);
    } finally {
      await bogus.disconnect();
    }
  }, 60_000);
});
