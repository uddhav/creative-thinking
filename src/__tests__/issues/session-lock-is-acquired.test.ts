/**
 * The session lock is defensive, and this pins that decision (#354).
 *
 * Three independent observable hunts could not distinguish the lock from a
 * no-op: history shape, the ergodicityMetrics sitting directly on the
 * pathMemory read/write that spans the await, and a third pass over
 * persistence, insights, metrics, path events and reflexivity ordering. The
 * whole suite stays green with `acquireLock` replaced by `() => {}`. And the
 * deployment shape that actually races — concurrent CLI processes on one
 * session — is outside the lock's reach entirely, measured losing a step five
 * runs out of five regardless of it.
 *
 * The verdict was to keep it as defence in depth rather than delete it on
 * negative evidence: single-threaded atomicity of `history.push` is a property
 * of today's code, not a contract, and the stale-read window between the
 * ergodicity await and the push is real even if no probe has caught it.
 *
 * That verdict creates exactly one new risk: someone reads "unobservable" as
 * "deletable" and removes it silently, with nothing going red. This file is
 * what goes red. It asserts the executor actually ACQUIRES the lock and that
 * two same-key critical sections never overlap — properties of the locking
 * itself, not of downstream state, which is the only place the lock is
 * visible at all.
 */

import { describe, it, expect } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

describe('the session lock is really taken', () => {
  it('acquires per (session, technique) and never overlaps a same-key hold', async () => {
    const server = new LateralThinkingServer();
    const sessionManager = server.getSessionManager();
    const lock = sessionManager.getSessionLock();

    const original = lock.acquireLock.bind(lock);
    let acquires = 0;
    let maxSameKeyHolds = 0;
    const held = new Map<string, number>();
    const keysSeen = new Set<string>();

    (lock as unknown as { acquireLock: typeof original }).acquireLock = async (
      sessionId: string,
      technique?: string
    ) => {
      acquires += 1;
      const key = `${sessionId}:${technique ?? ''}`;
      keysSeen.add(key);
      const release = await original(sessionId, technique);
      held.set(key, (held.get(key) ?? 0) + 1);
      maxSameKeyHolds = Math.max(maxSameKeyHolds, held.get(key) ?? 0);
      return () => {
        held.set(key, (held.get(key) ?? 0) - 1);
        release();
      };
    };

    try {
      const plan = JSON.parse(
        server.planThinkingSession({ problem: 'Lock pin probe', techniques: ['six_hats', 'po'] })
          .content[0].text
      ) as { planId: string };

      const step = (technique: string, n: number, total: number, i: number) =>
        server.executeThinkingStep({
          planId: plan.planId,
          sessionId: 'session_lock_pin',
          technique,
          problem: 'Lock pin probe',
          currentStep: n,
          totalSteps: total,
          ...(technique === 'six_hats' ? { hatColor: 'white' } : {}),
          output: `${technique} contender ${i}, written at length for the record.`,
          nextStepNeeded: true,
        });

      // Four concurrent same-key calls, plus two on a different technique so
      // the keying itself is exercised.
      await Promise.all([
        step('six_hats', 2, 7, 1),
        step('six_hats', 2, 7, 2),
        step('six_hats', 2, 7, 3),
        step('six_hats', 2, 7, 4),
        step('po', 1, 4, 5),
        step('po', 1, 4, 6),
      ]);

      // The kill-check discriminator: replace the acquire in execution.ts with
      // a no-op and this is 0.
      expect(
        acquires,
        'executeThinkingStep no longer acquires the session lock'
      ).toBeGreaterThanOrEqual(6);

      // The lock's one observable property: two holds of the same key never
      // coexist. (Different keys may overlap — that is what the key is FOR.)
      expect(maxSameKeyHolds, 'two same-key critical sections overlapped').toBe(1);

      // Keyed per technique, not per session alone.
      const techniques = new Set([...keysSeen].map(k => k.split(':')[1]));
      expect(
        techniques.has('six_hats') && techniques.has('po'),
        'lock keys do not carry the technique'
      ).toBe(true);
    } finally {
      (lock as unknown as { acquireLock: typeof original }).acquireLock = original;
    }
  });
});
