/**
 * Insights must describe the technique that produced them.
 *
 * Handlers label insights by position — `this.steps[index]` — so they depend on
 * receiving only their own steps. `ExecutionResponseBuilder` used to pass the
 * whole `session.history`, which in a multi-technique plan prefixed each
 * handler's view with the previous technique's entries. Every label landed on
 * the wrong step, and the entries that overflowed the step list were dropped
 * entirely, taking the final step with them.
 *
 * Ten handlers index positionally, so this was never specific to one technique.
 * The full suite passed with the defect present, which is why this exists.
 */

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
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  LateralTechnique,
} from '../../types/index.js';

describe('Insight alignment across techniques in one session', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  const problem = 'Do we still need the QA task group?';

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = TechniqueRegistry.getInstance();
    visualFormatter = new VisualFormatter(true);
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager();
  });

  async function runSession(
    techniques: LateralTechnique[]
  ): Promise<{ insights: string[]; sessionId: string | undefined }> {
    const planInput: PlanThinkingSessionInput = { problem, techniques, timeframe: 'thorough' };
    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    let sessionId: string | undefined;
    let insights: string[] = [];

    for (const technique of techniques) {
      const totalSteps = techniqueRegistry.getHandler(technique).getTechniqueInfo().totalSteps;

      for (let step = 1; step <= totalSteps; step++) {
        const isFinal = technique === techniques[techniques.length - 1] && step === totalSteps;
        const stepInput: ExecuteThinkingStepInput = {
          planId: plan.planId,
          sessionId,
          technique,
          problem,
          currentStep: step,
          totalSteps,
          // Tag every output with its own technique and step so a misplaced
          // label is legible in the assertion failure.
          output: `${technique}-${step} recorded finding. Second sentence.`,
          nextStepNeeded: !isFinal,
        };

        const response = await executeThinkingStep(
          stepInput,
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );

        const data = JSON.parse(response.content[0].text) as Record<string, unknown>;
        sessionId = data.sessionId as string;
        insights = (data.insights as string[]) ?? [];
      }
    }

    return { insights, sessionId };
  }

  /**
   * Asserts every step of `technique` is reported under its own step name.
   *
   * Order-independent by design. This used to index the accumulated array
   * positionally — `insights[step - 1]` — which only lined up while the
   * preceding technique contributed nothing at all. The moment a handler
   * started reporting its own steps, that indexing read the wrong technique's
   * entries and the check failed for a reason unrelated to alignment. What the
   * fix guarantees is that each step's label is paired with that step's own
   * output, wherever the pair happens to sit in the session's insights.
   */
  function expectAlignedTo(insights: string[], technique: LateralTechnique): void {
    const handler = techniqueRegistry.getHandler(technique);
    const totalSteps = handler.getTechniqueInfo().totalSteps;

    for (let step = 1; step <= totalSteps; step++) {
      const stepName = handler.getStepInfo(step).name;
      const where = `${technique} step ${step} should be reported under "${stepName}"`;

      // Only the pairing of label to output is asserted. How much of the
      // output a handler keeps is its own business — keeper_test reports its
      // final step whole where its siblings truncate to the first sentence.
      const paired = insights.filter(
        i => i.startsWith(`${stepName}:`) && i.includes(`${technique}-${step} `)
      );

      expect(paired, where).toHaveLength(1);
    }
  }

  /**
   * No insight carrying `technique`'s step label may quote another technique's
   * output.
   *
   * Asserting "no earlier technique's tag appears anywhere in insights" was the
   * older, looser form. It held only while the earlier technique contributed no
   * insights at all, so it silently stopped testing anything the moment that
   * handler started reporting its own steps — which is a property of the other
   * handler, not of the alignment this file exists to guard.
   */
  function expectNoForeignOutputUnder(
    insights: string[],
    technique: LateralTechnique,
    foreignTag: string
  ): void {
    const handler = techniqueRegistry.getHandler(technique);
    const totalSteps = handler.getTechniqueInfo().totalSteps;
    const stepNames = Array.from({ length: totalSteps }, (_, i) => handler.getStepInfo(i + 1).name);

    const mislabelled = insights.filter(
      i => stepNames.some(name => i.startsWith(`${name}:`)) && i.includes(foreignTag)
    );

    expect(mislabelled, `${technique} labels must not carry ${foreignTag} output`).toEqual([]);
  }

  it('labels a later technique with its own outputs, not the previous one’s', async () => {
    const { insights } = await runSession(['disney_method', 'keeper_test']);

    // disney_method runs first with 3 steps. Unfiltered history shifted every
    // keeper_test label three places and pushed step 5 off the end.
    expectNoForeignOutputUnder(insights, 'keeper_test', 'disney_method-');
    expectAlignedTo(insights, 'keeper_test');
  });

  it('keeps the final step, which the overflow used to discard', async () => {
    const { insights } = await runSession(['disney_method', 'keeper_test']);

    const finalStepName = techniqueRegistry.getHandler('keeper_test').getStepInfo(5).name;

    expect(
      insights.some(i => i.startsWith(`${finalStepName}:`) && i.includes('keeper_test-5'))
    ).toBe(true);
  });

  it('is unchanged for a single-technique session', async () => {
    // The filter is a no-op when a session only ever runs one technique, so
    // this pins that the fix did not alter the common path.
    const { insights } = await runSession(['keeper_test']);

    expectAlignedTo(insights, 'keeper_test');
  });

  it('holds for a pairing this technique is not involved in', async () => {
    // Ten handlers index positionally; keeper_test is only where it surfaced.
    const { insights } = await runSession(['disney_method', 'cognitive_bias_audit']);

    expectNoForeignOutputUnder(insights, 'cognitive_bias_audit', 'disney_method-');
    expectAlignedTo(insights, 'cognitive_bias_audit');
  });
});
