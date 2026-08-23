/**
 * stepReversibility: the bounded caller claim.
 *
 * The static tables cannot see step semantics — every SCAMPER Eliminate is
 * declared 'low' reversibility, yet eliminating a lock-in ADDS real freedom
 * (the field report's central inversion). The claim nudges the applied rung
 * at most one step from the handler-static prior, needs an on-record
 * rationale, and is echoed back as an audit. It must never reopen the
 * retired caller-buys-flexibility holes: bounded per step, non-compounding,
 * gates intact — pinned here alongside flexibility-is-measured.test.ts,
 * which runs claim-free and unmodified.
 *
 * retry is disabled: kill-checked guards; the global retry: 2 would let a
 * flaky pass mask exactly the regression this file exists to catch.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Redesign the family trip for September';
const ACTIONS = ['substitute', 'combine', 'adapt', 'modify', 'put_to_other_use', 'eliminate'];

interface StepResponse {
  sessionId: string;
  ergodicityMetrics?: { currentFlexibility?: number };
  executionMetadata?: {
    appliedReversibility?: { prior: string; claimed: string; applied: string; clamped: boolean };
  };
  reflexivityWarning?: { type?: string; pathsForeclosed?: string[] };
  [key: string]: unknown;
}

describe('stepReversibility claims', { retry: 0 }, () => {
  const client = new MCPClientTestHelper();

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  /** Runs scamper steps 1-6 with identical prose; per-step extras by step number. */
  async function runScamper(
    extras: Record<number, Record<string, unknown>> = {}
  ): Promise<StepResponse[]> {
    const plan = await client.planThinkingSession(PROBLEM, ['scamper']);
    const responses: StepResponse[] = [];
    let sessionId: string | undefined;
    for (let step = 1; step <= ACTIONS.length; step++) {
      const data = (await client.executeThinkingStep({
        planId: (plan as { planId: string }).planId,
        technique: 'scamper',
        problem: PROBLEM,
        currentStep: step,
        totalSteps: 8,
        output: `Step ${step}: the same plain sentence for every run.`,
        nextStepNeeded: true,
        scamperAction: ACTIONS[step - 1],
        ...(extras[step] ?? {}),
        ...(sessionId ? { sessionId } : {}),
      })) as unknown as StepResponse;
      sessionId = data.sessionId;
      responses.push(data);
    }
    return responses;
  }

  const finalFlexibility = (responses: StepResponse[]): number => {
    const value = responses[responses.length - 1].ergodicityMetrics?.currentFlexibility;
    expect(value, 'currentFlexibility must be present').toBeTypeOf('number');
    return value as number;
  };

  it('an upward claim on Eliminate is applied (clamped to one rung) and buys back cost', async () => {
    const unclaimed = await runScamper();
    const claimed = await runScamper({
      6: {
        stepReversibility: {
          level: 'high',
          rationale: 'Eliminates non-refundable bookings; every commitment stays reversible',
        },
      },
    });

    // The audit trail: Eliminate's prior is 'low'; 'high' clamps to 'medium'.
    const audit = claimed[5].executionMetadata?.appliedReversibility;
    expect(audit).toEqual({ prior: 'low', claimed: 'high', applied: 'medium', clamped: true });

    // The claim changed the measure — identical prose, different declaration.
    expect(finalFlexibility(claimed)).toBeGreaterThan(finalFlexibility(unclaimed));
  });

  it('a claim without a rationale is inert', async () => {
    const unclaimed = await runScamper();
    const blankRationale = await runScamper({
      6: { stepReversibility: { level: 'high', rationale: '   ' } },
    });

    expect(blankRationale[5].executionMetadata?.appliedReversibility).toBeUndefined();
    expect(finalFlexibility(blankRationale)).toBeCloseTo(finalFlexibility(unclaimed), 10);
  });

  it('a caller cannot plant the audit trail without making a claim', async () => {
    // appliedReversibility is server-computed; a fabricated copy sent without
    // stepReversibility must be cleared, not echoed.
    const responses = await runScamper({
      3: {
        appliedReversibility: { prior: 'low', claimed: 'high', applied: 'high', clamped: false },
      },
    });

    expect(responses[2].executionMetadata?.appliedReversibility).toBeUndefined();
  });

  it('a downward claim is recorded as a content constraint and fires the warning', async () => {
    // Modify's prior is 'high'; claiming 'low' declares MORE commitment than
    // the server assumed — real caller information, the first
    // content-provenance constraint producer (template constraints stay
    // silent by design).
    const responses = await runScamper({
      4: {
        stepReversibility: {
          level: 'low',
          rationale: "We've signed the venue contract for this variant",
        },
      },
    });

    const warning = responses[3].reflexivityWarning;
    expect(warning, 'a declared commitment must warn').toBeDefined();
    expect(warning?.type).toBe('path_foreclosed');
    expect(warning?.pathsForeclosed?.[0]).toContain('signed the venue contract');
    expect(responses[3].executionMetadata?.appliedReversibility).toEqual({
      prior: 'high',
      claimed: 'low',
      applied: 'medium',
      clamped: true,
    });
  });

  it('a chain of all-high claims cannot pin the score — the gates stay live', async () => {
    const extras: Record<number, Record<string, unknown>> = {};
    for (let step = 1; step <= 6; step++) {
      extras[step] = {
        stepReversibility: { level: 'high', rationale: 'Claimed reversible for the test' },
      };
    }
    const claimed = await runScamper(extras);
    const unclaimed = await runScamper();

    const series = claimed.map(r => r.ergodicityMetrics?.currentFlexibility as number);
    // The series is not strictly monotone even with claims: put_to_other_use
    // opens more options than it closes and legitimately credits, and the
    // options charge is untouched by claims. What a claim chain must NOT be
    // able to do is silence the measure: the committing steps still spend —
    // Eliminate still costs through its maximal claim — and the chain ends
    // below 1, above the unclaimed twin but not immune to it.
    expect(series[5], 'Eliminate must still cost through a claim').toBeLessThan(series[4]);
    expect(series[series.length - 1]).toBeLessThan(1);
    expect(series[series.length - 1]).toBeGreaterThan(finalFlexibility(unclaimed));
  });
});
