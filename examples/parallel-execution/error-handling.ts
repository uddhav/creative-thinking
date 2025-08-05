/**
 * Error Handling Example
 *
 * This example demonstrates how to handle errors gracefully in
 * parallel execution scenarios.
 */

import { SessionManager } from '../../src/core/SessionManager.js';
import { TechniqueRegistry } from '../../src/techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../src/utils/VisualFormatter.js';
import { MetricsCollector } from '../../src/core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../src/complexity/analyzer.js';
import { ErgodicityManager } from '../../src/ergodicity/index.js';
import { planThinkingSession } from '../../src/layers/planning.js';
import { executeThinkingStep } from '../../src/layers/execution.js';
import { ParallelExecutionContext } from '../../src/layers/execution/ParallelExecutionContext.js';
import type { PlanThinkingSessionInput, ExecuteThinkingStepInput } from '../../src/types/index.js';

async function runErrorHandlingExample() {
  console.log('=== Error Handling Example ===\n');

  // Initialize dependencies
  const sessionManager = new SessionManager();
  const techniqueRegistry = new TechniqueRegistry();
  const visualFormatter = new VisualFormatter();
  const metricsCollector = new MetricsCollector();
  const complexityAnalyzer = new HybridComplexityAnalyzer();
  const ergodicityManager = new ErgodicityManager();

  // Get parallel context for error monitoring
  const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
  const progressCoordinator = parallelContext.getProgressCoordinator();
  const timeoutMonitor = parallelContext.getSessionTimeoutMonitor();

  const problem = 'Develop a crisis management system for natural disasters';
  const techniques = ['six_hats', 'scamper', 'triz', 'po'];

  console.log(`Problem: "${problem}"`);
  console.log(`Techniques: ${techniques.join(', ')}\n`);

  // Create parallel plan
  const planInput: PlanThinkingSessionInput = {
    problem,
    techniques,
    executionMode: 'parallel',
    timeframe: 'quick', // Use quick timeframe to trigger timeouts
  };

  const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);
  const groupId = plan.parallelPlans?.[0]?.groupId || 'error-demo-group';

  console.log('=== Simulating Various Error Scenarios ===\n');

  // Scenario 1: Timeout Error
  console.log('1. Timeout Error Simulation:');
  await simulateTimeoutError(
    plan,
    techniques[0],
    problem,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  // Scenario 2: Invalid Step Error
  console.log('\n2. Invalid Step Error:');
  await simulateInvalidStepError(
    plan,
    techniques[1],
    problem,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  // Scenario 3: Dependency Failure
  console.log('\n3. Dependency Failure:');
  await simulateDependencyFailure(
    plan,
    techniques,
    problem,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  // Scenario 4: Partial Success with Recovery
  console.log('\n4. Partial Success with Recovery:');
  await simulatePartialSuccess(
    plan,
    techniques,
    problem,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager,
    progressCoordinator,
    groupId
  );

  // Show error handling best practices
  console.log('\n=== Error Handling Best Practices ===');
  console.log('1. Always check response.isError before processing results');
  console.log('2. Use try-catch blocks around parallel Promise.all()');
  console.log('3. Implement retry logic for transient failures');
  console.log('4. Monitor timeout thresholds and adjust timeframe if needed');
  console.log('5. Log errors with context for debugging');
  console.log('6. Continue processing other sessions even if one fails');
  console.log('7. Use progress coordinator to track failed sessions');
  console.log('8. Export metrics to analyze failure patterns');
}

async function simulateTimeoutError(
  plan: any,
  technique: string,
  problem: string,
  sessionManager: SessionManager,
  techniqueRegistry: TechniqueRegistry,
  visualFormatter: VisualFormatter,
  metricsCollector: MetricsCollector,
  complexityAnalyzer: HybridComplexityAnalyzer,
  ergodicityManager: ErgodicityManager
): Promise<void> {
  const sessionId = `timeout_session_${Date.now()}`;

  console.log(`  Attempting ${technique} with artificial delay...`);

  // Create a promise that will timeout
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => resolve('timeout'), 35000); // Exceed quick timeout (30s)
  });

  const executionPromise = executeThinkingStep(
    {
      planId: plan.planId,
      sessionId,
      technique,
      problem,
      currentStep: 1,
      totalSteps: 7,
      output: 'Starting execution...',
      nextStepNeeded: true,
    },
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  // Race between execution and timeout
  try {
    const result = await Promise.race([executionPromise, timeoutPromise]);
    if (result === 'timeout') {
      console.log('  ✗ Session would timeout after 30 seconds');
      console.log('  → Solution: Use "thorough" or "comprehensive" timeframe');
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function simulateInvalidStepError(
  plan: any,
  technique: string,
  problem: string,
  sessionManager: SessionManager,
  techniqueRegistry: TechniqueRegistry,
  visualFormatter: VisualFormatter,
  metricsCollector: MetricsCollector,
  complexityAnalyzer: HybridComplexityAnalyzer,
  ergodicityManager: ErgodicityManager
): Promise<void> {
  console.log(`  Attempting ${technique} with invalid step number...`);

  const response = await executeThinkingStep(
    {
      planId: plan.planId,
      technique,
      problem,
      currentStep: 99, // Invalid step number
      totalSteps: 8,
      output: 'Invalid step test',
      nextStepNeeded: false,
    },
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  if (response.isError) {
    console.log('  ✗ Error detected (as expected)');
    const errorData = JSON.parse(response.content[0].text);
    console.log(`  → Error: ${errorData.error}`);
    console.log('  → Solution: Validate step numbers before execution');
  } else {
    console.log('  ✓ Handled gracefully without error');
  }
}

async function simulateDependencyFailure(
  plan: any,
  techniques: string[],
  problem: string,
  sessionManager: SessionManager,
  techniqueRegistry: TechniqueRegistry,
  visualFormatter: VisualFormatter,
  metricsCollector: MetricsCollector,
  complexityAnalyzer: HybridComplexityAnalyzer,
  ergodicityManager: ErgodicityManager
): Promise<void> {
  console.log('  Creating sessions with dependencies...');

  // Create a modified plan where technique 2 depends on technique 1
  const dependentSessionId = `dependent_${Date.now()}`;
  const dependencySessionId = `dependency_${Date.now()}`;

  // First, fail the dependency
  console.log(`  Simulating failure of ${techniques[0]}...`);
  const failureResponse = await executeThinkingStep(
    {
      planId: plan.planId,
      sessionId: dependencySessionId,
      technique: techniques[0],
      problem: 'FORCE_ERROR: ' + problem, // Trigger an error
      currentStep: 1,
      totalSteps: 7,
      output: 'This will fail',
      nextStepNeeded: false,
    },
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  if (failureResponse.isError) {
    console.log(`  ✗ ${techniques[0]} failed (as expected)`);
  }

  // Now try to execute dependent session
  console.log(`  Attempting ${techniques[1]} which depends on failed session...`);
  const dependentResponse = await executeThinkingStep(
    {
      planId: plan.planId,
      sessionId: dependentSessionId,
      technique: techniques[1],
      problem,
      currentStep: 1,
      totalSteps: 8,
      output: 'Attempting dependent execution',
      nextStepNeeded: true,
    },
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  console.log(`  ${dependentResponse.isError ? '✗' : '✓'} Dependent session handled appropriately`);
  console.log('  → Solution: Check dependency status before execution');
}

async function simulatePartialSuccess(
  plan: any,
  techniques: string[],
  problem: string,
  sessionManager: SessionManager,
  techniqueRegistry: TechniqueRegistry,
  visualFormatter: VisualFormatter,
  metricsCollector: MetricsCollector,
  complexityAnalyzer: HybridComplexityAnalyzer,
  ergodicityManager: ErgodicityManager,
  progressCoordinator: any,
  groupId: string
): Promise<void> {
  console.log('  Executing multiple sessions with controlled failures...\n');

  const results = await Promise.allSettled(
    techniques.map(async (technique, index) => {
      // Fail every other technique
      const shouldFail = index % 2 === 1;
      const sessionId = `partial_${technique}_${Date.now()}`;

      try {
        const response = await executeThinkingStep(
          {
            planId: plan.planId,
            sessionId,
            technique,
            problem: shouldFail ? 'FORCE_ERROR: ' + problem : problem,
            currentStep: 1,
            totalSteps: 5,
            output: `Testing ${technique}`,
            nextStepNeeded: false,
          },
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );

        if (response.isError) {
          throw new Error(`${technique} execution failed`);
        }

        return { technique, status: 'success', response };
      } catch (error) {
        return {
          technique,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  // Analyze results
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log('  Results:');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const value = result.value as any;
      console.log(
        `    ${value.status === 'success' ? '✓' : '✗'} ${techniques[index]}: ${value.status}`
      );
    } else {
      console.log(`    ✗ ${techniques[index]}: failed to execute`);
    }
  });

  console.log(`\n  Summary: ${successful}/${techniques.length} succeeded`);
  console.log('  → Key insight: Promise.allSettled() allows partial success');
  console.log("  → Failed sessions don't block successful ones");

  // Check final group progress
  const finalProgress = await progressCoordinator.getGroupProgress(groupId);
  console.log(`  → Group status: ${finalProgress.overallStatus}`);
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runErrorHandlingExample().catch(console.error);
}

export { runErrorHandlingExample };
