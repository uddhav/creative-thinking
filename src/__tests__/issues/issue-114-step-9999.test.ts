/**
 * Test for Issue #114: Invalid step 9999 error when last step has nextStepNeeded=true
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
import type { PlanThinkingSessionInput, ExecuteThinkingStepInput } from '../../types/index.js';

describe('Issue #114: Step 9999 bug', () => {
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

  it('should handle last step with nextStepNeeded=true without 9999 error', async () => {
    // Create a plan with Six Hats
    const planInput: PlanThinkingSessionInput = {
      problem: 'Improve team dynamics',
      techniques: ['six_hats'],
      timeframe: 'thorough',
    };

    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    // Execute steps 1-6
    let sessionId: string | undefined;
    for (let i = 1; i <= 6; i++) {
      const stepInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique: 'six_hats',
        problem: planInput.problem,
        currentStep: i,
        totalSteps: 7,
        output: `Hat ${i} thinking`,
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

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      sessionId = responseData.sessionId as string;
    }

    // Now execute step 7 (Purple Hat) with nextStepNeeded=true
    // This used to cause "Invalid step 9999" error
    const lastStepInput: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId,
      technique: 'six_hats',
      problem: planInput.problem,
      currentStep: 7,
      totalSteps: 7,
      output: 'Purple hat: Path dependency analysis',
      nextStepNeeded: true, // This used to trigger step 9999 error
      hatColor: 'purple',
    };

    const response = await executeThinkingStep(
      lastStepInput,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    // Should not throw an error (this was the bug - it used to throw "Invalid step 9999")
    expect(response.isError).toBeUndefined();

    const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;

    // Should NOT complete the session because nextStepNeeded is still true
    expect(responseData.sessionComplete).toBeUndefined();
    expect(responseData.completed).toBeUndefined();

    // Should provide completion guidance since we're past the last step
    expect(responseData.nextStepGuidance).toBeDefined();
    expect(responseData.nextStepGuidance).toContain('Complete');
    expect(responseData.nextStepGuidance).toContain('Six Thinking Hats');

    // Should not have any step 9999 references (the actual bug that was fixed)
    const responseText = JSON.stringify(responseData);
    expect(responseText).not.toContain('9999');
  });

  it('should handle Nine Windows last step with nextStepNeeded=true', async () => {
    // Nine Windows has 9 steps, also affected by this bug
    const planInput: PlanThinkingSessionInput = {
      problem: 'Analyze system architecture',
      techniques: ['nine_windows'],
      timeframe: 'thorough',
    };

    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    // Execute steps 1-8
    let sessionId: string | undefined;
    for (let i = 1; i <= 8; i++) {
      const stepInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique: 'nine_windows',
        problem: planInput.problem,
        currentStep: i,
        totalSteps: 9,
        output: `Window ${i} analysis`,
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

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      sessionId = responseData.sessionId as string;
    }

    // Execute step 9 with nextStepNeeded=true
    const lastStepInput: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId,
      technique: 'nine_windows',
      problem: planInput.problem,
      currentStep: 9,
      totalSteps: 9,
      output: 'Future super-system analysis',
      nextStepNeeded: true,
    };

    const response = await executeThinkingStep(
      lastStepInput,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    // Should not throw an error
    expect(response.isError).toBeUndefined();

    const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;

    // Should NOT complete (nextStepNeeded is true)
    expect(responseData.sessionComplete).toBeUndefined();

    // Should provide completion guidance
    expect(responseData.nextStepGuidance).toBeDefined();
    expect(responseData.nextStepGuidance).toContain('Complete');
    expect(responseData.nextStepGuidance).toContain('Nine Windows');

    // No 9999 references
    expect(JSON.stringify(responseData)).not.toContain('9999');
  });

  it('should handle multi-technique workflow transitions at last step', async () => {
    // Test transition between techniques when last step has nextStepNeeded=true
    const planInput: PlanThinkingSessionInput = {
      problem: 'Complex problem requiring multiple perspectives',
      techniques: ['six_hats', 'scamper'],
      timeframe: 'thorough',
    };

    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    // Execute Six Hats steps 1-6
    let sessionId: string | undefined;
    for (let i = 1; i <= 6; i++) {
      const stepInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique: 'six_hats',
        problem: planInput.problem,
        currentStep: i,
        totalSteps: plan.totalSteps,
        output: `Hat ${i} analysis`,
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

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      sessionId = responseData.sessionId as string;
    }

    // Execute Six Hats step 7 with nextStepNeeded=true (should transition to SCAMPER)
    const transitionStepInput: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId,
      technique: 'six_hats',
      problem: planInput.problem,
      currentStep: 7,
      totalSteps: plan.totalSteps,
      output: 'Purple hat: Final analysis',
      nextStepNeeded: true,
      hatColor: 'purple',
    };

    const response = await executeThinkingStep(
      transitionStepInput,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    expect(response.isError).toBeUndefined();

    const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;

    // Should not complete yet (multi-technique workflow)
    expect(responseData.sessionComplete).toBeFalsy();

    // Should provide guidance for next technique
    expect(responseData.nextStepGuidance).toBeDefined();
    // The guidance should mention transitioning to the next technique
    expect(responseData.nextStepGuidance).toMatch(/Transitioning to|scamper/i);

    // No 9999 references (the bug that was fixed)
    expect(JSON.stringify(responseData)).not.toContain('9999');
  });
});
