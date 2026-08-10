/**
 * Incompleteness is a finding when a session ends, and noise while it runs.
 *
 * The progress warnings fired whenever progress sat below a threshold — which is
 * true on step 1 of every multi-step technique. A session proceeding exactly on
 * plan was told `⚠️ CRITICAL FAILURE … will result in INVALID analysis. DO NOT
 * proceed`, every time. Callers learned to ignore it, which is the real cost:
 * the same channel carries the genuine escape recommendations.
 *
 * `❌ CRITICAL GAPS DETECTED` was worse — it had no progress gate at all, and
 * `identifyCriticalGaps` counts every technique with zero completed steps, so on
 * step 1 of a multi-technique plan nearly all of them qualified.
 *
 * Both were invisible to this suite, because the code that emitted the loudest
 * one carried a `NODE_ENV === 'test' || VITEST === 'true'` exemption. A guard
 * whose only effect is that tests cannot observe the behaviour is why this
 * survived; both exemptions are gone.
 */

import { describe, it, expect } from 'vitest';
import { SessionCompletionTracker } from '../../../core/session/SessionCompletionTracker.js';
import type { SessionData, LateralTechnique } from '../../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../../types/planning.js';

const tracker = new SessionCompletionTracker();

function planFor(techniques: LateralTechnique[], stepsEach: number): PlanThinkingSessionOutput {
  return {
    planId: 'plan_test',
    problem: 'Test problem',
    techniques,
    totalSteps: techniques.length * stepsEach,
    workflow: techniques.map(technique => ({
      technique,
      steps: Array.from({ length: stepsEach }, (_, i) => ({
        stepNumber: i + 1,
        description: `step ${i + 1}`,
        expectedOutput: 'x',
      })),
    })),
  } as unknown as PlanThinkingSessionOutput;
}

function sessionWith(technique: LateralTechnique, completedSteps: number): SessionData {
  return {
    technique,
    problem: 'Test problem',
    history: Array.from({ length: completedSteps }, (_, i) => ({
      technique,
      currentStep: i + 1,
      output: `step ${i + 1} output`,
    })),
    branches: {},
    insights: [],
    startTime: Date.now(),
  } as unknown as SessionData;
}

describe('completion warnings fire when a session ends, not while it runs', () => {
  const plan = planFor(['six_hats', 'scamper'], 7);

  it('says nothing about incompleteness on an early step', () => {
    const metadata = tracker.calculateCompletionMetadata(
      sessionWith('six_hats', 1),
      plan,
      /* isTerminating */ false
    );

    const text = metadata.completionWarnings.join(' ');
    expect(text).not.toContain('CRITICAL FAILURE');
    expect(text).not.toContain('CRITICAL GAPS DETECTED');
    expect(text).not.toContain('MANDATORY ACTION');
  });

  it('still reports incompleteness when the session is ending', () => {
    const metadata = tracker.calculateCompletionMetadata(
      sessionWith('six_hats', 1),
      plan,
      /* isTerminating */ true
    );

    const text = metadata.completionWarnings.join(' ');
    expect(text, 'ending 7% complete is a real finding').toContain('CRITICAL FAILURE');
  });

  it('keeps populating criticalGapsIdentified mid-session', () => {
    // Only the warning STRING is gated. CompletionGatekeeper reads this field on
    // the terminating path, so suppressing the data would change enforcement.
    const metadata = tracker.calculateCompletionMetadata(sessionWith('six_hats', 1), plan, false);

    expect(Array.isArray(metadata.criticalGapsIdentified)).toBe(true);
  });

  it('does not gate the technique-specific warnings on termination', () => {
    // "Black Hat skipped" is true whenever it is true, and acting on it
    // mid-session is the entire point of saying it.
    const skipped = tracker.calculateCompletionMetadata(
      sessionWith('six_hats', 6),
      planFor(['six_hats'], 7),
      false
    );

    // Whatever else it says, the gate must not be what decides this class.
    expect(skipped.completionWarnings.join(' ')).not.toContain('CRITICAL FAILURE');
  });

  it('has no test-environment exemption left to hide behind', () => {
    // canProceedToSynthesis used to return `allowed` for any skipped step when
    // NODE_ENV=test or VITEST=true, so the block could never be observed here.
    const withSkips = tracker.calculateCompletionMetadata(
      sessionWith('six_hats', 2),
      planFor(['six_hats'], 7),
      true
    );
    withSkips.techniqueStatuses[0].skippedSteps = [3, 4];

    const verdict = tracker.canProceedToSynthesis(withSkips);

    expect(verdict.allowed, 'skipped steps must block synthesis, in tests too').toBe(false);
    expect(verdict.reason).toContain('BLOCKED');
  });
});
