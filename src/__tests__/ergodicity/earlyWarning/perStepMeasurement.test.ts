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
 * 3. Two barrier inputs whose default state was their saturated end, and the
 *    commitment mean that could not reach its own threshold. `cognitive_lock_in`
 *    now reads the reversibility each step declared instead of counting
 *    repeated technique names, `cynicism` is retired, and `commitmentDepth` is
 *    a trailing window rather than a mean over the whole session.
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

/**
 * The healthy control: neural_state (3) + random_entry (3) + six_hats (7),
 * thirteen thinking steps, the chain that ends at flexibility 0.937. Every one
 * of its steps declares itself reversible and non-committing, so it is the
 * session against which any new barrier or warning has to prove it is a sensor
 * and not noise.
 */
const HEALTHY_CONTROL: LateralTechnique[] = [
  ...(Array(3).fill('neural_state') as LateralTechnique[]),
  ...(Array(3).fill('random_entry') as LateralTechnique[]),
  ...(Array(7).fill('six_hats') as LateralTechnique[]),
];

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
    // any step, on any of the four that are still watched. This is the half
    // that matters: a barrier that fires on a healthy session is not a sensor,
    // it is noise.
    const manager = new PathMemoryManager();

    HEALTHY_CONTROL.forEach((technique, index) => {
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

  it('reads lock-in from what steps declared, not from how often a technique repeats', () => {
    // The old formula was `1 - uniqueTechniques/window` over the last ten
    // steps, so a plan that spends a technique's own steps on that technique
    // scored as locked in for running as planned: seven consecutive six_hats
    // steps put proximity at 0.857 before the 0.8 multiplier that existed to
    // mute exactly this. Repeating a reversible technique is now worth zero,
    // however long the run.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 12; step++) think(manager, 'six_hats', step);
    expect(distanceTo(manager.getPathMemory(), 'cognitive_lock_in')).toBe(1);
    expect(barrierWarnings(manager.getPathMemory(), 'cognitive_lock_in')).toHaveLength(0);

    // What lock-in means is being unable to change direction. Three of the
    // last ten steps near-irreversible: proximity 0.3, distance 0.7, quiet.
    const mixed = new PathMemoryManager();
    for (let step = 1; step <= 7; step++) think(mixed, 'six_hats', step);
    for (let step = 8; step <= 10; step++) commit(mixed, 'six_hats', step);
    expect(distanceTo(mixed.getPathMemory(), 'cognitive_lock_in')).toBeCloseTo(0.7, 10);
    expect(barrierWarnings(mixed.getPathMemory(), 'cognitive_lock_in')).toHaveLength(0);

    // Seven of nine: distance 0.222, a warning but not yet critical. The old
    // formula read the same 0.857 for a run of six_hats whether those steps
    // could be undone or not, so this band meant nothing about the session.
    const locking = new PathMemoryManager();
    for (let step = 1; step <= 2; step++) think(locking, 'six_hats', step);
    for (let step = 3; step <= 9; step++) commit(locking, 'scamper', step);
    expect(distanceTo(locking.getPathMemory(), 'cognitive_lock_in')).toBeCloseTo(0.2222, 4);
    expect(barrierWarnings(locking.getPathMemory(), 'cognitive_lock_in')[0].level).toBe(
      ErgodicityWarningLevel.WARNING
    );

    // Ten of ten irreversible, across four different techniques: the barrier
    // itself. Under the old formula four techniques in ten steps scored 0.48
    // — a comfortable 0.52 distance — while every step of it was one the
    // session could not walk back.
    const locked = new PathMemoryManager();
    const varied: LateralTechnique[] = ['scamper', 'triz', 'yes_and', 'po'];
    for (let step = 1; step <= 10; step++) commit(locked, varied[step % varied.length], step);
    expect(distanceTo(locked.getPathMemory(), 'cognitive_lock_in')).toBe(0);
    expect(barrierWarnings(locked.getPathMemory(), 'cognitive_lock_in')[0].level).toBe(
      ErgodicityWarningLevel.CRITICAL
    );
  });

  it('no longer watches a cynicism barrier nothing could observe', () => {
    // Its proximity counted steps closing more than twice as many options as
    // they opened, and SCAMPER is the only technique that reports options at
    // all — so for the other thirty-one the count could not leave zero, and
    // the measured proximity was 0.000 on every step of every chain. Retired
    // the same way the option-velocity warning was: the subtype stays in the
    // vocabulary, the sensor does not stay in the watched set.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 10; step++) {
      manager.recordPathEvent('scamper', step, 'Closing options without opening any.', {
        optionsClosed: ['a', 'b', 'c'],
        optionsOpened: [],
        reversibilityCost: 0.9,
        commitmentLevel: 0.9,
      });
    }

    const subtypes = manager
      .getPathMemory()
      .absorbingBarriers.map(barrier => barrier.subtype)
      .sort();
    expect(subtypes).toEqual([
      'analysis_paralysis',
      'cognitive_lock_in',
      'perfectionism',
      'resource_depletion',
    ]);
    expect(
      manager.getPathMemory().currentFlexibility.barrierProximity.map(p => p.barrier.subtype)
    ).not.toContain('cynicism');
  });
});

