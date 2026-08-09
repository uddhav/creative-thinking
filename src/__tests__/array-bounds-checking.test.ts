import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type { ExecuteThinkingStepInput } from '../index.js';
import { TemporalWorkHandler } from '../techniques/TemporalWorkHandler.js';

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

/**
 * An out-of-range step is rejected outright: no history entry is recorded and the
 * caller gets an E206 error response rather than a success-shaped payload with the
 * problem buried in executionMetadata.errorContext.
 */
interface StepErrorResponse {
  error: {
    code: string;
    message: string;
    context: {
      technique: string;
      providedStep: number;
      validRange: string;
    };
  };
}

describe('Array Bounds Checking Integration Tests', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    // Ensure thought logging is enabled for testing
    process.env.DISABLE_THOUGHT_LOGGING = '';
    server = new LateralThinkingServer();
  });

  describe('getNextStepGuidance bounds checking', () => {
    // maxSteps is what the caller declares as totalSteps; handlerSteps is the number of
    // steps the handler actually defines, which is what the error's validRange reports.
    const techniquesWithArrays = [
      { technique: 'triz' as const, maxSteps: 4, handlerSteps: 4 },
      { technique: 'neural_state' as const, maxSteps: 4, handlerSteps: 3 },
      { technique: 'temporal_work' as const, maxSteps: 5, handlerSteps: 5 },
      { technique: 'cultural_integration' as const, maxSteps: 5, handlerSteps: 5 },
      { technique: 'collective_intel' as const, maxSteps: 5, handlerSteps: 5 },
    ];

    techniquesWithArrays.forEach(({ technique, maxSteps, handlerSteps }) => {
      describe(`${technique} technique`, () => {
        it('should reject negative step numbers with an error', async () => {
          const planResult = server.planThinkingSession({
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
          const response = JSON.parse(result.content[0].text) as StepErrorResponse;

          // A step below 1 is rejected, not silently normalized into step 1 guidance
          expect(result.isError).toBe(true);
          expect(response.error.code).toBe('E206');
          expect(response.error.message).toBe(
            'Step -1 is invalid. Steps must be positive integers starting from 1.'
          );
          // The error names the technique and the range the caller should have used
          expect(response.error.context.technique).toBe(technique);
          expect(response.error.context.providedStep).toBe(-1);
          expect(response.error.context.validRange).toBe(`1-${handlerSteps}`);
        });

        it('should reject step numbers beyond array bounds with an error', async () => {
          const planResult = server.planThinkingSession({
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
          const response = JSON.parse(result.content[0].text) as StepErrorResponse;

          expect(result.isError).toBe(true);
          expect(response.error.code).toBe('E206');
          expect(response.error.message).toBe(
            `Step ${maxSteps + 5} exceeds total steps (${maxSteps}) for the plan.`
          );
          expect(response.error.message).not.toContain('undefined');
          expect(response.error.context.technique).toBe(technique);
          expect(response.error.context.providedStep).toBe(maxSteps + 5);
          expect(response.error.context.validRange).toBe(`1-${handlerSteps}`);
        });

        it('should reject step number zero with an error', async () => {
          const planResult = server.planThinkingSession({
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
          const response = JSON.parse(result.content[0].text) as StepErrorResponse;

          // Step 0 is not quietly rounded up to step 1 — steps are 1-indexed and 0 is an error
          expect(result.isError).toBe(true);
          expect(response.error.code).toBe('E206');
          expect(response.error.message).toBe(
            'Step 0 is invalid. Steps must be positive integers starting from 1.'
          );
          expect(response.error.message).not.toContain('undefined');
          expect(response.error.message).not.toContain('Unknown');
          expect(response.error.context.technique).toBe(technique);
          expect(response.error.context.providedStep).toBe(0);
          expect(response.error.context.validRange).toBe(`1-${handlerSteps}`);
        });
      });
    });
  });

  describe('formatOutput bounds checking', () => {
    const techniquesWithArrays = [
      { technique: 'triz' as const, maxSteps: 4, handlerSteps: 4 },
      { technique: 'neural_state' as const, maxSteps: 4, handlerSteps: 3 },
      { technique: 'temporal_work' as const, maxSteps: 5, handlerSteps: 5 },
      { technique: 'cultural_integration' as const, maxSteps: 5, handlerSteps: 5 },
      { technique: 'collective_intel' as const, maxSteps: 5, handlerSteps: 5 },
    ];

    techniquesWithArrays.forEach(({ technique, maxSteps, handlerSteps }) => {
      describe(`${technique} technique formatting`, () => {
        it('should return an error for invalid step numbers', async () => {
          const planResult = server.planThinkingSession({
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

          const result = await server.executeThinkingStep(input);
          const response = JSON.parse(result.content[0].text) as StepErrorResponse;

          // Should return an E206 error for an invalid step, not a success-shaped payload
          expect(result.isError).toBe(true);
          expect(response.error.code).toBe('E206');
          expect(response.error.message).toContain('invalid');
          expect(response.error.context.technique).toBe(technique);
          expect(response.error.context.providedStep).toBe(-5);
          expect(response.error.context.validRange).toBe(`1-${handlerSteps}`);
        });

        it('should return an error for steps beyond bounds', async () => {
          const planResult = server.planThinkingSession({
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

          const result = await server.executeThinkingStep(input);
          const response = JSON.parse(result.content[0].text) as StepErrorResponse;

          // Should return an E206 error for an out of bounds step
          expect(result.isError).toBe(true);
          expect(response.error.code).toBe('E206');
          expect(response.error.message).toContain('exceeds');
          expect(response.error.message).toBe(
            `Step 999 exceeds total steps (${maxSteps}) for the plan.`
          );
          expect(response.error.context.technique).toBe(technique);
          expect(response.error.context.providedStep).toBe(999);
          expect(response.error.context.validRange).toBe(`1-${handlerSteps}`);
        });
      });
    });
  });

  describe('Special case: temporal_work contextual guidance', () => {
    it('should handle missing session gracefully', async () => {
      const planResult = server.planThinkingSession({
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

    // executeThinkingStep rejects a step of 10 before any guidance is produced, so this
    // fallback is only reachable by calling the handler directly. Tested at that level so
    // the coverage of the out-of-range guidance arm survives.
    it('should handle temporal_work steps beyond case statements', () => {
      const handler = new TemporalWorkHandler();

      const guidance = handler.getStepGuidance(10, 'Test temporal problem');

      // Should hit the out-of-range fallback
      expect(guidance).toContain('Complete the Temporal Work Design process for:');
      expect(guidance).toBe(
        'Complete the Temporal Work Design process for: "Test temporal problem"'
      );
    });
  });

  describe('Hat color and SCAMPER action bounds', () => {
    it('should handle invalid hat color gracefully', async () => {
      const planResult = server.planThinkingSession({
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
      const planResult = server.planThinkingSession({
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
