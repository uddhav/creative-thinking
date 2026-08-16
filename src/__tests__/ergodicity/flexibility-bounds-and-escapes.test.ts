/**
 * The flexibility score stays a number between 0 and 1, and an escape moves it
 * when the escape happens.
 *
 * Three defects sat behind those two sentences.
 *
 * `Math.min(1, Math.max(0, NaN))` is `NaN`, so a non-finite impact supplied
 * through the public `recordThinkingStep` signature passed both clamps and
 * poisoned every later reading.
 *
 * An escape records a credit — a negative impact — so the running product can
 * exceed 1. Clamping only the final value left the excess banked inside the
 * product: eight escapes hid a true reading above 8, which then silently
 * absorbed a dozen committing steps before the gate could fire again.
 *
 * And `recordEvent` never recomputed the metrics, so the score did not move at
 * escape time at all. The condition that triggers an escape was still true
 * immediately after one succeeded; the credit only appeared on the next
 * ordinary step.
 */

import { describe, it, expect } from 'vitest';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { PathEvent } from '../../ergodicity/types.js';

const COMMITTING = { reversibilityCost: 0.9, commitmentLevel: 0.9 };

function escapeEvent(gain: number): PathEvent {
  return {
    timestamp: new Date().toISOString(),
    technique: 'six_hats',
    step: 0,
    decision: 'Executed an escape protocol',
    optionsOpened: [],
    optionsClosed: [],
    reversibilityCost: 0.1,
    commitmentLevel: 0.1,
    constraintsCreated: [],
    // The engine reads this field as a cost, so a gain is negative.
    flexibilityImpact: -gain,
  };
}

describe('the score stays inside 0 and 1', () => {
  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('ignores a %s impact rather than propagating it', async (_label, impact) => {
    const manager = new ErgodicityManager();
    await manager.recordThinkingStep('six_hats', 1, 'A step.', COMMITTING);
    await manager.recordThinkingStep('six_hats', 2, 'A step.', {
      ...COMMITTING,
      flexibilityImpact: impact,
    });

    const score = manager.getPathMemory().currentFlexibility.flexibilityScore;
    expect(Number.isFinite(score), `a ${_label} impact reached the score`).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('bounds an out-of-range impact in both directions', async () => {
    const spent = new ErgodicityManager();
    await spent.recordThinkingStep('six_hats', 1, 'A step.', {
      ...COMMITTING,
      flexibilityImpact: 2,
    });
    expect(spent.getPathMemory().currentFlexibility.flexibilityScore).toBe(0);

    const credited = new ErgodicityManager();
    await credited.recordThinkingStep('six_hats', 1, 'A step.', {
      ...COMMITTING,
      flexibilityImpact: -5,
    });
    expect(credited.getPathMemory().currentFlexibility.flexibilityScore).toBe(1);
  });
});

describe('an escape returns flexibility without banking it', () => {
  it('moves the score at the moment the escape is recorded', async () => {
    const manager = new ErgodicityManager();
    for (let step = 1; step <= 6; step++) {
      await manager.recordThinkingStep('six_hats', step, 'A committing step.', COMMITTING);
    }
    const before = manager.getPathMemory().currentFlexibility.flexibilityScore;

    (
      manager as unknown as { pathMemoryManager: { recordEvent(e: PathEvent): void } }
    ).pathMemoryManager.recordEvent(escapeEvent(0.3));

    const after = manager.getPathMemory().currentFlexibility.flexibilityScore;
    expect(after, 'the escape did not move the number it is judged by').toBeGreaterThan(before);
  });

  it('discards credit above the ceiling instead of stockpiling it', async () => {
    const manager = new ErgodicityManager();
    const pm = (manager as unknown as { pathMemoryManager: { recordEvent(e: PathEvent): void } })
      .pathMemoryManager;

    // Eight escapes on an untouched session. Every one of them is a credit
    // against a score already at its ceiling, so all of it must be discarded.
    for (let i = 0; i < 8; i++) pm.recordEvent(escapeEvent(0.4));
    expect(manager.getPathMemory().currentFlexibility.flexibilityScore).toBe(1);

    // If any of that had been banked, these committing steps would be absorbed
    // by it and the score would barely move.
    for (let step = 1; step <= 6; step++) {
      await manager.recordThinkingStep('six_hats', step, 'A committing step.', COMMITTING);
    }

    const score = manager.getPathMemory().currentFlexibility.flexibilityScore;
    expect(score, 'six committing steps were absorbed by banked credit').toBeLessThan(0.5);
  });
});
