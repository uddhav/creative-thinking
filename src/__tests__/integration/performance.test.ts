/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, no-console, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
/**
 * Performance integration tests
 * Tests system performance under various load conditions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type { ExecuteThinkingStepInput, SixHatsColor } from '../../index.js';
import { safeJsonParse } from '../helpers/types.js';

describe('Performance Integration Tests', () => {
  let server: LateralThinkingServer;

  // Configurable timeouts based on environment
  const PERF_TIMEOUT_MULTIPLIER = parseFloat(process.env.PERF_TIMEOUT_MULTIPLIER || '1');
  const TIMEOUT_50_CONCURRENT = 3000 * PERF_TIMEOUT_MULTIPLIER;
  const TIMEOUT_100_CONCURRENT = 5000 * PERF_TIMEOUT_MULTIPLIER;
  const TIMEOUT_100_STEPS = 10000 * PERF_TIMEOUT_MULTIPLIER;
  const TIMEOUT_50_REVISIONS = 5000 * PERF_TIMEOUT_MULTIPLIER;

  // Helper to get memory usage in MB
  function getMemoryUsageMB(): { heapUsed: number; external: number; rss: number } {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  }

  beforeEach(() => {
    server = new LateralThinkingServer();
    // Force garbage collection if available (run tests with --expose-gc flag)
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
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
      console.log(`50 concurrent discoveries completed in ${duration}ms`);
      console.log(
        `Memory usage - Before: ${memoryBefore.heapUsed}MB, After: ${memoryAfter.heapUsed}MB, Increase: ${memoryIncrease}MB`
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
          problem: `Concurrent execution problem ${i}`,
          currentStep: 1,
          totalSteps: 6,
          hatColor: 'blue',
          output: `Concurrent output ${i}`,
          nextStepNeeded: true,
        })
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

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
      const hatColors: SixHatsColor[] = ['blue', 'white', 'red', 'yellow', 'black', 'green'];

      const memoryBefore = getMemoryUsageMB();
      const memorySnapshots: number[] = [];

      // Execute 100 steps (cycling through hats with revisions)
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const isRevision = i > 6 && i % 7 === 0;
        const currentStep = isRevision ? (i % 6) + 1 : (i % 6) + 1;

        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'six_hats',
          problem,
          currentStep,
          totalSteps: 6,
          hatColor: hatColors[currentStep - 1],
          output: `Step ${i + 1} output`,
          nextStepNeeded: true,
          sessionId,
          ...(isRevision
            ? {
                isRevision: true,
                revisesStep: currentStep,
              }
            : {}),
        });

        if (i === 0) {
          sessionId = safeJsonParse(result.content[0].text).sessionId;
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

      // Ensure memory usage doesn't grow excessively (less than or equal to 2.5MB per 20 steps on average)
      expect(avgGrowthPer20Steps).toBeLessThanOrEqual(2.5);
      // Total memory increase should be reasonable (less than 20MB for 100 steps)
      expect(memoryIncrease).toBeLessThan(20);

      // Verify session state
      const finalStep = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 6,
        totalSteps: 6,
        hatColor: 'green',
        output: 'Final output',
        nextStepNeeded: false,
        sessionId,
      });

      const finalData = safeJsonParse(finalStep.content[0].text);
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
        const techSteps = technique === 'six_hats' ? 6 : technique === 'scamper' ? 8 : 5; // design_thinking

        for (let step = 1; step <= techSteps; step++) {
          stepCount++;

          const input: ExecuteThinkingStepInput = {
            planId: plan.planId,
            technique: technique as any,
            problem,
            currentStep: step,
            totalSteps: techSteps,
            output: `${technique} step ${step} output`,
            nextStepNeeded: stepCount < 18, // Total steps
            sessionId,
          };

          // Add technique-specific fields
          if (technique === 'six_hats') {
            input.hatColor = ['blue', 'white', 'red', 'yellow', 'black', 'green'][
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
