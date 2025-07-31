import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';

describe('Input Validation', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan for testing
  async function createTestPlan(problem: string, technique: string): Promise<string> {
    const planResult = await server.planThinkingSession({
      problem,
      techniques: [technique as any],
    });
    const planData = JSON.parse(planResult.content[0].text) as { planId: string };
    return planData.planId;
  }

  describe('Thinking Operation Validation', () => {
    it('should validate required fields for thinking operations', async () => {
      // First create a plan
      const planId = await createTestPlan('Test problem', 'six_hats');

      const input = {
        planId,
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError).toBeUndefined();
    });

    it('should reject thinking operation with missing technique', async () => {
      const planId = await createTestPlan('Test problem', 'six_hats');

      const input = {
        planId,
        // Missing technique
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid technique');
    });

    it('should reject thinking operation with missing problem', async () => {
      const planId = await createTestPlan('Test problem', 'six_hats');

      const input = {
        planId,
        technique: 'six_hats',
        // Missing problem
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid problem');
    });

    it('should not use dummy values for thinking operations', async () => {
      const planId = await createTestPlan('Test problem', 'six_hats');

      const input = {
        planId,
        technique: 'six_hats',
        // Missing problem, currentStep, totalSteps, output, nextStepNeeded
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError).toBe(true);
      // Should fail validation, not proceed with dummy values
      expect(result.content[0].text).toContain('Invalid problem');
    });
  });

  describe('Session Operation Validation', () => {
    it('should handle session operations when persistence is not available', async () => {
      const input = {
        sessionOperation: 'list',
        listOptions: {
          limit: 10,
        },
      };

      const result = await server.processLateralThinking(input);
      // Session operations require persistence, so they should fail gracefully
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Persistence not available');
    });

    it('should validate load operation requires sessionId', async () => {
      const input = {
        sessionOperation: 'load',
        loadOptions: {
          // Missing sessionId
        },
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('sessionId is required');
    });

    it('should validate delete operation requires sessionId', async () => {
      const input = {
        sessionOperation: 'delete',
        deleteOptions: {
          // Missing sessionId
        },
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('sessionId is required');
    });

    it('should validate export operation requires sessionId and format', async () => {
      const inputNoSessionId = {
        sessionOperation: 'export',
        exportOptions: {
          format: 'json',
        },
      };

      const resultNoSessionId = await server.processLateralThinking(inputNoSessionId);
      expect(resultNoSessionId.isError).toBe(true);
      expect(resultNoSessionId.content[0].text).toContain('sessionId is required');

      const inputBadFormat = {
        sessionOperation: 'export',
        exportOptions: {
          sessionId: 'test-session',
          format: 'invalid',
        },
      };

      const resultBadFormat = await server.processLateralThinking(inputBadFormat);
      expect(resultBadFormat.isError).toBe(true);
      expect(resultBadFormat.content[0].text).toContain('Invalid export format');
    });

    it('should not require thinking operation fields for session operations', async () => {
      // This test verifies we're not using dummy values anymore
      const input = {
        sessionOperation: 'list',
        // Not providing technique, problem, currentStep, etc.
      };

      const result = await server.processLateralThinking(input);
      // Session operations require persistence, but validation should pass
      // The error should be about persistence, not validation
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Persistence not available');
      // Importantly, it should NOT complain about missing technique/problem fields
      expect(result.content[0].text).not.toContain('Invalid technique');
      expect(result.content[0].text).not.toContain('Invalid problem');
    });
  });

  describe('Type Separation', () => {
    it('should handle thinking operations and session operations separately', async () => {
      // First create a plan
      const planId = await createTestPlan('Test problem', 'six_hats');

      // First create a thinking operation session
      const thinkingInput = {
        planId,
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
        hatColor: 'blue',
      };

      const thinkingResult = await server.processLateralThinking(thinkingInput);
      expect(thinkingResult.isError).toBeUndefined();

      // Then perform a session operation
      const sessionInput = {
        sessionOperation: 'list',
      };

      const sessionResult = await server.processLateralThinking(sessionInput);
      // Session operations require persistence
      expect(sessionResult.isError).toBe(true);
      expect(sessionResult.content[0].text).toContain('Persistence not available');
    });
  });
});
