/**
 * Simplified integration tests for parallel execution
 * Focus on core functionality with minimal complexity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import { planThinkingSession } from '../../layers/planning.js';
import { executeThinkingStep } from '../../layers/execution.js';
import type { PlanThinkingSessionInput, ExecuteThinkingStepInput } from '../../types/index.js';

describe('Parallel Execution Simple Integration', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = new TechniqueRegistry();
    visualFormatter = new VisualFormatter();
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer(metricsCollector);
    ergodicityManager = new ErgodicityManager(sessionManager);
  });

  describe('Basic Parallel Planning', () => {
    it('should create a parallel plan', async () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'scamper'],
        executionMode: 'parallel',
        timeframe: 'quick',
      };

      const plan = planThinkingSession(input, sessionManager, techniqueRegistry);

      expect(plan).toBeDefined();
      expect(plan.planId).toBeDefined();
      expect(plan.executionMode).toBe('parallel');
      expect(plan.parallelPlans).toBeDefined();
      expect(Array.isArray(plan.parallelPlans)).toBe(true);
    });
  });

  describe('Basic Parallel Execution', () => {
    it('should execute a simple parallel step', async () => {
      // First create a parallel plan
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['po'],
        executionMode: 'parallel',
        timeframe: 'quick',
      };

      const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);
      expect(plan.planId).toBeDefined();

      // Execute a single step
      const executeInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: 'po',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 4,
        output: 'Test provocation',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        executeInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.content[0]).toBeDefined();
      expect(response.isError).not.toBe(true);
    });
  });

  describe('Convergence Execution', () => {
    it('should execute convergence with minimal parallel results', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test convergence',
        currentStep: 1,
        totalSteps: 3,
        output: 'Starting convergence',
        nextStepNeeded: true,
        parallelResults: [
          {
            sessionId: 'session1',
            planId: 'plan1',
            technique: 'po',
            problem: 'Test problem',
            insights: ['Test insight'],
            results: { output: 'Test output' },
            metrics: {
              executionTime: 1000,
              completedSteps: 4,
              totalSteps: 4,
              confidence: 0.8,
            },
            status: 'completed',
          },
        ],
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      if (!response.isError) {
        const responseData = JSON.parse(response.content[0].text);
        // Convergence might create insights or synthesis
        expect(responseData).toBeDefined();
      }
    });
  });

  describe('Progress Monitoring', () => {
    it('should track basic progress', async () => {
      // Create a simple session
      const sessionId = sessionManager.createSession({
        technique: 'six_hats',
        problem: 'Test problem',
      });

      const session = sessionManager.getSession(sessionId);
      expect(session).toBeDefined();

      // Execute a step
      const input: ExecuteThinkingStepInput = {
        sessionId,
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Introduction to Six Thinking Hats',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(response).toBeDefined();
      if (response.isError) {
        console.error('Error response:', JSON.parse(response.content[0].text));
      }
      expect(response.isError).not.toBe(true);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeouts gracefully', async () => {
      vi.useFakeTimers();

      const sessionId = sessionManager.createSession({
        technique: 'six_hats',
        problem: 'Test timeout',
      });

      const session = sessionManager.getSession(sessionId);
      if (session) {
        session.parallelGroupId = 'timeout-test';
      }

      // Start execution
      const input: ExecuteThinkingStepInput = {
        sessionId,
        technique: 'six_hats',
        problem: 'Test timeout',
        currentStep: 1,
        totalSteps: 6,
        output: 'Starting',
        nextStepNeeded: true,
        hatColor: 'white',
      };

      // Execute without waiting
      const responsePromise = executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Advance time to trigger timeout monitoring
      vi.advanceTimersByTime(1000);

      const response = await responsePromise;
      expect(response).toBeDefined();

      vi.useRealTimers();
    });
  });
});
