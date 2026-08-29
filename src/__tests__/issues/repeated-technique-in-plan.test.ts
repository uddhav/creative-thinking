/**
 * A plan may name the same technique twice, and both blocks must be executable.
 *
 * `planThinkingSession` accepts a repeated technique and lays out a separate
 * block for each, so a 16-step plan for ['triz','scamper','triz'] is a thing the
 * planner will hand you. Executing it used to fail from the second block onward:
 * `calculateTechniqueLocalStep` assigned `techniqueIndex` on every match, ending
 * on the last occurrence, while `stepsBeforeThisTechnique` stopped accumulating
 * at the first. The two halves described different blocks, so the step fell in
 * neither range and was rejected.
 *
 * The error message compounded it, deriving the global range by multiplying the
 * block index by this technique's own step count — which assumes every technique
 * in the plan is the same length. It reported the second triz block as 9-12 when
 * it is really 13-16.
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
import type { ExecuteThinkingStepInput, LateralTechnique } from '../../types/index.js';

describe('A plan that names the same technique twice', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  const problem = 'Do we still need the QA task group?';
  // Deliberately mixed lengths: triz has 4 steps and scamper 8, so a global
  // range derived from index x stepCount cannot be right for the second block.
  const techniques: LateralTechnique[] = ['triz', 'scamper', 'triz'];

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = TechniqueRegistry.getInstance();
    visualFormatter = new VisualFormatter(true);
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager();
  });

  /**
   * Which technique owns a given global step, read off the plan rather than
   * assumed. planThinkingSession may order the blocks differently from the
   * requested order, so hardcoding the layout tests the planner's ordering
   * instead of the thing this file is about.
   */
  function techniqueForGlobalStep(
    workflow: Array<{ technique: LateralTechnique; steps: unknown[] }>,
    step: number
  ): LateralTechnique {
    let seen = 0;
    for (const block of workflow) {
      seen += block.steps.length;
      if (step <= seen) return block.technique;
    }
    return workflow[workflow.length - 1].technique;
  }

  it('lays out one block per occurrence', () => {
    const plan = planThinkingSession(
      { problem, techniques, timeframe: 'thorough' },
      sessionManager,
      techniqueRegistry
    );

    // Order is the planner's business; what matters here is that the repeated
    // technique gets a block each rather than being collapsed into one.
    expect([...plan.workflow.map(w => w.technique)].sort()).toEqual([...techniques].sort());
    expect(plan.workflow).toHaveLength(3);
    expect(plan.workflow.filter(w => w.technique === 'triz')).toHaveLength(2);
    expect(plan.totalSteps).toBe(16);
  });

  it('executes every global step, including the second block', async () => {
    const plan = planThinkingSession(
      { problem, techniques, timeframe: 'thorough' },
      sessionManager,
      techniqueRegistry
    );

    let sessionId: string | undefined;
    const rejected: string[] = [];

    for (let step = 1; step <= plan.totalSteps; step++) {
      const stepInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique: techniqueForGlobalStep(plan.workflow, step),
        problem,
        currentStep: step,
        totalSteps: plan.totalSteps,
        output: `Global step ${step} recorded a finding.`,
        nextStepNeeded: step < plan.totalSteps,
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
      sessionId = (data.sessionId as string) ?? sessionId;

      const error = data.error as { code?: string; message?: string } | undefined;
      if (error) {
        rejected.push(`step ${step}: ${error.code} ${error.message ?? ''}`.trim());
      }
    }

    // The final block — the repeated technique's second occurrence — is what used to fail.
    expect(rejected, 'no step of a repeated-technique plan may be rejected').toEqual([]);
  });
});
