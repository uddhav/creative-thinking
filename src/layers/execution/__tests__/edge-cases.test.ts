/**
 * Tests for edge cases in parallel execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConvergenceExecutor } from '../ConvergenceExecutor.js';
import { ParallelStepExecutor } from '../ParallelStepExecutor.js';
import { SessionManager } from '../../../core/SessionManager.js';
import { SessionSynchronizer } from '../../../core/session/SessionSynchronizer.js';
import { VisualFormatter } from '../../../utils/VisualFormatter.js';
import type { ExecuteThinkingStepInput } from '../../../types/index.js';
import type { ParallelPlan } from '../../../types/planning.js';

describe('Edge Cases', () => {
  let sessionManager: SessionManager;
  let sessionSynchronizer: SessionSynchronizer;
  let visualFormatter: VisualFormatter;
  let convergenceExecutor: ConvergenceExecutor;
  let parallelStepExecutor: ParallelStepExecutor;

  beforeEach(() => {
    sessionManager = new SessionManager();
    sessionSynchronizer = new SessionSynchronizer(sessionManager);
    visualFormatter = new VisualFormatter();
    convergenceExecutor = new ConvergenceExecutor(sessionManager, visualFormatter);
    parallelStepExecutor = new ParallelStepExecutor(sessionManager, sessionSynchronizer);
  });

  describe('ConvergenceExecutor Edge Cases', () => {
    it('should handle malformed parallel results', async () => {
      const sessionId = 'malformed-session';

      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'convergence',
          currentStep: 1,
          totalSteps: 3,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
        planId: 'test-plan',
        sessionId,
        parallelResults: [
          // Missing planId
          {
            technique: 'six_hats',
            insights: ['insight1'],
          } as any,
        ],
      };

      const result = await convergenceExecutor.executeConvergence(input, sessionId);

      // Should return an error response
      expect(result.content[0].text).toContain('error');
    });

    it('should handle empty parallel results gracefully', async () => {
      const sessionId = 'empty-results-session';

      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'convergence',
          currentStep: 1,
          totalSteps: 3,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
        planId: 'test-plan',
        sessionId,
        parallelResults: [],
      };

      const result = await convergenceExecutor.executeConvergence(input, sessionId);

      // Should return error about missing results
      expect(result.content[0].text).toContain('parallelResults');
    });

    it('should validate and normalize results with various data types', async () => {
      const sessionId = 'normalize-session';

      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'convergence',
          currentStep: 1,
          totalSteps: 3,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
        planId: 'test-plan',
        sessionId,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: ['insight1'],
            results: {
              string: 'value',
              number: 123,
              boolean: true,
              null: null,
              undefined: undefined,
              array: [1, 2, 3],
              object: { nested: 'value' },
              // These should be filtered out
              function: () => {},
              symbol: Symbol('test'),
              date: new Date(),
            } as any,
          },
        ],
      };

      const result = await convergenceExecutor.executeConvergence(input, sessionId);

      // Should succeed despite non-serializable values
      expect(result.content[0].text).not.toContain('error');
    });
  });

  describe('ParallelStepExecutor Edge Cases', () => {
    it('should handle JSON parsing failures gracefully', async () => {
      const sessionId = 'json-fail-session';
      const groupId = 'json-fail-group';

      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'six_hats',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      const response = {
        content: [
          {
            type: 'text' as const,
            text: 'This is not valid JSON but contains "insights" like "insight 1" and "insight 2"',
          },
        ],
      };

      // Should not throw, but handle gracefully
      await expect(
        parallelStepExecutor['updateSharedContextPostExecution'](
          sessionId,
          groupId,
          {
            technique: 'six_hats',
            problem: 'Test',
            currentStep: 1,
            totalSteps: 6,
            output: 'Test',
            nextStepNeeded: true,
            planId: 'test',
            sessionId,
          },
          response
        )
      ).resolves.not.toThrow();
    });

    it('should handle missing response content', async () => {
      const sessionId = 'missing-content-session';
      const groupId = 'missing-content-group';

      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'six_hats',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      const responses = [
        { content: [] },
        { content: [{ type: 'text' as const, text: '' }] },
        { content: null as any },
        {} as any,
      ];

      // All should handle gracefully
      for (const response of responses) {
        await expect(
          parallelStepExecutor['updateSharedContextPostExecution'](
            sessionId,
            groupId,
            {
              technique: 'six_hats',
              problem: 'Test',
              currentStep: 1,
              totalSteps: 6,
              output: 'Test',
              nextStepNeeded: true,
              planId: 'test',
              sessionId,
            },
            response
          )
        ).resolves.not.toThrow();
      }
    });

    it('should handle dependency timeouts', async () => {
      // Create plans for the parallel group
      const plans: ParallelPlan[] = [
        {
          planId: 'timeout-plan-1',
          techniques: ['six_hats'],
          workflow: [
            {
              technique: 'six_hats',
              stepCount: 6,
              description: 'Primary plan',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: false,
          dependencies: ['timeout-plan-2'],
        },
        {
          planId: 'timeout-plan-2',
          techniques: ['po'],
          workflow: [
            {
              technique: 'po',
              stepCount: 4,
              description: 'Dependency plan',
            },
          ],
          estimatedTime: 'quick',
          canExecuteIndependently: true,
        },
      ];

      const groupId = sessionManager.createParallelSessionGroup('Test problem', plans, {
        strategy: 'merge',
      });

      // Get the actual session IDs
      const group = sessionManager.getParallelGroup(groupId);
      const sessionIds = group?.sessionIds || [];
      const sessionId = sessionIds[0];

      const input: ExecuteThinkingStepInput = {
        technique: 'six_hats',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test',
        nextStepNeeded: true,
        planId: 'timeout-plan-1',
        sessionId,
      };

      // Execute with coordination (should timeout waiting for dependency)
      const baseExecutor = () =>
        Promise.resolve({
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ insights: ['test'] }),
            },
          ],
        });

      const result = await parallelStepExecutor.executeWithCoordination(
        input,
        sessionId,
        baseExecutor
      );

      // Should return waiting response
      expect(result.content[0].text).toContain('waiting');
    });
  });

  describe('Resource Limits', () => {
    it('should handle very large insight arrays', async () => {
      const sessionId = 'large-insights-session';

      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'convergence',
          currentStep: 1,
          totalSteps: 3,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      // Create very large insights array
      const largeInsights = Array.from({ length: 10000 }, (_, i) => `Insight ${i}`);

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
        planId: 'test-plan',
        sessionId,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: largeInsights,
            results: {},
          },
        ],
      };

      const result = await convergenceExecutor.executeConvergence(input, sessionId);

      // Should handle large data without crashing
      expect(result.content[0].text).toBeDefined();
    });

    it('should handle deeply nested results objects', async () => {
      const sessionId = 'nested-session';

      sessionManager.createSession(
        {
          problem: 'Test',
          technique: 'convergence',
          currentStep: 1,
          totalSteps: 3,
          output: 'Test',
          nextStepNeeded: true,
        },
        sessionId
      );

      // Create deeply nested object
      let deepObject: any = { value: 'bottom' };
      for (let i = 0; i < 100; i++) {
        deepObject = { nested: deepObject };
      }

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
        planId: 'test-plan',
        sessionId,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: ['insight1'],
            results: deepObject,
          },
        ],
      };

      const result = await convergenceExecutor.executeConvergence(input, sessionId);

      // Should handle without stack overflow
      expect(result.content[0].text).toBeDefined();
    });
  });
});
