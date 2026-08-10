/**
 * A resumed session keeps what it spent.
 *
 * `SessionState` — the shape that goes to disk — had no `pathMemory`, so a
 * session reloaded from persistence came back with no path history and
 * flexibility at 1.0. That was survivable only while the caller could reassert
 * `flexibilityScore` on the next step. Now that the number is measured rather
 * than accepted, dropping the path record drops the measurement: a session
 * three irreversible commitments deep resumed as though it had made none.
 *
 * Two seams have to hold for that not to happen — the record has to be saved,
 * and the manager that continues the session has to start from it rather than
 * from a fresh one.
 */

import { describe, it, expect } from 'vitest';
import { ErgodicityManager } from '../../ergodicity/index.js';
import { executeThinkingStep } from '../../layers/execution.js';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import type {
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  SessionData,
} from '../../types/index.js';

const PROBLEM = 'Retire the legacy pipeline';
/**
 * `scamper` is used because every one of its steps is declared an action with
 * a real reversibility cost. Wording no longer matters — the measure reads
 * what a step declares, not what its prose says — so the technique choice is
 * what makes these steps expensive.
 */
const COMMITTING = [
  'Replace the ceramic body with a bamboo composite.',
  'Fold the heating element into the wall.',
  'Adapt the lid for the new profile.',
];

/** Runs the given outputs and returns the session the server built. */
async function runSteps(outputs: string[]): Promise<SessionData> {
  const sessionManager = new SessionManager();
  const registry = TechniqueRegistry.getInstance();
  const plan = planThinkingSession(
    {
      problem: PROBLEM,
      techniques: ['scamper'],
      timeframe: 'thorough',
    } as PlanThinkingSessionInput,
    sessionManager,
    registry
  );

  let sessionId: string | undefined;
  for (let index = 0; index < outputs.length; index++) {
    const response = await executeThinkingStep(
      {
        planId: plan.planId,
        sessionId,
        technique: 'scamper',
        problem: PROBLEM,
        currentStep: index + 1,
        totalSteps: 8,
        output: outputs[index],
        nextStepNeeded: true,
      } as ExecuteThinkingStepInput,
      sessionManager,
      registry,
      new VisualFormatter(true),
      new MetricsCollector(),
      new HybridComplexityAnalyzer(),
      new ErgodicityManager()
    );
    const data = JSON.parse(response.content[0].text) as Record<string, unknown>;
    sessionId = (data.sessionId as string) ?? sessionId;
  }

  return sessionManager.getSession(sessionId as string) as SessionData;
}

describe('flexibility survives a restart', () => {
  it('starts a manager from the path record it is handed', async () => {
    const spent = await runSteps(COMMITTING);
    const spentScore = spent.pathMemory?.currentFlexibility?.flexibilityScore ?? 1;

    expect(spentScore, 'three committing steps must have cost something').toBeLessThan(0.95);
    expect(spent.pathMemory?.pathHistory).toHaveLength(COMMITTING.length);

    // What `managerFor` does for a session rehydrated from disk.
    const resumed = new ErgodicityManager(undefined, spent.pathMemory);

    expect(resumed.getPathMemory().currentFlexibility.flexibilityScore).toBeCloseTo(spentScore, 10);
    expect(resumed.getPathMemory().pathHistory).toHaveLength(COMMITTING.length);
  });

  it('keeps spending from where it left off rather than from full', async () => {
    const spent = await runSteps(COMMITTING);
    const spentScore = spent.pathMemory?.currentFlexibility?.flexibilityScore ?? 1;

    const resumed = new ErgodicityManager(undefined, spent.pathMemory);
    await resumed.recordThinkingStep('scamper', 4, 'Modify the base profile.', {
      reversibilityCost: 0.8,
      commitmentLevel: 0.8,
    });

    const after = resumed.getPathMemory().currentFlexibility.flexibilityScore;

    // A fresh manager taking that same single step lands at 0.84. The point of
    // restoring is that this one continues from what was already spent.
    expect(after).toBeLessThan(spentScore);
    expect(after, 'a resumed session must not start again at full flexibility').toBeLessThan(0.84);
    expect(resumed.getPathMemory().pathHistory).toHaveLength(COMMITTING.length + 1);
  });

  it('carries the path record through the saved session shape', async () => {
    const spent = await runSteps(COMMITTING);

    // The record has to survive JSON, which is what persistence stores.
    const roundTripped = JSON.parse(JSON.stringify(spent.pathMemory)) as NonNullable<
      SessionData['pathMemory']
    >;

    expect(roundTripped.currentFlexibility.flexibilityScore).toBeCloseTo(
      spent.pathMemory?.currentFlexibility?.flexibilityScore ?? 1,
      10
    );
    expect(roundTripped.pathHistory).toHaveLength(COMMITTING.length);
    expect(roundTripped.pathHistory[0].flexibilityImpact).toBeGreaterThan(0);
  });
});
