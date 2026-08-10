import { describe, it, expect, beforeEach } from 'vitest';
import { executeThinkingStep } from '../../layers/execution.js';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { ExecuteThinkingStepInput, PlanThinkingSessionInput } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

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

  it('should trigger option generation when flexibility drops below 0.4', async () => {
    // Create a plan with many constraints to trigger low flexibility
    const planInput: PlanThinkingSessionInput = {
      problem: 'Restructure company with strict budget constraints',
      techniques: ['scamper'],
      constraints: [
        'Cannot increase budget',
        'Must maintain all core services',
        'Cannot reduce headcount',
        'Must complete in 3 months',
        'Cannot outsource',
      ],
      timeframe: 'quick',
    };

    const plan: PlanThinkingSessionOutput = planThinkingSession(
      planInput,
      sessionManager,
      techniqueRegistry
    );

    // Verify plan indicates low flexibility
    expect(plan.flexibilityAssessment).toBeDefined();
    expect(plan.flexibilityAssessment?.score).toBeLessThan(0.4);
    expect(plan.flexibilityAssessment?.optionGenerationRecommended).toBe(true);

    // First, execute a few steps to build up constraints and reduce flexibility

    // Step 1: Substitute with high commitment
    const step1: ExecuteThinkingStepInput = {
      planId: plan.planId,
      technique: 'scamper',
      problem: planInput.problem,
      currentStep: 1,
      totalSteps: 8,
      output: 'Substitute all contractors with permanent employees only',
      nextStepNeeded: true,
      scamperAction: 'substitute',
    };

    let response = await executeThinkingStep(
      step1,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );
    const parsedResponse = JSON.parse(response.content[0].text) as { sessionId: string };
    const sessionIdFromResponse = parsedResponse.sessionId;

    // Step 2: Combine with more constraints
    const step2: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId: sessionIdFromResponse,
      technique: 'scamper',
      problem: planInput.problem,
      currentStep: 2,
      totalSteps: 8,
      output: 'Combine all departments into one mega-department',
      nextStepNeeded: true,
      scamperAction: 'combine',
    };

    await executeThinkingStep(
      step2,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    // Steps 3 to 6: keep committing, and let the engine measure the cost.
    //
    // This used to hand the server `flexibilityRetention: 0.3` on step 6 and
    // assert that option generation fired — which tested only that the server
    // believed the number it was told. Flexibility is measured now, so the way
    // to reach the gate is to spend it.
    const committal: Array<[number, string, string]> = [
      [3, 'adapt', 'Adapt the remaining teams permanently to the new structure'],
      [4, 'modify', 'Modify reporting lines and commit to them for the year'],
      [5, 'put_to_other_use', 'Invest the freed budget permanently in tooling'],
      [6, 'eliminate', 'Eliminate redundant processes and delete the legacy systems'],
    ];

    let responseData: Record<string, unknown> = {};
    for (const [currentStep, scamperAction, output] of committal) {
      response = await executeThinkingStep(
        {
          planId: plan.planId,
          sessionId: sessionIdFromResponse,
          technique: 'scamper',
          problem: planInput.problem,
          currentStep,
          totalSteps: 8,
          output,
          nextStepNeeded: true,
          scamperAction,
        } as ExecuteThinkingStepInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );
      responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      if (responseData.optionGeneration !== undefined) break;
    }

    // Verify option generation was triggered by the measurement, not by input
    const optionGeneration = responseData.optionGeneration as Record<string, unknown> | undefined;
    expect(optionGeneration, 'a run of irreversible commitments must reach the gate').toBeDefined();
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
    // Note: Non-SCAMPER techniques don't calculate flexibilityScore themselves
    // We need to simulate low flexibility by creating a session with path history
    // that has already reduced flexibility significantly

    const planInput: PlanThinkingSessionInput = {
      problem: 'Launch new product with extreme constraints',
      techniques: ['disney_method'],
      constraints: [
        'Zero marketing budget',
        'Must use existing team only',
        'Cannot modify existing products',
        'Must launch within 1 month',
        'Cannot use external resources',
        'Must be profitable immediately',
      ],
      timeframe: 'quick',
    };

    const plan: PlanThinkingSessionOutput = planThinkingSession(
      planInput,
      sessionManager,
      techniqueRegistry
    );

    // First, let's execute several steps to simulate path dependency buildup
    let sessionId: string | undefined;

    // Execute multiple high-commitment steps to reduce flexibility
    for (let i = 0; i < 10; i++) {
      const stepInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique: 'disney_method',
        problem: planInput.problem,
        currentStep: 1,
        totalSteps: 3,
        output: `High commitment decision ${i}: Permanently eliminate option ${i}, irreversible change, no backup plan`,
        nextStepNeeded: true,
        disneyRole: 'dreamer',
        dreamerVision: [`Permanent elimination ${i}`, `Irreversible commitment ${i}`],
        // Add high-risk elements that trigger ergodicity tracking
        risks: ['Complete failure possible', 'No recovery path'],
        failureModes: ['Total system collapse', 'Permanent damage'],
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

      if (!sessionId) {
        const parsedResp = JSON.parse(response.content[0].text) as { sessionId: string };
        sessionId = parsedResp.sessionId;
      }
    }

    // Now execute a step that should trigger option generation
    const input: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId,
      technique: 'disney_method',
      problem: planInput.problem,
      currentStep: 2,
      totalSteps: 3,
      output: 'Realist: We are completely locked in with no flexibility left',
      nextStepNeeded: true,
      disneyRole: 'realist',
      realistPlan: ['No alternatives available', 'All bridges burned', 'Zero flexibility'],
      // Manually indicate low flexibility if needed
      flexibilityScore: 0.3,
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

    // Debug output
    console.error('Disney method response keys:', Object.keys(responseData));
    console.error('Flexibility score:', responseData.flexibilityScore);
    console.error('Execution metadata:', responseData.executionMetadata);
    console.error('Option generation:', responseData.optionGeneration);

    // Verify option generation was triggered for non-SCAMPER technique
    expect(responseData.optionGeneration).toBeDefined();
    expect(responseData.optionGeneration.triggered).toBe(true);
    expect(responseData.optionGeneration.flexibility).toBeLessThan(0.4);
    expect(responseData.optionGeneration.optionsGenerated).toBeGreaterThan(0);
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
