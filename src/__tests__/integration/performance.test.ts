/* eslint-disable no-console, @typescript-eslint/no-unsafe-return */
/**
 * Performance integration tests
 * Tests system performance under various load conditions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type { ExecuteThinkingStepInput, SixHatsColor } from '../../index.js';
import { safeJsonParse } from '../helpers/types.js';
import {
  detectEnvironment,
  getTimeoutMultiplier,
  cleanupSessions,
  MemoryTracker,
  waitForMemoryStabilization,
} from '../helpers/performance.js';

describe('Performance Integration Tests', () => {
  let server: LateralThinkingServer;
  const env = detectEnvironment();
  const memTracker = new MemoryTracker();

  // Configurable timeouts based on environment
  const PERF_TIMEOUT_MULTIPLIER = getTimeoutMultiplier();
  const TIMEOUT_50_CONCURRENT = 3000 * PERF_TIMEOUT_MULTIPLIER;
  const TIMEOUT_100_CONCURRENT = 5000 * PERF_TIMEOUT_MULTIPLIER;
  const TIMEOUT_100_STEPS = 10000 * PERF_TIMEOUT_MULTIPLIER;
  const TIMEOUT_50_REVISIONS = 5000 * PERF_TIMEOUT_MULTIPLIER;

  // Log environment info once
  console.error(
    `[Performance] Running in ${env.environmentName} environment with ${PERF_TIMEOUT_MULTIPLIER}x timeout multiplier`
  );

  // Helper to get memory usage in MB
  function getMemoryUsageMB(): { heapUsed: number; external: number; rss: number } {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  }

  beforeEach(async () => {
    // Start memory tracking
    memTracker.start();

    server = new LateralThinkingServer();
    // Force garbage collection if available (run tests with --expose-gc flag)
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }

    // Wait for memory to stabilize
    await waitForMemoryStabilization(500);
  });

  afterEach(async () => {
    // Clean up all sessions to prevent leakage
    cleanupSessions(server);

    // Log memory delta for debugging
    memTracker.logDelta('Test cleanup');

    // Force final GC
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }

    // Wait for cleanup to complete
    await waitForMemoryStabilization(500);
  });

  describe('Concurrent Operations', () => {
    it('should handle 50 concurrent discovery requests', async () => {
      const memoryBefore = getMemoryUsageMB();
      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        server.discoverTechniques({
          problem: `Concurrent discovery problem ${i}`,
          context: `Context for problem ${i}`,
          preferredOutcome: ['innovative', 'systematic', 'risk-aware'][i % 3] as any,
        })
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      const memoryAfter = getMemoryUsageMB();

      // All should succeed
      expect(results.every(r => !r.isError)).toBe(true);
      expect(
        results.every(r => {
          const data = safeJsonParse(r.content[0].text);
          return data.recommendations && data.recommendations.length > 0;
        })
      ).toBe(true);

      // Should complete reasonably quickly (adjust threshold as needed)
      expect(duration).toBeLessThan(TIMEOUT_50_CONCURRENT); // 3 seconds for 50 requests (configurable)

      // Memory usage check
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      console.log(`[${env.environmentName}] 50 concurrent discoveries completed in ${duration}ms`);
      console.log(
        `[${env.environmentName}] Memory usage - Before: ${memoryBefore.heapUsed}MB, After: ${memoryAfter.heapUsed}MB, Increase: ${memoryIncrease}MB`
      );

      // Ensure memory usage doesn't grow excessively (less than 50MB for 50 requests)
      expect(memoryIncrease).toBeLessThan(50);
    });

    it('should handle 100 concurrent planning requests', async () => {
      const startTime = Date.now();

      const techniques = ['six_hats', 'scamper', 'po', 'random_entry'];

      const promises = Array.from({ length: 100 }, (_, i) =>
        server.planThinkingSession({
          problem: `Concurrent planning problem ${i}`,
          techniques: [techniques[i % techniques.length]] as any,
          timeframe: ['quick', 'thorough', 'comprehensive'][i % 3] as any,
        })
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All should succeed
      expect(results.every(r => !r.isError)).toBe(true);

      // Each should have unique planId
      const planIds = results.map(r => safeJsonParse(r.content[0].text).planId);
      expect(new Set(planIds).size).toBe(100);

      // Performance check
      expect(duration).toBeLessThan(TIMEOUT_100_CONCURRENT); // 5 seconds for 100 plans (configurable)

      console.log(`100 concurrent plans created in ${duration}ms`);
    });

    it('should handle 100 concurrent step executions', async () => {
      // First create a plan
      const planResult = server.planThinkingSession({
        problem: 'Performance test problem',
        techniques: ['six_hats'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, (_, i) =>
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'six_hats',
          problem: `Concurrent test case ${i}`,
          currentStep: 2, // Use step 2 to avoid ergodicity check
          totalSteps: 6,
          hatColor: 'white', // White hat for step 2
          output: `Test output ${i}`,
          nextStepNeeded: true,
        })
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Check for errors
      const errors = results.filter(r => r.isError);
      if (errors.length > 0) {
        console.error(
          'Errors found:',
          errors.map(e => safeJsonParse(e.content[0].text))
        );
      }

      // All should succeed
      expect(results.every(r => !r.isError)).toBe(true);

      // Each should have unique sessionId
      const sessionIds = results.map(r => safeJsonParse(r.content[0].text).sessionId);
      expect(new Set(sessionIds).size).toBe(100);

      // Performance check
      expect(duration).toBeLessThan(TIMEOUT_100_CONCURRENT); // 5 seconds for 100 executions (configurable)

      console.log(`100 concurrent executions completed in ${duration}ms`);
    });
  });

  describe('Large Session Handling', () => {
    it('should handle session with 100 steps efficiently', async () => {
      const problem = 'Large session test';

      // Create plan
      const planResult = server.planThinkingSession({
        problem,
        techniques: ['six_hats'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      let sessionId: string | undefined;
      const hatColors: SixHatsColor[] = [
        'blue',
        'white',
        'red',
        'yellow',
        'black',
        'green',
        'purple',
      ];

      const memoryBefore = getMemoryUsageMB();
      const memorySnapshots: number[] = [];

      // Execute 100 steps (cycling through hats with revisions)
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const isRevision = i > 6 && i % 7 === 0;
        const currentStep = (i % 6) + 1; // Cycle through steps 1-6 only

        const stepInput: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'six_hats',
          problem,
          currentStep,
          totalSteps: 7,
          hatColor: hatColors[currentStep - 1],
          output: `Step ${i + 1} output`,
          nextStepNeeded: i < 99,
          sessionId,
          ...(isRevision
            ? {
                isRevision: true,
                revisesStep: currentStep,
              }
            : {}),
        };

        // Add ergodicity check for step 1 every time we encounter it
        if (currentStep === 1) {
          stepInput.ergodicityCheck = {
            response:
              'This is a test scenario with no real-world impact. The domain is ergodic as we can freely experiment without risk of ruin. All outcomes are reversible in this test context. There are no path dependencies that would create individual-specific outcomes different from ensemble averages in this controlled test environment.',
            timestamp: new Date().toISOString(),
          };
        }

        const result = await server.executeThinkingStep(stepInput);

        const resultData = safeJsonParse(result.content[0].text);

        // Check for errors first
        if (resultData.error) {
          console.error(`Error at iteration ${i}:`, resultData.error);
          throw new Error(`Test failed at iteration ${i}: ${resultData.error.message}`);
        }

        // Capture sessionId on first successful execution
        if (!sessionId && resultData.sessionId) {
          sessionId = resultData.sessionId;
        }

        // Take memory snapshot every 20 steps
        if ((i + 1) % 20 === 0) {
          memorySnapshots.push(getMemoryUsageMB().heapUsed);
        }
      }

      const executionTime = Date.now() - startTime;
      const memoryAfter = getMemoryUsageMB();

      // Should handle 100 steps reasonably
      expect(executionTime).toBeLessThan(TIMEOUT_100_STEPS); // 10 seconds for 100 steps (configurable)

      // Analyze memory growth
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      // Calculate average memory growth rate
      let totalGrowth = 0;
      for (let i = 1; i < memorySnapshots.length; i++) {
        totalGrowth += memorySnapshots[i] - memorySnapshots[i - 1];
      }
      const avgGrowthPer20Steps = totalGrowth / (memorySnapshots.length - 1);

      console.log(`100 steps completed in ${executionTime}ms`);
      console.log(
        `Memory usage - Before: ${memoryBefore.heapUsed}MB, After: ${memoryAfter.heapUsed}MB, Increase: ${memoryIncrease}MB`
      );
      console.log(`Average memory growth per 20 steps: ${avgGrowthPer20Steps.toFixed(2)}MB`);

      // Ensure memory usage doesn't grow excessively (less than or equal to 3MB per 20 steps on average)
      expect(avgGrowthPer20Steps).toBeLessThanOrEqual(3);
      // Total memory increase should be reasonable (less than 25MB for 100 steps)
      expect(memoryIncrease).toBeLessThan(25);

      // Verify session state
      const finalStep = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 7,
        totalSteps: 7,
        hatColor: 'purple',
        output: 'Final output',
        nextStepNeeded: false,
        sessionId,
      });

      const finalData = safeJsonParse(finalStep.content[0].text);
      // sessionId should have been set on the first iteration
      expect(sessionId).toBeDefined();
      expect(finalData.sessionId).toBe(sessionId);
    });

    it('should handle deep revision chains efficiently', async () => {
      const problem = 'Deep revision test';

      // Create plan
      const planResult = server.planThinkingSession({
        problem,
        techniques: ['po'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Initial step
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem,
        currentStep: 1,
        totalSteps: 4,
        provocation: 'Po: Original provocation',
        output: 'Original output',
        nextStepNeeded: true,
      });
      const sessionId = safeJsonParse(step1.content[0].text).sessionId;

      // Create 50 revisions of the same step
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'po',
          problem,
          currentStep: 1,
          totalSteps: 4,
          provocation: `Po: Revision ${i + 1}`,
          output: `Revised output ${i + 1}`,
          nextStepNeeded: true,
          sessionId,
          isRevision: true,
          revisesStep: 1,
        });
      }

      const revisionTime = Date.now() - startTime;

      // Should handle deep revisions efficiently
      expect(revisionTime).toBeLessThan(TIMEOUT_50_REVISIONS); // 5 seconds for 50 revisions (configurable)

      console.log(`50 revisions completed in ${revisionTime}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should handle memory efficiently with many sessions', async () => {
      const sessionIds: string[] = [];

      // Create 50 sessions
      for (let i = 0; i < 50; i++) {
        const planResult = server.planThinkingSession({
          problem: `Memory test problem ${i}`,
          techniques: ['random_entry'],
        });
        const plan = safeJsonParse(planResult.content[0].text);

        const stepResult = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'random_entry',
          problem: `Memory test problem ${i}`,
          currentStep: 1,
          totalSteps: 3,
          randomStimulus: `Stimulus ${i}`,
          output: `Output ${i}`,
          nextStepNeeded: false,
        });

        sessionIds.push(safeJsonParse(stepResult.content[0].text).sessionId);
      }

      // Memory should be managed (sessions should be garbage collected if needed)
      // This is a basic test - in production you'd monitor actual memory usage
      expect(sessionIds.length).toBe(50);

      // Server should still be responsive
      const testResult = server.discoverTechniques({
        problem: 'Final test after many sessions',
      });
      expect(testResult.isError).toBeFalsy();
    });
  });

  describe('Response Time Consistency', () => {
    it('should maintain consistent response times under load', () => {
      const responseTimes: number[] = [];

      // Measure response times for 20 sequential operations
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();

        server.discoverTechniques({
          problem: `Response time test ${i}`,
          context: 'Testing response time consistency',
        });

        responseTimes.push(Date.now() - startTime);
      }

      // Calculate statistics
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);

      // Response times should be relatively consistent
      const variance = maxTime - minTime;
      // NLP processing can have some variance due to text complexity and first-time initialization
      // Allow up to 5x average time or 60ms, whichever is higher
      const threshold = Math.max(avgTime * 5, 60);
      expect(variance).toBeLessThan(threshold);

      console.log(`Response times - Avg: ${avgTime}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);
    });
  });

  describe('Complex Workflow Performance', () => {
    it('should handle multi-technique workflow efficiently', async () => {
      const problem = 'Complex workflow performance test';
      const techniques = ['six_hats', 'scamper', 'design_thinking'];

      const startTime = Date.now();

      // Plan multi-technique session
      const planResult = server.planThinkingSession({
        problem,
        techniques,
        timeframe: 'comprehensive',
      });
      const plan = safeJsonParse(planResult.content[0].text);

      let sessionId: string | undefined;
      let stepCount = 0;

      // Execute steps for each technique
      for (const technique of techniques) {
        const techSteps = technique === 'six_hats' ? 7 : technique === 'scamper' ? 8 : 5; // design_thinking

        for (let step = 1; step <= techSteps; step++) {
          stepCount++;

          const input: ExecuteThinkingStepInput = {
            planId: plan.planId,
            technique: technique as any,
            problem,
            currentStep: step,
            totalSteps: techSteps,
            output: `${technique} step ${step} output`,
            nextStepNeeded: stepCount < 20, // Total steps (7 + 8 + 5)
            sessionId,
          };

          // Add technique-specific fields
          if (technique === 'six_hats') {
            input.hatColor = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'][
              step - 1
            ] as SixHatsColor;
          } else if (technique === 'scamper') {
            input.scamperAction = [
              'substitute',
              'combine',
              'adapt',
              'modify',
              'put_to_other_use',
              'eliminate',
              'reverse',
            ][step - 1] as any;
          } else if (technique === 'design_thinking') {
            input.designStage = ['empathize', 'define', 'ideate', 'prototype', 'test'][
              step - 1
            ] as any;
          }

          const result = await server.executeThinkingStep(input);

          if (!sessionId) {
            sessionId = safeJsonParse(result.content[0].text).sessionId;
          }
        }
      }

      const totalTime = Date.now() - startTime;

      // Should complete complex workflow efficiently
      expect(totalTime).toBeLessThan(TIMEOUT_100_CONCURRENT); // 5 seconds for 18 steps across 3 techniques (configurable)

      console.log(`Complex workflow (${stepCount} steps) completed in ${totalTime}ms`);
    });
  });
});
