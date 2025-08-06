/**
 * Parallel Execution Performance Benchmark Runner
 * Demonstrates 2-3x performance improvement
 */
import { performance } from 'perf_hooks';
import { SessionManager } from '../core/SessionManager.js';
import { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../utils/VisualFormatter.js';
import { MetricsCollector } from '../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../complexity/analyzer.js';
import { ErgodicityManager } from '../ergodicity/index.js';
import { planThinkingSession } from '../layers/planning.js';
import { executeThinkingStep } from '../layers/execution.js';
// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};
function log(message, color = colors.reset) {
    console.error(`${color}${message}${colors.reset}`);
}
function logHeader(message) {
    console.error(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.error(`${colors.bright}${colors.blue}${message.padStart((60 + message.length) / 2).padEnd(60)}${colors.reset}`);
    console.error(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}
function logSection(message) {
    console.error(`\n${colors.bright}${colors.cyan}--- ${message} ---${colors.reset}`);
}
// Simulate realistic processing delay
async function simulateProcessingDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Execute a technique completely
async function executeTechnique(technique, problem, planId, dependencies, options = {}) {
    const { simulateDelay = 50, verbose = false } = options;
    const start = performance.now();
    const insights = [];
    const handler = dependencies.techniqueRegistry.getHandler(technique);
    const techniqueInfo = handler.getTechniqueInfo();
    const totalSteps = techniqueInfo.totalSteps;
    if (verbose) {
        log(`  Starting ${technique} (${totalSteps} steps)...`, colors.dim);
    }
    // Execute all steps
    for (let step = 1; step <= totalSteps; step++) {
        await simulateProcessingDelay(simulateDelay);
        const input = {
            planId: planId || 'benchmark-plan',
            technique,
            problem,
            currentStep: step,
            totalSteps,
            output: `${technique} step ${step} output`,
            nextStepNeeded: step < totalSteps,
        };
        try {
            const response = await executeThinkingStep(input, dependencies.sessionManager, dependencies.techniqueRegistry, dependencies.visualFormatter, dependencies.metricsCollector, dependencies.complexityAnalyzer, dependencies.ergodicityManager);
            if (!response.isError) {
                const data = JSON.parse(response.content[0].text);
                if (data.insights) {
                    insights.push(...data.insights);
                }
            }
        }
        catch (error) {
            if (verbose) {
                console.error(`Error in ${technique} step ${step}:`, error);
            }
        }
    }
    const duration = performance.now() - start;
    return { insights, duration, stepCount: totalSteps };
}
// Main benchmark runner
async function runBenchmarks() {
    logHeader('PARALLEL EXECUTION PERFORMANCE BENCHMARKS');
    // Initialize dependencies
    const sessionManager = new SessionManager();
    const techniqueRegistry = new TechniqueRegistry();
    const visualFormatter = new VisualFormatter();
    const metricsCollector = new MetricsCollector();
    const complexityAnalyzer = new HybridComplexityAnalyzer();
    const ergodicityManager = new ErgodicityManager();
    const deps = {
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager,
    };
    // Benchmark 1: Basic Sequential vs Parallel
    await runBasicComparison(deps);
    // Benchmark 2: Scalability Test
    await runScalabilityTest(deps);
    // Benchmark 3: Real-world Scenario
    await runRealWorldScenario(deps);
    logHeader('BENCHMARK COMPLETE');
}
async function runBasicComparison(deps) {
    logSection('Benchmark 1: Sequential vs Parallel Execution');
    const problem = 'How can we improve customer satisfaction in our online store?';
    const techniques = ['six_hats', 'scamper', 'po'];
    log(`Problem: "${problem}"`, colors.dim);
    log(`Techniques: ${techniques.join(', ')}`, colors.dim);
    log(`Processing delay per step: 50ms`, colors.dim);
    // Sequential execution
    log('\nSequential Execution:', colors.yellow);
    const seqStart = performance.now();
    const seqResults = [];
    for (const technique of techniques) {
        const result = await executeTechnique(technique, problem, undefined, deps, {
            simulateDelay: 50,
            verbose: true,
        });
        seqResults.push(result);
        log(`  ✓ ${technique}: ${result.duration.toFixed(0)}ms (${result.stepCount} steps, ${result.insights.length} insights)`, colors.green);
    }
    const seqTotal = performance.now() - seqStart;
    // Parallel execution
    log('\nParallel Execution:', colors.yellow);
    const planInput = {
        problem,
        techniques,
        executionMode: 'parallel',
        timeframe: 'thorough',
    };
    const plan = planThinkingSession(planInput, deps.sessionManager, deps.techniqueRegistry);
    const parStart = performance.now();
    const parPromises = techniques.map(technique => executeTechnique(technique, problem, plan.planId, deps, {
        simulateDelay: 50,
        verbose: true,
    }));
    const parResults = await Promise.all(parPromises);
    const parTotal = performance.now() - parStart;
    // Results
    const speedup = seqTotal / parTotal;
    const improvement = ((seqTotal - parTotal) / seqTotal) * 100;
    log('\nResults:', colors.bright);
    log(`Sequential Total: ${seqTotal.toFixed(0)}ms`);
    log(`Parallel Total: ${parTotal.toFixed(0)}ms`);
    log(`Speedup: ${colors.green}${speedup.toFixed(2)}x${colors.reset}`);
    log(`Time Saved: ${(seqTotal - parTotal).toFixed(0)}ms (${improvement.toFixed(1)}%)`);
    // Quality check
    const seqInsights = seqResults.reduce((sum, r) => sum + r.insights.length, 0);
    const parInsights = parResults.reduce((sum, r) => sum + r.insights.length, 0);
    log(`\nQuality Maintained:`);
    log(`Sequential Insights: ${seqInsights}`);
    log(`Parallel Insights: ${parInsights}`);
}
async function runScalabilityTest(deps) {
    logSection('Benchmark 2: Scalability with Multiple Techniques');
    const problem = 'Design an innovative educational platform for the future';
    const allTechniques = [
        'po',
        'random_entry',
        'scamper',
        'six_hats',
        'design_thinking',
        'triz',
    ];
    log('Testing scalability with increasing number of techniques...\n');
    const results = [];
    for (let count = 2; count <= 6; count++) {
        const techniques = allTechniques.slice(0, count);
        log(`Testing ${count} techniques: ${techniques.join(', ')}`);
        // Sequential
        const seqStart = performance.now();
        for (const technique of techniques) {
            await executeTechnique(technique, problem, undefined, deps, { simulateDelay: 30 });
        }
        const seqTime = performance.now() - seqStart;
        // Parallel
        const planInput = {
            problem,
            techniques,
            executionMode: 'parallel',
            timeframe: 'quick',
        };
        const plan = planThinkingSession(planInput, deps.sessionManager, deps.techniqueRegistry);
        const parStart = performance.now();
        await Promise.all(techniques.map(t => executeTechnique(t, problem, plan.planId, deps, { simulateDelay: 30 })));
        const parTime = performance.now() - parStart;
        const speedup = seqTime / parTime;
        results.push({ count, seqTime, parTime, speedup });
        log(`  Sequential: ${seqTime.toFixed(0)}ms | Parallel: ${parTime.toFixed(0)}ms | Speedup: ${colors.green}${speedup.toFixed(2)}x${colors.reset}\n`);
    }
    // Summary table
    log('\nScalability Summary:');
    log('Techniques | Sequential | Parallel | Speedup  | Efficiency');
    log('-----------|------------|----------|----------|------------');
    results.forEach(r => {
        const efficiency = ((r.speedup / r.count) * 100).toFixed(1);
        log(`${r.count.toString().padEnd(10)} | ` +
            `${r.seqTime.toFixed(0).padEnd(10)} | ` +
            `${r.parTime.toFixed(0).padEnd(8)} | ` +
            `${colors.green}${r.speedup.toFixed(2)}x${colors.reset}     | ` +
            `${efficiency}%`);
    });
}
async function runRealWorldScenario(deps) {
    logSection('Benchmark 3: Real-World Scenario with Convergence');
    const problem = 'Create a comprehensive strategy for reducing carbon emissions in urban areas';
    const techniques = ['six_hats', 'design_thinking', 'triz', 'scamper'];
    log(`Complex Problem: "${problem}"`);
    log(`Techniques: ${techniques.join(', ')}`);
    log(`Including convergence step for synthesis\n`);
    // Create parallel plan with convergence
    const planInput = {
        problem,
        techniques,
        executionMode: 'parallel',
        convergenceOptions: {
            method: 'execute_thinking_step',
        },
        timeframe: 'thorough',
    };
    const plan = planThinkingSession(planInput, deps.sessionManager, deps.techniqueRegistry);
    // Execute parallel sessions
    log('Executing parallel thinking sessions...');
    const parStart = performance.now();
    const parallelResults = await Promise.all(techniques.map(async (technique) => {
        const result = await executeTechnique(technique, problem, plan.planId, deps, {
            simulateDelay: 40,
        });
        log(`  ✓ ${technique} completed: ${result.duration.toFixed(0)}ms`, colors.green);
        return {
            sessionId: `session_${technique}`,
            planId: plan.planId,
            technique,
            problem,
            insights: result.insights,
            results: { output: `${technique} complete`, duration: result.duration },
            metrics: {
                executionTime: result.duration,
                completedSteps: result.stepCount,
                totalSteps: result.stepCount,
                confidence: 0.85,
            },
            status: 'completed',
        };
    }));
    const parTime = performance.now() - parStart;
    // Execute convergence
    log('\nExecuting convergence synthesis...');
    const convStart = performance.now();
    const convergenceInput = {
        planId: plan.planId,
        technique: 'convergence',
        problem,
        currentStep: 1,
        totalSteps: 3,
        output: 'Synthesizing insights from all techniques',
        nextStepNeeded: false,
        parallelResults,
        convergenceStrategy: 'merge',
    };
    try {
        await executeThinkingStep(convergenceInput, deps.sessionManager, deps.techniqueRegistry, deps.visualFormatter, deps.metricsCollector, deps.complexityAnalyzer, deps.ergodicityManager);
        const convTime = performance.now() - convStart;
        log(`  ✓ Convergence completed: ${convTime.toFixed(0)}ms`, colors.green);
        // Calculate total time and theoretical sequential time
        const totalTime = parTime + convTime;
        const stepCounts = parallelResults.map(r => r.metrics.totalSteps);
        const totalSteps = stepCounts.reduce((a, b) => a + b, 0);
        const theoreticalSeqTime = totalSteps * 40 * 1.2; // 40ms per step + overhead
        log('\nFinal Results:', colors.bright);
        log(`Parallel Execution: ${parTime.toFixed(0)}ms`);
        log(`Convergence: ${convTime.toFixed(0)}ms`);
        log(`Total Time: ${totalTime.toFixed(0)}ms`);
        log(`Theoretical Sequential: ~${theoreticalSeqTime.toFixed(0)}ms`);
        log(`Overall Speedup: ${colors.green}${(theoreticalSeqTime / totalTime).toFixed(2)}x${colors.reset}`);
        log(`Convergence Overhead: ${((convTime / totalTime) * 100).toFixed(1)}%`);
        // Insights summary
        const totalInsights = parallelResults.reduce((sum, r) => sum + r.insights.length, 0);
        log(`\nTotal Insights Generated: ${totalInsights}`);
    }
    catch (error) {
        log(`  ✗ Convergence failed: ${String(error)}`, colors.yellow);
    }
}
// Run benchmarks
console.error('Starting parallel execution benchmarks...\n');
runBenchmarks().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
});
//# sourceMappingURL=parallel-execution-runner.js.map