/**
 * Guards for two things the barrier subsystem measured but could never report.
 *
 * 1. The sensors re-measure once per recorded step, not once per wall-clock
 *    window. The gate used to be `measurementThrottleMs = 5000`, so any caller
 *    faster than five seconds a step — the CLI, this suite, every scripted run
 *    — measured once at step 1 and replayed that reading for the rest of the
 *    session.
 * 2. Two barriers whose warning could never fire because their proximity
 *    formula was scaled below the threshold it is compared against, and the
 *    healthy control chain that must stay quiet after the scaling came off.
 *
 * `getSensorStatus().historySize` is the observable for (1): a sensor appends
 * to its reading history only inside `measure`, so the count is a direct
 * measurement counter that needs no mocking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AbsorbingBarrierEarlyWarning } from '../../../ergodicity/earlyWarning/warningSystem.js';
import { PathMemoryManager } from '../../../ergodicity/pathMemory.js';
import { MetricsCalculator } from '../../../ergodicity/metrics.js';
import { ErgodicityWarningLevel } from '../../../ergodicity/types.js';
import type { PathMemory } from '../../../ergodicity/types.js';
import type { SessionData } from '../../../index.js';
import type { LateralTechnique } from '../../../types/index.js';

function makeSession(): SessionData {
  return {
    technique: 'six_hats' as LateralTechnique,
    problem: 'Retire the legacy billing pipeline',
    history: [],
    branches: {},
    insights: [],
    startTime: Date.now(),
  } as unknown as SessionData;
}

/** Total readings taken across all sensors so far. */
function measurementCount(system: AbsorbingBarrierEarlyWarning): number {
  let total = 0;
  for (const status of system.getSensorStatus().values()) {
    total += (status as { historySize: number }).historySize;
  }
  return total;
}

/** A committing step: near-irreversible, high commitment. */
function commit(manager: PathMemoryManager, technique: LateralTechnique, step: number): void {
  manager.recordPathEvent(technique, step, 'A recorded finding for this step.', {
    reversibilityCost: 0.9,
    commitmentLevel: 0.9,
  });
}

/** A thinking step, as the healthy techniques declare them. */
function think(manager: PathMemoryManager, technique: LateralTechnique, step: number): void {
  manager.recordPathEvent(technique, step, 'A recorded finding for this step.', {
    reversibilityCost: 0.1,
    commitmentLevel: 0.2,
  });
}

