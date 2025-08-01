import { describe, it, expect, beforeEach } from 'vitest';
import { discoverTechniques } from '../../layers/discovery.js';
import { planThinkingSession } from '../../layers/planning.js';
import { executeThinkingStep } from '../../layers/execution.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type {
  DiscoverTechniquesInput,
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
} from '../../types/index.js';

describe('Step Numbering Full Workflow', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = new TechniqueRegistry();
    visualFormatter = new VisualFormatter(true); // Disable visual output
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager();
  });

  it('should provide clear progress through multi-technique workflow', async () => {
    // Step 1: Discovery
    const discoveryInput: DiscoverTechniquesInput = {
      problem: 'Design a new employee onboarding process',
      context: 'Remote-first company with team members across time zones',
      preferredOutcome: 'systematic',
    };

    const discovery = discoverTechniques(discoveryInput, techniqueRegistry, complexityAnalyzer);
    console.error(
      'Recommended techniques:',
      discovery.recommendations.map(r => r.technique)
    );
    // For this test, we'll use whatever techniques are recommended
    const recommendedTechniques = discovery.recommendations.slice(0, 2).map(r => r.technique);
    expect(recommendedTechniques.length).toBeGreaterThanOrEqual(2);

    // Step 2: Planning
    const planInput: PlanThinkingSessionInput = {
      problem: discoveryInput.problem,
      techniques: recommendedTechniques,
      objectives: ['Create engaging onboarding', 'Consider time zone challenges'],
      timeframe: 'thorough',
    };

    const plan = planThinkingSession(planInput, sessionManager, techniqueRegistry);

    // Verify plan structure
    expect(plan.workflow).toHaveLength(2);
    const technique1 = plan.workflow[0].technique;
    const technique2 = plan.workflow[1].technique;
    const technique1Steps = plan.workflow[0].steps.length;
    const technique2Steps = plan.workflow[1].steps.length;
    expect(plan.totalSteps).toBe(technique1Steps + technique2Steps);

    // Step 3: Execute first technique

    // Execute first technique's first step
    const step1: ExecuteThinkingStepInput = {
      planId: plan.planId,
      technique: technique1,
      problem: plan.problem,
      currentStep: 1, // Global step 1
      totalSteps: plan.totalSteps,
      output: 'Starting with first technique',
      nextStepNeeded: true,
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

    let responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
    const sessionId = responseData.sessionId as string;

    // Check progress info
    let progress = responseData.techniqueProgress as Record<string, unknown>;
    expect(progress.techniqueStep).toBe(1); // Local step 1 of first technique
    expect(progress.techniqueTotalSteps).toBe(technique1Steps);
    expect(progress.currentTechnique).toBe(technique1);
    expect(progress.techniqueIndex).toBe(1); // First technique

    // Skip to last step of first technique
    const lastStep1: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId,
      technique: technique1,
      problem: plan.problem,
      currentStep: technique1Steps, // Last step of first technique
      totalSteps: plan.totalSteps,
      output: 'Completing first technique',
      nextStepNeeded: true,
    };

    response = await executeThinkingStep(
      lastStep1,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
    progress = responseData.techniqueProgress as Record<string, unknown>;
    expect(progress.techniqueStep).toBe(technique1Steps); // Local last step of first technique
    expect(progress.techniqueTotalSteps).toBe(technique1Steps);

    // Step 4: Transition to second technique
    const step2_1: ExecuteThinkingStepInput = {
      planId: plan.planId,
      sessionId,
      technique: technique2,
      problem: plan.problem,
      currentStep: technique1Steps + 1, // First step after first technique
      totalSteps: plan.totalSteps,
      output: 'Starting second technique',
      nextStepNeeded: true,
    };

    response = await executeThinkingStep(
      step2_1,
      sessionManager,
      techniqueRegistry,
      visualFormatter,
      metricsCollector,
      complexityAnalyzer,
      ergodicityManager
    );

    responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
    progress = responseData.techniqueProgress as Record<string, unknown>;

    // Verify second technique shows correct local progress
    expect(progress.techniqueStep).toBe(1); // Local step 1 of second technique!
    expect(progress.techniqueTotalSteps).toBe(technique2Steps);
    expect(progress.globalStep).toBe(technique1Steps + 1); // Global step
    expect(progress.globalTotalSteps).toBe(plan.totalSteps);
    expect(progress.currentTechnique).toBe(technique2);
    expect(progress.techniqueIndex).toBe(2); // Second technique
    expect(progress.totalTechniques).toBe(2);

    console.error('Success! Multi-technique workflow shows clear progress:');
    console.error(`- ${technique1}: steps 1-${technique1Steps} (global 1-${technique1Steps})`);
    console.error(
      `- ${technique2}: steps 1-${technique2Steps} (global ${technique1Steps + 1}-${plan.totalSteps})`
    );
    console.error('- Response includes both local and global progress');
  });
});
