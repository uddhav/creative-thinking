/**
 * Concurrency guarantees of the execution path.
 *
 * This file used to assert concurrency over `discoverTechniques` and
 * `planThinkingSession`. Both are synchronous (src/index.ts), so the aggregate
 * settled immediately and the claims could not fail for the reason they named:
 * "if sequential: ~150ms minimum" described work that was always sequential.
 * See #352.
 *
 * `executeThinkingStep` is the only async surface of the three, so these tests
 * drive it instead, and assert properties that can actually fail: that a
 * contended session loses no history entry, and that separate sessions stay
 * separate.
 *
 * They are deliberately not described as testing the lock in
 * `src/layers/execution.ts`. Disabling it leaves the whole suite green, so what
 * it protects is still uncovered — recorded on #354 rather than papered over
 * here. (That lock is keyed `sessionId:technique`, not per session, so steps of
 * different techniques on one session never contend for it anyway.)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

interface ExecutionResponse {
  sessionId: string;
  currentStep: number;
  historyLength: number;
  nextStepNeeded: boolean;
}

const parse = (result: { content: Array<{ text: string }> }): ExecutionResponse =>
  JSON.parse(result.content[0].text) as ExecutionResponse;

describe('Execution concurrency', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  /** A six_hats plan; step 2 (white hat) avoids the step-1 ergodicity check. */
  function createPlan(problem: string): string {
    const result = server.planThinkingSession({ problem, techniques: ['six_hats'] });
    expect(result.isError).toBeFalsy();
    return (JSON.parse(result.content[0].text) as { planId: string }).planId;
  }

  function step(planId: string, i: number, sessionId?: string) {
    return server.executeThinkingStep({
      planId,
      ...(sessionId ? { sessionId } : {}),
      technique: 'six_hats',
      problem: 'Concurrency probe',
      currentStep: 2,
      totalSteps: 6,
      hatColor: 'white',
      output: `Concurrent output ${i}`,
      nextStepNeeded: true,
    });
  }

  it('loses no history entry when concurrent steps contend for one session', async () => {
    const planId = createPlan('Same-session concurrency');

    // Establish the session with one step, then contend on it.
    const seed = parse(await step(planId, 0));
    const { sessionId } = seed;
    expect(sessionId).toBeTruthy();

    const CONTENDERS = 12;
    const results = await Promise.all(
      Array.from({ length: CONTENDERS }, (_, i) => step(planId, i + 1, sessionId))
    );

    // Every call has to land on the session it was given.
    for (const r of results) {
      expect(parse(r).sessionId).toBe(sessionId);
    }

    // Each caller sees a distinct history length and no entry is lost.
    //
    // Do not read this as a test of the lock. Disabling
    // `sessionLock.acquireLock` in src/layers/execution.ts leaves this — and
    // the entire suite — green, because `history.push` is atomic on a single
    // thread even though an await sits between the lock and the push. What the
    // lock actually protects is not covered by anything here; see #354.
    //
    // Asserting the set rather than the count still earns its keep: a duplicate
    // length cannot hide behind a coincidentally correct total.
    const lengths = results.map(r => parse(r).historyLength).sort((a, b) => a - b);
    const expected = Array.from({ length: CONTENDERS }, (_, i) => seed.historyLength + i + 1);
    expect(lengths).toEqual(expected);
    expect(new Set(lengths).size).toBe(CONTENDERS);
  });

  it('keeps concurrent sessions isolated from one another', async () => {
    // A step with no sessionId attaches to the plan's existing session rather
    // than opening a new one, so distinct sessions need distinct plans. (That
    // is also why performance.test.ts's "100 concurrent step executions" all
    // land on a single session.)
    const SESSIONS = 10;
    const planIds = Array.from({ length: SESSIONS }, (_, i) => createPlan(`Isolation plan ${i}`));

    const seeds = await Promise.all(planIds.map((planId, i) => step(planId, i)));
    const sessionIds = seeds.map(r => parse(r).sessionId);
    expect(new Set(sessionIds).size).toBe(SESSIONS);

    // A second concurrent round, one step per session. Each must see only its
    // own history — a leak across sessions would push some counts past two.
    const second = await Promise.all(sessionIds.map((id, i) => step(planIds[i], i, id)));
    for (const r of second) {
      expect(parse(r).historyLength).toBe(2);
    }
    expect(new Set(second.map(r => parse(r).sessionId)).size).toBe(SESSIONS);
  });

  it('completes 50 concurrent steps on one session without error', async () => {
    // One plan and no sessionId, so all 50 land on the same session (see the
    // note in the isolation test above) — this is volume against a contended
    // session, not across independent ones.
    const planId = createPlan('Contended session throughput');

    const CALLS = 50;
    const results = await Promise.all(Array.from({ length: CALLS }, (_, i) => step(planId, i)));

    expect(results).toHaveLength(CALLS);
    for (const r of results) {
      expect(r.isError).toBeFalsy();
      expect(parse(r).currentStep).toBe(2);
    }
    expect(new Set(results.map(r => parse(r).sessionId)).size).toBe(1);
  });
});
