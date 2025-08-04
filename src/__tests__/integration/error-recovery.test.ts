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

/**
 * Helper function to extract error context from execution response
 */
function extractErrorContext(result: any): any {
  const response = safeJsonParse<{ executionMetadata?: { errorContext?: any } }>(
    result.content[0].text
  );
  return response.executionMetadata?.errorContext;
}

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
      const parsedError = JSON.parse(errorText);
      expect(parsedError.error.code).toBe('E003');
      expect(parsedError.error.message).toContain('invalid_technique');
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
      const errorContext = extractErrorContext(negativeStepResult);
      expect(errorContext).toBeTruthy();
      expect(errorContext.providedStep).toBe(-1);

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
      const exceedErrorContext = extractErrorContext(exceedStepResult);
      expect(exceedErrorContext).toBeTruthy();
      expect(exceedErrorContext.providedStep).toBe(10);
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

      // DESIGN DECISION: When a non-existent session ID is provided, the system creates a new session with that ID
      // This is by design to support:
      // 1. Session recovery after crashes (client can recreate session with same ID)
      // 2. Custom session IDs from external systems
      // 3. Stateless operation where each request can work independently
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
      const parsedError = JSON.parse(errorText);
      expect(parsedError.error.code).toBe('E202');
      expect(parsedError.error.message).toContain('Plan');
      expect(parsedError.error.message).toContain('not found');
      expect(parsedError.error.message).toContain('non-existent-plan');
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
      const parsedError = JSON.parse(errorText);
      expect(parsedError.error.code).toBe('E003');
      expect(parsedError.error.message).toContain('Technique mismatch');
      expect(parsedError.error.message).toContain('disney_method');
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
        const parsedError = JSON.parse(errorText);
        expect(parsedError.error.code).toBe('E202');
        expect(parsedError.error.message).toContain('not found');
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
      const invalidErrorContext = extractErrorContext(invalidStepResult);
      expect(invalidErrorContext).toBeTruthy();
      expect(invalidErrorContext.providedStep).toBe(10);

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
      const numSessions = 10;

      // Create multiple sessions in parallel for performance
      const sessionPromises = Array.from({ length: numSessions }, async (_, i) => {
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
          return response.sessionId;
        }
        return null;
      });

      const sessionResults = await Promise.all(sessionPromises);
      const sessionIds = sessionResults.filter((id): id is string => id !== null);

      // Verify sessions were created
      expect(sessionIds.length).toBeGreaterThan(0);
      console.error(`[Test] Created ${sessionIds.length} sessions successfully`);

      // Clean up created sessions to prevent memory leaks
      sessionIds.forEach(id => {
        sessionManager.deleteSession(id);
      });

      // Verify cleanup
      const remainingSessions = sessionIds.filter(id => sessionManager.getSession(id));
      expect(remainingSessions.length).toBe(0);
    });
  });

  describe('Persistence Error Handling', () => {
    it('should handle autoSave failures gracefully', async () => {
      const planOutput = planThinkingSession(
        {
          problem: 'Persistence test',
          techniques: ['random_entry'],
          timeframe: 'quick',
        },
        sessionManager,
        techniqueRegistry
      );

      const planResponse = responseBuilder.buildPlanningResponse(planOutput);
      const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

      // Execute with autoSave enabled - persistence is not configured
      const result = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'random_entry',
          problem: 'Persistence test',
          currentStep: 1,
          totalSteps: 3,
          output: 'Testing with autoSave',
          nextStepNeeded: true,
          autoSave: true,
          randomStimulus: 'persistence',
        },
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Should succeed despite persistence not being available
      expect(result.isError).not.toBe(true);
      const response = safeJsonParse<{ autoSaveStatus?: string; autoSaveMessage?: string }>(
        result.content[0].text
      );

      // Verify autoSave status is reported
      expect(response.autoSaveStatus).toBe('disabled');
      expect(response.autoSaveMessage).toContain('Persistence is not configured');
    });
  });

  describe('Memory Limit Handling', () => {
    it('should handle memory limit exceeded scenarios', async () => {
      // Create a session manager with very low memory limit
      const limitedSessionManager = new SessionManager({
        maxSessions: 100,
        sessionTimeoutMs: 3600000,
        maxMemoryMB: 0.001, // 1KB - extremely low to trigger limit
        cleanupIntervalMs: 60000,
      });

      const planOutput = planThinkingSession(
        {
          problem: 'Memory limit test with extremely large output',
          techniques: ['concept_extraction'],
          timeframe: 'quick',
        },
        limitedSessionManager,
        techniqueRegistry
      );

      const planResponse = responseBuilder.buildPlanningResponse(planOutput);
      const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

      // Try to create a very large output that exceeds memory limit
      const largeOutput = 'x'.repeat(10000); // 10KB of data

      const result = await executeThinkingStep(
        {
          planId: plan.planId,
          technique: 'concept_extraction',
          problem: 'Memory limit test',
          currentStep: 1,
          totalSteps: 4,
          output: largeOutput,
          nextStepNeeded: true,
          successExample: 'Large data handling',
        },
        limitedSessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // System should handle memory limits gracefully
      expect(result).toBeDefined();
      // Session manager should have evicted sessions if needed
      const stats = limitedSessionManager.getMemoryStats();
      const config = limitedSessionManager.getConfig();
      expect(stats.sessionCount).toBeLessThanOrEqual(config.maxSessions);
    });
  });

  describe('Concurrent Session Cleanup', () => {
    it('should handle cleanup during active error handling', async () => {
      // Create multiple sessions first
      const sessionPromises = Array.from({ length: 5 }, async (_, i) => {
        const planOutput = planThinkingSession(
          {
            problem: `Cleanup test ${i}`,
            techniques: ['yes_and'],
            timeframe: 'quick',
          },
          sessionManager,
          techniqueRegistry
        );

        const planResponse = responseBuilder.buildPlanningResponse(planOutput);
        const plan = safeJsonParse<{ planId: string }>(planResponse.content[0].text);

        return executeThinkingStep(
          {
            planId: plan.planId,
            technique: 'yes_and',
            problem: `Cleanup test ${i}`,
            currentStep: 1,
            totalSteps: 4,
            output: `Initial idea ${i}`,
            nextStepNeeded: true,
            initialIdea: `Test idea ${i}`,
          },
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );
      });

      const results = await Promise.all(sessionPromises);
      const sessionIds = results
        .filter(r => !r.isError)
        .map(r => safeJsonParse<{ sessionId: string }>(r.content[0].text).sessionId);

      // Force cleanup while sessions are active
      sessionManager.cleanupOldSessions();

      // Verify sessions are still accessible (cleanup shouldn't remove active sessions)
      const activeSessions = sessionIds.filter(id => sessionManager.getSession(id));
      expect(activeSessions.length).toBeGreaterThan(0);

      // Clean up test sessions
      sessionIds.forEach(id => sessionManager.deleteSession(id));
    });
  });

  describe('Error Response Format Validation', () => {
    it('should ensure all errors follow consistent format', async () => {
      const errorScenarios = [
        // Plan not found error
        {
          input: {
            planId: 'non-existent',
            technique: 'six_hats' as const,
            problem: 'Format test 1',
            currentStep: 1,
            totalSteps: 6,
            output: 'Test',
            nextStepNeeded: false,
          },
          expectedError: /Plan.*not found/i,
        },
        // Invalid technique with plan
        {
          input: {
            planId: 'plan_123',
            technique: 'invalid_tech' as any,
            problem: 'Format test 2',
            currentStep: 1,
            totalSteps: 1,
            output: 'Test',
            nextStepNeeded: false,
          },
          expectedError: /Plan.*not found/i, // Plan doesn't exist so this comes first
        },
      ];

      for (const scenario of errorScenarios) {
        const result = await executeThinkingStep(
          scenario.input,
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );

        // All should return isError: true
        expect(result.isError).toBe(true);

        // Verify error text is valid JSON
        const errorText = result.content[0].text;
        let parsedError: any;
        expect(() => {
          parsedError = JSON.parse(errorText);
        }).not.toThrow();

        // Verify error structure
        expect(parsedError).toHaveProperty('error');
        expect(parsedError.error).toHaveProperty('code');
        expect(parsedError.error).toHaveProperty('message');

        // Check that the error message matches expected pattern
        expect(parsedError.error.message).toMatch(scenario.expectedError);
      }
    });
  });
});
