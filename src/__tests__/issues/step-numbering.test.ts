import { describe, it, expect, beforeEach } from 'vitest';
import { planThinkingSession } from '../../layers/planning.js';
import { executeThinkingStep } from '../../layers/execution.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { PlanThinkingSessionInput, ExecuteThinkingStepInput } from '../../types/index.js';

describe('Step Numbering Issue #115', () => {
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

  it('should show technique-local step numbering in plan (current behavior)', () => {
    const planInput: PlanThinkingSessionInput = {
      problem: 'Improve team communication',
      techniques: ['six_hats', 'temporal_work'],
      timeframe: 'thorough',
    };

    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    // Check the workflow structure
    expect(plan.workflow).toHaveLength(2);

    // Six Hats should have steps 1-7
    const sixHatsWorkflow = plan.workflow[0];
    expect(sixHatsWorkflow.technique).toBe('six_hats');
    expect(sixHatsWorkflow.steps).toHaveLength(7);
    expect(sixHatsWorkflow.steps[0].stepNumber).toBe(1);
    expect(sixHatsWorkflow.steps[6].stepNumber).toBe(7);

    // Temporal Work also has steps 1-5 (not cumulative in plan!)
    const temporalWorkflow = plan.workflow[1];
    expect(temporalWorkflow.technique).toBe('temporal_work');
    expect(temporalWorkflow.steps).toHaveLength(5);
    expect(temporalWorkflow.steps[0].stepNumber).toBe(1); // Already 1-based!
    expect(temporalWorkflow.steps[4].stepNumber).toBe(5);

    // Total steps should be 12 (this is cumulative)
    expect(plan.totalSteps).toBe(12);

    // So the issue is: plan has local numbering, but execution expects cumulative!
    console.error('Plan workflow:', JSON.stringify(plan.workflow, null, 2));
  });

  it('should now handle technique-local step numbers correctly', async () => {
    const planInput: PlanThinkingSessionInput = {
      problem: 'Improve team communication',
      techniques: ['six_hats', 'temporal_work'],
      timeframe: 'thorough',
    };

    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    // The plan shows steps 1-7 for six_hats and 1-5 for temporal_work
    // But users have to use cumulative numbering in execution!

    // Execute last step of six_hats
    const sixHatsStep: ExecuteThinkingStepInput = {
      planId: plan.planId,
      technique: 'six_hats',
      problem: planInput.problem,
      currentStep: 7, // Step 7 is fine for six_hats
      totalSteps: 12, // Total across both techniques
      output: 'Blue hat: Summary of insights',
      nextStepNeeded: true,
      hatColor: 'blue',
    };

    let response = await executeThinkingStep(
      sixHatsStep,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
    const sessionId = responseData.sessionId as string;

    // User sees temporal_work step 1 in the plan, but has to use step 8!
    const temporalStep: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId,
      technique: 'temporal_work',
      problem: planInput.problem,
      currentStep: 8, // User has to calculate: 7 (six_hats) + 1 = 8
      totalSteps: 12,
      output: 'Mapping temporal landscape',
      nextStepNeeded: true,
    };

    response = await executeThinkingStep(
      temporalStep,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    expect(response.isError).toBeUndefined();

    // Check that the response includes technique progress info
    const finalResponseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
    expect(finalResponseData.techniqueProgress).toBeDefined();

    const progress = finalResponseData.techniqueProgress as Record<string, unknown>;
    expect(progress.techniqueStep).toBe(1); // Should show local step 1
    expect(progress.techniqueTotalSteps).toBe(5); // Temporal work has 5 steps
    expect(progress.globalStep).toBe(8); // Global step is still 8
    expect(progress.globalTotalSteps).toBe(12); // Total is 12
    expect(progress.currentTechnique).toBe('temporal_work');
    expect(progress.techniqueIndex).toBe(2); // Second technique (1-indexed)
    expect(progress.totalTechniques).toBe(2);

    console.error('Fixed! Response now includes technique progress:', progress);
  });

  it('should ideally reset step numbers for each technique (desired behavior)', () => {
    // This test documents the desired behavior
    // Each technique should have its own 1-N numbering
    // For a plan with:
    // - problem: 'Improve team communication'
    // - techniques: ['six_hats', 'temporal_work']
    // - timeframe: 'thorough'
    // After fix, we would expect:
    // - Six Hats: steps 1-7 (local to technique)
    // - Temporal Work: steps 1-5 (local to technique)
    // - Some way to track global progress (e.g., technique 1 of 2, or global step counter)
    // This would make the UX much clearer:
    // "You are on Six Hats step 7 of 7"
    // "You are on Temporal Work step 1 of 5"
    // Rather than:
    // "You are on step 8 of 12" (which doesn't tell you which technique or local progress)
  });
});
