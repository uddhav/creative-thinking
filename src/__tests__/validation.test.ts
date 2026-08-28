import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type { LateralTechnique } from '../index.js';

describe('Input Validation', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan for testing
  function createTestPlan(problem: string, technique: string): string {
    const planResult = server.planThinkingSession({
      problem,
      techniques: [technique as LateralTechnique],
    });
    const planData = JSON.parse(planResult.content[0].text) as { planId: string };
    return planData.planId;
  }

  describe('Thinking Operation Validation', () => {
    it('should validate required fields for thinking operations', async () => {
      // First create a plan
      const planId = createTestPlan('Test problem', 'six_hats');

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
      const planId = createTestPlan('Test problem', 'six_hats');

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
      const planId = createTestPlan('Test problem', 'six_hats');

      const input = {
        planId,
        technique: 'six_hats',
        // Deliberately absent: the plan states the problem once at plan scope
        // and its execution-graph nodes omit it, so a caller running those
        // nodes verbatim sends none. The server resolves it from the planId.
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError, 'a step naming a real plan was refused for its own problem').not.toBe(
        true
      );
      // Resolved from the plan, not invented: the text has to be the problem
      // the plan was created with.
      expect(result.content[0].text).toContain('Test problem');
    });

    it('should not use dummy values for thinking operations', async () => {
      const planId = createTestPlan('Test problem', 'six_hats');

      const input = {
        planId,
        technique: 'six_hats',
        // Missing currentStep, totalSteps, output, nextStepNeeded. `problem`
        // is resolvable from the plan; these are not resolvable from anywhere,
        // and the server must say so rather than substitute defaults.
      };

      const result = await server.processLateralThinking(input);
      expect(result.isError).toBe(true);
      // Names a field that is genuinely missing. This asserted 'Invalid
      // problem' when `problem` was required; the no-dummy-values claim it
      // exists to make is about fields the server cannot know, and `problem`
      // stopped being one of those.
      expect(result.content[0].text).toMatch(/currentStep|totalSteps|output|nextStepNeeded/);
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
      // Session operations should gracefully degrade when persistence is not available
      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.operation).toBe('list');
      expect(response.success).toBe(true);
      expect(response.result).toHaveProperty('sessions');
      expect(Array.isArray(response.result.sessions)).toBe(true);
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
      // Session operations should gracefully degrade when persistence is not available
      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.operation).toBe('list');
      // Importantly, it should NOT complain about missing technique/problem fields
      expect(result.content[0].text).not.toContain('Invalid technique');
      expect(result.content[0].text).not.toContain('Invalid problem');
    });
  });

  describe('Type Separation', () => {
    it('should handle thinking operations and session operations separately', async () => {
      // First create a plan
      const planId = createTestPlan('Test problem', 'six_hats');

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
      // Session operations should gracefully degrade
      expect(sessionResult.isError).toBeUndefined();
      const response = JSON.parse(sessionResult.content[0].text);
      expect(response.operation).toBe('list');
      expect(response.success).toBe(true);
      expect(response.result).toHaveProperty('sessions');
    });
  });
});
