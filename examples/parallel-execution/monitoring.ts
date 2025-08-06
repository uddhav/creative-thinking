/**
 * Progress Monitoring Example
 *
 * This example demonstrates how to monitor the real-time progress
 * of parallel thinking sessions.
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

async function runMonitoringExample() {
  console.log('=== Progress Monitoring Example ===\n');

  // Initialize dependencies
  const sessionManager = new SessionManager();
  const techniqueRegistry = new TechniqueRegistry();
  const visualFormatter = new VisualFormatter();
  const metricsCollector = new MetricsCollector();
  const complexityAnalyzer = new HybridComplexityAnalyzer();
  const ergodicityManager = new ErgodicityManager();

  // Get parallel execution context for monitoring
  const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
  const progressCoordinator = parallelContext.getProgressCoordinator();
  const executionMetrics = parallelContext.getExecutionMetrics();

  const problem = 'How can we reduce food waste in restaurants?';
  const techniques = ['six_hats', 'scamper', 'design_thinking', 'po'];

  // Create parallel plan
  const planInput: PlanThinkingSessionInput = {
    problem,
    techniques,
    executionMode: 'parallel',
    timeframe: 'thorough',
  };

  const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);
  const groupId = plan.parallelPlans?.[0]?.groupId || 'default-group';

  console.log(`Monitoring parallel execution for group: ${groupId}`);
  console.log(`Techniques: ${techniques.join(', ')}\n`);

  // Start metrics collection
  executionMetrics.startGroup(groupId, techniques.length);

  // Set up progress monitoring interval
  const monitoringInterval = setInterval(async () => {
    const progress = await progressCoordinator.getGroupProgress(groupId);

    // Clear previous lines and show updated progress
    process.stdout.write('\x1B[4A'); // Move cursor up 4 lines
    console.log('=== Real-time Progress ===');
    console.log(`Status: ${progress.overallStatus}`);
    console.log(`Completed: ${progress.completed}/${progress.total} sessions`);

    // Show individual session progress
    const progressBar =
      '█'.repeat(Math.floor((progress.completed / progress.total) * 20)) +
      '░'.repeat(20 - Math.floor((progress.completed / progress.total) * 20));
    console.log(
      `Progress: [${progressBar}] ${((progress.completed / progress.total) * 100).toFixed(0)}%`
    );

    // Stop monitoring when complete
    if (progress.overallStatus === 'completed' || progress.overallStatus === 'failed') {
      clearInterval(monitoringInterval);
    }
  }, 500); // Update every 500ms

  // Initial progress display
  console.log('=== Real-time Progress ===');
  console.log('Status: pending');
  console.log('Completed: 0/4 sessions');
  console.log('Progress: [░░░░░░░░░░░░░░░░░░░░] 0%');

  // Execute techniques with staggered starts to show progress
  const executionPromises = techniques.map(async (technique, index) => {
    const sessionId = plan.parallelPlans?.[0]?.sessions[index]?.sessionId || `session_${technique}`;
    const handler = techniqueRegistry.getHandler(technique);
    const totalSteps = handler.getTechniqueInfo().totalSteps;

    // Stagger starts to make progress visible
    await new Promise(resolve => setTimeout(resolve, index * 200));

    // Track session start
    executionMetrics.startSession(groupId, sessionId, technique, index * 200);

    // Execute steps with simulated delays
    for (let step = 1; step <= totalSteps; step++) {
      const stepStartTime = Date.now();

      const input: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique,
        problem,
        currentStep: step,
        totalSteps,
        output: `Processing ${technique} - Step ${step}`,
        nextStepNeeded: step < totalSteps,
      };

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Track step completion
      executionMetrics.recordStepCompletion(sessionId, step, stepStartTime, Date.now());
    }

    // Complete session
    executionMetrics.completeSession(sessionId, 'completed', 3 + Math.random() * 2);

    return { technique, sessionId };
  });

  // Wait for all to complete
  const results = await Promise.all(executionPromises);

  // Complete group tracking
  executionMetrics.completeGroup(groupId);

  // Clear monitoring output and show final results
  await new Promise(resolve => setTimeout(resolve, 600)); // Wait for last update
  console.log('\n\n=== Execution Complete ===\n');

  // Show detailed metrics
  const groupMetrics = executionMetrics.getGroupMetrics(groupId);
  const aggregateMetrics = executionMetrics.getAggregateMetrics();

  console.log('Group Metrics:');
  console.log(`- Total Duration: ${groupMetrics?.totalDuration.toFixed(0)}ms`);
  console.log(
    `- Parallel Efficiency: ${((groupMetrics?.parallelEfficiency || 0) * 100).toFixed(1)}%`
  );
  console.log(`- Average Wait Time: ${groupMetrics?.averageWaitTime.toFixed(0)}ms`);
  console.log(`- Peak Concurrency: ${groupMetrics?.peakConcurrency}`);

  console.log('\nSession Details:');
  results.forEach(({ technique, sessionId }) => {
    const sessionMetrics = executionMetrics.getSessionMetrics(sessionId);
    if (sessionMetrics) {
      console.log(`\n${technique}:`);
      console.log(`  - Duration: ${sessionMetrics.totalDuration.toFixed(0)}ms`);
      console.log(`  - Steps: ${sessionMetrics.completedSteps}/${sessionMetrics.totalSteps}`);
      console.log(`  - Avg Step Time: ${sessionMetrics.averageStepDuration.toFixed(0)}ms`);
      console.log(`  - Status: ${sessionMetrics.status}`);
    }
  });

  console.log('\nAggregate Statistics:');
  console.log(`- Total Executions: ${aggregateMetrics.totalExecutions}`);
  console.log(
    `- Success Rate: ${((aggregateMetrics.successfulExecutions / aggregateMetrics.totalExecutions) * 100).toFixed(1)}%`
  );
  console.log(`- Average Duration: ${aggregateMetrics.averageDuration.toFixed(0)}ms`);

  // Export metrics for analysis
  const exportedMetrics = executionMetrics.exportMetrics();
  console.log(`\nMetrics exported (${(exportedMetrics.length / 1024).toFixed(2)}KB)`);

  // Show sample of exported data
  const metricsData = JSON.parse(exportedMetrics);
  console.log('\nSample exported data:');
  console.log(`- Groups: ${Object.keys(metricsData.groups).length}`);
  console.log(`- Sessions: ${Object.keys(metricsData.sessions).length}`);
  console.log(`- Export timestamp: ${new Date(metricsData.exportTimestamp).toLocaleString()}`);
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitoringExample().catch(console.error);
}

export { runMonitoringExample };
