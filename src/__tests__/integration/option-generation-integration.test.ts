import { describe, it, expect, beforeEach } from 'vitest';
import { executeThinkingStep } from '../../layers/execution.js';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type {
  ExecuteThinkingStepInput,
  LateralTechnique,
  PlanThinkingSessionInput,
} from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

/**
 * The same sentence for every step of every run below.
 *
 * Deliberately plain: flexibility is derived from what each step declares
 * about its own reversibility, so the measure no longer reads the output text
 * at all. Committal wording would buy nothing here, and plain wording costs
 * nothing — which is the point, and is why these runs reach the gate by
 * running steps rather than by choosing words.
 */
const PLAIN_OUTPUT = 'A recorded finding for this step, written plainly.';

describe('Option Generation Integration', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = TechniqueRegistry.getInstance();
    visualFormatter = new VisualFormatter(true); // Disable visual output
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager();
  });

  /**
   * Walks a chained plan one step at a time and stops at the first step whose
   * response carries `optionGeneration`.
   *
   * Nothing here asserts a flexibility number to the server: no
   * `flexibilityScore`, no hand-built `pathImpact`. Both are ignored by design,
   * so a test that sent one would be testing only that the server believed what
   * it was told. The gate is reached by spending flexibility on steps that
   * declare themselves hard to undo.
   */
  async function runPlanUntilOptionGeneration(planInput: PlanThinkingSessionInput): Promise<{
    plan: PlanThinkingSessionOutput;
    totalSteps: number;
    gateStep?: number;
    gateTechnique?: LateralTechnique;
    gateResponse?: Record<string, unknown>;
  }> {
    const plan: PlanThinkingSessionOutput = planThinkingSession(
      planInput,
      sessionManager,
      techniqueRegistry
    );

    // `workflow` holds one entry PER TECHNIQUE, each with its own `steps`
    // array. Flatten it to the plan-wide sequence a caller actually walks, and
    // take the order from the plan rather than from `planInput.techniques` —
    // planning is free to reorder them.
    const sequence: LateralTechnique[] = plan.workflow.flatMap(block =>
      block.steps.map(() => block.technique)
    );

    let sessionId: string | undefined;

    for (let index = 0; index < sequence.length; index++) {
      const response = await executeThinkingStep(
        {
          planId: plan.planId,
          sessionId,
          technique: sequence[index],
          problem: planInput.problem,
          currentStep: index + 1,
          totalSteps: sequence.length,
          output: PLAIN_OUTPUT,
          // Required on every call, and true until the final step.
          nextStepNeeded: index < sequence.length - 1,
        } as ExecuteThinkingStepInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const data = JSON.parse(response.content[0].text) as Record<string, unknown>;
      sessionId = (data.sessionId as string | undefined) ?? sessionId;

      if (data.optionGeneration !== undefined) {
        return {
          plan,
          totalSteps: sequence.length,
          gateStep: index + 1,
          gateTechnique: sequence[index],
          gateResponse: data,
        };
      }
    }

    return { plan, totalSteps: sequence.length };
  }

  it('should trigger option generation when flexibility drops below 0.4', async () => {
    // No single technique spends enough to reach the 0.4 gate on its own — the
    // most committing one ends around 0.45. A real session reaches it the way
    // this one does: by chaining techniques, so the per-step costs compound
    // across the whole plan. `competing_hypotheses` then `scamper` is 16 steps
    // of declared commitments.
    const planInput: PlanThinkingSessionInput = {
      problem: 'Restructure company with strict budget constraints',
      techniques: ['competing_hypotheses', 'scamper'],
      constraints: [
        'Cannot increase budget',
        'Must maintain all core services',
        'Cannot reduce headcount',
        'Must complete in 3 months',
        'Cannot outsource',
      ],
      timeframe: 'thorough',
    };

    const { plan, totalSteps, gateStep, gateResponse } =
      await runPlanUntilOptionGeneration(planInput);

    // The planning layer's own up-front read of the constraints. Separate from
    // the runtime measurement below, which is what actually opens the gate.
    expect(plan.flexibilityAssessment).toBeDefined();
    expect(plan.flexibilityAssessment?.score).toBeLessThan(0.4);
    expect(plan.flexibilityAssessment?.optionGenerationRecommended).toBe(true);

    // Verify option generation was triggered by the measurement, not by input
    const responseData = gateResponse ?? {};
    const optionGeneration = responseData.optionGeneration as Record<string, unknown> | undefined;
    expect(optionGeneration, 'a run of committing steps must reach the gate').toBeDefined();
    // Partway through, not on the first step and not only on the last: the
    // gate opens once enough has been spent, and the session still has steps
    // left in which to act on the options. (Measured: step 10 of 16.)
    expect(gateStep).toBeGreaterThan(1);
    expect(gateStep).toBeLessThan(totalSteps);
    expect(optionGeneration?.triggered).toBe(true);
    expect(optionGeneration?.flexibility).toBeLessThan(0.4);
    expect(optionGeneration?.optionsGenerated).toBeGreaterThan(0);
    expect(optionGeneration?.strategies).toBeInstanceOf(Array);
    expect(optionGeneration?.topOptions).toBeInstanceOf(Array);
    expect((optionGeneration?.topOptions as unknown[]).length).toBeGreaterThan(0);

    // Verify options have expected structure
    const firstOption = (
      optionGeneration?.topOptions as Array<{
        name: string;
        description: string;
        flexibilityGain?: number;
        recommendation?: string;
      }>
    )[0];
    expect(firstOption).toHaveProperty('name');
    expect(firstOption).toHaveProperty('description');
    // flexibilityGain might be undefined if not evaluated yet
    expect(firstOption).toHaveProperty('recommendation');
  });

  it(
    'emits the option block once per descent, not on every step below 0.4',
    { retry: 0 },
    async () => {
      // Same chained plan as above, walked to the END this time. The gate used
      // to be state-based (fire whenever flexibility < 0.4), so once crossed it
      // re-emitted the same canned block on every remaining step — roughly
      // seven consecutive re-emissions on this very plan. The gate is now the
      // downward CROSSING; flexibility is a monotone-decreasing product for
      // ordinary steps, so exactly one step of this plan may carry the block.
      // (retry disabled: this is a kill-checked guard; the global retry: 2
      // would let a flaky pass mask the regression it exists to catch.)
      const planInput: PlanThinkingSessionInput = {
        problem: 'Restructure company with strict budget constraints',
        techniques: ['competing_hypotheses', 'scamper'],
        constraints: [
          'Cannot increase budget',
          'Must maintain all core services',
          'Cannot reduce headcount',
          'Must complete in 3 months',
          'Cannot outsource',
        ],
        timeframe: 'thorough',
      };

      const plan: PlanThinkingSessionOutput = planThinkingSession(
        planInput,
        sessionManager,
        techniqueRegistry
      );
      const sequence: LateralTechnique[] = plan.workflow.flatMap(block =>
        block.steps.map(() => block.technique)
      );

      let sessionId: string | undefined;
      const carriers: number[] = [];

      for (let index = 0; index < sequence.length; index++) {
        const response = await executeThinkingStep(
          {
            planId: plan.planId,
            sessionId,
            technique: sequence[index],
            problem: planInput.problem,
            currentStep: index + 1,
            totalSteps: sequence.length,
            output: PLAIN_OUTPUT,
            nextStepNeeded: index < sequence.length - 1,
          } as ExecuteThinkingStepInput,
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );

        const data = JSON.parse(response.content[0].text) as Record<string, unknown>;
        sessionId = (data.sessionId as string | undefined) ?? sessionId;
        if (data.optionGeneration !== undefined) {
          carriers.push(index + 1);
        }
      }

      expect(carriers, 'exactly one step may carry optionGeneration').toHaveLength(1);
    }
  );

  it('should not trigger option generation when flexibility is high', async () => {
    // Create a plan with minimal constraints
    const planInput: PlanThinkingSessionInput = {
      problem: 'Explore new product ideas',
      techniques: ['random_entry'],
      constraints: [], // No constraints = high flexibility
      timeframe: 'thorough',
    };

    const plan: PlanThinkingSessionOutput = planThinkingSession(
      planInput,
      sessionManager,
      techniqueRegistry
    );

    // Execute a random entry step
    const input: ExecuteThinkingStepInput = {
      planId: plan.planId,
      technique: 'random_entry',
      problem: planInput.problem,
      currentStep: 1,
      totalSteps: 3,
      output: 'Using "butterfly" as random stimulus',
      nextStepNeeded: true,
      randomStimulus: 'butterfly',
    };

    const response = await executeThinkingStep(
      input,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;

    // Verify option generation was NOT triggered
    expect(responseData.optionGeneration).toBeUndefined();
  });

  it('should include option generation for non-SCAMPER techniques when flexibility is low', async () => {
    // Option generation is not a SCAMPER-only feature: the flexibility it
    // gates on is measured for every technique from what its steps declare
    // about their own reversibility. So this chain contains no SCAMPER at all,
    // and the gate has to open on a step belonging to something else.
    const planInput: PlanThinkingSessionInput = {
      problem: 'Launch new product with extreme constraints',
      techniques: ['context_reframing', 'perception_optimization'],
      constraints: [
        'Zero marketing budget',
        'Must use existing team only',
        'Cannot modify existing products',
        'Must launch within 1 month',
        'Cannot use external resources',
        'Must be profitable immediately',
      ],
      timeframe: 'thorough',
    };

    const { gateStep, gateTechnique, gateResponse } = await runPlanUntilOptionGeneration(planInput);

    // Verify option generation was triggered for non-SCAMPER technique
    expect(
      gateResponse?.optionGeneration,
      'a SCAMPER-free chain must reach the gate'
    ).toBeDefined();
    expect(gateTechnique).not.toBe('scamper');
    // Measured: step 8 of 10, a perception_optimization step.
    expect(gateStep).toBeGreaterThan(1);

    const optionGeneration = gateResponse?.optionGeneration as Record<string, unknown>;
    expect(optionGeneration.triggered).toBe(true);
    expect(optionGeneration.flexibility).toBeLessThan(0.4);
    expect(optionGeneration.optionsGenerated).toBeGreaterThan(0);
  });

  it('should handle option generation gracefully when engine fails', async () => {
    // Create a scenario that might cause option generation to fail
    const planInput: PlanThinkingSessionInput = {
      problem: 'X'.repeat(1000), // Extremely long problem
      techniques: ['po'],
      constraints: Array(20).fill('constraint'), // Many constraints
      timeframe: 'quick',
    };

    const plan: PlanThinkingSessionOutput = planThinkingSession(
      planInput,
      sessionManager,
      techniqueRegistry
    );

    const input: ExecuteThinkingStepInput = {
      planId: plan.planId,
      technique: 'po',
      problem: planInput.problem,
      currentStep: 1,
      totalSteps: 4,
      output: 'Provocation: What if we eliminated everything?',
      nextStepNeeded: true,
      provocation: 'Eliminate everything',
    };

    // Should not throw even if option generation has issues
    const response = await executeThinkingStep(
      input,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;

    // Should still return a valid response
    expect(responseData.sessionId).toBeDefined();
    expect(responseData.technique).toBe('po');
  });
});
