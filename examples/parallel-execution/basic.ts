/**
 * Basic Parallel Execution Example
 *
 * This example demonstrates how to use parallel execution to run multiple
 * thinking techniques simultaneously for faster problem-solving.
 */

import { SessionManager } from '../../src/core/SessionManager.js';
import { TechniqueRegistry } from '../../src/techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../src/utils/VisualFormatter.js';
import { MetricsCollector } from '../../src/core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../src/complexity/analyzer.js';
import { ErgodicityManager } from '../../src/ergodicity/index.js';
import { planThinkingSession } from '../../src/layers/planning.js';
import { executeThinkingStep } from '../../src/layers/execution.js';
import type { PlanThinkingSessionInput, ExecuteThinkingStepInput } from '../../src/types/index.js';

async function runBasicParallelExample() {
  console.log('=== Basic Parallel Execution Example ===\n');

  // Initialize dependencies
  const sessionManager = new SessionManager();
  const techniqueRegistry = new TechniqueRegistry();
  const visualFormatter = new VisualFormatter();
  const metricsCollector = new MetricsCollector();
  const complexityAnalyzer = new HybridComplexityAnalyzer();
  const ergodicityManager = new ErgodicityManager();

  // Define the problem and techniques
  const problem = 'How can we make our city more environmentally sustainable?';
  const techniques = ['six_hats', 'scamper', 'po'];

  console.log(`Problem: "${problem}"`);
  console.log(`Techniques: ${techniques.join(', ')}\n`);

  // Step 1: Create a parallel execution plan
  const planInput: PlanThinkingSessionInput = {
    problem,
    techniques,
    executionMode: 'parallel', // Enable parallel execution
    timeframe: 'thorough',
  };

  const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);
  console.log(`Created parallel plan: ${plan.planId}`);
  console.log(`Parallel groups: ${plan.parallelPlans?.length || 0}\n`);

  // Step 2: Execute techniques in parallel
  console.log('Starting parallel execution...\n');

  // Create execution promises for each technique
  const executionPromises = techniques.map(async technique => {
    const handler = techniqueRegistry.getHandler(technique);
    const totalSteps = handler.getTechniqueInfo().totalSteps;
    const results = [];

    // Execute all steps for this technique
    for (let step = 1; step <= totalSteps; step++) {
      const input: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique,
        problem,
        currentStep: step,
        totalSteps,
        output: `${technique} - Step ${step}: Analyzing the problem`,
        nextStepNeeded: step < totalSteps,
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

      if (!response.isError) {
        results.push(response);
      }
    }

    return { technique, results };
  });

  // Wait for all techniques to complete
  const startTime = Date.now();
  const allResults = await Promise.all(executionPromises);
  const executionTime = Date.now() - startTime;

  console.log(`\nParallel execution completed in ${executionTime}ms`);

  // Step 3: Display results
  console.log('\n=== Results ===');
  allResults.forEach(({ technique, results }) => {
    console.log(`\n${technique} (${results.length} steps completed)`);

    // Extract insights from the last step
    const lastStep = results[results.length - 1];
    if (lastStep) {
      try {
        const data = JSON.parse(lastStep.content[0].text);
        if (data.insights && data.insights.length > 0) {
          console.log('Insights:');
          data.insights.forEach((insight: string, i: number) => {
            console.log(`  ${i + 1}. ${insight}`);
          });
        }
      } catch (e) {
        // Handle parsing errors gracefully
      }
    }
  });

  // Step 4: Show performance comparison
  const sequentialEstimate = techniques.reduce((sum, technique) => {
    const handler = techniqueRegistry.getHandler(technique);
    return sum + handler.getTechniqueInfo().totalSteps * 100; // Assume 100ms per step
  }, 0);

  console.log('\n=== Performance Summary ===');
  console.log(`Parallel execution time: ${executionTime}ms`);
  console.log(`Estimated sequential time: ${sequentialEstimate}ms`);
  console.log(`Speedup: ${(sequentialEstimate / executionTime).toFixed(2)}x`);
  console.log(`Time saved: ${sequentialEstimate - executionTime}ms`);
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicParallelExample().catch(console.error);
}

export { runBasicParallelExample };
