import { describe, it, expect } from 'vitest';
import type {
  ConvergenceOptions,
  CoordinationStrategy,
  ParallelPlan,
} from '../../types/planning.js';
import type { ParallelSessionGroup, ExecuteThinkingStepInput } from '../../types/index.js';
import {
  isExecutionMode,
  isConvergenceMethod,
  supportsParallelExecution,
  canExecuteInParallel,
  isConvergenceTechnique,
  isValidMaxParallelism,
  getDefaultMaxParallelism,
} from '../../types/guards.js';
import { ErrorCode, ParallelExecutionError } from '../../errors/types.js';

describe('Parallel Execution Types', () => {
  describe('Type Guards', () => {
    describe('isExecutionMode', () => {
      it('should validate valid execution modes', () => {
        expect(isExecutionMode('sequential')).toBe(true);
        expect(isExecutionMode('parallel')).toBe(true);
        expect(isExecutionMode('auto')).toBe(true);
      });

      it('should reject invalid execution modes', () => {
        expect(isExecutionMode('invalid')).toBe(false);
        expect(isExecutionMode(123)).toBe(false);
        expect(isExecutionMode(null)).toBe(false);
        expect(isExecutionMode(undefined)).toBe(false);
      });
    });

    describe('isConvergenceMethod', () => {
      it('should validate valid convergence methods', () => {
        expect(isConvergenceMethod('execute_thinking_step')).toBe(true);
        expect(isConvergenceMethod('llm_handoff')).toBe(true);
        expect(isConvergenceMethod('none')).toBe(true);
      });

      it('should reject invalid convergence methods', () => {
        expect(isConvergenceMethod('merge')).toBe(false);
        expect(isConvergenceMethod('')).toBe(false);
        expect(isConvergenceMethod({})).toBe(false);
      });
    });

    describe('supportsParallelExecution', () => {
      it('should return true for parallelizable techniques', () => {
        expect(supportsParallelExecution('six_hats')).toBe(true);
        expect(supportsParallelExecution('scamper')).toBe(true);
        expect(supportsParallelExecution('po')).toBe(true);
        expect(supportsParallelExecution('random_entry')).toBe(true);
      });

      it('should return false for convergence technique', () => {
        expect(supportsParallelExecution('convergence')).toBe(false);
      });
    });

    describe('canExecuteInParallel', () => {
      it('should return true when all techniques support parallel', () => {
        expect(canExecuteInParallel(['six_hats', 'scamper', 'po'])).toBe(true);
        expect(canExecuteInParallel(['random_entry'])).toBe(true);
      });

      it('should return false when any technique does not support parallel', () => {
        expect(canExecuteInParallel(['six_hats', 'convergence'])).toBe(false);
        expect(canExecuteInParallel(['convergence'])).toBe(false);
      });
    });

    describe('isConvergenceTechnique', () => {
      it('should identify convergence technique', () => {
        expect(isConvergenceTechnique('convergence')).toBe(true);
        expect(isConvergenceTechnique('six_hats')).toBe(false);
        expect(isConvergenceTechnique('scamper')).toBe(false);
      });
    });

    describe('isValidMaxParallelism', () => {
      it('should validate valid parallelism values', () => {
        expect(isValidMaxParallelism(1)).toBe(true);
        expect(isValidMaxParallelism(3)).toBe(true);
        expect(isValidMaxParallelism(10)).toBe(true);
      });

      it('should reject invalid parallelism values', () => {
        expect(isValidMaxParallelism(0)).toBe(false);
        expect(isValidMaxParallelism(11)).toBe(false);
        expect(isValidMaxParallelism(-1)).toBe(false);
        expect(isValidMaxParallelism(3.5)).toBe(true); // Numbers are allowed
        expect(isValidMaxParallelism('3')).toBe(false);
        expect(isValidMaxParallelism(null)).toBe(false);
      });
    });

    describe('getDefaultMaxParallelism', () => {
      it('should return appropriate defaults', () => {
        expect(getDefaultMaxParallelism(1)).toBe(1);
        expect(getDefaultMaxParallelism(2)).toBe(2);
        expect(getDefaultMaxParallelism(3)).toBe(3);
        expect(getDefaultMaxParallelism(5)).toBe(3); // Capped at 3
        expect(getDefaultMaxParallelism(10)).toBe(3); // Capped at 3
      });
    });
  });

  describe('Type Structures', () => {
    it('should create valid ConvergenceOptions', () => {
      const options: ConvergenceOptions = {
        method: 'execute_thinking_step',
        convergencePlan: {
          planId: 'plan_conv_123',
          technique: 'convergence',
          estimatedSteps: 3,
          requiresAllPlans: true,
          metadata: {
            synthesisStrategy: 'merge',
            conflictResolution: 'weighted',
          },
        },
      };

      expect(options.method).toBe('execute_thinking_step');
      expect(options.convergencePlan?.technique).toBe('convergence');
    });

    it('should create valid CoordinationStrategy', () => {
      const strategy: CoordinationStrategy = {
        syncPoints: [
          {
            afterPlanIds: ['plan1', 'plan2'],
            action: 'checkpoint',
          },
        ],
        sharedContext: {
          enabled: true,
          updateStrategy: 'batched',
        },
        errorHandling: 'partial_results',
      };

      expect(strategy.errorHandling).toBe('partial_results');
      expect(strategy.sharedContext?.enabled).toBe(true);
    });

    it('should create valid ParallelPlan', () => {
      const plan: ParallelPlan = {
        planId: 'plan_123',
        techniques: ['six_hats'],
        workflow: [],
        estimatedTime: '15 minutes',
        canExecuteIndependently: true,
        dependencies: [],
        metadata: {
          techniqueCount: 1,
          totalSteps: 6,
          complexity: 'medium',
        },
      };

      expect(plan.canExecuteIndependently).toBe(true);
      expect(plan.metadata?.complexity).toBe('medium');
    });

    it('should create valid ParallelSessionGroup', () => {
      const group: ParallelSessionGroup = {
        groupId: 'group_123',
        sessionIds: ['session_1', 'session_2'],
        parentProblem: 'How to improve user retention?',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(['session_1']),
      };

      expect(group.executionMode).toBe('parallel');
      expect(group.completedSessions.has('session_1')).toBe(true);
    });

    it('should support convergence fields in ExecuteThinkingStepInput', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'plan_conv',
        technique: 'convergence',
        problem: 'Synthesize results',
        currentStep: 1,
        totalSteps: 3,
        output: 'Starting synthesis',
        nextStepNeeded: true,
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            results: { insights: ['insight1'] },
            insights: ['Key insight from six hats'],
            metrics: { effectiveness: 0.8 },
          },
        ],
        convergenceStrategy: 'merge',
      };

      expect(input.technique).toBe('convergence');
      expect(input.parallelResults?.length).toBe(1);
      expect(input.convergenceStrategy).toBe('merge');
    });
  });

  describe('Error Handling', () => {
    it('should create ParallelExecutionError with proper details', () => {
      const error = new ParallelExecutionError(
        ErrorCode.CONVERGENCE_DEPENDENCIES_NOT_MET,
        'Cannot converge: 2 plans still running',
        ['plan1', 'plan2'],
        [{ technique: 'six_hats', partial: true }]
      );

      expect(error.code).toBe(ErrorCode.CONVERGENCE_DEPENDENCIES_NOT_MET);
      expect(error.failedPlans).toEqual(['plan1', 'plan2']);
      expect(error.partialResults?.length).toBe(1);
      expect(error.layer).toBe('execution');
    });

    it('should handle different parallel error codes', () => {
      const errors = [
        new ParallelExecutionError(
          ErrorCode.PARALLEL_EXECUTION_NOT_SUPPORTED,
          'Parallel execution not enabled'
        ),
        new ParallelExecutionError(
          ErrorCode.MAX_PARALLELISM_EXCEEDED,
          'Cannot run 15 techniques in parallel'
        ),
        new ParallelExecutionError(
          ErrorCode.PARALLEL_SESSION_NOT_FOUND,
          'Session not found in group'
        ),
      ];

      errors.forEach(error => {
        expect(error.name).toBe('ParallelExecutionError');
        expect(error.layer).toBe('execution');
      });
    });
  });
});
