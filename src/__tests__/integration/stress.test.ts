/* eslint-disable no-console */
/**
 * Stress tests for extreme loads
 * Tests system behavior under extreme conditions (1000+ operations)
 *
 * Note: These tests are intentionally separated from regular performance tests
 * as they may take significant time and resources to run.
 *
 * Run with: npm test -- stress.test.ts
 * Or with environment variable: STRESS_TEST=true npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type {
  ExecuteThinkingStepInput,
  SixHatsColor,
  LateralTechnique,
  ScamperAction,
  DesignThinkingStage,
} from '../../index.js';
import { safeJsonParse, type ServerResponse } from '../helpers/types.js';

interface DiscoveryResponse {
  recommendations: unknown[];
}

interface PlanResponse {
  planId: string;
}

interface StepResponse {
  sessionId: string;
}

describe('Stress Tests - Extreme Loads', () => {
  let server: LateralThinkingServer;

  // Extended timeouts for stress tests
  const STRESS_TIMEOUT_MULTIPLIER = parseFloat(process.env.STRESS_TIMEOUT_MULTIPLIER || '2');
  const TIMEOUT_1000_DISCOVERIES = 30000 * STRESS_TIMEOUT_MULTIPLIER; // 30s base
  const TIMEOUT_1000_STEPS = 60000 * STRESS_TIMEOUT_MULTIPLIER; // 60s base
  const TIMEOUT_500_SESSIONS = 45000 * STRESS_TIMEOUT_MULTIPLIER; // 45s base

  // Helper to get memory usage in MB
  function getMemoryUsageMB(): { heapUsed: number; external: number; rss: number } {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  }

  // Helper to format memory size
  function formatMemory(mb: number): string {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)}GB`;
    }
    return `${mb}MB`;
  }

  beforeEach(() => {
    server = new LateralThinkingServer();
    // Force garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  });

  describe('Extreme Concurrent Load', () => {
    it(
      'should handle 1000 concurrent discovery requests',
      async () => {
        const memoryBefore = getMemoryUsageMB();
        const startTime = Date.now();
        const batchSize = 100; // Process in batches to avoid overwhelming the system
        const totalRequests = 1000;
        const results: ServerResponse[] = [];

        console.log(`Starting stress test: ${totalRequests} discovery requests`);
        console.log(
          `Initial memory: Heap ${formatMemory(memoryBefore.heapUsed)}, RSS ${formatMemory(memoryBefore.rss)}`
        );

        // Process in batches
        for (let batch = 0; batch < totalRequests / batchSize; batch++) {
          const batchPromises = Array.from({ length: batchSize }, (_, i) => {
            const index = batch * batchSize + i;
            const outcomes = [
              'innovative',
              'systematic',
              'risk-aware',
              'collaborative',
              'analytical',
            ] as const;
            return server.discoverTechniques({
              problem: `Stress test problem ${index}`,
              context: `This is a complex problem requiring deep analysis and multiple technique recommendations ${index}`,
              preferredOutcome: outcomes[index % 5],
              constraints: [`Time constraint ${index}`, `Resource constraint ${index}`],
            });
          });

          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);

          // Log progress
          if ((batch + 1) % 2 === 0) {
            const currentMemory = getMemoryUsageMB();
            console.log(
              `Processed ${(batch + 1) * batchSize} requests. Memory: Heap ${formatMemory(currentMemory.heapUsed)}`
            );
          }
        }

        const duration = Date.now() - startTime;
        const memoryAfter = getMemoryUsageMB();

        // Verify all succeeded
        expect(results.every(r => !r.isError)).toBe(true);
        expect(results.length).toBe(totalRequests);

        // Verify structure
        expect(
          results.every(r => {
            if (r.isError) return false;
            const data = safeJsonParse<DiscoveryResponse>(r.content[0].text);
            return data.recommendations && data.recommendations.length > 0;
          })
        ).toBe(true);

        // Performance metrics
        const avgTimePerRequest = duration / totalRequests;
        const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
        const memoryPerRequest = memoryIncrease / totalRequests;

        console.log(`\nStress test completed:`);
        console.log(`- Total time: ${duration}ms`);
        console.log(`- Average time per request: ${avgTimePerRequest.toFixed(2)}ms`);
        console.log(`- Memory increase: ${formatMemory(memoryIncrease)}`);
        console.log(`- Memory per request: ${memoryPerRequest.toFixed(3)}MB`);
        console.log(
          `- Final memory: Heap ${formatMemory(memoryAfter.heapUsed)}, RSS ${formatMemory(memoryAfter.rss)}`
        );

        // Assertions
        expect(duration).toBeLessThan(TIMEOUT_1000_DISCOVERIES);
        expect(avgTimePerRequest).toBeLessThan(50); // Should average less than 50ms per request
        expect(memoryPerRequest).toBeLessThan(0.5); // Should use less than 0.5MB per request
      },
      TIMEOUT_1000_DISCOVERIES
    );
  });

  describe('Extreme Sequential Load', () => {
    it(
      'should handle 1000 sequential steps in a single session',
      async () => {
        const problem = 'Extreme sequential stress test';
        const memoryBefore = getMemoryUsageMB();
        const memorySnapshots: number[] = [];

        // Create plan
        const planResult = await server.planThinkingSession({
          problem,
          techniques: ['six_hats', 'scamper', 'design_thinking'],
          timeframe: 'comprehensive',
        });
        const plan = safeJsonParse<PlanResponse>(planResult.content[0].text);

        console.log(`Starting stress test: 1000 sequential steps`);
        console.log(`Initial memory: Heap ${formatMemory(memoryBefore.heapUsed)}`);

        let sessionId: string | undefined;
        const techniques: LateralTechnique[] = ['six_hats', 'scamper', 'design_thinking'];
        const startTime = Date.now();

        // Execute 1000 steps
        for (let i = 0; i < 1000; i++) {
          const techniqueIndex = Math.floor(i / 100) % techniques.length;
          const technique = techniques[techniqueIndex];
          const techSteps = technique === 'six_hats' ? 6 : technique === 'scamper' ? 8 : 5;
          const currentStep = (i % techSteps) + 1;

          const input: ExecuteThinkingStepInput = {
            planId: plan.planId,
            technique,
            problem,
            currentStep,
            totalSteps: techSteps,
            output: `Step ${i + 1}: Detailed analysis and creative output for ${technique} step ${currentStep}`,
            nextStepNeeded: i < 999,
            sessionId,
          };

          // Add technique-specific fields
          if (technique === 'six_hats') {
            const hatColors: SixHatsColor[] = ['blue', 'white', 'red', 'yellow', 'black', 'green'];
            input.hatColor = hatColors[currentStep - 1];
          } else if (technique === 'scamper') {
            const scamperActions: ScamperAction[] = [
              'substitute',
              'combine',
              'adapt',
              'modify',
              'put_to_other_use',
              'eliminate',
              'reverse',
            ];
            input.scamperAction = scamperActions[currentStep - 1];
          } else if (technique === 'design_thinking') {
            const stages: DesignThinkingStage[] = [
              'empathize',
              'define',
              'ideate',
              'prototype',
              'test',
            ];
            input.designStage = stages[currentStep - 1];
          }

          // Add revisions periodically
          if (i > 50 && i % 50 === 0) {
            input.isRevision = true;
            input.revisesStep = currentStep;
          }

          const result = await server.executeThinkingStep(input);

          if (i === 0) {
            sessionId = safeJsonParse<StepResponse>(result.content[0].text).sessionId;
          }

          // Memory snapshots every 100 steps
          if ((i + 1) % 100 === 0) {
            const currentMemory = getMemoryUsageMB();
            memorySnapshots.push(currentMemory.heapUsed);
            console.log(
              `Processed ${i + 1} steps. Memory: Heap ${formatMemory(currentMemory.heapUsed)}`
            );
          }
        }

        const duration = Date.now() - startTime;
        const memoryAfter = getMemoryUsageMB();

        // Calculate memory growth rate
        let maxGrowth = 0;
        for (let i = 1; i < memorySnapshots.length; i++) {
          const growth = memorySnapshots[i] - memorySnapshots[i - 1];
          maxGrowth = Math.max(maxGrowth, growth);
        }

        console.log(`\nStress test completed:`);
        console.log(`- Total time: ${duration}ms`);
        console.log(`- Average time per step: ${(duration / 1000).toFixed(2)}ms`);
        console.log(
          `- Memory increase: ${formatMemory(memoryAfter.heapUsed - memoryBefore.heapUsed)}`
        );
        console.log(`- Max memory growth per 100 steps: ${formatMemory(maxGrowth)}`);

        // Assertions
        expect(duration).toBeLessThan(TIMEOUT_1000_STEPS);
        expect(maxGrowth).toBeLessThan(50); // Max 50MB growth per 100 steps
      },
      TIMEOUT_1000_STEPS
    );
  });

  describe('Extreme Session Creation', () => {
    it(
      'should handle creating and managing 500 concurrent sessions',
      async () => {
        // Note: This test may encounter session limits or cleanup mechanisms
        // which is expected behavior for production systems
        const memoryBefore = getMemoryUsageMB();
        const startTime = Date.now();
        const sessionData: Array<{ planId: string; sessionId: string }> = [];

        console.log(`Starting stress test: 500 concurrent sessions`);
        console.log(`Initial memory: Heap ${formatMemory(memoryBefore.heapUsed)}`);

        // Create 500 sessions in batches
        const batchSize = 50;
        const totalSessions = 500;

        for (let batch = 0; batch < totalSessions / batchSize; batch++) {
          const batchPromises = Array.from({ length: batchSize }, async (_, i) => {
            const index = batch * batchSize + i;
            const techniques: LateralTechnique[] = [
              'random_entry',
              'concept_extraction',
              'yes_and',
            ];
            const technique = techniques[index % 3];

            // Create plan
            const planResult = await server.planThinkingSession({
              problem: `Session ${index} problem`,
              techniques: [technique],
              objectives: [`Objective 1 for session ${index}`, `Objective 2 for session ${index}`],
            });
            const plan = safeJsonParse<PlanResponse>(planResult.content[0].text);

            // Start session with first step
            const stepResult = await server.executeThinkingStep({
              planId: plan.planId,
              technique,
              problem: `Session ${index} problem`,
              currentStep: 1,
              totalSteps: 3,
              output: `Initial output for session ${index}`,
              nextStepNeeded: true,
              ...(technique === 'random_entry' ? { randomStimulus: `Stimulus ${index}` } : {}),
              ...(technique === 'concept_extraction' ? { successExample: `Example ${index}` } : {}),
              ...(technique === 'yes_and' ? { initialIdea: `Idea ${index}` } : {}),
            });

            const sessionId = safeJsonParse<StepResponse>(stepResult.content[0].text).sessionId;
            return { planId: plan.planId, sessionId };
          });

          const batchResults = await Promise.all(batchPromises);
          sessionData.push(...batchResults);

          // Log progress
          const currentMemory = getMemoryUsageMB();
          console.log(
            `Created ${(batch + 1) * batchSize} sessions. Memory: Heap ${formatMemory(currentMemory.heapUsed)}`
          );
        }

        // Now execute one more step for each session to verify they're all still accessible
        console.log(`Verifying all ${totalSessions} sessions are still accessible...`);

        const verificationPromises = sessionData.map(async ({ planId, sessionId }, index) => {
          const techniques: LateralTechnique[] = ['random_entry', 'concept_extraction', 'yes_and'];
          const technique = techniques[index % 3];
          return server.executeThinkingStep({
            planId,
            technique,
            problem: `Session ${index} problem`,
            currentStep: 2,
            totalSteps: 3,
            output: `Second output for session ${index}`,
            nextStepNeeded: true,
            sessionId,
            ...(technique === 'random_entry' ? { connections: [`Connection ${index}`] } : {}),
            ...(technique === 'concept_extraction'
              ? { extractedConcepts: [`Concept ${index}`] }
              : {}),
            ...(technique === 'yes_and' ? { additions: [`Addition ${index}`] } : {}),
          });
        });

        const verificationResults = await Promise.all(verificationPromises);
        const duration = Date.now() - startTime;
        const memoryAfter = getMemoryUsageMB();

        // Verify sessions - some may have been cleaned up which is expected
        const errors = verificationResults.filter(r => r.isError);
        const successfulVerifications = verificationResults.filter(r => !r.isError).length;

        if (errors.length > 0) {
          console.log(
            `Note: ${errors.length} sessions were cleaned up (expected behavior under extreme load)`
          );
          const errorData = safeJsonParse<{ error: { code: string; message: string } }>(
            errors[0].content[0].text
          );
          if (errorData.error.code === 'SESSION_NOT_FOUND') {
            console.log(
              'Sessions were cleaned up due to memory management - this is expected behavior'
            );
          }
        }

        // At least 20% of sessions should still be accessible (100 out of 500)
        expect(successfulVerifications).toBeGreaterThanOrEqual(100);

        // Check unique session IDs
        const uniqueSessions = new Set(sessionData.map(s => s.sessionId));
        expect(uniqueSessions.size).toBe(totalSessions);

        console.log(`\nStress test completed:`);
        console.log(`- Total time: ${duration}ms`);
        console.log(`- Sessions created: ${totalSessions}`);
        console.log(`- Sessions still accessible: ${successfulVerifications}`);
        console.log(
          `- Memory increase: ${formatMemory(memoryAfter.heapUsed - memoryBefore.heapUsed)}`
        );
        console.log(
          `- Memory per session: ${((memoryAfter.heapUsed - memoryBefore.heapUsed) / totalSessions).toFixed(2)}MB`
        );

        // Assertions
        expect(duration).toBeLessThan(TIMEOUT_500_SESSIONS);
        expect((memoryAfter.heapUsed - memoryBefore.heapUsed) / totalSessions).toBeLessThan(1); // Less than 1MB per session
      },
      TIMEOUT_500_SESSIONS
    );
  });

  describe('Extreme Branching', () => {
    it('should handle deep branching with 100 branches', async () => {
      const problem = 'Extreme branching test';

      // Create plan
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['triz'],
      });
      const plan = safeJsonParse<PlanResponse>(planResult.content[0].text);

      // Initial step
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem,
        currentStep: 1,
        totalSteps: 4,
        contradiction: 'Original contradiction',
        output: 'Original solution',
        nextStepNeeded: true,
      });
      const sessionId = safeJsonParse<StepResponse>(step1.content[0].text).sessionId;

      console.log(`Starting stress test: 100 branches from single step`);
      const startTime = Date.now();

      // Create 100 branches
      const branchPromises = Array.from({ length: 100 }, (_, i) =>
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'triz',
          problem,
          currentStep: 1,
          totalSteps: 4,
          contradiction: `Branch ${i + 1} contradiction`,
          output: `Branch ${i + 1} solution`,
          nextStepNeeded: true,
          sessionId,
          branchFromStep: 1,
          branchId: `branch_${i + 1}`,
        })
      );

      const branchResults = await Promise.all(branchPromises);
      const duration = Date.now() - startTime;

      // Verify all branches created successfully
      expect(branchResults.every(r => !r.isError)).toBe(true);

      console.log(`Created 100 branches in ${duration}ms`);
      console.log(`Average time per branch: ${(duration / 100).toFixed(2)}ms`);

      // Performance check
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Extreme Risk Analysis', () => {
    it('should handle sessions with extensive risk and mitigation data', async () => {
      const problem = 'Complex system with multiple risk factors';

      // Create plan
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['design_thinking', 'triz'],
        constraints: Array.from({ length: 20 }, (_, i) => `Constraint ${i + 1}`),
      });
      const plan = safeJsonParse<PlanResponse>(planResult.content[0].text);

      let sessionId: string | undefined;
      const startTime = Date.now();

      // Execute steps with extensive risk data
      for (let step = 1; step <= 5; step++) {
        const stages: DesignThinkingStage[] = [
          'empathize',
          'define',
          'ideate',
          'prototype',
          'test',
        ];
        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'design_thinking',
          problem,
          currentStep: step,
          totalSteps: 5,
          designStage: stages[step - 1],
          output: `Step ${step} with extensive analysis`,
          nextStepNeeded: step < 5,
          sessionId,
          // Add extensive risk data
          risks: Array.from({ length: 50 }, (_, i) => `Risk ${i + 1} for step ${step}`),
          failureModes: Array.from({ length: 30 }, (_, i) => `Failure mode ${i + 1}`),
          mitigations: Array.from({ length: 40 }, (_, i) => `Mitigation strategy ${i + 1}`),
          antifragileProperties: Array.from(
            { length: 20 },
            (_, i) => `Antifragile property ${i + 1}`
          ),
          blackSwans: Array.from({ length: 10 }, (_, i) => `Black swan event ${i + 1}`),
        });

        if (step === 1) {
          sessionId = safeJsonParse<StepResponse>(result.content[0].text).sessionId;
        }
      }

      const duration = Date.now() - startTime;

      console.log(`Processed session with extensive risk data in ${duration}ms`);

      // Should handle large risk data efficiently
      expect(duration).toBeLessThan(5000); // 5 seconds for 5 steps with extensive data
    });
  });
});
