/**
 * Tests for ConvergenceExecutor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConvergenceExecutor } from '../../../layers/execution/ConvergenceExecutor.js';
import type { SessionManager } from '../../../core/SessionManager.js';
import type { VisualFormatter } from '../../../utils/VisualFormatter.js';
import type { ExecuteThinkingStepInput, SessionData } from '../../../types/index.js';
import type { ParallelExecutionResult } from '../../../types/parallel-session.js';

// Mock implementations
const mockSessionManager = {
  getSession: vi.fn(),
  getParallelGroup: vi.fn(),
} as unknown as SessionManager;

const formatConvergenceProgressMock = vi.fn();
const mockVisualFormatter = {
  formatConvergenceProgress: formatConvergenceProgressMock,
} as unknown as VisualFormatter;

describe('ConvergenceExecutor', () => {
  let executor: ConvergenceExecutor;
  let mockSession: SessionData;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new ConvergenceExecutor(mockSessionManager, mockVisualFormatter);

    mockSession = {
      id: 'test-session',
      technique: 'convergence',
      problem: 'Test problem',
      startTime: Date.now(),
      history: [],
      insights: [],
      branches: {},
    };
  });

  describe('executeConvergence', () => {
    it('should successfully execute convergence with parallel results', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Collecting insights',
        nextStepNeeded: true,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: ['Insight 1', 'Insight 2'],
            results: { output: 'Six hats results' },
            metrics: { confidence: 0.8 },
          },
          {
            planId: 'plan2',
            technique: 'po',
            insights: ['Insight 3'],
            results: { output: 'PO results' },
            metrics: { confidence: 0.7 },
          },
        ],
      };

      mockSessionManager.getSession.mockReturnValue(mockSession);

      const result = await executor.executeConvergence(input, 'test-session');

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const content = JSON.parse(result.content[0].text);
      expect(content.sessionId).toBe('test-session');
      expect(content.technique).toBe('convergence');
      expect(content.insights.length).toBeGreaterThan(0);
      expect(content.executionMetadata?.noteworthyMoment).toContain(
        'Converged 2 parallel sessions'
      );
    });

    it('should reject non-convergence techniques', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Wrong technique',
        nextStepNeeded: true,
      };

      const result = await executor.executeConvergence(input, 'test-session');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid technique');
    });

    it('should handle missing session gracefully', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
        parallelResults: [],
      };

      mockSessionManager.getSession.mockReturnValue(null);

      const result = await executor.executeConvergence(input, 'non-existent');

      expect(result.isError).toBe(true);
      const errorContent = JSON.parse(result.content[0].text);
      expect(errorContent.error.message).toContain('not found');
    });

    it('should gather results from parallel group when no results provided', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
      };

      const groupSession = {
        ...mockSession,
        parallelGroupId: 'group-123',
      };

      const mockGroup = {
        groupId: 'group-123',
        completedSessions: ['session1', 'session2'],
        sharedContext: {},
      };

      const completedSession1: SessionData = {
        id: 'session1',
        technique: 'six_hats',
        problem: 'Test problem',
        startTime: Date.now() - 5000,
        endTime: Date.now(),
        history: [
          {
            technique: 'six_hats',
            problem: 'Test problem',
            currentStep: 6,
            totalSteps: 6,
            output: 'Six hats complete',
            nextStepNeeded: false,
            sessionId: 'session1',
          },
        ],
        insights: ['Group insight 1', 'Group insight 2'],
        branches: {},
        parallelMetadata: { planId: 'plan1' },
        metrics: { creativityScore: 0.8 },
      };

      const completedSession2: SessionData = {
        id: 'session2',
        technique: 'po',
        problem: 'Test problem',
        startTime: Date.now() - 4000,
        endTime: Date.now(),
        history: [
          {
            technique: 'po',
            problem: 'Test problem',
            currentStep: 4,
            totalSteps: 4,
            output: 'PO complete',
            nextStepNeeded: false,
            sessionId: 'session2',
          },
        ],
        insights: ['Group insight 3'],
        branches: {},
        parallelMetadata: { planId: 'plan2' },
        metrics: { creativityScore: 0.7 },
      };

      mockSessionManager.getSession
        .mockReturnValueOnce(groupSession)
        .mockReturnValueOnce(completedSession1)
        .mockReturnValueOnce(completedSession2);
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);

      const result = await executor.executeConvergence(input, 'test-session');

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.insights.length).toBeGreaterThan(0);
      expect(content.executionMetadata?.noteworthyMoment).toContain(
        'Converged 2 parallel sessions'
      );
    });

    it('should fail when no parallel results available', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
      };

      mockSessionManager.getSession.mockReturnValue(mockSession);

      const result = await executor.executeConvergence(input, 'test-session');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('parallelResults');
    });

    it('should validate parallel results schema', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
        parallelResults: [
          {
            // Missing required fields
            technique: 'six_hats',
          } as any,
        ],
      };

      mockSessionManager.getSession.mockReturnValue(mockSession);

      const result = await executor.executeConvergence(input, 'test-session');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('parallelResults[0]');
    });

    it('should handle different convergence strategies', async () => {
      const parallelResults: ParallelExecutionResult[] = [
        {
          planId: 'plan1',
          technique: 'six_hats',
          insights: ['Insight 1', 'Insight 2'],
          results: { output: 'Result 1' },
          metrics: { confidence: 0.9 },
        },
        {
          planId: 'plan2',
          technique: 'po',
          insights: ['Insight 3', 'Insight 4'],
          results: { output: 'Result 2' },
          metrics: { confidence: 0.6 },
        },
      ];

      mockSessionManager.getSession.mockReturnValue(mockSession);

      // Test merge strategy
      const mergeInput: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 3,
        totalSteps: 3,
        output: 'Synthesizing',
        nextStepNeeded: false,
        convergenceStrategy: 'merge',
        parallelResults,
      };

      const mergeResult = await executor.executeConvergence(mergeInput, 'test-session');
      expect(mergeResult.isError).toBeUndefined();
      const content = JSON.parse(mergeResult.content[0].text);
      // After merge, should contain all unique insights
      expect(content.insights).toContain('Insight 1');
      expect(content.insights).toContain('Insight 2');
      expect(content.insights).toContain('Insight 3');
      expect(content.insights).toContain('Insight 4');

      // Test select strategy
      const selectInput: ExecuteThinkingStepInput = {
        ...mergeInput,
        convergenceStrategy: 'select',
      };

      const selectResult = await executor.executeConvergence(selectInput, 'test-session');
      expect(selectResult.isError).toBeUndefined();
      const selectContent = JSON.parse(selectResult.content[0].text);
      // Select strategy should return insights from highest confidence result (0.9)
      expect(selectContent.insights).toContain('Insight 1');
      expect(selectContent.insights).toContain('Insight 2');
      // Should not contain insights from lower confidence result
      expect(selectContent.insights).not.toContain('Insight 3');

      // Test hierarchical strategy
      const hierarchicalInput: ExecuteThinkingStepInput = {
        ...mergeInput,
        convergenceStrategy: 'hierarchical',
      };

      const hierarchicalResult = await executor.executeConvergence(
        hierarchicalInput,
        'test-session'
      );
      expect(hierarchicalResult.isError).toBeUndefined();
      const hierarchicalContent = JSON.parse(hierarchicalResult.content[0].text);
      expect(
        hierarchicalContent.insights.some((i: string) => i.includes('Hierarchical synthesis'))
      ).toBe(true);
    });

    it('should progress through all convergence steps', async () => {
      const parallelResults: ParallelExecutionResult[] = [
        {
          planId: 'plan1',
          technique: 'six_hats',
          insights: ['Insight 1', 'Insight 2'],
          results: { output: 'Result' },
        },
      ];

      mockSessionManager.getSession.mockReturnValue(mockSession);

      // Step 1: Collect and categorize
      const step1Input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Collecting',
        nextStepNeeded: true,
        parallelResults,
      };

      const step1Result = await executor.executeConvergence(step1Input, 'test-session');
      expect(step1Result.isError).toBeUndefined();
      const step1Content = JSON.parse(step1Result.content[0].text);
      expect(step1Content.insights.some((i: string) => i.includes('Collected'))).toBe(true);

      // Step 2: Identify patterns
      const step2Input: ExecuteThinkingStepInput = {
        ...step1Input,
        currentStep: 2,
        output: 'Identifying patterns',
      };

      const step2Result = await executor.executeConvergence(step2Input, 'test-session');
      expect(step2Result.isError).toBeUndefined();
      const step2Content = JSON.parse(step2Result.content[0].text);
      expect(step2Content.insights.some((i: string) => i.includes('themes'))).toBe(true);

      // Step 3: Final synthesis
      const step3Input: ExecuteThinkingStepInput = {
        ...step1Input,
        currentStep: 3,
        output: 'Final synthesis',
        nextStepNeeded: false,
      };

      const step3Result = await executor.executeConvergence(step3Input, 'test-session');
      expect(step3Result.isError).toBeUndefined();
      const step3Content = JSON.parse(step3Result.content[0].text);
      expect(step3Content.nextStepNeeded).toBe(false);
    });

    it('should handle dynamic synthesis for additional steps', async () => {
      const parallelResults: ParallelExecutionResult[] = [
        {
          planId: 'plan1',
          technique: 'six_hats',
          insights: ['Insight 1'],
          results: {},
        },
      ];

      mockSessionManager.getSession.mockReturnValue(mockSession);

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 5, // Beyond standard 3 steps
        totalSteps: 6,
        output: 'Extended analysis',
        nextStepNeeded: true,
        parallelResults,
      };

      const result = await executor.executeConvergence(input, 'test-session');
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.insights.some((i: string) => i.includes('extended synthesis'))).toBe(true);
    });

    it('should handle empty group results gracefully', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
      };

      const groupSession = {
        ...mockSession,
        parallelGroupId: 'group-123',
      };

      const mockGroup = {
        groupId: 'group-123',
        completedSessions: ['session1'],
        sharedContext: {},
      };

      mockSessionManager.getSession.mockReturnValueOnce(groupSession).mockReturnValueOnce(null); // Session not found
      mockSessionManager.getParallelGroup.mockReturnValue(mockGroup);

      const result = await executor.executeConvergence(input, 'test-session');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('parallelResults');
    });

    it('should normalize results with various input types', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: [],
            // results is optional, so omitting it is valid
          },
          {
            planId: 'plan2',
            technique: 'po',
            insights: [],
            results: { nested: { data: 'value' }, array: [1, 2, 3] },
          },
          {
            planId: 'plan3',
            technique: 'scamper',
            insights: [],
            results: {}, // Empty object is valid
          },
        ],
      };

      mockSessionManager.getSession.mockReturnValue(mockSession);

      const result = await executor.executeConvergence(input, 'test-session');
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.insights.length).toBeGreaterThan(0);
    });

    it('should display convergence progress when logging enabled', async () => {
      const originalEnv = process.env.DISABLE_THOUGHT_LOGGING;
      delete process.env.DISABLE_THOUGHT_LOGGING;

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: ['Insight'],
            results: {},
          },
        ],
      };

      mockSessionManager.getSession.mockReturnValue(mockSession);
      formatConvergenceProgressMock.mockReturnValue('Progress: Step 1/3');

      const writeImpl = vi.fn().mockImplementation(() => true);
      const originalWrite = process.stderr.write.bind(process.stderr);
      process.stderr.write = writeImpl as any;

      await executor.executeConvergence(input, 'test-session');

      expect(formatConvergenceProgressMock).toHaveBeenCalledWith(1, 3, 1, ['six_hats']);
      expect(writeImpl).toHaveBeenCalledWith('Progress: Step 1/3');

      process.stderr.write = originalWrite;
      process.env.DISABLE_THOUGHT_LOGGING = originalEnv;
    });

    it('should not display progress when logging disabled', async () => {
      process.env.DISABLE_THOUGHT_LOGGING = 'true';

      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: ['Insight'],
            results: {},
          },
        ],
      };

      mockSessionManager.getSession.mockReturnValue(mockSession);
      const writeImpl = vi.fn().mockImplementation(() => true);
      const originalWrite = process.stderr.write.bind(process.stderr);
      process.stderr.write = writeImpl as any;

      await executor.executeConvergence(input, 'test-session');

      expect(formatConvergenceProgressMock).not.toHaveBeenCalled();
      expect(writeImpl).not.toHaveBeenCalled();

      process.stderr.write = originalWrite;
      delete process.env.DISABLE_THOUGHT_LOGGING;
    });

    it('should handle error during execution gracefully', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test',
        nextStepNeeded: true,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            insights: ['Insight'],
            results: {},
          },
        ],
      };

      mockSessionManager.getSession.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await executor.executeConvergence(input, 'test-session');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Database error');
    });
  });
});
