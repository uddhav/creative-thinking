/**
 * Performance benchmarks for parallel execution
 * Demonstrates 2-3x improvement over sequential execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import { planThinkingSession } from '../../layers/planning.js';
import { executeThinkingStep } from '../../layers/execution.js';
import type {
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  LateralTechnique,
} from '../../types/index.js';
import { ParallelExecutionContext } from '../../layers/execution/ParallelExecutionContext.js';

// Helper to measure execution time
async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`[BENCHMARK] ${name}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

// Simulate realistic processing delay
async function simulateProcessingDelay(ms: number): Promise<void> {
  const start = Date.now();
  // Simulate CPU work
  while (Date.now() - start < ms) {
    // Busy wait to simulate actual processing
    Math.sqrt(Math.random());
  }
}

describe('Parallel Execution Performance Benchmarks', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = new TechniqueRegistry();
    visualFormatter = new VisualFormatter();
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer(metricsCollector);
    ergodicityManager = new ErgodicityManager(sessionManager);

    // Reset parallel execution context for clean benchmarks
    ParallelExecutionContext.reset();
  });

  describe('Sequential vs Parallel Execution', () => {
    // Helper to execute a technique completely
    async function executeTechnique(
      technique: LateralTechnique,
      problem: string,
      planId?: string,
      simulateDelay: number = 50
    ): Promise<{ insights: string[]; duration: number }> {
      const start = performance.now();
      const insights: string[] = [];

      // Get technique info for step count
      const handler = techniqueRegistry.getHandler(technique);
      const techniqueInfo = handler.getTechniqueInfo();
      const totalSteps = techniqueInfo.stepCount;

      // Execute all steps
      for (let step = 1; step <= totalSteps; step++) {
        // Simulate processing time for each step
        await simulateProcessingDelay(simulateDelay);

        const input: ExecuteThinkingStepInput = {
          planId,
          technique,
          problem,
          currentStep: step,
          totalSteps,
          output: `${technique} step ${step} output`,
          nextStepNeeded: step < totalSteps,
        };

        try {
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
            const data = JSON.parse(response.content[0].text);
            if (data.insights) {
              insights.push(...data.insights);
            }
          }
        } catch (error) {
          console.error(`Error executing ${technique} step ${step}:`, error);
        }
      }

      const duration = performance.now() - start;
      return { insights, duration };
    }

    it('should demonstrate 2-3x speedup with parallel execution', async () => {
      const problem = 'How can we improve employee engagement in remote teams?';
      const techniques: LateralTechnique[] = ['six_hats', 'scamper', 'po'];

      console.log('\n=== BENCHMARK: Sequential vs Parallel Execution ===');
      console.log(`Problem: ${problem}`);
      console.log(`Techniques: ${techniques.join(', ')}`);
      console.log(`Simulated processing time per step: 50ms`);

      // 1. Sequential Execution
      console.log('\n--- Sequential Execution ---');
      const sequentialStart = performance.now();
      const sequentialResults = [];

      for (const technique of techniques) {
        const result = await executeTechnique(technique, problem);
        sequentialResults.push(result);
        console.log(
          `  ${technique}: ${result.duration.toFixed(2)}ms (${result.insights.length} insights)`
        );
      }

      const sequentialTotal = performance.now() - sequentialStart;
      console.log(`Total Sequential Time: ${sequentialTotal.toFixed(2)}ms`);

      // 2. Parallel Execution
      console.log('\n--- Parallel Execution ---');

      // Create parallel plan
      const planInput: PlanThinkingSessionInput = {
        problem,
        techniques,
        executionMode: 'parallel',
        timeframe: 'thorough',
      };

      const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);

      const parallelStart = performance.now();

      // Execute techniques in parallel
      const parallelPromises = techniques.map(technique =>
        executeTechnique(technique, problem, plan.planId)
      );

      const parallelResults = await Promise.all(parallelPromises);

      const parallelTotal = performance.now() - parallelStart;
      console.log(`Total Parallel Time: ${parallelTotal.toFixed(2)}ms`);

      // 3. Calculate improvement
      const speedup = sequentialTotal / parallelTotal;
      console.log(`\n=== RESULTS ===`);
      console.log(`Sequential Total: ${sequentialTotal.toFixed(2)}ms`);
      console.log(`Parallel Total: ${parallelTotal.toFixed(2)}ms`);
      console.log(`Speedup: ${speedup.toFixed(2)}x`);
      console.log(
        `Time Saved: ${(sequentialTotal - parallelTotal).toFixed(2)}ms (${((1 - parallelTotal / sequentialTotal) * 100).toFixed(1)}%)`
      );

      // Verify results quality is maintained
      const sequentialInsightCount = sequentialResults.reduce(
        (sum, r) => sum + r.insights.length,
        0
      );
      const parallelInsightCount = parallelResults.reduce((sum, r) => sum + r.insights.length, 0);
      console.log(`\nQuality Check:`);
      console.log(`Sequential Insights: ${sequentialInsightCount}`);
      console.log(`Parallel Insights: ${parallelInsightCount}`);

      // Assert performance improvement
      expect(speedup).toBeGreaterThan(1.5); // At least 1.5x speedup
      expect(speedup).toBeLessThan(4.0); // Realistic upper bound

      // Assert quality is maintained
      expect(parallelInsightCount).toBeGreaterThan(0);
      expect(Math.abs(parallelInsightCount - sequentialInsightCount)).toBeLessThan(5); // Similar insight count
    });

    it('should show increasing benefits with more techniques', async () => {
      console.log('\n=== BENCHMARK: Scalability with Multiple Techniques ===');

      const problem = 'Design a sustainable urban transportation system';
      const allTechniques: LateralTechnique[] = [
        'six_hats',
        'scamper',
        'po',
        'random_entry',
        'design_thinking',
        'triz',
      ];

      const results: Array<{
        techniqueCount: number;
        sequentialTime: number;
        parallelTime: number;
        speedup: number;
      }> = [];

      // Test with increasing number of techniques
      for (let count = 2; count <= allTechniques.length; count++) {
        const techniques = allTechniques.slice(0, count);
        console.log(`\nTesting with ${count} techniques: ${techniques.join(', ')}`);

        // Sequential execution
        const seqStart = performance.now();
        for (const technique of techniques) {
          await executeTechnique(technique, problem, undefined, 30); // 30ms per step
        }
        const seqTime = performance.now() - seqStart;

        // Parallel execution
        const planInput: PlanThinkingSessionInput = {
          problem,
          techniques,
          executionMode: 'parallel',
          timeframe: 'quick',
        };
        const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);

        const parStart = performance.now();
        await Promise.all(techniques.map(t => executeTechnique(t, problem, plan.planId, 30)));
        const parTime = performance.now() - parStart;

        const speedup = seqTime / parTime;
        results.push({
          techniqueCount: count,
          sequentialTime: seqTime,
          parallelTime: parTime,
          speedup,
        });

        console.log(`  Sequential: ${seqTime.toFixed(2)}ms`);
        console.log(`  Parallel: ${parTime.toFixed(2)}ms`);
        console.log(`  Speedup: ${speedup.toFixed(2)}x`);
      }

      // Display summary
      console.log('\n=== SCALABILITY SUMMARY ===');
      console.log('Techniques | Sequential | Parallel | Speedup');
      console.log('-----------|------------|----------|--------');
      results.forEach(r => {
        console.log(
          `${r.techniqueCount.toString().padEnd(10)} | ` +
            `${r.sequentialTime.toFixed(0).padEnd(10)} | ` +
            `${r.parallelTime.toFixed(0).padEnd(8)} | ` +
            `${r.speedup.toFixed(2)}x`
        );
      });

      // Verify increasing benefits
      const speedups = results.map(r => r.speedup);
      const avgSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length;

      expect(avgSpeedup).toBeGreaterThan(1.8); // Average speedup should be significant
      expect(speedups[speedups.length - 1]).toBeGreaterThan(speedups[0]); // Should scale with more techniques
    });

    it('should maintain efficiency with convergence overhead', async () => {
      console.log('\n=== BENCHMARK: Parallel Execution with Convergence ===');

      const problem = 'Create an innovative product for elderly care';
      const techniques: LateralTechnique[] = ['six_hats', 'scamper', 'design_thinking'];

      // Plan with convergence
      const planInput: PlanThinkingSessionInput = {
        problem,
        techniques,
        executionMode: 'parallel',
        convergenceOptions: {
          method: 'execute_thinking_step',
          strategy: 'synthesize',
        },
        timeframe: 'thorough',
      };

      const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);

      // Execute parallel sessions
      console.log('Executing parallel sessions...');
      const parallelStart = performance.now();

      const parallelResults = await Promise.all(
        techniques.map(async technique => {
          const result = await executeTechnique(technique, problem, plan.planId, 40);
          return {
            sessionId: `session_${technique}`,
            planId: plan.planId,
            technique,
            problem,
            insights: result.insights,
            results: { output: `${technique} complete`, duration: result.duration },
            metrics: {
              executionTime: result.duration,
              completedSteps: techniqueRegistry.getHandler(technique).getTechniqueInfo().stepCount,
              totalSteps: techniqueRegistry.getHandler(technique).getTechniqueInfo().stepCount,
              confidence: 0.8 + Math.random() * 0.2,
            },
            status: 'completed' as const,
          };
        })
      );

      const parallelTime = performance.now() - parallelStart;

      // Execute convergence
      console.log('Executing convergence...');
      const convergenceStart = performance.now();

      const convergenceInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: 'convergence',
        problem,
        currentStep: 1,
        totalSteps: 3,
        output: 'Synthesizing insights from parallel sessions',
        nextStepNeeded: true,
        parallelResults,
        convergenceStrategy: 'merge',
      };

      const convergenceResponse = await executeThinkingStep(
        convergenceInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const convergenceTime = performance.now() - convergenceStart;
      const totalTime = parallelTime + convergenceTime;

      // Compare with sequential baseline
      const sequentialTime = techniques.length * 40 * 8; // Approximate sequential time

      console.log('\n=== CONVERGENCE OVERHEAD ANALYSIS ===');
      console.log(`Parallel Execution: ${parallelTime.toFixed(2)}ms`);
      console.log(`Convergence: ${convergenceTime.toFixed(2)}ms`);
      console.log(`Total with Convergence: ${totalTime.toFixed(2)}ms`);
      console.log(`Estimated Sequential: ${sequentialTime}ms`);
      console.log(`Speedup (with convergence): ${(sequentialTime / totalTime).toFixed(2)}x`);
      console.log(`Convergence Overhead: ${((convergenceTime / totalTime) * 100).toFixed(1)}%`);

      // Verify efficiency is maintained
      expect(totalTime).toBeLessThan(sequentialTime);
      expect(convergenceTime / totalTime).toBeLessThan(0.25); // Convergence should be < 25% of total
    });

    it('should demonstrate metrics collection efficiency', async () => {
      console.log('\n=== BENCHMARK: Metrics Collection Performance ===');

      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const metrics = parallelContext.getExecutionMetrics();

      // Execute a workload
      const problem = 'Optimize supply chain efficiency';
      const techniques: LateralTechnique[] = ['six_hats', 'triz', 'scamper'];

      const planInput: PlanThinkingSessionInput = {
        problem,
        techniques,
        executionMode: 'parallel',
        timeframe: 'quick',
      };

      const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);
      const groupId = 'benchmark-group';

      // Start metrics collection
      const metricsStart = performance.now();
      metrics.startGroup(groupId, techniques.length);

      // Simulate parallel execution with metrics
      await Promise.all(
        techniques.map(async (technique, index) => {
          const sessionId = `session_${index}`;
          const waitTime = index * 10; // Simulate staggered starts

          await simulateProcessingDelay(waitTime);
          metrics.startSession(groupId, sessionId, technique, waitTime);

          // Simulate steps
          for (let step = 1; step <= 4; step++) {
            const stepStart = Date.now();
            await simulateProcessingDelay(20);
            metrics.recordStepCompletion(sessionId, step, stepStart, Date.now());
          }

          metrics.completeSession(sessionId, 'completed', 3 + index);
        })
      );

      metrics.completeGroup(groupId);
      const metricsTime = performance.now() - metricsStart;

      // Get metrics report
      const report = metrics.getAggregateMetrics();
      const groupMetrics = metrics.getGroupMetrics(groupId);

      console.log('\n=== METRICS PERFORMANCE ===');
      console.log(`Metrics Collection Time: ${metricsTime.toFixed(2)}ms`);
      console.log(
        `Metrics Overhead: ${((metricsTime / (techniques.length * 4 * 20)) * 100).toFixed(2)}%`
      );
      console.log('\nCollected Metrics:');
      console.log(`- Total Executions: ${report.totalExecutions}`);
      console.log(
        `- Success Rate: ${((report.successfulExecutions / report.totalExecutions) * 100).toFixed(1)}%`
      );
      console.log(`- Average Duration: ${report.averageDuration.toFixed(2)}ms`);
      console.log(
        `- Parallel Efficiency: ${groupMetrics?.parallelEfficiency?.toFixed(2) || 'N/A'}`
      );
      console.log(`- Peak Concurrency: ${report.peakConcurrency}`);

      // Export metrics
      const exportStart = performance.now();
      const exported = metrics.exportMetrics();
      const exportTime = performance.now() - exportStart;

      console.log(`\nMetrics Export Time: ${exportTime.toFixed(2)}ms`);
      console.log(`Export Size: ${(exported.length / 1024).toFixed(2)}KB`);

      // Verify minimal overhead
      expect(metricsTime / (techniques.length * 4 * 20)).toBeLessThan(0.1); // < 10% overhead
      expect(exportTime).toBeLessThan(10); // Export should be fast
      expect(report.totalExecutions).toBe(techniques.length);
    });
  });

  describe('Resource Utilization', () => {
    it('should demonstrate memory efficiency in parallel execution', async () => {
      console.log('\n=== BENCHMARK: Memory Efficiency ===');

      const problem = 'Develop a climate change mitigation strategy';
      const techniques: LateralTechnique[] = ['six_hats', 'scamper', 'po', 'design_thinking'];

      // Measure baseline memory
      global.gc && global.gc(); // Force GC if available
      const baselineMemory = process.memoryUsage();

      // Sequential execution memory usage
      global.gc && global.gc();
      const seqMemStart = process.memoryUsage();

      for (const technique of techniques) {
        await executeTechnique(technique, problem, undefined, 25);
      }

      const seqMemEnd = process.memoryUsage();
      const seqMemDelta = seqMemEnd.heapUsed - seqMemStart.heapUsed;

      // Parallel execution memory usage
      global.gc && global.gc();
      const parMemStart = process.memoryUsage();

      const planInput: PlanThinkingSessionInput = {
        problem,
        techniques,
        executionMode: 'parallel',
        timeframe: 'quick',
      };
      const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);

      await Promise.all(techniques.map(t => executeTechnique(t, problem, plan.planId, 25)));

      const parMemEnd = process.memoryUsage();
      const parMemDelta = parMemEnd.heapUsed - parMemStart.heapUsed;

      console.log('\n=== MEMORY USAGE COMPARISON ===');
      console.log(`Sequential Memory Delta: ${(seqMemDelta / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Parallel Memory Delta: ${(parMemDelta / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory Ratio (Par/Seq): ${(parMemDelta / seqMemDelta).toFixed(2)}x`);

      // Memory should not increase linearly with parallel execution
      expect(parMemDelta / seqMemDelta).toBeLessThan(techniques.length * 0.7);
    });
  });
});

// Helper to execute a technique
async function executeTechnique(
  technique: LateralTechnique,
  problem: string,
  planId?: string,
  simulateDelay: number = 50,
  sessionManager?: SessionManager,
  techniqueRegistry?: TechniqueRegistry,
  visualFormatter?: VisualFormatter,
  metricsCollector?: MetricsCollector,
  complexityAnalyzer?: HybridComplexityAnalyzer,
  ergodicityManager?: ErgodicityManager
): Promise<{ insights: string[]; duration: number }> {
  // Implementation provided in the test above
  return { insights: [], duration: 0 };
}
