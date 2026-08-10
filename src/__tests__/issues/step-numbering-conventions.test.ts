/**
 * A step can be numbered two ways, and both have to arrive at the same step.
 *
 * `execute_thinking_step` accepts either numbering: within the technique
 * (`currentStep` 1..n with `totalSteps` = that technique's own count) or across
 * the whole plan (`currentStep` 1..N with `totalSteps` = the plan's). The
 * existing suite exercised the first; the CLI and the skill use the second.
 *
 * For any technique after the first the two ranges OVERLAP — with a 4-step
 * block ahead of a 7-step one, local steps 4..7 are also global steps 4..7 —
 * and the resolution guessed from `currentStep` alone, which meant it always
 * chose the global reading. Under plan-wide numbering the handlers then
 * indexed their own step tables with a global number and reported nothing at
 * all for thirty-one of thirty-two techniques; under per-technique numbering
 * the overlapping steps folded back onto earlier ones.
 *
 * `totalSteps` is what distinguishes them, and it was not being read.
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

const PROBLEM = 'Shorten the time it takes a new engineer to ship';

/**
 * Runs a two-technique plan under one numbering convention and returns the
 * insights the completed session reported.
 */
async function runPlan(
  techniques: LateralTechnique[],
  numbering: 'per-technique' | 'plan-wide'
): Promise<string[]> {
  const sessionManager = new SessionManager();
  const registry = TechniqueRegistry.getInstance();
  const plan = planThinkingSession(
    { problem: PROBLEM, techniques, timeframe: 'thorough' } as PlanThinkingSessionInput,
    sessionManager,
    registry
  );

  // Block lengths come from the plan, not the handler: the plan is what lays
  // the blocks out, and a timeframe can change how many steps it gives each.
  const blocks = plan.workflow.map(block => ({
    technique: block.technique,
    steps: block.steps.length,
  }));
  const planSteps = blocks.reduce((sum, b) => sum + b.steps, 0);

  let sessionId: string | undefined;
  let insights: string[] = [];
  let globalStep = 0;

  for (const block of blocks) {
    for (let local = 1; local <= block.steps; local++) {
      globalStep += 1;
      const isFinal = globalStep === planSteps;
      const response = await executeThinkingStep(
        {
          planId: plan.planId,
          sessionId,
          technique: block.technique,
          problem: PROBLEM,
          currentStep: numbering === 'per-technique' ? local : globalStep,
          totalSteps: numbering === 'per-technique' ? block.steps : planSteps,
          output: `${block.technique} step ${local} recorded a finding. Second sentence.`,
          nextStepNeeded: !isFinal,
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
      insights = (data.insights as string[]) ?? insights;
    }
  }

  return insights;
}

describe('both step-numbering conventions reach the same step', () => {
  // six_hats is the legible case: its labels name the hat, so a step resolved
  // to the wrong number is visible rather than merely absent.
  const HATS = ['Blue Hat', 'White Hat', 'Red Hat', 'Yellow Hat', 'Black Hat', 'Green Hat'];

  it('reports every hat when six_hats runs second and steps are numbered plan-wide', async () => {
    const insights = await runPlan(['triz', 'six_hats'], 'plan-wide');

    // This is what the skill and the CLI send, and it reported nothing at all.
    for (const hat of [...HATS, 'Purple Hat']) {
      expect(
        insights.some(i => i.startsWith(`${hat}:`)),
        `${hat} missing`
      ).toBe(true);
    }
  });

  it('reports every hat when six_hats runs second and steps are numbered per technique', async () => {
    const insights = await runPlan(['triz', 'six_hats'], 'per-technique');

    for (const hat of [...HATS, 'Purple Hat']) {
      expect(
        insights.some(i => i.startsWith(`${hat}:`)),
        `${hat} missing`
      ).toBe(true);
    }
  });

  it('pairs each hat with the output of its own step, under both conventions', async () => {
    for (const numbering of ['plan-wide', 'per-technique'] as const) {
      const insights = await runPlan(['triz', 'six_hats'], numbering);

      // hatOrder is blue, white, red, yellow, black, green, purple — so the
      // Nth hat must carry the text of six_hats' own step N.
      [...HATS, 'Purple Hat'].forEach((hat, index) => {
        const line = insights.find(i => i.startsWith(`${hat}:`));
        expect(line, `${hat} missing under ${numbering}`).toBeDefined();
        expect(line, `${hat} carries another step's output under ${numbering}`).toContain(
          `six_hats step ${index + 1} `
        );
      });
    }
  });

  it('does not lose the trailing steps of a longer second technique', async () => {
    // nine_windows has nine steps behind triz's four, so under plan-wide
    // numbering its steps run 5..13 — every one of them outside its own table.
    const insights = await runPlan(['triz', 'nine_windows'], 'plan-wide');

    for (let step = 1; step <= 9; step++) {
      expect(
        insights.some(i => i.includes(`nine_windows step ${step} `)),
        `nine_windows step ${step} missing`
      ).toBe(true);
    }
  });
});
