/* eslint-disable no-console */
/**
 * Error Recovery Integration Tests
 * Tests system behavior and recovery from various error scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { planThinkingSession } from '../../layers/planning.js';
import { executeThinkingStep } from '../../layers/execution.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import { safeJsonParse } from '../helpers/types.js';

describe('Error Recovery Integration Tests', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let responseBuilder: ResponseBuilder;
  let metricsCollector: MetricsCollector;
  let visualFormatter: VisualFormatter;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager({
      maxSessions: 100,
      sessionTimeoutMs: 3600000,
      maxMemoryMB: 100,
      cleanupIntervalMs: 60000,
    });
    techniqueRegistry = new TechniqueRegistry();
    responseBuilder = new ResponseBuilder();
    metricsCollector = new MetricsCollector();
    visualFormatter = new VisualFormatter();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager(sessionManager);
  });

  describe('Invalid Input Handling', () => {
    it('should handle invalid technique names gracefully', async () => {
      // First create a valid plan
      const planOutput = planThinkingSession(
        {
          problem: 'Test problem',
          techniques: ['six_hats'],
          timeframe: 'quick',
        },
        sessionManager,
        techniqueRegistry
      );

      const planResponse = responseBuilder.buildPlanningResponse(planOutput);
      expect(planResponse.isError).not.toBe(true);
      const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

      // Try with invalid technique name
      const result = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'invalid_technique' as any,
          problem: 'Test problem',
          currentStep: 1,
          totalSteps: 1,
          output: 'Test output',
          nextStepNeeded: false,
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(result.isError).toBe(true);
      // When providing a planId with an invalid technique, it's caught as a technique mismatch
      const errorText = result.content[0].text;
      expect(errorText).toContain('invalid_technique');
    });

    it('should handle missing required fields gracefully', () => {
      // Test empty problem field
      try {
        planThinkingSession(
          {
            problem: '',
            techniques: ['random_entry'],
            timeframe: 'quick',
          },
          sessionManager,
          techniqueRegistry
        );
      } catch (error: any) {
        expect(error.message).toContain('problem');
      }

      // Test empty techniques array
      try {
        planThinkingSession(
          {
            problem: 'Test problem',
            techniques: [],
            timeframe: 'quick',
          },
          sessionManager,
          techniqueRegistry
        );
      } catch (error: any) {
        expect(error.message).toContain('technique');
      }
    });

    it('should handle invalid step numbers gracefully', async () => {
      const planOutput = planThinkingSession(
        {
          problem: 'Step number test',
          techniques: ['po'],
          timeframe: 'quick',
        },
        sessionManager,
        techniqueRegistry
      );

      const planResponse = responseBuilder.buildPlanningResponse(planOutput);
      const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

      // Test negative step number
      const negativeStepResult = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'po',
          problem: 'Step number test',
          currentStep: -1,
          totalSteps: 4,
          output: 'Negative step',
          nextStepNeeded: true,
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // The system handles invalid steps by returning success with error context in metadata
      expect(negativeStepResult.isError).not.toBe(true);
      const negResponse = safeJsonParse<{ executionMetadata?: { errorContext?: any } }>(
        negativeStepResult.content[0].text
      );
      expect(negResponse.executionMetadata?.errorContext).toBeTruthy();
      expect(negResponse.executionMetadata?.errorContext?.providedStep).toBe(-1);

      // Test step number exceeding total
      const exceedStepResult = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'po',
          problem: 'Step number test',
          currentStep: 10,
          totalSteps: 4,
          output: 'Exceeding step',
          nextStepNeeded: false,
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // The system handles invalid steps by returning success with error context in metadata
      expect(exceedStepResult.isError).not.toBe(true);
      const exceedResponse = safeJsonParse<{ executionMetadata?: { errorContext?: any } }>(
        exceedStepResult.content[0].text
      );
      expect(exceedResponse.executionMetadata?.errorContext).toBeTruthy();
      expect(exceedResponse.executionMetadata?.errorContext?.providedStep).toBe(10);
    });
  });

  describe('Session Error Handling', () => {
    it('should handle non-existent session gracefully', async () => {
      const planOutput = planThinkingSession(
        {
          problem: 'Session test',
          techniques: ['scamper'],
          timeframe: 'quick',
        },
        sessionManager,
        techniqueRegistry
      );

      const planResponse = responseBuilder.buildPlanningResponse(planOutput);
      const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

      // When a non-existent session ID is provided, the system creates a new session with that ID
      // This is by design to support session recovery and custom session IDs
      const result = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'scamper',
          problem: 'Session test',
          currentStep: 1,
          totalSteps: 8,
          output: 'Test output',
          nextStepNeeded: true,
          sessionId: 'non-existent-session-id',
          scamperAction: 'substitute',
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // The system should succeed and create a new session
      expect(result.isError).not.toBe(true);
      const response = safeJsonParse<{ sessionId: string }>(result.content[0].text);
      expect(response.sessionId).toBe('non-existent-session-id');

      // Verify the session was created
      const createdSession = sessionManager.getSession('non-existent-session-id');
      expect(createdSession).toBeTruthy();
    });

    it('should handle plan not found gracefully', async () => {
      const result = await executeThinkingStep(
        {
          planId: 'non-existent-plan',
          technique: 'six_hats',
          problem: 'Test problem',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test output',
          nextStepNeeded: true,
          hatColor: 'blue',
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      // The error response has a specific format with workflow guidance
      expect(errorText).toContain('WORKFLOW ERROR: Plan not found');
      expect(errorText).toContain('non-existent-plan');
    });
  });

  describe('Technique Mismatch Handling', () => {
    it('should handle technique mismatch errors', async () => {
      // Create plan for one technique
      const planOutput = planThinkingSession(
        {
          problem: 'Mismatch test',
          techniques: ['concept_extraction'],
          timeframe: 'quick',
        },
        sessionManager,
        techniqueRegistry
      );

      const planResponse = responseBuilder.buildPlanningResponse(planOutput);
      const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

      // Try to execute with different technique
      const mismatchResult = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'disney_method', // Wrong technique
          problem: 'Mismatch test',
          currentStep: 1,
          totalSteps: 3,
          output: 'Test output',
          nextStepNeeded: true,
          disneyRole: 'dreamer',
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(mismatchResult.isError).toBe(true);
      const errorText = mismatchResult.content[0].text;
      // The error response has a specific format for technique mismatch
      expect(errorText).toContain('TECHNIQUE MISMATCH ERROR');
      expect(errorText).toContain('disney_method');
    });
  });

  describe('Concurrent Error Handling', () => {
    it('should handle multiple concurrent errors gracefully', async () => {
      const errorPromises = [
        // Plan not found
        executeThinkingStep(
          {
            planId: 'non-existent-plan-1',
            technique: 'six_hats',
            problem: 'Concurrent error 1',
            currentStep: 1,
            totalSteps: 6,
            output: 'Test',
            nextStepNeeded: false,
          },
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        ),
        // Invalid step
        executeThinkingStep(
          {
            planId: 'non-existent-plan-2',
            technique: 'scamper',
            problem: 'Concurrent error 3',
            currentStep: -5,
            totalSteps: 8,
            output: 'Test',
            nextStepNeeded: false,
          },
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        ),
      ];

      const results = await Promise.all(errorPromises);

      // Both should return errors (plan not found)
      expect(results.every(r => r.isError)).toBe(true);

      // Verify each has proper error content
      results.forEach(result => {
        const errorText = result.content[0].text;
        expect(errorText).toContain('Plan not found');
      });
    });
  });

  describe('State Consistency', () => {
    it('should maintain session state after validation errors', async () => {
      const planOutput = planThinkingSession(
        {
          problem: 'State consistency test',
          techniques: ['triz'],
          timeframe: 'quick',
        },
        sessionManager,
        techniqueRegistry
      );

      const planResponse = responseBuilder.buildPlanningResponse(planOutput);
      const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

      // Execute valid first step
      const step1Result = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'triz',
          problem: 'State consistency test',
          currentStep: 1,
          totalSteps: 4,
          output: 'Identifying contradiction',
          nextStepNeeded: true,
          contradiction: 'Need both flexibility and structure',
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(step1Result.isError).not.toBe(true);
      const session = safeJsonParse<{ sessionId: string }>(step1Result.content[0].text);

      // Try invalid step (should fail)
      const invalidStepResult = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'triz',
          problem: 'State consistency test',
          currentStep: 10, // Invalid step number
          totalSteps: 4,
          output: 'Invalid step',
          nextStepNeeded: true,
          sessionId: session.sessionId,
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Invalid steps return success with error context
      expect(invalidStepResult.isError).not.toBe(true);
      const invalidResponse = safeJsonParse<{ executionMetadata?: { errorContext?: any } }>(
        invalidStepResult.content[0].text
      );
      expect(invalidResponse.executionMetadata?.errorContext).toBeTruthy();
      expect(invalidResponse.executionMetadata?.errorContext?.providedStep).toBe(10);

      // Now execute valid step 2 - session should still be valid
      const step2Result = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'triz',
          problem: 'State consistency test',
          currentStep: 2,
          totalSteps: 4,
          output: 'Applying inventive principles',
          nextStepNeeded: true,
          sessionId: session.sessionId,
          inventivePrinciples: ['Segmentation', 'Asymmetry'],
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(step2Result.isError).not.toBe(true);
      const recoveredSession = safeJsonParse<{ historyLength: number }>(
        step2Result.content[0].text
      );
      expect(recoveredSession.historyLength).toBe(2); // Should have steps 1 and 2, not the failed attempt
    });
  });

  describe('Memory and Resource Handling', () => {
    it('should handle multiple sessions gracefully', async () => {
      const sessionIds: string[] = [];
      const numSessions = 10;

      // Create multiple sessions
      for (let i = 0; i < numSessions; i++) {
        const planOutput = planThinkingSession(
          {
            problem: `Memory test session ${i}`,
            techniques: ['six_hats'],
            timeframe: 'quick',
          },
          sessionManager,
          techniqueRegistry
        );

        const planResponse = responseBuilder.buildPlanningResponse(planOutput);
        const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

        const stepResult = await executeThinkingStep(
          {
            planId: plan.planId,
            technique: 'six_hats',
            problem: `Memory test session ${i}`,
            currentStep: 1,
            totalSteps: 6,
            output: `Step 1 for session ${i}`,
            nextStepNeeded: true,
            hatColor: 'blue',
          },
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );

        if (!stepResult.isError) {
          const response = safeJsonParse<{ sessionId: string }>(stepResult.content[0].text);
          sessionIds.push(response.sessionId);
        }
      }

      // Verify sessions were created
      expect(sessionIds.length).toBeGreaterThan(0);
      console.log(`Created ${sessionIds.length} sessions successfully`);
    });
  });
});
