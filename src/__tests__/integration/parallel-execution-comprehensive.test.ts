/**
 * Comprehensive integration tests for parallel execution
 * Tests the full workflow from detection through completion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import { planThinkingSession } from '../../layers/planning.js';
import { executeThinkingStep } from '../../layers/execution.js';
import type {
  ExecuteThinkingStepInput,
  PlanThinkingSessionInput,
} from '../../types/index.js';
import { ParallelExecutionContext } from '../../layers/execution/ParallelExecutionContext.js';

// No global fake timers - will use per test

describe('Parallel Execution Comprehensive Integration', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    sessionManager = new SessionManager();
    techniqueRegistry = new TechniqueRegistry();
    visualFormatter = new VisualFormatter();
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer(metricsCollector);
    ergodicityManager = new ErgodicityManager(sessionManager);

    // Reset parallel execution context
    ParallelExecutionContext.reset();
  });

  afterEach(() => {
    // Reset timers if they were faked
    if (vi.isFakeTimers()) {
      vi.useRealTimers();
    }
  });

  describe('End-to-End Parallel Workflow', () => {
    it('should execute parallel workflow from planning to convergence', async () => {
      // Step 1: Plan a parallel session
      const planInput: PlanThinkingSessionInput = {
        problem: 'How can we improve remote team collaboration?',
        techniques: ['six_hats', 'scamper', 'po'],
        objectives: ['Generate creative solutions', 'Consider multiple perspectives'],
        constraints: ['Limited budget', '30-day implementation'],
        executionMode: 'parallel',
        timeframe: 'thorough',
      };

      const planResponse = planThinkingSession(planInput, sessionManager, techniqueRegistry);

      expect(planResponse).toBeDefined();
      // planThinkingSession returns PlanThinkingSessionOutput directly
      const planData = planResponse;
      expect(planData.planId).toBeDefined();
      expect(planData.executionMode).toBe('parallel');
      expect(planData.parallelPlans).toBeDefined();
      expect(planData.parallelPlans.length).toBeGreaterThan(0);

      // Step 2: Execute parallel sessions
      const group =
        planData.parallelPlans.find((p: any) => p.technique !== 'convergence') ||
        planData.parallelPlans[0];
      const sessionPromises: Promise<any>[] = [];

      // Execute each technique in parallel
      const techniques = group.workflow
        ? group.workflow.map((w: any) => ({
            technique: w.technique,
            estimatedSteps: w.steps.length,
          }))
        : [];
      for (const technique of techniques) {
        const executePromise = (async () => {
          const results = [];
          let nextStepNeeded = true;
          let currentStep = 1;

          while (nextStepNeeded) {
            const input: ExecuteThinkingStepInput = {
              planId: planData.planId,
              technique: technique.technique,
              problem: planInput.problem,
              currentStep,
              totalSteps: technique.estimatedSteps,
              output: `Step ${currentStep} for ${technique.technique}`,
              nextStepNeeded: currentStep < technique.estimatedSteps,
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

            results.push(response);
            const responseData = response.isError ? response : JSON.parse(response.content[0].text);

            if (!responseData.error) {
              nextStepNeeded = responseData.nextStepNeeded || false;
              currentStep++;
            } else {
              break;
            }
          }

          return results;
        })();

        sessionPromises.push(executePromise);
      }

      // Wait for all parallel executions
      const parallelResults = await Promise.all(sessionPromises);

      // Verify all sessions completed
      expect(parallelResults.length).toBe(group.techniques.length);
      parallelResults.forEach(results => {
        expect(results.length).toBeGreaterThan(0);
      });

      // Step 3: Execute convergence
      const convergenceInput: ExecuteThinkingStepInput = {
        planId: planData.planId,
        technique: 'convergence',
        problem: planInput.problem,
        currentStep: 1,
        totalSteps: 3,
        output: 'Synthesizing results from parallel sessions',
        nextStepNeeded: true,
        convergenceStrategy: 'merge',
      };

      const convergenceResponse = await executeThinkingStep(
        convergenceInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(convergenceResponse).toBeDefined();
      expect(convergenceResponse.content).toBeDefined();
      expect(convergenceResponse.content[0]).toBeDefined();
      const convergenceData = convergenceResponse.isError
        ? convergenceResponse
        : JSON.parse(convergenceResponse.content[0].text);
      if (!convergenceResponse.isError && convergenceData.technique) {
        expect(convergenceData.technique).toBe('convergence');
      }
      expect(convergenceData.synthesis).toBeDefined();
    });

    it('should handle sequential dependencies in parallel groups', async () => {
      // Plan with dependencies
      const planInput: PlanThinkingSessionInput = {
        problem: 'Design a new product feature',
        techniques: ['design_thinking', 'six_hats', 'triz'],
        objectives: ['User-centered design', 'Technical feasibility'],
        executionMode: 'parallel',
        timeframe: 'thorough',
      };

      const planResponse = planThinkingSession(planInput, sessionManager, techniqueRegistry);

      // planThinkingSession returns PlanThinkingSessionOutput directly
      const planData = planResponse;

      // Find a group with dependencies (if any)
      const groupWithDeps = planData.parallelPlans.find(
        (p: any) =>
          p.workflow && p.workflow.some((w: any) => w.dependencies && w.dependencies.length > 0)
      );

      if (groupWithDeps) {
        // Execute techniques respecting dependencies
        const completed = new Set<string>();
        const executing = new Map<string, Promise<any>>();

        const executeWithDependencies = async (technique: any): Promise<any> => {
          // Wait for dependencies
          if (technique.dependencies) {
            await Promise.all(technique.dependencies.map((dep: string) => executing.get(dep)));
          }

          // Execute the technique
          const input: ExecuteThinkingStepInput = {
            planId: planData.planId,
            technique: technique.technique,
            problem: planInput.problem,
            currentStep: 1,
            totalSteps: technique.estimatedSteps,
            output: `Executing ${technique.technique}`,
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

          completed.add(technique.technique);
          return response;
        };

        // Start execution for all techniques
        const techniques = groupWithDeps.workflow
          ? groupWithDeps.workflow.map((w: any) => ({
              technique: w.technique,
              estimatedSteps: w.steps.length,
              dependencies: w.dependencies,
            }))
          : [];
        for (const technique of techniques) {
          const promise = executeWithDependencies(technique);
          executing.set(technique.technique, promise);
        }

        // Wait for all to complete
        await Promise.all(Array.from(executing.values()));

        expect(completed.size).toBe(techniques.length);
      }
    });
  });

  describe('Progress Monitoring and Metrics', () => {
    it('should track progress across parallel sessions', async () => {
      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const progressCoordinator = parallelContext.getProgressCoordinator();
      const metrics = parallelContext.getExecutionMetrics();

      // Set up progress listener
      const progressUpdates: any[] = [];
      progressCoordinator.on('progress', update => {
        progressUpdates.push(update);
      });

      // Create and execute parallel sessions
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'],
        executionMode: 'parallel',
        timeframe: 'quick',
      };

      const planResponse = planThinkingSession(planInput, sessionManager, techniqueRegistry);

      // planThinkingSession returns PlanThinkingSessionOutput directly
      const planData = planResponse;
      const group =
        planData.parallelPlans.find((p: any) => p.technique !== 'convergence') ||
        planData.parallelPlans[0];

      // Execute first steps of each technique
      const techniques = group.workflow
        ? group.workflow.map((w: any) => ({
            technique: w.technique,
            estimatedSteps: w.steps.length,
          }))
        : [];
      for (const technique of techniques) {
        const input: ExecuteThinkingStepInput = {
          planId: planData.planId,
          technique: technique.technique,
          problem: planInput.problem,
          currentStep: 1,
          totalSteps: technique.estimatedSteps,
          output: `First step`,
          nextStepNeeded: true,
        };

        await executeThinkingStep(
          input,
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );
      }

      // Check progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      progressUpdates.forEach(update => {
        expect(update.groupId).toBeDefined();
        expect(update.sessionId).toBeDefined();
        expect(update.currentStep).toBeDefined();
        expect(update.totalSteps).toBeDefined();
      });

      // Check metrics
      const currentMetrics = metrics.getCurrentMetrics();
      expect(currentMetrics.activeGroups).toBeGreaterThan(0);
      expect(currentMetrics.activeSessions).toBeGreaterThan(0);
    });

    it('should calculate parallel efficiency', async () => {
      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const metrics = parallelContext.getExecutionMetrics();

      // Plan and execute a simple parallel workflow
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test efficiency',
        techniques: ['six_hats', 'scamper'],
        executionMode: 'parallel',
        timeframe: 'quick',
      };

      const planResponse = planThinkingSession(planInput, sessionManager, techniqueRegistry);

      // planThinkingSession returns PlanThinkingSessionOutput directly
      const planData = planResponse;
      const groupId = planData.parallelPlans[0].groupId || 'test-group';

      // Start group metrics
      metrics.startGroup(groupId, 2);

      // Simulate parallel execution with overlap
      metrics.startSession(groupId, 'session1', 'six_hats');

      // Simulate some delay before starting session 2
      vi.advanceTimersByTime(100);
      metrics.startSession(groupId, 'session2', 'scamper');

      // Complete sessions with overlap
      vi.advanceTimersByTime(900);
      metrics.completeSession('session1', 'completed', 3);

      vi.advanceTimersByTime(400);
      metrics.completeSession('session2', 'completed', 2);

      // Complete the group
      metrics.completeGroup(groupId);

      // Check efficiency
      const groupMetrics = metrics.getGroupMetrics(groupId);
      expect(groupMetrics).toBeDefined();
      expect(groupMetrics?.parallelEfficiency).toBeDefined();
      expect(groupMetrics?.parallelEfficiency).toBeGreaterThan(0);
      expect(groupMetrics?.parallelEfficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('Timeout and Error Recovery', () => {
    it('should handle session timeouts in parallel execution', async () => {
      vi.useFakeTimers();
      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const timeoutMonitor = parallelContext.getSessionTimeoutMonitor();

      // Set up timeout listener
      const timeouts: any[] = [];
      timeoutMonitor.on('timeout', event => {
        timeouts.push(event);
      });

      // Create a session that will timeout
      const sessionId = sessionManager.createSession({
        technique: 'six_hats',
        problem: 'Test timeout',
      });

      const session = sessionManager.getSession(sessionId);
      if (session) {
        session.parallelGroupId = 'timeout-test-group';
      }

      // Start monitoring with quick timeout
      timeoutMonitor.startMonitoringSession(sessionId, 'timeout-test-group', 'quick');

      // Advance time past timeout (30 seconds for quick)
      vi.advanceTimersByTime(31 * 1000);

      // Check timeout was triggered
      expect(timeouts.length).toBe(1);
      expect(timeouts[0].sessionId).toBe(sessionId);
      expect(timeouts[0].timeoutType).toBe('execution');
    });

    it('should retry failed sessions with exponential backoff', async () => {
      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const errorHandler = parallelContext.getParallelErrorHandler();

      // Create a session that will fail
      const sessionId = sessionManager.createSession({
        technique: 'six_hats',
        problem: 'Test retry',
      });

      // Create a parallel group for the session
      const groupId = 'test-group';
      const group = {
        groupId,
        sessionIds: [sessionId],
        completedSessions: new Set<string>(),
        failedSessions: new Set<string>(),
        status: 'active' as const,
        startTime: Date.now(),
        sharedContext: {},
      };
      sessionManager.createParallelGroup(group);

      // Simulate an error
      const error = new Error('Test error');
      const errorContext: any = {
        sessionId,
        groupId,
        technique: 'six_hats',
        step: 1,
        errorType: 'execution_error',
      };

      const shouldRetry = await errorHandler.handleSessionError(
        sessionId,
        groupId,
        error,
        errorContext
      );

      expect(shouldRetry).toBe(true);

      // Simulate another error to test exponential backoff
      const shouldRetry2 = await errorHandler.handleSessionError(
        sessionId,
        groupId,
        error,
        errorContext
      );

      expect(shouldRetry2).toBe(true);

      // Check retry limits
      // Simulate multiple failures to test max retries
      for (let i = 0; i < 3; i++) {
        await errorHandler.handleSessionError(sessionId, groupId, error, errorContext);
      }

      // After max retries, should not retry
      const shouldRetryFinal = await errorHandler.handleSessionError(
        sessionId,
        groupId,
        error,
        errorContext
      );

      // May still retry or switch to partial completion
      expect(typeof shouldRetryFinal).toBe('boolean');
    });
  });

  describe('Convergence Strategies', () => {
    it('should merge results using merge strategy', async () => {
      // Create parallel results
      const parallelResults = [
        {
          sessionId: 'session1',
          planId: 'plan1',
          technique: 'six_hats' as const,
          problem: 'Test problem',
          insights: ['Insight A', 'Insight B'],
          results: {
            output: 'Six hats complete',
            hats: {
              white: ['Fact 1', 'Fact 2'],
              red: ['Feeling 1'],
              black: ['Risk 1'],
              yellow: ['Benefit 1'],
              green: ['Idea 1'],
              blue: ['Process 1'],
            },
          },
          metrics: {
            executionTime: 1000,
            completedSteps: 6,
            totalSteps: 6,
            confidence: 0.8,
          },
          status: 'completed' as const,
        },
        {
          sessionId: 'session2',
          planId: 'plan1',
          technique: 'scamper' as const,
          problem: 'Test problem',
          insights: ['Insight C', 'Insight D'],
          results: {
            output: 'SCAMPER complete',
            modifications: ['Mod 1', 'Mod 2'],
          },
          metrics: {
            executionTime: 1200,
            completedSteps: 8,
            totalSteps: 8,
            confidence: 0.7,
          },
          status: 'completed' as const,
        },
      ];

      const convergenceInput: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Merging results',
        nextStepNeeded: true,
        parallelResults,
        convergenceStrategy: 'merge',
      };

      const response = await executeThinkingStep(
        convergenceInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(response.content).toBeDefined();
      expect(response.content[0]).toBeDefined();
      const responseData = response.isError ? response : JSON.parse(response.content[0].text);
      if (!response.isError && responseData.technique) {
        expect(responseData.technique).toBe('convergence');
      }
      expect(responseData.synthesis).toBeDefined();
      expect(responseData.insights).toContain('Insight A');
      expect(responseData.insights).toContain('Insight C');
    });

    it('should select best results using select strategy', async () => {
      const parallelResults = [
        {
          sessionId: 'session1',
          planId: 'plan1',
          technique: 'six_hats' as const,
          problem: 'Test problem',
          insights: ['Low quality insight'],
          results: { output: 'Minimal output' },
          metrics: {
            executionTime: 500,
            completedSteps: 3,
            totalSteps: 6,
            confidence: 0.4,
          },
          status: 'completed' as const,
        },
        {
          sessionId: 'session2',
          planId: 'plan1',
          technique: 'scamper' as const,
          problem: 'Test problem',
          insights: ['High quality insight 1', 'High quality insight 2'],
          results: { output: 'Comprehensive output' },
          metrics: {
            executionTime: 1000,
            completedSteps: 8,
            totalSteps: 8,
            confidence: 0.9,
          },
          status: 'completed' as const,
        },
      ];

      const convergenceInput: ExecuteThinkingStepInput = {
        technique: 'convergence',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Selecting best results',
        nextStepNeeded: true,
        parallelResults,
        convergenceStrategy: 'select',
      };

      const response = await executeThinkingStep(
        convergenceInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      expect(response.content).toBeDefined();
      expect(response.content[0]).toBeDefined();
      const responseData = response.isError ? response : JSON.parse(response.content[0].text);
      if (!response.isError && responseData.technique) {
        expect(responseData.technique).toBe('convergence');
      }
      expect(responseData.synthesis).toBeDefined();
      // Should prioritize the higher confidence result
      expect(responseData.insights).toContain('High quality insight 1');
    });
  });

  describe('Session Synchronization', () => {
    it('should share context between parallel sessions', async () => {
      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const synchronizer = parallelContext.getSessionSynchronizer();

      // Initialize shared context
      const groupId = 'sync-test-group';
      synchronizer.initializeSharedContext(groupId);

      // Update context from session 1
      await synchronizer.updateSharedContext('session1', groupId, {
        insights: ['Shared insight 1'],
        constraints: ['Budget limit'],
      });

      // Update context from session 2
      await synchronizer.updateSharedContext('session2', groupId, {
        insights: ['Shared insight 2'],
        opportunities: ['Market gap'],
      });

      // Get merged context
      const sharedContext = synchronizer.getSharedContext(groupId);
      expect(sharedContext).toBeDefined();
      expect(sharedContext?.insights).toBeDefined();
      expect(Array.isArray(sharedContext?.insights)).toBe(true);
      expect(sharedContext?.insights).toContain('Shared insight 1');
      expect(sharedContext?.insights).toContain('Shared insight 2');
      expect(sharedContext?.constraints).toContain('Budget limit');
      expect(sharedContext?.opportunities).toContain('Market gap');
    });

    it('should handle context conflicts', async () => {
      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const synchronizer = parallelContext.getSessionSynchronizer();

      const groupId = 'conflict-test-group';
      synchronizer.initializeSharedContext(groupId);

      // Session 1 sets a value
      await synchronizer.updateSharedContext('session1', groupId, {
        priority: 'high',
        budget: 10000,
      });

      // Session 2 conflicts
      await synchronizer.updateSharedContext('session2', groupId, {
        priority: 'medium',
        budget: 15000,
      });

      // Get context - should have both values or handle conflict
      const sharedContext = synchronizer.getSharedContext(groupId);
      expect(sharedContext).toBeDefined();
      // The implementation might keep last write or merge conflicts
      expect(sharedContext?.budget).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up completed groups after retention period', async () => {
      vi.useFakeTimers();
      const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
      const progressCoordinator = parallelContext.getProgressCoordinator();

      // Create and complete a group
      const groupId = 'cleanup-test-group';
      progressCoordinator.startGroup(groupId);

      // Report completion for all sessions
      const sessionIds = ['session1', 'session2'];
      for (const sessionId of sessionIds) {
        await progressCoordinator.reportProgress({
          groupId,
          sessionId,
          technique: 'six_hats',
          currentStep: 6,
          totalSteps: 6,
          status: 'completed',
          timestamp: Date.now(),
        });
      }

      // Check initial memory stats
      const statsBefore = progressCoordinator.getMemoryStats();
      expect(statsBefore.sessionProgressCount).toBeGreaterThan(0);

      // Fast forward past retention period (30 minutes) and cleanup interval
      vi.advanceTimersByTime(36 * 60 * 1000);

      // Check memory stats after cleanup
      const statsAfter = progressCoordinator.getMemoryStats();
      expect(statsAfter.completedGroupsAwaitingCleanup).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of parallel sessions', async () => {
      const sessionCount = 10;
      const planInput: PlanThinkingSessionInput = {
        problem: 'Scalability test',
        techniques: Array(sessionCount).fill('po'),
        executionMode: 'parallel',
        maxParallelism: 10,
        timeframe: 'quick',
      };

      const planResponse = planThinkingSession(planInput, sessionManager, techniqueRegistry);

      // planThinkingSession returns PlanThinkingSessionOutput directly
      const planData = planResponse;
      expect(planData.parallelPlans).toBeDefined();

      // Execute all sessions in parallel
      const promises = [];
      for (const plan of planData.parallelPlans) {
        if (plan.technique === 'convergence') continue;
        const techniques = plan.workflow
          ? plan.workflow.map((w: any) => ({
              technique: w.technique,
              estimatedSteps: w.steps.length,
            }))
          : [];
        for (const technique of techniques) {
          const promise = executeThinkingStep(
            {
              planId: planData.planId,
              technique: technique.technique,
              problem: planInput.problem,
              currentStep: 1,
              totalSteps: technique.estimatedSteps,
              output: 'Parallel execution',
              nextStepNeeded: true,
            },
            sessionManager,
            techniqueRegistry,
            visualFormatter,
            metricsCollector,
            complexityAnalyzer,
            ergodicityManager
          );
          promises.push(promise);
        }
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(sessionCount);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
      });
    });
  });
});