describe('early warning re-measures per step, not per wall-clock second', () => {
  let system: AbsorbingBarrierEarlyWarning;
  let session: SessionData;
  let manager: PathMemoryManager;

  beforeEach(() => {
    system = new AbsorbingBarrierEarlyWarning();
    session = makeSession();
    manager = new PathMemoryManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('takes a fresh reading on every step even with no time between steps', async () => {
    const perStep: number[] = [];

    for (let step = 1; step <= 8; step++) {
      commit(manager, 'scamper', step);
      const before = measurementCount(system);
      await system.continuousMonitoring(manager.getPathMemory(), session);
      perStep.push(measurementCount(system) - before);
    }

    // Three sensors, one reading each, on every one of the eight steps. Under
    // the wall-clock gate this loop finished inside a single 5 s window and
    // read [3,0,0,0,0,0,0,0].
    expect(perStep).toEqual([3, 3, 3, 3, 3, 3, 3, 3]);
  });

  it('does not re-measure when the clock advances but the path does not', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const t0 = new Date('2026-08-10T12:00:00.000Z').getTime();
    vi.setSystemTime(t0);

    commit(manager, 'scamper', 1);
    await system.continuousMonitoring(manager.getPathMemory(), session);
    const afterFirst = measurementCount(system);

    // Ten simulated seconds — twice the retired throttle window — with the
    // path unchanged. Steps are the unit, so there is nothing new to read.
    vi.setSystemTime(t0 + 10_000);
    await system.continuousMonitoring(manager.getPathMemory(), session);
    expect(measurementCount(system)).toBe(afterFirst);

    // Same instant, one more step: that is a change worth reading.
    commit(manager, 'scamper', 2);
    await system.continuousMonitoring(manager.getPathMemory(), session);
    expect(measurementCount(system)).toBe(afterFirst + 3);
  });

  it('costs one reading per sensor per step however often it is asked', async () => {
    // Six steps, not twenty: a sensor's reading history is capped at 20, so a
    // longer run would saturate the counter and hide a doubling.
    for (let step = 1; step <= 6; step++) {
      commit(manager, 'scamper', step);
      await system.continuousMonitoring(manager.getPathMemory(), session);
      // A caller that asks three times on the same step pays nothing extra.
      await system.continuousMonitoring(manager.getPathMemory(), session);
      await system.continuousMonitoring(manager.getPathMemory(), session);
    }

    expect(measurementCount(system)).toBe(6 * 3);
  });

  it('reports the state of the current step, not of step 1', async () => {
    const actions: string[] = [];
    for (let step = 1; step <= 41; step++) {
      commit(manager, 'scamper', step);
      const state = await system.continuousMonitoring(manager.getPathMemory(), session);
      actions.push(state.recommendedAction);
    }

    // Forty-one near-irreversible steps taken in milliseconds. The wall-clock
    // gate replayed step 1's reading for the whole run, so the series was one
    // value repeated 41 times and the run ended on whatever step 1 said.
    expect(actions.at(-1)).toBe('escape');
    expect(new Set(actions).size).toBeGreaterThan(1);
    expect(actions[0]).not.toBe('escape');
  });
});

describe('barrier proximity can reach the thresholds it is compared against', () => {
  const metrics = new MetricsCalculator();

  function barrierWarnings(pathMemory: PathMemory, subtype: string) {
    return metrics
      .generateWarnings(metrics.calculateMetrics(pathMemory))
      .filter(w => w.metric === 'barrierProximity')
      .filter(w => {
        const proximity = pathMemory.currentFlexibility.barrierProximity.find(
          p => p.barrier.subtype === subtype
        );
        return proximity !== undefined && w.message.includes(proximity.barrier.name);
      });
  }

  function distanceTo(pathMemory: PathMemory, subtype: string): number {
    const proximity = pathMemory.currentFlexibility.barrierProximity.find(
      p => p.barrier.subtype === subtype
    );
    if (!proximity) throw new Error(`no barrier ${subtype}`);
    return proximity.distance;
  }

  it('resource_depletion warns, which the 0.7 scale made arithmetically impossible', () => {
    const manager = new PathMemoryManager();

    // 35 steps: 1 - 35/50 = 0.300, exactly at the threshold, which is strict.
    for (let step = 1; step <= 35; step++) commit(manager, 'scamper', step);
    expect(distanceTo(manager.getPathMemory(), 'resource_depletion')).toBeCloseTo(0.3, 10);
    expect(barrierWarnings(manager.getPathMemory(), 'resource_depletion')).toHaveLength(0);

    // 36 steps: 0.280. The old formula multiplied the steps score by 0.7, so
    // its distance bottomed out at exactly 0.300 after fifty steps and never
    // got under the 0.3 warningThreshold at any session length.
    commit(manager, 'scamper', 36);
    expect(distanceTo(manager.getPathMemory(), 'resource_depletion')).toBeCloseTo(0.28, 10);
    const warnings = barrierWarnings(manager.getPathMemory(), 'resource_depletion');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].level).toBe(ErgodicityWarningLevel.WARNING);

    // Fully saturated input now reaches the barrier itself.
    for (let step = 37; step <= 50; step++) commit(manager, 'scamper', step);
    expect(distanceTo(manager.getPathMemory(), 'resource_depletion')).toBe(0);
  });

  it('analysis_paralysis reaches CRITICAL, which the 0.8 scale made impossible', () => {
    const manager = new PathMemoryManager();

    // The formula counts six_hats steps committing less than 0.3.
    for (let step = 1; step <= 10; step++) think(manager, 'six_hats', step);
    // 1 - 10/15 = 0.333: still clear of the 0.3 warningThreshold.
    expect(distanceTo(manager.getPathMemory(), 'analysis_paralysis')).toBeCloseTo(0.3333, 4);
    expect(barrierWarnings(manager.getPathMemory(), 'analysis_paralysis')).toHaveLength(0);

    // 11 steps: 0.2667, a warning. The scaled formula needed 14 analysis steps
    // to reach the same level.
    think(manager, 'six_hats', 11);
    expect(distanceTo(manager.getPathMemory(), 'analysis_paralysis')).toBeCloseTo(0.2667, 4);
    expect(barrierWarnings(manager.getPathMemory(), 'analysis_paralysis')[0].level).toBe(
      ErgodicityWarningLevel.WARNING
    );

    // 13 steps: 0.1333, critical. The scaled formula's floor was 0.200 — the
    // value of the CRITICAL cut itself — so it could only ever cross by the
    // 4e-17 that `1 - 0.8` leaves behind in IEEE754, and only at full
    // saturation (15 analysis steps). Nothing that depends on a rounding
    // residue is a threshold anybody set.
    think(manager, 'six_hats', 12);
    think(manager, 'six_hats', 13);
    expect(distanceTo(manager.getPathMemory(), 'analysis_paralysis')).toBeCloseTo(0.1333, 4);
    expect(barrierWarnings(manager.getPathMemory(), 'analysis_paralysis')[0].level).toBe(
      ErgodicityWarningLevel.CRITICAL
    );
  });

  it('stays silent for the whole healthy control chain', () => {
    // neural_state (3) + random_entry (3) + six_hats (7) = 13 thinking steps,
    // the chain that ends at flexibility 0.937. It must trip no barrier, at
    // any step, on any of the five. This is the half that matters: a barrier
    // that fires on a healthy session is not a sensor, it is noise.
    const manager = new PathMemoryManager();
    const chain: LateralTechnique[] = [
      ...(Array(3).fill('neural_state') as LateralTechnique[]),
      ...(Array(3).fill('random_entry') as LateralTechnique[]),
      ...(Array(7).fill('six_hats') as LateralTechnique[]),
    ];

    chain.forEach((technique, index) => {
      think(manager, technique, index + 1);
      const pathMemory = manager.getPathMemory();
      const raised = metrics
        .generateWarnings(metrics.calculateMetrics(pathMemory))
        .filter(w => w.metric === 'barrierProximity');
      expect(
        raised.map(w => w.message),
        `barrier warning raised at step ${index + 1} of the healthy control`
      ).toEqual([]);
    });

    // And nothing else in the metrics warns either.
    const finalWarnings = metrics.generateWarnings(
      metrics.calculateMetrics(manager.getPathMemory())
    );
    expect(finalWarnings.filter(w => w.level !== ErgodicityWarningLevel.INFO)).toEqual([]);
  });
});
