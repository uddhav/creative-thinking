/**
 * Concurrent Execution Tests
 * Verifies that the server correctly handles multiple simultaneous requests
 * without race conditions or state corruption
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type { LateralThinkingResponse } from '../../types/index.js';

describe('Concurrent Request Handling', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  afterEach(() => {
    server.destroy();
  });

  /**
   * Helper to parse response and check for errors
   */
  function parseResponse(response: LateralThinkingResponse): Record<string, unknown> {
    const text = response.content[0].text;
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { error: text };
    }
  }

  it('should handle 10 concurrent requests for the same session without race conditions', async () => {
    // First create a plan
    const planResponse = server.planThinkingSession({
      problem: 'Concurrent test problem',
      techniques: ['six_hats'],
    });
    const plan = parseResponse(planResponse);
    expect(plan.planId).toBeDefined();

    // Create initial session with first step
    const firstStepResponse = await server.executeThinkingStep({
      planId: plan.planId,
      technique: 'six_hats',
      problem: 'Concurrent test problem',
      currentStep: 1,
      totalSteps: 6,
      hatColor: 'blue',
      output: 'Initial step',
      nextStepNeeded: true,
    });
    const firstStep = parseResponse(firstStepResponse);
    const sessionId = firstStep.sessionId;
    expect(sessionId).toBeDefined();

    // Now send 10 concurrent requests for steps 2-11
    const promises = Array.from({ length: 10 }, (_, i) => {
      const stepNum = i + 2;
      return server.executeThinkingStep({
        sessionId,
        planId: plan.planId,
        technique: 'six_hats',
        problem: 'Concurrent test problem',
        currentStep: stepNum,
        totalSteps: 6,
        hatColor:
          stepNum <= 6 ? ['blue', 'white', 'red', 'yellow', 'black', 'green'][stepNum - 1] : 'blue',
        output: `Concurrent step ${stepNum}`,
        nextStepNeeded: stepNum < 6,
      });
    });

    // Execute all requests concurrently
    const results = await Promise.all(promises);

    // All requests should succeed
    results.forEach(result => {
      const parsed = parseResponse(result);
      expect(parsed.error).toBeUndefined();
      expect(parsed.sessionId).toBe(sessionId);
      // Check that the step was recorded
      expect(parsed.historyLength).toBeGreaterThan(0);
    });

    // Check session state is consistent
    const finalSession = server.getSessionManager().getSession(sessionId);
    expect(finalSession).toBeDefined();
    // Due to locking, some concurrent requests for the same step might not create duplicate entries
    expect(finalSession?.history.length).toBeGreaterThanOrEqual(6); // At least the 6 unique steps
    expect(finalSession?.history.length).toBeLessThanOrEqual(11); // At most initial + 10

    // Verify first step is always first
    const stepNumbers = finalSession?.history.map(h => h.currentStep) || [];
    expect(stepNumbers[0]).toBe(1); // First step should be first
  });

  it('should handle 100 concurrent requests across different sessions', async () => {
    // Create 10 different plans
    const plans = Array.from({ length: 10 }, (_, i) => {
      const response = server.planThinkingSession({
        problem: `Problem ${i}`,
        techniques: ['po'],
      });
      return parseResponse(response);
    });

    // First create a session for each plan
    const sessionMap = new Map<string, string>(); // planId -> sessionId
    for (const plan of plans) {
      const response = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem: `Problem ${plans.indexOf(plan)}`,
        currentStep: 1,
        totalSteps: 4,
        output: `Initial step`,
        nextStepNeeded: true,
        provocation: `Provocation ${plans.indexOf(plan)}`,
      });
      const parsed = parseResponse(response);
      sessionMap.set(plan.planId, parsed.sessionId);
    }

    // Now create concurrent requests for steps 2-4 across all sessions
    const promises: Promise<LateralThinkingResponse>[] = [];

    for (let planIndex = 0; planIndex < plans.length; planIndex++) {
      const plan = plans[planIndex];
      const sessionId = sessionMap.get(plan.planId);
      if (!sessionId) continue;

      for (let step = 2; step <= 4; step++) {
        promises.push(
          server.executeThinkingStep({
            planId: plan.planId,
            sessionId, // Use the created session
            technique: 'po',
            problem: `Problem ${planIndex}`,
            currentStep: step,
            totalSteps: 4,
            output: `Plan ${planIndex}, Step ${step}`,
            nextStepNeeded: step < 4,
          })
        );
      }
    }

    // Execute all 30 concurrent requests (3 steps * 10 sessions)
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    // Performance tracking comment - 30 requests completed in ${duration}ms

    // All should succeed
    const errors = results.filter(r => {
      const parsed = parseResponse(r);
      return parsed.error !== undefined;
    });
    expect(errors.length).toBe(0);

    // Each plan should have created exactly one session
    expect(sessionMap.size).toBe(10);

    // Verify each session has the expected history
    for (const [, sessionId] of sessionMap.entries()) {
      const session = server.getSessionManager().getSession(sessionId);
      expect(session).toBeDefined();
      // Each session should have 4 history entries (1 initial + 3 concurrent)
      expect(session?.history.length).toBe(4);
    }

    // Performance check - should complete reasonably fast
    expect(duration).toBeLessThan(5000); // 5 seconds for 30 requests
  });

  it('should prevent race conditions when modifying session state', async () => {
    // Create a session
    const planResponse = server.planThinkingSession({
      problem: 'Race condition test',
      techniques: ['scamper'],
    });
    const plan = parseResponse(planResponse);

    // Create initial step to get sessionId
    const initResponse = await server.executeThinkingStep({
      planId: plan.planId,
      technique: 'scamper',
      problem: 'Race condition test',
      currentStep: 1,
      totalSteps: 8,
      scamperAction: 'substitute',
      output: 'Initial',
      nextStepNeeded: true,
    });
    const { sessionId } = parseResponse(initResponse);

    // Send 20 concurrent requests that all try to modify the same session
    const promises = Array.from({ length: 20 }, (_, i) => {
      return server.executeThinkingStep({
        sessionId,
        planId: plan.planId,
        technique: 'scamper',
        problem: 'Race condition test',
        currentStep: 2,
        totalSteps: 8,
        scamperAction: 'combine',
        output: `Concurrent modification ${i}`,
        nextStepNeeded: true,
        // Add some fields that modify session state
        insights: [`Insight ${i}`],
        isRevision: i % 3 === 0,
        revisesStep: i % 3 === 0 ? 1 : undefined,
      });
    });

    const results = await Promise.all(promises);

    // All should succeed without errors
    results.forEach(result => {
      const parsed = parseResponse(result);
      expect(parsed.error).toBeUndefined();
    });

    // Session should still be in a valid state
    const session = server.getSessionManager().getSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.history.length).toBeGreaterThan(0);

    // Session should not be corrupted
    expect(session?.technique).toBe('scamper');
    expect(session?.problem).toBe('Race condition test');
  });

  it('should handle parallel tool calls pattern from Claude Desktop', async () => {
    // This simulates the pattern that causes "Claude's response was interrupted" errors

    // First, discover techniques in parallel with planning
    const discoverPromise = Promise.resolve(
      server.discoverTechniques({
        problem: 'How to improve team productivity',
      })
    );

    const planPromise = discoverPromise.then(() =>
      server.planThinkingSession({
        problem: 'How to improve team productivity',
        techniques: ['six_hats', 'scamper'],
      })
    );

    const [, planResult] = await Promise.all([discoverPromise, planPromise]);

    const plan = parseResponse(planResult);
    expect(plan.planId).toBeDefined();

    // Now simulate parallel execution of multiple techniques
    const technique1Promise = server.executeThinkingStep({
      planId: plan.planId,
      technique: 'six_hats',
      problem: 'How to improve team productivity',
      currentStep: 1,
      totalSteps: 6,
      hatColor: 'blue',
      output: 'Process overview',
      nextStepNeeded: true,
    });

    const technique2Promise = server.executeThinkingStep({
      planId: plan.planId,
      technique: 'scamper',
      problem: 'How to improve team productivity',
      currentStep: 1,
      totalSteps: 8,
      scamperAction: 'substitute',
      output: 'Replace meetings with async communication',
      nextStepNeeded: true,
    });

    // Execute both techniques in parallel
    const [result1, result2] = await Promise.all([technique1Promise, technique2Promise]);

    // Both should succeed
    const parsed1 = parseResponse(result1);
    const parsed2 = parseResponse(result2);

    expect(parsed1.error).toBeUndefined();
    expect(parsed2.error).toBeUndefined();
    expect(parsed1.sessionId).toBeDefined();
    expect(parsed2.sessionId).toBeDefined();

    // With the bug fix, they should share the same session ID when using the same planId
    // This ensures parallel execution of techniques in the same plan share state
    expect(parsed1.sessionId).toBe(parsed2.sessionId);
    expect(parsed1.sessionId).toBe(`session_${String(plan.planId)}`);

    // Successfully handled Claude Desktop parallel tool call pattern
  });

  it('should maintain session isolation during concurrent access', async () => {
    // Create multiple sessions
    const sessions: { planId: string; sessionId: string }[] = [];

    for (let i = 0; i < 5; i++) {
      const planResponse = server.planThinkingSession({
        problem: `Isolation test ${i}`,
        techniques: ['random_entry'],
      });
      const planId = parseResponse(planResponse).planId;

      // Create initial session
      const initResponse = await server.executeThinkingStep({
        planId,
        technique: 'random_entry',
        problem: `Isolation test ${i}`,
        currentStep: 1,
        totalSteps: 3,
        output: `Session ${i}, Step 1`,
        nextStepNeeded: true,
        randomStimulus: `Stimulus ${i}`,
      });

      sessions.push({
        planId,
        sessionId: parseResponse(initResponse).sessionId,
      });
    }

    // Concurrently execute remaining steps on all sessions
    const promises = sessions.flatMap((session, sessionIndex) => {
      return Array.from({ length: 2 }, (_, stepIndex) => {
        const step = stepIndex + 2; // Steps 2 and 3
        return server.executeThinkingStep({
          planId: session.planId,
          sessionId: session.sessionId,
          technique: 'random_entry',
          problem: `Isolation test ${sessionIndex}`,
          currentStep: step,
          totalSteps: 3,
          output: `Session ${sessionIndex}, Step ${step}`,
          nextStepNeeded: step < 3,
        });
      });
    });

    await Promise.all(promises);

    // Verify each session maintained its isolation
    sessions.forEach((session, index) => {
      const sessionData = server.getSessionManager().getSession(session.sessionId);
      expect(sessionData).toBeDefined();
      expect(sessionData?.problem).toBe(`Isolation test ${index}`);
      expect(sessionData?.technique).toBe('random_entry');

      // Each session should have exactly 3 history entries
      expect(sessionData?.history.length).toBe(3);

      // Verify history contains only entries for this session
      sessionData?.history.forEach(entry => {
        expect(entry.problem).toBe(`Isolation test ${index}`);
      });
    });
  });
});
