/**
 * Tests for ParallelPlanGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParallelPlanGenerator } from '../../../layers/planning/ParallelPlanGenerator.js';
import type { LateralTechnique } from '../../../types/index.js';
import type { PlanThinkingSessionInput, ConvergenceOptions } from '../../../types/planning.js';
import type { TechniqueRegistry } from '../../../techniques/TechniqueRegistry.js';
import type { TechniqueHandler } from '../../../techniques/types.js';

// Mock implementations

const createMockHandler = (technique: LateralTechnique, totalSteps: number): TechniqueHandler => ({
  getTechniqueInfo: () => ({
    name: technique,
    description: `${technique} description`,
    totalSteps,
  }),
  getStepInfo: (step: number) => ({
    name: `Step ${step}`,
    focus: `${technique} step ${step} focus`,
    emoji: '🎯',
  }),
  validateStep: () => true,
  getStepGuidance: () => 'Guidance',
  summarizeTechnique: () => ({ summary: 'Summary', keyInsights: [] }),
});

const mockTechniqueRegistry = {
  getHandler: (technique: LateralTechnique) => {
    const stepCounts: Record<LateralTechnique, number> = {
      six_hats: 6,
      po: 4,
      random_entry: 3,
      scamper: 8,
      concept_extraction: 4,
      yes_and: 4,
      design_thinking: 5,
      triz: 4,
      neural_state: 4,
      temporal_work: 5,
      cross_cultural: 5,
      collective_intel: 5,
      disney_method: 3,
      nine_windows: 9,
      convergence: 3,
    };
    return createMockHandler(technique, stepCounts[technique] || 4);
  },
} as TechniqueRegistry;

describe('ParallelPlanGenerator', () => {
  let generator: ParallelPlanGenerator;

  beforeEach(() => {
    generator = new ParallelPlanGenerator(mockTechniqueRegistry);
  });

  describe('Sequential Plan Generation', () => {
    it('should generate sequential plan when mode is sequential', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'],
        executionMode: 'sequential',
      };

      const result = generator.generateParallelPlans(input, 'sequential');

      expect(result.executionMode).toBe('sequential');
      expect(result.parallelPlans).toBeUndefined();
      expect(result.workflow).toHaveLength(2);
      expect(result.totalSteps).toBe(10); // 6 + 4
    });
  });

  describe('Parallel Plan Generation', () => {
    it('should generate parallel plans for independent techniques', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po', 'random_entry'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      expect(result.executionMode).toBe('parallel');
      expect(result.parallelPlans).toBeDefined();
      expect(result.parallelPlans?.length).toBeGreaterThan(0);

      // All techniques should be included
      const allTechniques = result.parallelPlans?.flatMap(p => p.techniques) || [];
      expect(allTechniques.sort()).toEqual(input.techniques.sort());
    });

    it('should respect maxParallelism constraint', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po', 'random_entry', 'scamper', 'disney_method'],
        executionMode: 'parallel',
        maxParallelism: 2,
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      // Should have at most 2 parallel groups (excluding convergence)
      const nonConvergencePlans =
        result.parallelPlans?.filter(p => !p.techniques.includes('convergence')) || [];
      expect(nonConvergencePlans.length).toBeLessThanOrEqual(2);
    });

    it('should handle dependent techniques correctly', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['triz', 'design_thinking'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      // TRIZ depends on design_thinking, so they should be in different groups
      const trizPlan = result.parallelPlans?.find(p => p.techniques.includes('triz'));
      const dtPlan = result.parallelPlans?.find(p => p.techniques.includes('design_thinking'));

      if (trizPlan && dtPlan && trizPlan !== dtPlan) {
        // If in different plans, triz should have dependency on design_thinking's plan
        expect(trizPlan.canExecuteIndependently).toBe(false);
      }
    });
  });

  describe('Convergence Plan Generation', () => {
    it('should create convergence plan when requested', () => {
      const convergenceOptions: ConvergenceOptions = {
        method: 'execute_thinking_step',
        convergencePlan: {
          metadata: {
            synthesisStrategy: 'comprehensive',
          },
        },
      };

      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel', convergenceOptions);

      // Should have a convergence plan
      const convergencePlan = result.parallelPlans?.find(p => p.techniques.includes('convergence'));
      expect(convergencePlan).toBeDefined();
      expect(convergencePlan?.techniques).toEqual(['convergence']);
      expect(convergencePlan?.canExecuteIndependently).toBe(false);

      // Convergence should depend on other plans
      expect(convergencePlan?.dependencies.length).toBeGreaterThan(0);
    });

    it('should not create convergence plan when method is llm_handoff', () => {
      const convergenceOptions: ConvergenceOptions = {
        method: 'llm_handoff',
      };

      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel', convergenceOptions);

      // Should not have a convergence plan
      const convergencePlan = result.parallelPlans?.find(p => p.techniques.includes('convergence'));
      expect(convergencePlan).toBeUndefined();
    });
  });

  describe('Coordination Strategy', () => {
    it('should create coordination strategy with sync points', () => {
      const convergenceOptions: ConvergenceOptions = {
        method: 'execute_thinking_step',
      };

      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel', convergenceOptions);

      expect(result.coordinationStrategy).toBeDefined();
      expect(result.coordinationStrategy?.syncPoints).toBeDefined();

      // Should have sync point before convergence
      const waitSync = result.coordinationStrategy?.syncPoints.find(sp => sp.action === 'wait');
      expect(waitSync).toBeDefined();
    });

    it('should enable shared context for convergence', () => {
      const convergenceOptions: ConvergenceOptions = {
        method: 'execute_thinking_step',
      };

      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel', convergenceOptions);

      expect(result.coordinationStrategy?.sharedContext.enabled).toBe(true);
      expect(result.coordinationStrategy?.sharedContext.updateStrategy).toBe('checkpoint');
    });
  });

  describe.skip('Time Estimation', () => {
    // Skipped: Time estimation has been removed from the system
    it('should calculate parallel time correctly', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'], // 30 + 20 minutes sequential
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      // In parallel, time should be max of groups + overhead
      expect(result.estimatedTotalTime).toContain('parallel execution');

      // Extract minutes from string
      const match = result.estimatedTotalTime.match(/(\d+)\s*minutes/);
      expect(match).toBeTruthy();

      const totalMinutes = parseInt(match?.[1] || '0');
      // Should be less than sequential (50 minutes)
      expect(totalMinutes).toBeLessThan(50);
    });

    it('should include convergence time in estimate', () => {
      const convergenceOptions: ConvergenceOptions = {
        method: 'execute_thinking_step',
      };

      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'po'],
        executionMode: 'parallel',
      };

      const resultWithoutConvergence = generator.generateParallelPlans(input, 'parallel');
      const resultWithConvergence = generator.generateParallelPlans(
        input,
        'parallel',
        convergenceOptions
      );

      // Extract minutes
      const withoutMatch = resultWithoutConvergence.estimatedTotalTime.match(/(\d+)\s*minutes/);
      const withMatch = resultWithConvergence.estimatedTotalTime.match(/(\d+)\s*minutes/);

      const withoutMinutes = parseInt(withoutMatch?.[1] || '0');
      const withMinutes = parseInt(withMatch?.[1] || '0');

      // With convergence should take longer
      expect(withMinutes).toBeGreaterThan(withoutMinutes);
    });
  });

  describe('Workflow Generation', () => {
    it('should generate correct workflow items for each technique', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      const sixHatsPlan = result.parallelPlans?.find(p => p.techniques.includes('six_hats'));
      expect(sixHatsPlan).toBeDefined();

      const workflow = sixHatsPlan?.workflow[0];
      expect(workflow.technique).toBe('six_hats');
      expect(workflow.steps).toHaveLength(6);
      // estimatedTime removed from workflow
      expect(workflow.requiredInputs).toBeDefined();
      expect(workflow.expectedOutputs).toBeDefined();
    });

    it('should include critical lens for specific steps', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      const sixHatsPlan = result.parallelPlans?.find(p => p.techniques.includes('six_hats'));
      const blackHatStep = sixHatsPlan?.workflow[0].steps[4]; // Step 5 - Black hat

      expect(blackHatStep.criticalLens).toBeDefined();
      expect(blackHatStep.criticalLens).toContain('risk');
    });
  });

  describe('Plan Metadata', () => {
    it('should include correct metadata in plans', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats', 'triz'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      result.parallelPlans?.forEach(plan => {
        expect(plan.metadata).toBeDefined();
        expect(plan.metadata?.techniqueCount).toBe(plan.techniques.length);
        expect(plan.metadata?.totalSteps).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(plan.metadata?.complexity || '');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single technique', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats'],
        executionMode: 'parallel',
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      expect(result.parallelPlans).toHaveLength(1);
      expect(result.parallelPlans?.[0].techniques).toEqual(['six_hats']);
    });

    it('should handle empty objectives and constraints', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['six_hats'],
        executionMode: 'parallel',
        objectives: [],
        constraints: [],
      };

      const result = generator.generateParallelPlans(input, 'parallel');

      expect(result.objectives).toEqual([]);
      expect(result.constraints).toEqual([]);
    });

    it('should handle all techniques with convergence', () => {
      const allTechniques: LateralTechnique[] = [
        'six_hats',
        'po',
        'random_entry',
        'scamper',
        'concept_extraction',
        'yes_and',
        'design_thinking',
        'triz',
        'neural_state',
        'temporal_work',
        'cross_cultural',
        'collective_intel',
        'disney_method',
        'nine_windows',
      ];

      const input: PlanThinkingSessionInput = {
        problem: 'Complex problem',
        techniques: allTechniques,
        executionMode: 'parallel',
        maxParallelism: 5,
      };

      const convergenceOptions: ConvergenceOptions = {
        method: 'execute_thinking_step',
      };

      const result = generator.generateParallelPlans(input, 'parallel', convergenceOptions);

      // Should handle all techniques
      const allPlannedTechniques =
        result.parallelPlans
          ?.filter(p => !p.techniques.includes('convergence'))
          .flatMap(p => p.techniques) || [];

      expect(allPlannedTechniques.sort()).toEqual(allTechniques.sort());

      // Should have convergence plan
      const convergencePlan = result.parallelPlans?.find(p => p.techniques.includes('convergence'));
      expect(convergencePlan).toBeDefined();
    });
  });
});
