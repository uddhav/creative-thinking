/**
 * SessionCompletionTracker must report the same step count as the handler.
 *
 * Progress is reported as completedSteps / totalPlannedSteps, so if the tracker
 * disagrees with the handler about how many steps a technique has, every
 * session running that technique misreports how far along it is — and nothing
 * else in the suite would notice. The tracker used to keep its own hand-copied
 * table of all 32 counts to answer this.
 */

import { describe, it, expect } from 'vitest';
import { SessionCompletionTracker } from '../../core/session/SessionCompletionTracker.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import type { SessionData, LateralTechnique } from '../../types/index.js';

function sessionFor(technique: LateralTechnique): SessionData {
  return {
    technique,
    problem: 'Test problem',
    history: [],
    branches: {},
    insights: [],
    startTime: Date.now(),
  } as unknown as SessionData;
}

describe('SessionCompletionTracker step counts', () => {
  const tracker = new SessionCompletionTracker();
  const registry = TechniqueRegistry.getInstance();

  it('covers every registered technique', () => {
    expect(registry.getAllTechniques().sort()).toEqual([...ALL_LATERAL_TECHNIQUES].sort());
  });

  for (const technique of ALL_LATERAL_TECHNIQUES) {
    it(`reports ${technique}'s step count as the handler defines it`, () => {
      const expected = registry.getHandler(technique).getTechniqueInfo().totalSteps;
      const metadata = tracker.calculateCompletionMetadata(sessionFor(technique));

      expect(
        metadata.totalPlannedSteps,
        `tracker says ${technique} has ${metadata.totalPlannedSteps} steps, handler says ${expected}`
      ).toBe(expected);
      expect(metadata.techniqueStatuses[0].totalSteps).toBe(expected);
    });
  }

  it('does not throw on a technique this build no longer registers', () => {
    // A persisted session can name a retired technique. Loading it should give a
    // neutral estimate, not an exception on the way in.
    const metadata = tracker.calculateCompletionMetadata(
      sessionFor('retired_technique' as LateralTechnique)
    );

    expect(metadata.totalPlannedSteps).toBeGreaterThan(0);
  });
});
