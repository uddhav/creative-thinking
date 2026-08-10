/**
 * Flexibility is measured from the path, not asserted by the caller.
 *
 * `updateFlexibilityMetrics` computes it as the available-option ratio times
 * ∏(1 − flexibilityImpact) over the path history. Nothing ever set
 * `flexibilityImpact`, and only SCAMPER ever reported an option as closed, so
 * for the other thirty-one techniques both terms were pinned: the ratio stayed
 * 1 and the product stayed empty. Engine-measured flexibility was exactly 1.0
 * for the whole of every session.
 *
 * Every `< 0.4` gate in the codebase — the flexibility warning, option
 * generation, the displayed indicator — was therefore reachable only because
 * `input.flexibilityScore` won over the engine's own number. A caller could
 * type 0.05 and trip all of them, or 1.0 and silence them. That field is gone.
 */

import { describe, it, expect } from 'vitest';
import { executeThinkingStep } from '../../layers/execution.js';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type {
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  LateralTechnique,
} from '../../types/index.js';

async function runSession(
  technique: LateralTechnique,
  problem: string,
  outputs: string[],
  extraPerStep: Record<string, unknown> = {}
): Promise<{ flexibility: number[]; sessionManager: SessionManager; sessionId: string }> {
  const sessionManager = new SessionManager();
  const registry = TechniqueRegistry.getInstance();
  const plan = planThinkingSession(
    { problem, techniques: [technique], timeframe: 'thorough' } as PlanThinkingSessionInput,
    sessionManager,
    registry
  );

  let sessionId: string | undefined;
  const flexibility: number[] = [];

  for (let index = 0; index < outputs.length; index++) {
    const response = await executeThinkingStep(
      {
        planId: plan.planId,
        sessionId,
        technique,
        problem,
        currentStep: index + 1,
        totalSteps: outputs.length,
        output: outputs[index],
        nextStepNeeded: index < outputs.length - 1,
        ...extraPerStep,
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
    flexibility.push(
      sessionManager.getSession(sessionId)?.pathMemory?.currentFlexibility?.flexibilityScore ?? 1
    );
  }

  return { flexibility, sessionManager, sessionId: sessionId as string };
}

const HEAVY = [
  'We will eliminate the legacy pipeline permanently and commit the budget.',
  'Remove the fallback entirely and delete the old path.',
  'Invest in a permanent single-vendor contract.',
  'Commit irreversibly to the migration and remove the rollback.',
  'Delete the parallel stack; the investment is permanent.',
  'Eliminate the remaining alternatives and commit the team.',
  'Remove the last escape hatch permanently.',
];

const LIGHT = [
  'Sketch a few directions worth a look.',
  'Consider how the onboarding reads to a newcomer.',
  'Note where the wording could be friendlier.',
  'List the alternatives nobody has tried.',
  'Ask what a first-time user expects to see.',
  'Collect the smaller ideas worth keeping.',
  'Summarise the directions still open.',
];

describe('flexibility moves for techniques that never touch pathImpact', () => {
  it('falls through the 0.4 gate on a run of irreversible commitments', async () => {
    const { flexibility } = await runSession('six_hats', 'Retire the legacy pipeline', HEAVY);

    // Before this was measured, every one of these was exactly 1.0.
    expect(flexibility[0], 'the first step already costs something').toBeLessThan(1);
    expect(flexibility.at(-1), 'a run of commitments has to reach the gate').toBeLessThan(0.4);

    // Monotonic: flexibility is spent, never recovered by a later step.
    for (let i = 1; i < flexibility.length; i++) {
      expect(flexibility[i]).toBeLessThanOrEqual(flexibility[i - 1]);
    }
  });

  it('stays wide open on an exploratory run of the same length', async () => {
    const { flexibility } = await runSession('six_hats', 'Name the onboarding flow', LIGHT);

    // The control. If this also fell through the gate, the measurement would
    // be tracking session length rather than commitment, and every warning
    // built on it would be noise again.
    expect(flexibility.at(-1)).toBeGreaterThan(0.9);
  });
});

describe('the caller cannot assert its own flexibility', () => {
  it('ignores a flexibilityScore sent alongside the step', async () => {
    // The field is gone from the schema and from the input type. An old client
    // still sending it must not be able to move the number, in either
    // direction — unknown keys pass through the server unvalidated.
    const asserted = await runSession('six_hats', 'Name the onboarding flow', LIGHT, {
      flexibilityScore: 0.02,
    });
    const silent = await runSession('six_hats', 'Name the onboarding flow', LIGHT);

    expect(asserted.flexibility).toEqual(silent.flexibility);
    expect(asserted.flexibility.at(-1)).toBeGreaterThan(0.9);
  });
});
