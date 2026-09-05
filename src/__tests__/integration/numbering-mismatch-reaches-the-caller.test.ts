/**
 * The contradictory step-numbering pairing is named to the caller, and the
 * terminal block names steps in a convention that actually clears it (#298).
 *
 * Two components read a step's numbering by different rules. The validator's
 * ladder honours `numbering`, then infers; the completion counter reads only
 * `totalSteps`. Send six_hats behind po(4) as currentStep 1 with totalSteps 11
 * — a technique-local step paired with the plan-wide total, which CLAUDE.md
 * already forbids — and the step EXECUTES as six_hats step 1 (the response
 * says so in techniqueProgress) while the counter computes 1 - 4 = -3 and
 * discards the entry. Measured before this file existed: completionPercentage
 * 0 against 0.143 for the same call with totalSteps 7, and nothing on the wire
 * said why.
 *
 * Every assertion here is made where the caller stands, through the built
 * server: the finding rides `advisoryFindings`, which is the one channel
 * measured to survive both `verbosity: 'minimal'` and a blocked termination.
 * Fresh plan and fresh sessionId per scenario — sessionId defaults to
 * session_<planId>, so reusing a plan reuses the session and masks the drop.
 *
 * G4 is the guard that matters most. Two earlier drafts of the predicate
 * hard-coded a verdict and were wrong on part of their own domain, because the
 * counter's rule is a three-way ternary whose third branch matches neither
 * convention. The production predicate MIRRORS the counter's arithmetic; G4
 * asserts the finding's own claim (discarded vs filed-elsewhere) against what
 * the counter actually did, so a predicate that predicts instead of mirrors
 * goes red on the case it gets wrong.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

let client: MCPClientTestHelper;
let seq = 0;

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

interface Finding {
  gate: string;
  message: string;
  technique: string;
  step: number;
}

interface StepResponse {
  blocked?: boolean;
  completed?: boolean;
  advisoryFindings?: Finding[];
  override?: { message?: string };
  completionMetadata?: {
    techniqueStatuses?: Array<{
      technique: string;
      completionPercentage: number;
      skippedSteps: number[];
    }>;
  };
  completionStatus?: {
    overallProgress?: number;
  };
}

async function plan(techniques: string[]): Promise<string> {
  return (
    JSON.parse(
      textOf(await client.callTool('plan_thinking_session', { problem: PROBLEM, techniques }))
    ) as { planId: string }
  ).planId;
}

interface Call {
  planId: string;
  sessionId: string;
  technique: string;
  currentStep: number;
  totalSteps: number;
  nextStepNeeded?: boolean;
  numbering?: 'technique' | 'plan';
  verbosity?: 'minimal' | 'full';
}

async function step(c: Call): Promise<StepResponse> {
  // No hatColor: under plan-wide numbering the technique-local step is not
  // currentStep, and a colour picked from the wrong number is its own failure.
  // Omitting it yields a validation.warning finding, which every selector
  // below filters out by gate name.
  const hat = {};
  return JSON.parse(
    textOf(
      await client.callTool('execute_thinking_step', {
        planId: c.planId,
        sessionId: c.sessionId,
        technique: c.technique,
        problem: PROBLEM,
        currentStep: c.currentStep,
        totalSteps: c.totalSteps,
        output: `A recorded finding for ${c.technique} step ${c.currentStep}, written plainly and at length.`,
        nextStepNeeded: c.nextStepNeeded ?? true,
        ...(c.numbering ? { numbering: c.numbering } : {}),
        ...(c.verbosity ? { verbosity: c.verbosity } : {}),
        ...hat,
      })
    )
  ) as StepResponse;
}

const mismatch = (r: StepResponse): Finding | undefined =>
  r.advisoryFindings?.find(f => f.gate === 'numbering.mismatch');

const status = (r: StepResponse, technique: string) =>
  r.completionMetadata?.techniqueStatuses?.find(s => s.technique === technique);

const fresh = (): string => `session_numbering_${Date.now()}_${seq++}`;

describe('G1 — the contradictory pairing is named to the caller', () => {
  it('six_hats step 1 with the plan-wide total fires numbering.mismatch, and the counter really dropped it', async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 11,
    });

    const f = mismatch(r);
    expect(f, 'no numbering.mismatch finding on the reported defect').toBeDefined();
    expect(f?.technique).toBe('six_hats');
    expect(f?.step).toBe(1);
    // The message must name BOTH remedies: re-sending in the caller's own
    // convention produces the same verdict every time.
    expect(f?.message).toContain('currentStep 1 with totalSteps 7');
    expect(f?.message).toContain('currentStep 5 with totalSteps 11');
    expect(f?.message).toContain('discarded');
    // And the finding is telling the truth about the counter.
    expect(status(r, 'six_hats')?.completionPercentage).toBe(0);
  }, 30_000);
});

describe('G2 — silent on both legitimate conventions', () => {
  it('technique-local numbering: no finding, one step counted', async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 7,
    });
    expect(mismatch(r), 'fired on legitimate technique-local numbering').toBeUndefined();
    expect(status(r, 'six_hats')?.completionPercentage).toBeCloseTo(1 / 7, 5);
  }, 30_000);

  it('plan-wide numbering: no finding, one step counted', async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 5,
      totalSteps: 11,
    });
    expect(mismatch(r), 'fired on legitimate plan-wide numbering').toBeUndefined();
    expect(status(r, 'six_hats')?.completionPercentage).toBeCloseTo(1 / 7, 5);
  }, 30_000);
});

describe('G3 — silent where the two conventions coincide', () => {
  it('first technique, plan-wide total: no finding, counted', async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'po',
      currentStep: 1,
      totalSteps: 11,
    });
    expect(
      mismatch(r),
      'fired on the first technique, where step 1 is step 1 either way'
    ).toBeUndefined();
    expect(status(r, 'po')?.completionPercentage).toBeCloseTo(0.25, 5);
  }, 30_000);

  it('single-technique plan: no finding', async () => {
    const planId = await plan(['six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 7,
    });
    expect(mismatch(r), 'fired on a single-technique plan, which cannot disagree').toBeUndefined();
    expect(status(r, 'six_hats')?.completionPercentage).toBeCloseTo(1 / 7, 5);
  }, 30_000);
});

describe('G4 — the predicate mirrors the counter instead of predicting it', () => {
  it("numbering:'technique' + plan-wide total, step 1: fires, and the counter discarded it", async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 11,
      numbering: 'technique',
    });
    const f = mismatch(r);
    expect(
      f,
      'explicit numbering does not rescue the pairing — the counter never reads it'
    ).toBeDefined();
    expect(f?.message).toContain('discarded');
    expect(status(r, 'six_hats')?.completionPercentage).toBe(0);
  }, 30_000);

  it("numbering:'technique' + plan-wide total, step 5: fires as FILED ELSEWHERE, and the counter counted step 1", async () => {
    // The ladder trusts numbering: this is six_hats step 5. The counter reads
    // totalSteps 11 as plan-wide and files 5 - 4 = 1. A hard-coded 'discarded'
    // verdict is wrong here — the entry was counted, under the wrong step.
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 5,
      totalSteps: 11,
      numbering: 'technique',
    });
    const f = mismatch(r);
    expect(f, 'no finding on the filed-elsewhere shape').toBeDefined();
    expect(f?.step).toBe(5);
    expect(f?.message).toContain('filed it as step 1');
    expect(f?.message).not.toContain('discarded');
    expect(status(r, 'six_hats')?.completionPercentage).toBeCloseTo(1 / 7, 5);
    expect(status(r, 'six_hats')?.skippedSteps).toEqual([]);
  }, 30_000);

  it("numbering:'plan' + technique total, step 9: fires as discarded (9 - 4 = 5 is a real step, but the counter reads totalSteps 7 as local: 9 > 7)", async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 9,
      totalSteps: 7,
      numbering: 'plan',
    });
    const f = mismatch(r);
    expect(f, 'no finding on the plan-numbered, technique-total shape').toBeDefined();
    expect(f?.step).toBe(5);
    expect(f?.message).toContain('discarded');
    expect(status(r, 'six_hats')?.completionPercentage).toBe(0);
  }, 30_000);
});

describe('G5 — the finding survives every response shape the caller sees', () => {
  it("rides verbosity:'minimal'", async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 11,
      verbosity: 'minimal',
    });
    expect(mismatch(r), 'minimal verbosity dropped the finding').toBeDefined();
  }, 30_000);

  it('rides a blocked termination', async () => {
    const planId = await plan(['po', 'six_hats']);
    const r = await step({
      planId,
      sessionId: fresh(),
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 11,
      nextStepNeeded: false,
    });
    expect(r.blocked, 'expected the termination to be blocked').toBe(true);
    expect(mismatch(r), 'the blocked response dropped the finding').toBeDefined();
  }, 30_000);
});

describe('G6–G8 — the terminal block names steps a caller can actually resend', () => {
  it('G6: a gap in the FIRST run of a repeated technique is named plan-wide with its total, and resending that clears the block', async () => {
    const planId = await plan(['po', 'six_hats', 'po']);
    const sessionId = fresh();
    for (const s of [1, 2, 4])
      await step({ planId, sessionId, technique: 'po', currentStep: s, totalSteps: 4 });
    for (let s = 1; s <= 7; s++)
      await step({ planId, sessionId, technique: 'six_hats', currentStep: s, totalSteps: 7 });
    for (const s of [1, 2, 3])
      await step({ planId, sessionId, technique: 'po', currentStep: s, totalSteps: 4 });
    const blocked = await step({
      planId,
      sessionId,
      technique: 'po',
      currentStep: 4,
      totalSteps: 4,
      nextStepNeeded: false,
    });

    expect(blocked.blocked).toBe(true);
    expect(blocked.override?.message).toContain('po step 3 with totalSteps 15');
    expect(blocked.override?.message).not.toContain('po steps 3 ');

    // Follow the instruction literally.
    await step({ planId, sessionId, technique: 'po', currentStep: 3, totalSteps: 15 });
    const done = await step({
      planId,
      sessionId,
      technique: 'po',
      currentStep: 15,
      totalSteps: 15,
      nextStepNeeded: false,
    });
    expect(done.blocked, 'following the block message did not clear it').toBeUndefined();
    expect(done.completed).toBe(true);
  }, 120_000);

  it('G7: a gap in the SECOND run gets a different number from the same gap in the first', async () => {
    const planId = await plan(['po', 'six_hats', 'po']);
    const sessionId = fresh();
    for (let s = 1; s <= 4; s++)
      await step({ planId, sessionId, technique: 'po', currentStep: s, totalSteps: 4 });
    for (let s = 1; s <= 7; s++)
      await step({ planId, sessionId, technique: 'six_hats', currentStep: s, totalSteps: 7 });
    for (const s of [1, 2])
      await step({ planId, sessionId, technique: 'po', currentStep: s, totalSteps: 4 });
    const blocked = await step({
      planId,
      sessionId,
      technique: 'po',
      currentStep: 4,
      totalSteps: 4,
      nextStepNeeded: false,
    });

    expect(blocked.blocked).toBe(true);
    expect(blocked.override?.message).toContain('po step 14 with totalSteps 15');
    expect(blocked.override?.message).not.toContain('po step 3 with');
  }, 120_000);

  it('G8: a technique that never ran is named once, not twice', async () => {
    const planId = await plan(['po', 'six_hats']);
    const sessionId = fresh();
    for (const s of [1, 2, 3, 5, 6])
      await step({ planId, sessionId, technique: 'six_hats', currentStep: s, totalSteps: 7 });
    const blocked = await step({
      planId,
      sessionId,
      technique: 'six_hats',
      currentStep: 7,
      totalSteps: 7,
      nextStepNeeded: false,
    });

    expect(blocked.blocked).toBe(true);
    const msg = blocked.override?.message ?? '';
    expect((msg.match(/\bpo\b/g) ?? []).length, `po named more than once in: ${msg}`).toBe(1);
    expect(msg).toContain('with totalSteps 11');
  }, 120_000);
});