describe('commitmentDepth answers "how committed now", not "on average since step 1"', () => {
  const metrics = new MetricsCalculator();

  const depthOf = (manager: PathMemoryManager) =>
    metrics.calculateMetrics(manager.getPathMemory()).commitmentDepth;
  const depthWarnings = (manager: PathMemoryManager) =>
    metrics
      .generateWarnings(metrics.calculateMetrics(manager.getPathMemory()))
      .filter(w => w.metric === 'commitmentDepth');

  it('reaches the 0.7 threshold that a whole-session mean could not', () => {
    // The mean over every step was capped by dilution, not by the ladder: per
    // step commitment is 0.20 / 0.50 / 0.90 / 0.95 and 107 of the catalogue's
    // 171 steps are 0.20, so the best any concatenation of whole techniques
    // could average was 0.65 against a threshold of 0.7. The warning could not
    // fire for any session that could be run.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 20; step++) think(manager, 'six_hats', step);
    expect(depthWarnings(manager)).toHaveLength(0);

    // Five consecutive committing steps — the window — and it fires.
    for (let step = 21; step <= 25; step++) commit(manager, 'scamper', step);
    expect(depthOf(manager)).toBeCloseTo(0.9, 10);
    const warnings = depthWarnings(manager);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].level).toBe(ErgodicityWarningLevel.CAUTION);

    // Twenty prior thinking steps used to hold the same session's mean at
    // 0.34, which is the whole defect: a session could not escape its history.
    const wholeSessionMean =
      manager.getPathMemory().pathHistory.reduce((sum, e) => sum + e.commitmentLevel, 0) /
      manager.getPathMemory().pathHistory.length;
    expect(wholeSessionMean).toBeLessThan(0.7);
  });

  it('falls again when the session stops committing', () => {
    // The point of a window: commitment is a state to leave, not a debt to
    // carry. A mean over all events can only ever be paid down asymptotically.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 5; step++) commit(manager, 'scamper', step);
    expect(depthWarnings(manager)).toHaveLength(1);

    for (let step = 6; step <= 10; step++) think(manager, 'six_hats', step);
    expect(depthOf(manager)).toBeCloseTo(0.2, 10);
    expect(depthWarnings(manager)).toHaveLength(0);
  });

  it('offers a strategic pivot to a session that is committing now', () => {
    // `commitmentDepth` had two computations under one name: this one, on
    // `currentFlexibility`, is what `generateEscapeRoutes` gates the Strategic
    // Pivot on, and it was a mean over every event too. Twenty reflective
    // steps held it at 0.34 through five steps the session could not undo, so
    // the route that exists for exactly that situation was never offered.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 20; step++) think(manager, 'six_hats', step);
    for (let step = 21; step <= 25; step++) commit(manager, 'scamper', step);

    expect(manager.getPathMemory().currentFlexibility.commitmentDepth).toBeCloseTo(0.9, 10);
    expect(manager.generateEscapeRoutes().map(route => route.name)).toContain('Strategic Pivot');
  });

  it('leaves the healthy control chain at 0.20 for every step', () => {
    // Every step of the control declares itself a thinking step, so it reads
    // 0.20 at every window length and cannot approach 0.7 at any of them.
    const manager = new PathMemoryManager();
    HEALTHY_CONTROL.forEach((technique, index) => {
      think(manager, technique, index + 1);
      expect(depthOf(manager), `commitment depth at step ${index + 1}`).toBeCloseTo(0.2, 10);
      expect(depthWarnings(manager)).toHaveLength(0);
    });
  });
});
