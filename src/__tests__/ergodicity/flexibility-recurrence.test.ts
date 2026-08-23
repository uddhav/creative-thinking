/**
 * The one flexibility recurrence, and the crossing gate built on it.
 *
 * `PathMemoryManager.computeFlexibilityScore` is the clamped, finite-guarded
 * product both the live score and the option-generation crossing gate use.
 * The gate's "previous" reading MUST come from this recurrence: an unclamped
 * series banks escape credits above 1 (eight escapes once hid a true reading
 * of 8.2) and a single NaN poisons every later value — either would make the
 * gate's previous-vs-current comparison read two different quantities.
 *
 * retry is disabled: kill-checked guard; the global retry: 2 would let a
 * flaky pass mask exactly the regression this file exists to catch.
 */
import { describe, expect, it } from 'vitest';
import { PathMemoryManager } from '../../ergodicity/pathMemory.js';

const events = (...impacts: number[]) => impacts.map(flexibilityImpact => ({ flexibilityImpact }));

describe('computeFlexibilityScore', { retry: 0 }, () => {
  it('is the clamped product of (1 - impact)', () => {
    expect(PathMemoryManager.computeFlexibilityScore(events(0.3, 0.3))).toBeCloseTo(0.49, 10);
    expect(PathMemoryManager.computeFlexibilityScore([])).toBe(1);
  });

  it('skips non-finite impacts instead of poisoning the tail', () => {
    expect(PathMemoryManager.computeFlexibilityScore(events(0.3, NaN, 0.3))).toBeCloseTo(0.49, 10);
  });

  it('clamps escape credits per event rather than banking them above 1', () => {
    // A large credit on a fresh session cannot push the score past 1, so a
    // later committing step spends from 1, not from a banked surplus.
    expect(PathMemoryManager.computeFlexibilityScore(events(-0.5, 0.3))).toBeCloseTo(0.7, 10);
  });

  it('supports the dip-recover-dip crossing the option gate needs', () => {
    // The crossing predicate: previous >= 0.4 && current < 0.4, where
    // previous is the recurrence over all but the last event.
    const impacts = [0.3, 0.3, 0.15, 0.1, -0.5, 0.3];
    const crossings: number[] = [];
    for (let i = 1; i <= impacts.length; i++) {
      const previous = PathMemoryManager.computeFlexibilityScore(
        events(...impacts.slice(0, i - 1))
      );
      const current = PathMemoryManager.computeFlexibilityScore(events(...impacts.slice(0, i)));
      if (previous >= 0.4 && current < 0.4) {
        crossings.push(i);
      }
    }
    // First descent crosses at event 4 (0.417 -> 0.375); the escape credit at
    // event 5 recovers to 0.562; the second descent crosses at event 6
    // (0.562 -> 0.394). Steps merely sitting below 0.4 never appear.
    expect(crossings).toEqual([4, 6]);
  });
});
