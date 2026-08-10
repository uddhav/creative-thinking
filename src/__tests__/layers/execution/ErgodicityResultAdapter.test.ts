/**
 * Guard for `constraintLevel`, which used to add two clocks together and read a
 * missing value as a middling one:
 *
 *     Math.min(1, (metrics.commitmentDepth || 0.5) + constraints.length * 0.05)
 *
 * `commitmentDepth` is a mean over the last five steps, a state a session can
 * leave; `constraints.length` counts every constraint since step 1 and only
 * grows. Summed, they answered no question about any moment. They also count
 * the same steps — `createConstraint` fires on `commitmentLevel > 0.5`, exactly
 * what `commitmentDepth` averages — so a committing step was charged twice, the
 * same double charge the flexibility score shed. And `|| 0.5` turned a depth of
 * 0 into a reading halfway to fully constrained.
 */

import { describe, it, expect } from 'vitest';
import { ErgodicityResultAdapter } from '../../../layers/execution/ErgodicityResultAdapter.js';
import type { ErgodicityManagerResult } from '../../../layers/execution/ErgodicityResultAdapter.js';
import { PathMemoryManager } from '../../../ergodicity/pathMemory.js';
import { MetricsCalculator } from '../../../ergodicity/metrics.js';
import type { PathMemory } from '../../../ergodicity/types.js';
import type { LateralTechnique } from '../../../types/index.js';

const adapter = new ErgodicityResultAdapter();
const metricsCalculator = new MetricsCalculator();

function managerResult(pathMemory: PathMemory): ErgodicityManagerResult {
  const metrics = metricsCalculator.calculateMetrics(pathMemory);
  return {
    event: {
      technique: 'scamper',
      step: pathMemory.pathHistory.length,
      timestamp: new Date().toISOString(),
      decision: 'A recorded finding for this step.',
      reversibilityCost: 0.9,
    },
    metrics: {
      pathDivergence: metrics.pathDivergence,
      commitmentDepth: metrics.commitmentDepth,
      optionVelocity: metrics.optionVelocity,
    },
    warnings: [],
  };
}

function commit(manager: PathMemoryManager, step: number): void {
  manager.recordPathEvent('scamper' as LateralTechnique, step, 'Committing step.', {
    reversibilityCost: 0.9,
    commitmentLevel: 0.9,
  });
}

function think(manager: PathMemoryManager, step: number): void {
  manager.recordPathEvent('six_hats' as LateralTechnique, step, 'Reflective step.', {
    reversibilityCost: 0.1,
    commitmentLevel: 0.2,
  });
}

const constraintLevelOf = (manager: PathMemoryManager) => {
  const pathMemory = manager.getPathMemory();
  return adapter.adapt(managerResult(pathMemory), 1, pathMemory).metrics.constraintLevel;
};

describe('ErgodicityResultAdapter constraintLevel', () => {
  it('reports zero for a session that has committed to nothing', () => {
    // A depth of 0 is a measurement. `|| 0.5` read it as "no reading" and
    // reported a session halfway to fully constrained before it had taken a
    // step.
    const empty = new PathMemoryManager();
    expect(constraintLevelOf(empty)).toBe(0);

    // Thirteen reflective steps, the healthy control's shape: commitment depth
    // 0.2, and nothing added on top of it.
    const reflective = new PathMemoryManager();
    for (let step = 1; step <= 13; step++) think(reflective, step);
    expect(constraintLevelOf(reflective)).toBeCloseTo(0.2, 10);
  });

  it('does not grow with session length once the committing stops', () => {
    // The constraint count only ever went up, so a session that committed early
    // and reflected for the rest of its run reported a rising constraint level
    // for steps that constrained nothing. One clock, the five-step window: the
    // level falls as the commitments leave it.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 5; step++) commit(manager, step);
    const committing = constraintLevelOf(manager);
    expect(committing).toBeCloseTo(0.9, 10);
    expect(manager.getPathMemory().constraints).toHaveLength(5);

    for (let step = 6; step <= 20; step++) think(manager, step);
    expect(manager.getPathMemory().constraints).toHaveLength(5); // still counted, all-session
    expect(constraintLevelOf(manager)).toBeCloseTo(0.2, 10);
    expect(constraintLevelOf(manager)).toBeLessThan(committing);
  });

  it('does not charge a committing step twice', () => {
    // `createConstraint` fires on `commitmentLevel > 0.5`, which is what
    // `commitmentDepth` averages, so the two terms were the same steps. Twenty
    // committing steps used to reach the 1.0 cap — 0.9 plus twenty constraints
    // at 0.05 — and every session past twenty steps of commitment reported the
    // same saturated value whatever it did next.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 20; step++) commit(manager, step);

    expect(manager.getPathMemory().constraints).toHaveLength(20);
    expect(constraintLevelOf(manager)).toBeCloseTo(0.9, 10);
  });

  it('reads the same with and without path memory', () => {
    // The two branches used to disagree: with path memory the constraint count
    // was added, without it, it was not. One number, one definition.
    const manager = new PathMemoryManager();
    for (let step = 1; step <= 5; step++) commit(manager, step);
    const pathMemory = manager.getPathMemory();
    const result = managerResult(pathMemory);

    expect(adapter.adapt(result, 1, undefined).metrics.constraintLevel).toBe(
      adapter.adapt(result, 1, pathMemory).metrics.constraintLevel
    );
  });
});
