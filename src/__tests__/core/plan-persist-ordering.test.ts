/**
 * The plan write is awaited before the planId is handed out, and a plan this
 * process did not issue is read back through the adapter (#358).
 *
 * The filesystem cannot prove either: a tmp-write-and-rename lands in under a
 * millisecond, so a fire-and-forget write is indistinguishable from an awaited
 * one on that path. A fake adapter whose `savePlan` is a deferred promise can.
 *
 * `planThinkingSession` used to be synchronous and the plan store synchronous
 * with it. Making the write async without awaiting it would have re-opened
 * #358 (the response leaves before the row exists) and cut the CLI's write
 * short (`emit` exits inside the stdout write callback).
 *
 * The factory is mocked rather than the adapter class: `SessionPersistence`
 * calls `getDefaultConfig` OUTSIDE the try and `createAdapter` inside it, so a
 * mock that omits `getDefaultConfig` makes initialisation reject and the
 * response resolve at once, which looks exactly like a missing await. Both
 * are exported here, and PERSISTENCE_TYPE is set before the server is built
 * because the factory runs at construction, not lazily.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PersistenceAdapter } from '../../persistence/adapter.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>(r => {
    resolve = r;
  });
  return { promise, resolve };
}

const savePlanGate = deferred();
const savePlan = vi.fn(async (_id: string, _plan: PlanThinkingSessionOutput) => {
  await savePlanGate.promise;
});
const loadPlan = vi.fn((_id: string): Promise<PlanThinkingSessionOutput | null> =>
  Promise.resolve(null)
);

vi.mock('../../persistence/factory.js', () => ({
  getDefaultConfig: () => ({ adapter: 'postgres', options: {} }),
  createAdapter: (): Promise<PersistenceAdapter> =>
    Promise.resolve({
      initialize: () => Promise.resolve(),
      save: () => Promise.resolve(),
      load: () => Promise.resolve(null),
      delete: () => Promise.resolve(false),
      exists: () => Promise.resolve(false),
      list: () => Promise.resolve([]),
      search: () => Promise.resolve([]),
      saveBatch: () => Promise.resolve(),
      deleteBatch: () => Promise.resolve(0),
      export: () => Promise.resolve(Buffer.from('')),
      import: () => Promise.resolve(''),
      getStats: () => Promise.resolve({ totalSessions: 0, totalSize: 0 }),
      cleanup: () => Promise.resolve(0),
      close: () => Promise.resolve(),
      savePlan,
      loadPlan,
      deletePlan: () => Promise.resolve(false),
    }),
}));

const previousType = process.env.PERSISTENCE_TYPE;

beforeEach(() => {
  process.env.PERSISTENCE_TYPE = 'postgres';
  savePlan.mockClear();
  loadPlan.mockClear();
});

afterEach(() => {
  if (previousType === undefined) delete process.env.PERSISTENCE_TYPE;
  else process.env.PERSISTENCE_TYPE = previousType;
});

describe('the plan write is part of the planning call', () => {
  it('planThinkingSession stays pending until the adapter write settles', async () => {
    // Break: delete the `await` before persistPlan in index.ts and this
    // resolves before the gate opens.
    const { LateralThinkingServer } = await import('../../index.js');
    const server = new LateralThinkingServer();
    let settled = false;
    const call = server
      .planThinkingSession({ problem: 'Order the write before the id', techniques: ['six_hats'] })
      .then(r => {
        settled = true;
        return r;
      });

    await new Promise(r => setTimeout(r, 50));
    expect(savePlan, 'the adapter write was never started').toHaveBeenCalled();
    expect(settled, 'the response resolved before the write settled').toBe(false);

    savePlanGate.resolve();
    const response = await call;
    expect(settled).toBe(true);
    expect(response.isError).toBeFalsy();
    server.destroy();
  }, 10_000);
});

describe('a plan this process did not issue', () => {
  it('is read back through the adapter, once', async () => {
    // Break: delete the hydratePlan call in SessionManager.getPlan and the
    // first lookup returns undefined; make hydration skip savePlan and the
    // second lookup re-hits the adapter.
    const { SessionManager } = await import('../../core/SessionManager.js');
    const sm = new SessionManager();
    const plan: PlanThinkingSessionOutput = {
      planId: 'plan_from_elsewhere',
      problem: 'A plan another instance wrote',
      techniques: ['six_hats'],
      workflow: [],
      totalSteps: 7,
      executionMode: 'sequential',
      createdAt: Date.now(),
    };
    loadPlan.mockResolvedValueOnce(plan);

    const first = await sm.getPlan('plan_from_elsewhere');
    expect(first?.problem).toBe(plan.problem);
    expect(loadPlan).toHaveBeenCalledWith('plan_from_elsewhere');

    const second = await sm.getPlan('plan_from_elsewhere');
    expect(second?.problem).toBe(plan.problem);
    expect(loadPlan, 'the second lookup should come from memory').toHaveBeenCalledTimes(1);
    sm.destroy();
  }, 10_000);
});
