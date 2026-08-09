/**
 * A plan naming a technique this build does not register must not fail the step
 * before it.
 *
 * `ExecutionResponseBuilder` builds a transition hint at the last step of each
 * technique, and that hint has a fallback for a missing handler — written as a
 * ternary, which reads as though the lookup returns undefined on a miss.
 * `TechniqueRegistry.getHandler` throws. The fallback was therefore unreachable,
 * and the throw surfaced as an "Invalid technique" error attributed to the
 * *previous* technique's final step, which had already succeeded.
 *
 * This is reachable, not theoretical: `hydratePlan` in the CLI plan store reads
 * a plan off disk with a raw `JSON.parse` and no membership check, so a plan
 * saved before a technique was retired still names it.
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

describe('A plan naming an unregistered technique', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  const problem = 'Do we still need the QA task group?';
  const RETIRED = 'retired_technique' as LateralTechnique;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = TechniqueRegistry.getInstance();
    visualFormatter = new VisualFormatter(true);
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager();
  });

  it('does not exist in the registry, which is what makes this test meaningful', () => {
    expect(techniqueRegistry.isValidTechnique(RETIRED)).toBe(false);
    expect(() => techniqueRegistry.getHandler(RETIRED)).toThrow();
  });

  it('still completes the step before it, and degrades the hint', async () => {
    // disney_method runs first and is real; the plan then names a technique the
    // registry does not hold, exactly as a plan hydrated from disk would after
    // that technique was retired.
    const planInput: PlanThinkingSessionInput = {
      problem,
      techniques: ['disney_method'],
      timeframe: 'thorough',
    };
    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    // Append the retired technique to the plan exactly as a plan hydrated from
    // disk would carry it: present in `techniques` and in `workflow`, with no
    // handler behind it. planThinkingSession cannot produce this, which is the
    // point — only a plan written by an older build can.
    const disneyStage = plan.workflow[0];
    plan.techniques = ['disney_method', RETIRED];
    plan.workflow = [disneyStage, { ...disneyStage, technique: RETIRED }];
    plan.totalSteps = disneyStage.steps.length * 2;
    sessionManager.savePlan(plan.planId, plan);

    let sessionId: string | undefined;
    let lastText = '';

    // Run disney_method to its final step, which is where the transition hint
    // for the next technique is built. totalSteps is the plan total, so the
    // guidance path does not short-circuit on "no next step".
    for (let step = 1; step <= disneyStage.steps.length; step++) {
      const stepInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique: 'disney_method',
        problem,
        currentStep: step,
        totalSteps: plan.totalSteps,
        output: `disney_method-${step} recorded finding.`,
        nextStepNeeded: true,
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

      lastText = response.content[0].text;
      const data = JSON.parse(lastText) as Record<string, unknown>;
      sessionId = data.sessionId as string;
    }

    const final = JSON.parse(lastText) as Record<string, unknown>;

    // The step that succeeded must be reported as having succeeded.
    expect(final.error, 'the previous technique’s final step must not fail').toBeUndefined();
    expect(lastText).not.toContain('Invalid technique');
    expect(final.historyLength).toBe(3);

    // And the hint degrades to naming the technique rather than guiding into it.
    const guidance = final.nextStepGuidance;
    expect(typeof guidance).toBe('string');
    expect(guidance as string).toContain(RETIRED);
  });
});
