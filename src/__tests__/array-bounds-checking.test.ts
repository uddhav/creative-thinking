import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type { ExecuteThinkingStepInput } from '../index.js';

interface PlanResponse {
  planId: string;
  workflow: Array<{ technique: string; stepNumber: number }>;
  estimatedSteps: number;
  objectives: string[];
  successCriteria: string[];
  createdAt: number;
}

interface ExecutionResponse {
  sessionId: string;
  technique: string;
  currentStep: number;
  totalSteps: number;
  nextStepNeeded: boolean;
  historyLength: number;
  branches: string[];
  nextStepGuidance?: string;
  error?: string;
}

describe('Array Bounds Checking Integration Tests', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    // Ensure thought logging is enabled for testing
    process.env.DISABLE_THOUGHT_LOGGING = '';
    server = new LateralThinkingServer();
  });

  describe('getNextStepGuidance bounds checking', () => {
    const techniquesWithArrays = [
      { technique: 'triz' as const, maxSteps: 4 },
      { technique: 'neural_state' as const, maxSteps: 4 },
      { technique: 'temporal_work' as const, maxSteps: 5 },
      { technique: 'cross_cultural' as const, maxSteps: 5 },
      { technique: 'collective_intel' as const, maxSteps: 5 },
    ];

    techniquesWithArrays.forEach(({ technique, maxSteps }) => {
      describe(`${technique} technique`, () => {
        it('should handle negative step numbers gracefully', async () => {
          const planResult = await server.planThinkingSession({
            problem: 'Test problem',
            techniques: [technique],
          });
          const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

          const input: ExecuteThinkingStepInput = {
            planId: planResponse.planId,
            technique,
            problem: 'Test problem',
            currentStep: -1,
            totalSteps: maxSteps,
            output: 'Test output',
            nextStepNeeded: true,
          };

          const result = await server.executeThinkingStep(input);
          const response = JSON.parse(result.content[0].text) as ExecutionResponse;

          // Should contain "Complete the" and handle technique name transformation
          expect(response.nextStepGuidance).toContain('Complete the');
          expect(response.nextStepGuidance?.toLowerCase()).toContain(technique.replace(/_/g, ' '));
        });

        it('should handle step numbers beyond array bounds', async () => {
          const planResult = await server.planThinkingSession({
            problem: 'Test problem',
            techniques: [technique],
          });
          const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

          const input: ExecuteThinkingStepInput = {
            planId: planResponse.planId,
            technique,
            problem: 'Test problem',
            currentStep: maxSteps + 5, // Well beyond bounds
            totalSteps: maxSteps,
            output: 'Test output',
            nextStepNeeded: true,
          };

          const result = await server.executeThinkingStep(input);
          const response = JSON.parse(result.content[0].text) as ExecutionResponse;

          expect(response.nextStepGuidance).toContain('Complete the');
          expect(response.nextStepGuidance).not.toContain('undefined');
        });

        it('should handle zero step number', async () => {
          const planResult = await server.planThinkingSession({
            problem: 'Test problem',
            techniques: [technique],
          });
          const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

          const input: ExecuteThinkingStepInput = {
            planId: planResponse.planId,
            technique,
            problem: 'Test problem',
            currentStep: 0,
            totalSteps: maxSteps,
            output: 'Test output',
            nextStepNeeded: true,
          };

          const result = await server.executeThinkingStep(input);
          const response = JSON.parse(result.content[0].text) as ExecutionResponse;

          // For step 0, next step is 1, which should be valid
          expect(response.nextStepGuidance).toBeDefined();
          expect(response.nextStepGuidance).not.toContain('undefined');
          expect(response.nextStepGuidance).not.toContain('Unknown');
        });
      });
    });
  });

  describe('formatOutput bounds checking', () => {
    const techniquesWithArrays = [
      { technique: 'triz' as const, maxSteps: 4 },
      { technique: 'neural_state' as const, maxSteps: 4 },
      { technique: 'temporal_work' as const, maxSteps: 5 },
      { technique: 'cross_cultural' as const, maxSteps: 5 },
      { technique: 'collective_intel' as const, maxSteps: 5 },
    ];

    techniquesWithArrays.forEach(({ technique, maxSteps }) => {
      describe(`${technique} technique formatting`, () => {
        it('should display unknown step message for invalid step numbers', async () => {
          const planResult = await server.planThinkingSession({
            problem: 'Test problem',
            techniques: [technique],
          });
          const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

          // Test with invalid negative step
          const input: ExecuteThinkingStepInput = {
            planId: planResponse.planId,
            technique,
            problem: 'Test problem',
            currentStep: -5,
            totalSteps: maxSteps,
            output: 'Test output with invalid step',
            nextStepNeeded: false,
          };

          // Capture console output
          const originalConsoleError = console.error;
          let capturedOutput = '';
          console.error = (msg: string) => {
            capturedOutput += msg;
          };

          await server.executeThinkingStep(input);

          console.error = originalConsoleError;

          // Should show "Unknown [technique] step -5"
          expect(capturedOutput).toContain('Unknown');
          expect(capturedOutput).toContain('step -5');
        });

        it('should display unknown step message for steps beyond bounds', async () => {
          const planResult = await server.planThinkingSession({
            problem: 'Test problem',
            techniques: [technique],
          });
          const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

          const input: ExecuteThinkingStepInput = {
            planId: planResponse.planId,
            technique,
            problem: 'Test problem',
            currentStep: 999,
            totalSteps: maxSteps,
            output: 'Test output with out of bounds step',
            nextStepNeeded: false,
          };

          // Capture console output
          const originalConsoleError = console.error;
          let capturedOutput = '';
          console.error = (msg: string) => {
            capturedOutput += msg;
          };

          await server.executeThinkingStep(input);

          console.error = originalConsoleError;

          // Should show "Unknown [technique] step 999"
          expect(capturedOutput).toContain('Unknown');
          expect(capturedOutput).toContain('step 999');
        });
      });
    });
  });

  describe('Special case: temporal_work contextual guidance', () => {
    it('should handle missing session gracefully', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Test temporal problem',
        techniques: ['temporal_work'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

      // Execute step 2 which tries to reference step 1
      const input: ExecuteThinkingStepInput = {
        planId: planResponse.planId,
        technique: 'temporal_work',
        problem: 'Test temporal problem',
        currentStep: 1,
        totalSteps: 5,
        output: 'Step 2 without step 1 history',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(input);
      const response = JSON.parse(result.content[0].text) as ExecutionResponse;

      // Should fall back to generic guidance when history is missing
      expect(response.nextStepGuidance).toContain('Analyze circadian rhythms');
      expect(response.nextStepGuidance).not.toContain('undefined');
    });

    it('should handle temporal_work steps beyond case statements', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Test temporal problem',
        techniques: ['temporal_work'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

      const input: ExecuteThinkingStepInput = {
        planId: planResponse.planId,
        technique: 'temporal_work',
        problem: 'Test temporal problem',
        currentStep: 10, // Beyond the switch cases (1-5)
        totalSteps: 5,
        output: 'Step beyond normal range',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(input);
      const response = JSON.parse(result.content[0].text) as ExecutionResponse;

      // Should hit the default case
      expect(response.nextStepGuidance).toBe('Complete the Temporal Work Design process');
    });
  });

  describe('Hat color and SCAMPER action bounds', () => {
    it('should handle invalid hat color gracefully', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Test problem',
        techniques: ['six_hats'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

      const input: ExecuteThinkingStepInput = {
        planId: planResponse.planId,
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 7,
        output: 'Test with invalid hat',
        nextStepNeeded: false,
        hatColor: 'invalid_color' as ExecuteThinkingStepInput['hatColor'],
      };

      const result = await server.executeThinkingStep(input);

      // Verify that validation catches invalid hat color
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text) as {
        error: { code: string; message: string };
      };
      expect(errorData.error.code).toBe('INVALID_FIELD_VALUE');
      expect(errorData.error.message).toBe('Invalid hatColor for six_hats technique');
    });

    it('should handle invalid SCAMPER action gracefully', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Test problem',
        techniques: ['scamper'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

      const input: ExecuteThinkingStepInput = {
        planId: planResponse.planId,
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 7,
        output: 'Test with invalid action',
        nextStepNeeded: false,
        scamperAction: 'invalid_action' as ExecuteThinkingStepInput['scamperAction'],
      };

      const result = await server.executeThinkingStep(input);

      // Verify that validation catches invalid SCAMPER action
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text) as {
        error: { code: string; message: string };
      };
      expect(errorData.error.code).toBe('INVALID_FIELD_VALUE');
      expect(errorData.error.message).toBe('Invalid scamperAction for scamper technique');
    });
  });
});
