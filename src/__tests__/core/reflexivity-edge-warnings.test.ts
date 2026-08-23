/**
 * Edge-triggered reflexivity warnings.
 *
 * The tracker used to report threshold STATE: once a session's constraint
 * count passed 10, an identical "critical" fired on every remaining step,
 * fed entirely by handler-authored template strings. trackStep now returns
 * the warning as a value, computed from the step's own delta: it fires on a
 * bucket crossing of the CONTENT-derived count (5, 10, then geometric ×1.25)
 * or when a step forecloses new paths from caller content — and template
 * constraints never fire anything.
 *
 * retry is disabled for this suite: it exists as a kill-checked guard, and
 * the global retry: 2 (vitest.config.ts) would let a flaky pass mask exactly
 * the regression this file is here to catch.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ReflexivityTracker } from '../../core/ReflexivityTracker.js';
import type { ReflexiveEffects } from '../../techniques/types.js';
import { getNLPService } from '../../nlp/NLPService.js';

const foreclosing = (text: string): ReflexiveEffects => ({
  triggers: ['test'],
  realityChanges: [],
  futureConstraints: [text],
  reversibility: 'low',
});

const stakeholder = (): ReflexiveEffects => ({
  triggers: ['test'],
  realityChanges: ['Stakeholder expectations set'],
  futureConstraints: [],
  reversibility: 'medium',
});

describe('edge-triggered reflexivity warnings', { retry: 0 }, () => {
  let tracker: ReflexivityTracker;
  const sessionId = 'edge-warning-session';

  beforeEach(() => {
    tracker = new ReflexivityTracker(getNLPService());
  });

  it('never warns for template-provenance constraints, however many accumulate', () => {
    for (let step = 1; step <= 15; step++) {
      const { warning } = tracker.trackStep(
        sessionId,
        'scamper',
        step,
        'action',
        `scamper step ${step}`,
        foreclosing(`Must adapt to change ${step}`)
        // provenance defaults to 'template'
      );
      expect(warning, `template step ${step} must not warn`).toBeNull();
    }
    // The constraints were still recorded — they are facilitation, not alarm.
    expect(tracker.getRealityState(sessionId)?.templateConstraintCount).toBe(15);
    expect(tracker.getRealityState(sessionId)?.contentConstraintCount).toBe(0);
  });

  it('fires on a new content-derived foreclosure, carrying only the new entries', () => {
    const { warning } = tracker.trackStep(
      sessionId,
      'scamper',
      1,
      'action',
      'scamper step 1',
      foreclosing('Cannot rebook the flights'),
      'content'
    );

    expect(warning).not.toBeNull();
    expect(warning?.type).toBe('path_foreclosed');
    expect(warning?.level).toBe('warning'); // never critical from the tracker
    expect(warning?.pathsForeclosed).toEqual(['Cannot rebook the flights']);
  });

  it('fires on bucket crossings of the content count, not on the state above them', () => {
    const firedAt: number[] = [];
    // Stakeholder expectations count toward the constraint total without
    // entering pathsForeclosed, so only bucket crossings can fire here.
    for (let step = 1; step <= 12; step++) {
      const { warning } = tracker.trackStep(
        sessionId,
        'six_hats',
        step,
        'action',
        `step ${step}`,
        stakeholder(),
        'content'
      );
      if (warning) {
        firedAt.push(step);
        expect(warning.type).toBe('constraint_threshold');
        expect(warning.level).toBe('warning');
      }
    }

    // One content constraint per step: crossings at >5 (step 6) and >10
    // (step 11) — and nowhere else. Steps 7-10 and 12 sit above a threshold
    // without crossing one, which used to re-fire identically every step.
    expect(firedAt).toEqual([6, 11]);
  });

  it('re-fires above 10 only on a geometric (~25%) increase', () => {
    // Reach a content count of 11 (fires at 6 and 11).
    for (let step = 1; step <= 11; step++) {
      tracker.trackStep(
        sessionId,
        'six_hats',
        step,
        'action',
        `s${step}`,
        stakeholder(),
        'content'
      );
    }
    const fired: number[] = [];
    // Counts 12..16: the next bucket boundary past 10 is >12.5, so count 13
    // fires; 16 crosses the following boundary (>15.6).
    for (let count = 12; count <= 16; count++) {
      const { warning } = tracker.trackStep(
        sessionId,
        'six_hats',
        count,
        'action',
        `s${count}`,
        stakeholder(),
        'content'
      );
      if (warning) fired.push(count);
    }
    expect(fired).toEqual([13, 16]);
  });
});
