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

/**
 * Wording is identical across every run below. The measure reads what each
 * step declares about its own reversibility, not what its prose says, so any
 * difference between two runs has to come from which steps were run.
 */
const PLAIN = 'A recorded finding for this step, written plainly.';

/** Techniques whose steps are declared as commitments. */
const COMMITTING: LateralTechnique[] = ['disney_method', 'keeper_test', 'scamper'];

/** Techniques whose steps are all reflection. */
const REFLECTIVE: LateralTechnique[] = ['neural_state', 'random_entry', 'six_hats'];

/** Runs a chained plan and returns flexibility after each step. */
async function runChain(
  techniques: LateralTechnique[],
  extraPerStep: Record<string, unknown> = {}
): Promise<number[]> {
  const sessionManager = new SessionManager();
  const registry = TechniqueRegistry.getInstance();
  const problem = 'Retire the legacy pipeline';
  const plan = planThinkingSession(
    { problem, techniques, timeframe: 'thorough' } as PlanThinkingSessionInput,
    sessionManager,
    registry
  );

  // One entry per technique, each carrying its own steps — flatten to the
  // plan-wide sequence the caller actually walks.
  const steps = plan.workflow.flatMap(block =>
    block.steps.map(() => ({ technique: block.technique }))
  );
  let sessionId: string | undefined;
  const flexibility: number[] = [];

  for (let index = 0; index < steps.length; index++) {
    const response = await executeThinkingStep(
      {
        planId: plan.planId,
        sessionId,
        technique: steps[index].technique,
        problem,
        currentStep: index + 1,
        totalSteps: steps.length,
        output: PLAIN,
        nextStepNeeded: index < steps.length - 1,
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

  return flexibility;
}

describe('flexibility is spent by the steps a session runs', () => {
  it('falls through the 0.4 gate on a run of committing steps', async () => {
    const flexibility = await runChain(COMMITTING);

    // Before this was measured, every one of these was exactly 1.0 — nothing
    // ever set the per-step cost the score is a product of.
    expect(flexibility[0], 'the first step already costs something').toBeLessThan(1);
    expect(flexibility.at(-1), 'a run of commitments has to reach the gate').toBeLessThan(0.4);

    // Monotonic: flexibility is spent, never recovered by a later step.
    for (let i = 1; i < flexibility.length; i++) {
      expect(flexibility[i]).toBeLessThanOrEqual(flexibility[i - 1]);
    }
  });

  it('stays wide open across a longer run of reflection', async () => {
    const flexibility = await runChain(REFLECTIVE);

    // The control, and it is longer than the committing run. If this also fell
    // through the gate the measure would be tracking session length rather
    // than commitment, and every warning built on it would be noise again.
    expect(flexibility.length).toBeGreaterThanOrEqual((await runChain(COMMITTING)).length - 3);
    expect(flexibility.at(-1)).toBeGreaterThan(0.9);
  });
});

describe('the caller cannot assert its own flexibility', () => {
  it('ignores a flexibilityScore sent alongside the step', async () => {
    // The field is gone from the schema and from the input type. An old client
    // still sending it must not move the number in either direction.
    const asserted = await runChain(REFLECTIVE, { flexibilityScore: 0.02 });
    const silent = await runChain(REFLECTIVE);

    expect(asserted).toEqual(silent);
  });

  it('ignores a pathImpact sent for a technique that does not derive one', async () => {
    // The hole the retired flexibilityScore left behind, wearing a different
    // name: twenty entries in optionsOpened used to credit half a step's cost
    // each and pin flexibility at 1.0 through any number of committing steps.
    const optionsOpened = Array.from({ length: 20 }, (_, i) => `invented option ${i}`);
    const asserted = await runChain(COMMITTING, {
      pathImpact: {
        reversible: true,
        dependenciesCreated: [],
        optionsClosed: [],
        optionsOpened,
        flexibilityRetention: 1,
        commitmentLevel: 'low',
      },
    });
    const silent = await runChain(COMMITTING);

    expect(asserted).toEqual(silent);
    expect(asserted.at(-1), 'the committing run still reaches the gate').toBeLessThan(0.4);
  });
});
