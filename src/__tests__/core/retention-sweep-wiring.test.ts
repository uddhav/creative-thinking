/**
 * The retention sweep runs where it is supposed to and nowhere else (#357).
 *
 * `PERSISTENCE_TTL_DAYS` sweeps at construction and on every cleaner tick.
 * It must NOT run from the memory-pressure path in `createSession`, which
 * fires whenever the in-memory map is full and would turn a busy server into
 * one that deletes disk records under load.
 *
 * Two layers, because each alone leaves a hole: the cleaner test proves the
 * tick calls its hook, and stays green if the manager passes `undefined`; the
 * manager test proves the wiring. The sweep itself is exercised end to end in
 * plan-retention.test.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionCleaner } from '../../core/session/SessionCleaner.js';
import { PlanManager } from '../../core/session/PlanManager.js';
import { SessionPersistence } from '../../core/session/SessionPersistence.js';
import { SessionManager } from '../../core/SessionManager.js';
import type { SessionConfig } from '../../core/SessionManager.js';
import type { MemoryManager } from '../../core/MemoryManager.js';

const config: SessionConfig = {
  maxSessions: 2,
  maxSessionSize: 1024 * 1024,
  sessionTTL: 24 * 60 * 60 * 1000,
  cleanupInterval: 60_000,
  enableMemoryMonitoring: false,
};

const memoryManager = { triggerGCIfNeeded: () => {} } as unknown as MemoryManager;

describe('SessionCleaner', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('calls onTick on every interval and not from a direct cleanup', () => {
    // Break: drop `this.onTick?.()` from startCleanup.
    const onTick = vi.fn();
    const cleaner = new SessionCleaner(
      new Map(),
      new PlanManager(),
      config,
      memoryManager,
      () => {},
      onTick
    );
    cleaner.startCleanup();
    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(config.cleanupInterval);
    expect(onTick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(config.cleanupInterval);
    expect(onTick).toHaveBeenCalledTimes(2);

    cleaner.cleanupOldSessions();
    expect(
      onTick,
      'a direct cleanup (the memory-pressure path) must not sweep'
    ).toHaveBeenCalledTimes(2);
    cleaner.stopCleanup();
  });

  it('evicts expired plans through PlanManager, the one place the cache horizon is defined', () => {
    const plans = new PlanManager();
    plans.savePlan('plan_stale', {
      planId: 'plan_stale',
      problem: 'x',
      techniques: ['six_hats'],
      workflow: [],
      totalSteps: 7,
      executionMode: 'sequential',
      createdAt: Date.now() - 5 * 60 * 60 * 1000,
    });
    plans.savePlan('plan_fresh', {
      planId: 'plan_fresh',
      problem: 'x',
      techniques: ['six_hats'],
      workflow: [],
      totalSteps: 7,
      executionMode: 'sequential',
      createdAt: Date.now(),
    });
    const cleaner = new SessionCleaner(new Map(), plans, config, memoryManager, () => {});
    cleaner.cleanupOldSessions();
    expect(plans.getPlan('plan_stale')).toBeUndefined();
    expect(plans.getPlan('plan_fresh')).toBeDefined();
  });
});

describe('SessionManager wiring', () => {
  const previousTtl = process.env.PERSISTENCE_TTL_DAYS;
  const previousType = process.env.PERSISTENCE_TYPE;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env.PERSISTENCE_TTL_DAYS = '30';
    // No adapter comes up under memory, so sweep() returns 0 without I/O; the
    // spy sees the call either way.
    process.env.PERSISTENCE_TYPE = 'memory';
  });

  afterEach(() => {
    // Restore spies here, not only at the end of each case: under retry: 2 a
    // failed attempt would otherwise leave its spy counting into the retry.
    vi.restoreAllMocks();
    vi.useRealTimers();
    if (previousTtl === undefined) delete process.env.PERSISTENCE_TTL_DAYS;
    else process.env.PERSISTENCE_TTL_DAYS = previousTtl;
    if (previousType === undefined) delete process.env.PERSISTENCE_TYPE;
    else process.env.PERSISTENCE_TYPE = previousType;
  });

  it('sweeps at construction and on the timer, never from memory pressure', () => {
    // Break: pass `undefined` instead of the sweep hook to SessionCleaner.
    const sweep = vi.spyOn(SessionPersistence.prototype, 'sweep').mockResolvedValue(0);
    const sm = new SessionManager();
    expect(sweep, 'no sweep at construction').toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(sweep, 'no sweep on the cleaner tick').toHaveBeenCalledTimes(2);

    // Fill the map past maxSessions (default 100) is expensive; drive the
    // pressure path directly instead: cleanupOldSessions is what createSession
    // calls at capacity.
    sm.getSessionCleaner().cleanupOldSessions();
    expect(sweep, 'memory pressure must not sweep disk').toHaveBeenCalledTimes(2);

    sm.destroy();
    sweep.mockRestore();
  });

  it('a TTL that is not a plain integer string means never, with a warning', async () => {
    // Number() accepted '1e2' as 100 days and ' 2 ' as 2 days; neither is a
    // value anyone wrote on purpose. Break: parse with Number() alone.
    const stderr: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      stderr.push(args.map(String).join(' '));
    };
    try {
      for (const raw of ['1e2', ' 2 ', '2.0', '0x10']) {
        process.env.PERSISTENCE_TTL_DAYS = raw;
        const sweep = vi.spyOn(SessionPersistence.prototype, 'sweep');
        const sm = new SessionManager();
        await Promise.resolve();
        expect(sweep, `${JSON.stringify(raw)} must not sweep`).not.toHaveBeenCalled();
        sm.destroy();
        sweep.mockRestore();
      }
      expect(stderr.join('\n')).toMatch(/PERSISTENCE_TTL_DAYS/);
    } finally {
      console.error = original;
    }
  });

  it('with the TTL unset the sweep is a no-op that touches no adapter', async () => {
    delete process.env.PERSISTENCE_TTL_DAYS;
    const sweep = vi.spyOn(SessionPersistence.prototype, 'sweep');
    const sm = new SessionManager();
    await Promise.resolve();
    expect(sweep).not.toHaveBeenCalled();
    sm.destroy();
    sweep.mockRestore();
  });
});
