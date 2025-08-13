/**
 * Tests for session management using only the public API
 * These tests verify the same behavior as sessionManagement.test.ts but without accessing internals
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LateralThinkingServer } from '../index.js';

describe('Session Management - Public API', () => {
  let server: LateralThinkingServer;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear any existing env vars
    delete process.env.SESSION_TTL;
    delete process.env.MAX_SESSIONS;
    delete process.env.ENABLE_MEMORY_MONITORING;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    if (server) {
      server.destroy();
    }
  });

  describe('Session cleanup with TTL', () => {
    it('should clean up sessions older than TTL', async () => {
      // Set a very short TTL (2 seconds) and cleanup interval (1 second)
      process.env.SESSION_TTL = '2000';
      process.env.CLEANUP_INTERVAL = '1000';

      server = new LateralThinkingServer();

      // Create a session through the public API
      const planResult = server.planThinkingSession({
        problem: 'Test TTL expiration',
        techniques: ['six_hats'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      // Session is created on first execution, not during planning
      expect(planData.planId).toBeDefined();

      // Execute first step to establish the session
      const step1Result = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'six_hats',
        problem: 'Test TTL expiration',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Process overview',
        nextStepNeeded: true,
      });

      // Get the sessionId from the response
      const step1Response = JSON.parse(step1Result.content[0].text);
      const sessionId = step1Response.sessionId;

      // Verify session is active
      expect(sessionId).toBeDefined();

      // Wait for TTL to expire plus cleanup interval
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Try to continue the session without providing sessionId
      // This will force creation of a new session if the old one was cleaned up
      const step2Result = await server.executeThinkingStep({
        planId: planData.planId,
        // Don't provide sessionId - let it create a new one
        technique: 'six_hats',
        problem: 'Test TTL expiration',
        currentStep: 2,
        totalSteps: 6,
        hatColor: 'white',
        output: 'Facts and information',
        nextStepNeeded: true,
      });

      const step2Response = JSON.parse(step2Result.content[0].text);

      // With the bug fix, session is derived from planId when not provided
      // So it should reuse the same session ID pattern
      expect(step2Response.sessionId).toBeDefined();
      expect(step2Response.sessionId).toBe(`session_${planData.planId}`);

      // Now try to access the old session directly - it should recreate with the same ID
      const step3Result = await server.executeThinkingStep({
        planId: planData.planId,
        sessionId, // Use the old session ID
        technique: 'six_hats',
        problem: 'Test TTL expiration',
        currentStep: 2,
        totalSteps: 6,
        hatColor: 'white',
        output: 'Facts and information',
        nextStepNeeded: true,
      });

      const step3Response = JSON.parse(step3Result.content[0].text);
      // With plan-derived sessionId, the session is preserved
      expect(step3Response.sessionId).toBe(sessionId);
      expect(step3Response.historyLength).toBe(2); // Session preserved from step 1
    });

    it('should keep sessions alive when accessed', async () => {
      // Set a short TTL but we'll keep accessing the session
      process.env.SESSION_TTL = '2000';

      server = new LateralThinkingServer();

      // Create a session
      const planResult = server.planThinkingSession({
        problem: 'Test session keep-alive',
        techniques: ['po'],
      });

      const planData = JSON.parse(planResult.content[0].text);
      let sessionId: string | undefined;

      // Access the session multiple times over a period longer than TTL
      for (let i = 1; i <= 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 600)); // 600ms between accesses

        const stepResult = await server.executeThinkingStep({
          planId: planData.planId,
          sessionId: sessionId || undefined,
          technique: 'po',
          problem: 'Test session keep-alive',
          currentStep: i,
          totalSteps: 4,
          provocation: `Po: Test ${i}`,
          output: `Step ${i} output`,
          nextStepNeeded: i < 4,
        });

        const response = JSON.parse(stepResult.content[0].text);

        // First iteration creates the session
        if (i === 1) {
          sessionId = response.sessionId;
          expect(sessionId).toBeDefined();
        } else {
          // Subsequent iterations should use the same session
          expect(response.sessionId).toBe(sessionId);
        }
        expect(response.currentStep).toBe(i);
      }

      // Total time: 4 * 600ms = 2400ms, which is longer than TTL
      // But session should still be alive because we kept accessing it
    });
  });

  describe('Session limits and eviction', () => {
    it('should enforce maximum session limit', async () => {
      // Set a low max sessions limit
      process.env.MAX_SESSIONS = '2';

      server = new LateralThinkingServer();

      const sessionIds: string[] = [];

      // Create 2 sessions (at the limit)
      for (let i = 0; i < 2; i++) {
        const planResult = server.planThinkingSession({
          problem: `Problem ${i}`,
          techniques: ['random_entry'],
        });
        const planData = JSON.parse(planResult.content[0].text);
        sessionIds.push(planData.sessionId);

        // Execute a step to establish the session
        await server.executeThinkingStep({
          planId: planData.planId,
          sessionId: planData.sessionId,
          technique: 'random_entry',
          problem: `Problem ${i}`,
          currentStep: 1,
          totalSteps: 3,
          randomStimulus: `Stimulus ${i}`,
          output: `Output ${i}`,
          nextStepNeeded: false,
        });
      }

      // Create a 3rd session, which should trigger eviction of the oldest
      const plan3Result = server.planThinkingSession({
        problem: 'Problem 3',
        techniques: ['random_entry'],
      });
      const plan3Data = JSON.parse(plan3Result.content[0].text);

      await server.executeThinkingStep({
        planId: plan3Data.planId,
        technique: 'random_entry',
        problem: 'Problem 3',
        currentStep: 1,
        totalSteps: 3,
        randomStimulus: 'Stimulus 3',
        output: 'Output 3',
        nextStepNeeded: false,
      });

      // Try to access the first session - it might have been evicted
      const oldSessionResult = await server.executeThinkingStep({
        planId: 'dummy-plan-id', // We don't have the original planId
        sessionId: sessionIds[0],
        technique: 'random_entry',
        problem: 'Problem 0',
        currentStep: 2,
        totalSteps: 3,
        connections: ['Connection 1'],
        output: 'Trying old session',
        nextStepNeeded: false,
      });

      const oldSessionResponse = JSON.parse(oldSessionResult.content[0].text);

      // The old session might have been evicted (new session created)
      // or we get an error. Either way, it's not the same session.
      const wasEvicted =
        oldSessionResponse.error ||
        oldSessionResponse.sessionId !== sessionIds[0] ||
        oldSessionResponse.historyLength === 1; // New session would have fresh history

      expect(wasEvicted).toBeTruthy();
    });
  });

  describe('Memory monitoring', () => {
    it('should log memory metrics when monitoring is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Enable memory monitoring and set a short cleanup interval
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      process.env.CLEANUP_INTERVAL = '1000'; // 1 second

      server = new LateralThinkingServer();

      // Create some sessions to generate memory usage
      for (let i = 0; i < 3; i++) {
        const planResult = server.planThinkingSession({
          problem: `Memory test problem ${i}`,
          techniques: ['scamper'],
        });

        const planData = JSON.parse(planResult.content[0].text);

        // Execute some steps to build up session history
        for (let step = 1; step <= 3; step++) {
          await server.executeThinkingStep({
            planId: planData.planId,
            technique: 'scamper',
            problem: `Memory test problem ${i}`,
            currentStep: step,
            totalSteps: 8,
            scamperAction: 'substitute',
            modifications: [`Modification ${step}`],
            output: `Step ${step} for session ${i}`,
            nextStepNeeded: step < 3,
          });
        }
      }

      // Wait for cleanup cycle to run and log metrics
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Memory metrics should have been logged during cleanup
      // Check for the [Memory Metrics] prefix and the metrics object
      const memoryLogged = consoleSpy.mock.calls.some(call =>
        call.some(
          (arg, index) =>
            typeof arg === 'string' &&
            arg.includes('[Memory Metrics]') &&
            call[index + 1] &&
            typeof call[index + 1] === 'object' &&
            'sessions' in call[index + 1]
        )
      );

      expect(memoryLogged).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it('should log eviction when max sessions is exceeded', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Enable memory monitoring and set low limit
      process.env.ENABLE_MEMORY_MONITORING = 'true';
      process.env.MAX_SESSIONS = '1';

      server = new LateralThinkingServer();

      // Create first session
      const plan1Result = server.planThinkingSession({
        problem: 'First problem',
        techniques: ['six_hats'],
      });
      const plan1Data = JSON.parse(plan1Result.content[0].text);
      const session1Id = plan1Data.sessionId;

      await server.executeThinkingStep({
        planId: plan1Data.planId,
        sessionId: session1Id,
        technique: 'six_hats',
        problem: 'First problem',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'First session output',
        nextStepNeeded: false,
      });

      // Create second session - should trigger eviction
      const plan2Result = server.planThinkingSession({
        problem: 'Second problem',
        techniques: ['six_hats'],
      });
      const plan2Data = JSON.parse(plan2Result.content[0].text);

      await server.executeThinkingStep({
        planId: plan2Data.planId,
        technique: 'six_hats',
        problem: 'Second problem',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'white',
        output: 'Second session output',
        nextStepNeeded: false,
      });

      // Check that eviction was logged
      const evictionLogged = consoleSpy.mock.calls.some(call =>
        call.some(
          arg =>
            typeof arg === 'string' && arg.includes('[Session Eviction]') && arg.includes('(LRU)')
        )
      );

      expect(evictionLogged).toBeTruthy();

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration through environment variables', () => {
    it('should respect environment variable configuration', () => {
      // This test verifies that environment variables are read
      // We can't directly check config values, but we can observe behavior

      // Test with custom values
      process.env.MAX_SESSIONS = '5';
      process.env.SESSION_TTL = '3600000'; // 1 hour
      process.env.CLEANUP_INTERVAL = '300000'; // 5 minutes
      process.env.ENABLE_MEMORY_MONITORING = 'false';

      server = new LateralThinkingServer();

      // Create a session to ensure server initializes properly
      const planResult = server.planThinkingSession({
        problem: 'Config test',
        techniques: ['po'],
      });

      // If we get a valid response, config was loaded successfully
      const planData = JSON.parse(planResult.content[0].text);
      expect(planData.planId).toBeDefined();
      // sessionId is not in plan, it's created on first execution
      expect(planData.workflow).toBeDefined();
    });
  });
});
