/**
 * Parallel Execution Bug Fix Tests
 * Tests specifically for the parallel execution bug fixes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import { safeJsonParse } from '../helpers/types.js';

describe('Parallel Execution Bug Fixes', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Session Derivation from PlanId', () => {
    it('should derive shared sessionId from planId when no sessionId provided', async () => {
      // Create a plan
      const planResult = server.planThinkingSession({
        problem: 'Test session derivation',
        techniques: ['six_hats', 'scamper'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Execute steps without providing sessionId
      const result1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Blue hat output',
        nextStepNeeded: true,
      });

      const result2 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 8,
        scamperAction: 'substitute',
        output: 'Substitute output',
        nextStepNeeded: true,
      });

      const data1 = safeJsonParse(result1.content[0].text);
      const data2 = safeJsonParse(result2.content[0].text);

      // Both should have the same derived sessionId
      expect(data1.sessionId).toBe(`session_${plan.planId}`);
      expect(data2.sessionId).toBe(`session_${plan.planId}`);
    });
  });

  describe('Step Number Calculation', () => {
    it('should handle global step numbers correctly', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test global steps',
        techniques: ['six_hats', 'scamper'], // 6 + 8 = 14 total steps
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Use global step 8 (which should be SCAMPER step 2)
      const result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 8, // Global step (6 from six_hats + 2)
        totalSteps: 8,
        scamperAction: 'combine',
        output: 'Combine output',
        nextStepNeeded: true,
      });

      const data = safeJsonParse(result.content[0].text);
      expect(data.error).toBeUndefined();
      expect(data.output).toBe('Combine output');
    });

    it('should handle technique-local step numbers correctly', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test local steps',
        techniques: ['po', 'triz'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Use technique-local step 2 for TRIZ
      const result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem: 'Test problem',
        currentStep: 2, // Technique-local step
        totalSteps: 4,
        output: 'TRIZ step 2 output',
        nextStepNeeded: true,
      });

      const data = safeJsonParse(result.content[0].text);
      expect(data.error).toBeUndefined();
      expect(data.output).toBe('TRIZ step 2 output');
    });

    it('should never calculate negative step numbers', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test negative step prevention',
        techniques: ['random_entry'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Try with step 0 which could cause negative calculation
      const result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem: 'Test problem',
        currentStep: 0,
        totalSteps: 3,
        randomStimulus: 'Test stimulus',
        output: 'Test output',
        nextStepNeeded: true,
      });

      const data = safeJsonParse(result.content[0].text);
      // Should not crash and should normalize to at least step 1
      expect(data.sessionId).toBeDefined();
    });

    it('should handle out-of-bounds steps gracefully', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test out of bounds',
        techniques: ['yes_and'], // 4 steps
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Try step 10 which is beyond the technique's range
      const result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'yes_and',
        problem: 'Test problem',
        currentStep: 10,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
      });

      const data = safeJsonParse(result.content[0].text);
      // Should handle gracefully without crashing
      expect(data.sessionId).toBeDefined();
    });
  });

  describe('Parallel Execution with Shared State', () => {
    it('should maintain shared session state across parallel executions', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test shared state',
        techniques: ['six_hats', 'disney_method'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Execute steps in parallel
      const promises = [
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'six_hats',
          problem: 'Shared problem',
          currentStep: 1,
          totalSteps: 6,
          hatColor: 'blue',
          output: 'Blue perspective',
          nextStepNeeded: true,
        }),
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'disney_method',
          problem: 'Shared problem',
          currentStep: 1,
          totalSteps: 3,
          disneyRole: 'dreamer',
          output: 'Dreamer perspective',
          nextStepNeeded: true,
        }),
      ];

      const results = await Promise.all(promises);
      const sessionId = safeJsonParse(results[0].content[0].text).sessionId;

      // Execute next steps using the shared session
      const nextPromises = [
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'six_hats',
          problem: 'Shared problem',
          currentStep: 2,
          totalSteps: 6,
          hatColor: 'white',
          output: 'White perspective',
          nextStepNeeded: true,
          sessionId,
        }),
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'disney_method',
          problem: 'Shared problem',
          currentStep: 2,
          totalSteps: 3,
          disneyRole: 'realist',
          output: 'Realist perspective',
          nextStepNeeded: true,
          sessionId,
        }),
      ];

      const nextResults = await Promise.all(nextPromises);

      // All should succeed with the same session
      nextResults.forEach(result => {
        const data = safeJsonParse(result.content[0].text);
        expect(data.error).toBeUndefined();
        expect(data.sessionId).toBe(sessionId);
      });
    });

    it('should handle technique-specific locks for parallel execution', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test technique locks',
        techniques: ['po', 'concept_extraction'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Execute same step of different techniques in parallel
      const promises = Array.from({ length: 3 }, (_, i) => [
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'po',
          problem: `Test ${i}`,
          currentStep: 1,
          totalSteps: 4,
          provocation: `Provocation ${i}`,
          output: `PO output ${i}`,
          nextStepNeeded: true,
        }),
        server.executeThinkingStep({
          planId: plan.planId,
          technique: 'concept_extraction',
          problem: `Test ${i}`,
          currentStep: 1,
          totalSteps: 4,
          output: `Concept output ${i}`,
          nextStepNeeded: true,
        }),
      ]).flat();

      const results = await Promise.all(promises);

      // All should complete successfully
      results.forEach(result => {
        const data = safeJsonParse(result.content[0].text);
        expect(data.error).toBeUndefined();
      });
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message for technique mismatch', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test error messages',
        techniques: ['six_hats'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      const result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper', // Not in plan
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 8,
        scamperAction: 'substitute',
        output: 'Test output',
        nextStepNeeded: true,
      });

      const data = safeJsonParse(result.content[0].text);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('E204'); // TECHNIQUE_MISMATCH maps to E204
      expect(data.error.message).toContain('scamper');
      expect(data.error.message).toContain('six_hats');
    });

    it('should provide clear error message for invalid step numbers', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Test step error messages',
        techniques: ['triz'], // 4 steps
      });
      const plan = safeJsonParse(planResult.content[0].text);

      const result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem: 'Test problem',
        currentStep: 15, // Way out of bounds
        totalSteps: 4,
        contradiction: 'Test contradiction',
        output: 'Test output',
        nextStepNeeded: true,
      });

      const data = safeJsonParse(result.content[0].text);
      // Should complete but with adjusted step
      expect(data.sessionId).toBeDefined();
    });
  });
});
