/**
 * Tests for LLM workflow validation and error messages
 * Ensures LLMs receive helpful guidance when making mistakes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type { ExecuteThinkingStepInput } from '../index.js';

describe('LLM Workflow Validation', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Workflow Enforcement', () => {
    it('should require planId to enforce workflow', async () => {
      const input: ExecuteThinkingStepInput = {
        // No planId - violates workflow
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 5,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.error).toBe(
        '❌ MISSING REQUIRED FIELD: planId is required to execute thinking steps'
      );
      expect(response.workflow).toContain(
        'discover_techniques → plan_thinking_session → execute_thinking_step'
      );
    });
  });

  describe('Invalid Technique Handling', () => {
    it('should provide helpful error when using non-existent technique', async () => {
      // First create a valid plan to get a planId
      const planResult = server.planThinkingSession({
        problem: 'Test problem',
        techniques: ['six_hats'],
      });
      const planResponse = JSON.parse(planResult.content[0].text);

      const input: ExecuteThinkingStepInput = {
        planId: planResponse.planId, // Use valid planId
        technique: 'contrarian_thinking' as any, // Invalid technique
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 5,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(input);
      const response = JSON.parse(result.content[0].text);

      // Should get an error - either technique mismatch or invalid technique
      expect(response.error).toBeDefined();

      // Check if it's a technique mismatch error (from plan validation)
      if (response.error === 'Technique mismatch') {
        expect(response.plannedTechniques).toContain('six_hats');
        expect(response.requestedTechnique).toBe('contrarian_thinking');
      } else {
        // Otherwise check for invalid technique error
        const errorMessage =
          typeof response.error === 'string' ? response.error : response.error.message;
        expect(errorMessage).toContain('❌ INVALID TECHNIQUE');
      }
    });
  });

  describe('Missing Plan Validation', () => {
    it('should provide workflow guidance when planId does not exist', async () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'fake-plan-id',
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 7,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(input);
      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);

      // Should get an error with enhanced error format
      expect(response.error.code).toBe('E202');
      expect(response.error.message).toContain('Plan');
      expect(response.error.message).toContain('not found');
      expect(response.error.category).toBe('state');
      expect(response.error.recovery).toBeDefined();
      expect(response.error.recovery.length).toBeGreaterThan(0);

      // The recovery guidance should include workflow information
      const recoveryText = response.error.recovery.join(' ');
      expect(recoveryText).toMatch(/plan|planId|create|new/i);
    });
  });

  describe('Discovery Response Enhancement', () => {
    it('should include available techniques and workflow guidance', () => {
      const result = server.discoverTechniques({
        problem: 'How to improve team collaboration',
      });
      const response = JSON.parse(result.content[0].text);

      // Should include available techniques
      expect(response.availableTechniques).toBeDefined();
      expect(response.availableTechniques).toContain('six_hats');
      expect(response.availableTechniques).toContain('disney_method');
      expect(response.availableTechniques).toHaveLength(14);

      // Should include workflow reminder
      expect(response.workflowReminder).toBeDefined();
      expect(response.workflowReminder.currentStep).toBe(1);
      expect(response.workflowReminder.totalSteps).toBe(3);
      expect(response.workflowReminder.steps).toHaveLength(3);
    });
  });

  describe('Planning Response Enhancement', () => {
    it('should include workflow reminder and emphasis on using planId', () => {
      const discoverResult = server.discoverTechniques({
        problem: 'Test problem',
      });
      const discoverResponse = JSON.parse(discoverResult.content[0].text);
      const recommendedTechnique = discoverResponse.recommendations[0].technique;

      const planResult = server.planThinkingSession({
        problem: 'Test problem',
        techniques: [recommendedTechnique],
      });
      const planResponse = JSON.parse(planResult.content[0].text);

      // Should include workflow reminder
      expect(planResponse.workflowReminder).toBeDefined();
      expect(planResponse.workflowReminder.currentStep).toBe(2);
      expect(planResponse.workflowReminder.steps[1]).toContain('current');

      // Should emphasize using the returned planId
      expect(planResponse.nextSteps).toBeDefined();
      expect(planResponse.nextSteps.important).toContain('Always use the planId');
      expect(planResponse.nextSteps.important).toContain('Do not skip');
    });
  });

  describe('Complete Workflow Test', () => {
    it('should guide LLM through complete workflow successfully', async () => {
      // Step 1: Discovery
      const discoverResult = server.discoverTechniques({
        problem: 'How to reduce stress',
      });
      const discoverResponse = JSON.parse(discoverResult.content[0].text);

      expect(discoverResponse.recommendations).toBeDefined();
      expect(discoverResponse.nextStepGuidance.nextTool).toBe('plan_thinking_session');

      // Step 2: Planning
      const planResult = server.planThinkingSession({
        problem: 'How to reduce stress',
        techniques: [discoverResponse.recommendations[0].technique],
      });
      const planResponse = JSON.parse(planResult.content[0].text);

      expect(planResponse.planId).toBeDefined();
      expect(planResponse.nextSteps.firstCall.parameters.planId).toBe(planResponse.planId);

      // Step 3: Execution
      const executeResult = await server.executeThinkingStep({
        planId: planResponse.planId,
        technique: planResponse.nextSteps.firstCall.parameters.technique,
        problem: 'How to reduce stress',
        currentStep: 1,
        totalSteps: planResponse.nextSteps.firstCall.parameters.totalSteps,
        output: 'Initial thoughts on stress reduction',
        nextStepNeeded: true,
      });
      const executeResponse = JSON.parse(executeResult.content[0].text);

      expect(executeResponse.sessionId).toBeDefined();
      expect(executeResponse.nextStepGuidance).toBeDefined();
      expect(executeResponse.error).toBeUndefined();
    });
  });
});
