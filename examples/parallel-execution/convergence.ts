/**
 * Advanced Convergence Strategies Example
 *
 * This example demonstrates how to use different convergence strategies
 * to synthesize results from parallel thinking sessions.
 */

import { SessionManager } from '../../src/core/SessionManager.js';
import { TechniqueRegistry } from '../../src/techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../src/utils/VisualFormatter.js';
import { MetricsCollector } from '../../src/core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../src/complexity/analyzer.js';
import { ErgodicityManager } from '../../src/ergodicity/index.js';
import { planThinkingSession } from '../../src/layers/planning.js';
import { executeThinkingStep } from '../../src/layers/execution.js';
import type {
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  ParallelResultForConvergence,
} from '../../src/types/index.js';

async function runConvergenceExample() {
  console.log('=== Advanced Convergence Strategies Example ===\n');

  // Initialize dependencies
  const sessionManager = new SessionManager();
  const techniqueRegistry = new TechniqueRegistry();
  const visualFormatter = new VisualFormatter();
  const metricsCollector = new MetricsCollector();
  const complexityAnalyzer = new HybridComplexityAnalyzer();
  const ergodicityManager = new ErgodicityManager();

  const problem = 'Design an innovative educational platform for remote learning';
  const techniques = ['six_hats', 'design_thinking', 'scamper', 'triz'];

  // Step 1: Create parallel plan with convergence
  const planInput: PlanThinkingSessionInput = {
    problem,
    techniques,
    executionMode: 'parallel',
    convergenceOptions: {
      method: 'execute_thinking_step',
    },
    timeframe: 'thorough',
  };

  const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);
  console.log(`Created plan with convergence: ${plan.planId}\n`);

  // Step 2: Execute techniques in parallel and collect results
  console.log('Executing techniques in parallel...\n');

  const parallelResults: ParallelResultForConvergence[] = await Promise.all(
    techniques.map(async technique => {
      const handler = techniqueRegistry.getHandler(technique);
      const totalSteps = handler.getTechniqueInfo().totalSteps;
      const sessionId = `session_${technique}_${Date.now()}`;
      const insights: string[] = [];
      let executionTime = 0;

      // Execute all steps
      const startTime = Date.now();
      for (let step = 1; step <= totalSteps; step++) {
        const input: ExecuteThinkingStepInput = {
          planId: plan.planId,
          sessionId,
          technique,
          problem,
          currentStep: step,
          totalSteps,
          output: `Exploring ${technique} perspective on the problem`,
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
          try {
            const data = JSON.parse(response.content[0].text);
            if (data.insights) {
              insights.push(...data.insights);
            }
          } catch (e) {
            // Handle parsing errors
          }
        }
      }
      executionTime = Date.now() - startTime;

      console.log(`✓ ${technique} completed (${totalSteps} steps, ${insights.length} insights)`);

      // Return result in convergence format
      return {
        sessionId,
        planId: plan.planId,
        technique,
        problem,
        insights,
        results: {
          output: `${technique} analysis complete`,
          duration: executionTime,
        },
        metrics: {
          executionTime,
          completedSteps: totalSteps,
          totalSteps,
          confidence: 0.8 + Math.random() * 0.2, // Simulated confidence
        },
        status: 'completed' as const,
      };
    })
  );

  // Step 3: Demonstrate different convergence strategies
  console.log('\n=== Testing Convergence Strategies ===\n');

  // Strategy 1: Merge - Combine all insights
  console.log('1. MERGE Strategy - Combining all insights:');
  await demonstrateConvergence(
    'merge',
    parallelResults,
    plan.planId,
    problem,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  // Strategy 2: Select - Choose best insights
  console.log('\n2. SELECT Strategy - Choosing best insights:');
  await demonstrateConvergence(
    'select',
    parallelResults,
    plan.planId,
    problem,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  // Strategy 3: Hierarchical - Organize by importance
  console.log('\n3. HIERARCHICAL Strategy - Organizing by importance:');
  await demonstrateConvergence(
    'hierarchical',
    parallelResults,
    plan.planId,
    problem,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  // Step 4: Show metrics
  console.log('\n=== Convergence Metrics ===');
  const totalInsights = parallelResults.reduce((sum, r) => sum + r.insights.length, 0);
  const avgConfidence =
    parallelResults.reduce((sum, r) => sum + r.metrics.confidence, 0) / parallelResults.length;
  const totalTime = parallelResults.reduce((sum, r) => sum + r.metrics.executionTime, 0);

  console.log(`Total insights generated: ${totalInsights}`);
  console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`Total execution time: ${totalTime}ms`);
  console.log(`Average time per technique: ${(totalTime / techniques.length).toFixed(0)}ms`);
}

async function demonstrateConvergence(
  strategy: 'merge' | 'select' | 'hierarchical',
  parallelResults: ParallelResultForConvergence[],
  planId: string,
  problem: string,
  sessionManager: SessionManager,
  techniqueRegistry: TechniqueRegistry,
  visualFormatter: VisualFormatter,
  metricsCollector: MetricsCollector,
  complexityAnalyzer: HybridComplexityAnalyzer,
  ergodicityManager: ErgodicityManager
): Promise<void> {
  const convergenceInput: ExecuteThinkingStepInput = {
    planId,
    technique: 'convergence',
    problem,
    currentStep: 1,
    totalSteps: 1,
    output: `Applying ${strategy} convergence strategy`,
    nextStepNeeded: false,
    parallelResults,
    convergenceStrategy: strategy,
  };

  const response = await executeThinkingStep(
    convergenceInput,
    sessionManager,
    techniqueRegistry,
    visualFormatter,
    metricsCollector,
    complexityAnalyzer,
    ergodicityManager
  );

  if (!response.isError) {
    try {
      const data = JSON.parse(response.content[0].text);

      console.log(`- Strategy: ${strategy}`);
      console.log(`- Synthesized insights: ${data.insights?.length || 0}`);

      if (data.insights && data.insights.length > 0) {
        console.log('- Top insights:');
        data.insights.slice(0, 3).forEach((insight: string, i: number) => {
          console.log(`  ${i + 1}. ${insight}`);
        });
      }

      if (data.convergenceMetadata) {
        console.log(
          `- Synthesis quality: ${(data.convergenceMetadata.synthesisQuality * 100).toFixed(1)}%`
        );
      }
    } catch (e) {
      console.log('- Error parsing convergence result');
    }
  } else {
    console.log('- Convergence failed');
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runConvergenceExample().catch(console.error);
}

export { runConvergenceExample };
