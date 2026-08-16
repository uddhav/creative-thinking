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
  it('keeps spending from where it left off rather than from full', async () => {
    const spent = await runSteps(COMMITTING);
    const spentScore = spent.pathMemory?.currentFlexibility?.flexibilityScore ?? 1;

    expect(spentScore, 'three committing steps must have cost something').toBeLessThan(0.95);
    expect(spent.pathMemory?.pathHistory).toHaveLength(COMMITTING.length);

    // Rehydrated exactly as `SessionPersistence` leaves a session: the path
    // record survives, the manager does not. Then run a step through the real
    // executor, so `ErgodicityOrchestrator.managerFor` is what does the
    // seeding.
    //
    // This used to construct `new ErgodicityManager(undefined, spent.pathMemory)`
    // itself — a transcription of the line inside `managerFor`. Removing the
    // seed from the production call site left all three tests green, so the
    // guard proved only that the constructor works, which was never in doubt.
    const restored: SessionData = {
      ...spent,
      ergodicityManager: undefined,
    } as SessionData;

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

    // Placed the way a restore places it: state present, manager absent.
    const resumedId = 'session_resumed_probe';
    (sessionManager as unknown as { sessions: Map<string, SessionData> }).sessions.set(
      resumedId,
      restored
    );

    const response = await executeThinkingStep(
      {
        planId: plan.planId,
        sessionId: resumedId,
        technique: 'scamper',
        problem: PROBLEM,
        currentStep: 1,
        totalSteps: 8,
        output: 'Modify the base profile, recorded plainly and at length.',
        nextStepNeeded: true,
        scamperAction: 'modify',
      } as ExecuteThinkingStepInput,
      sessionManager,
      registry,
      new VisualFormatter(true),
      new MetricsCollector(),
      new HybridComplexityAnalyzer(),
      new ErgodicityManager()
    );

    const data = JSON.parse(response.content[0].text) as {
      ergodicityMetrics?: { currentFlexibility?: number };
    };
    const after = data.ergodicityMetrics?.currentFlexibility ?? 1;

    // The point of restoring is that the resumed run continues from what was
    // already spent rather than starting again at full.
    expect(after, 'a resumed session started again at full flexibility').toBeLessThan(spentScore);
    expect(
      restored.pathMemory?.pathHistory,
      'the resumed step was not appended to the record it was seeded from'
    ).toHaveLength(COMMITTING.length + 1);
  });
});
