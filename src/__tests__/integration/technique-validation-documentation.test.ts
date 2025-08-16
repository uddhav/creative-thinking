/**
 * Integration test to verify all technique validation requirements are properly documented
 * and that error messages are helpful for users and LLMs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type { ExecuteThinkingStepInput, PlanThinkingSessionInput } from '../../types/index.js';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';

describe('Technique Validation Documentation', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  afterEach(() => {
    server.destroy();
  });

  describe('First Principles Handler', () => {
    it('should provide helpful error messages for missing fields', async () => {
      // Create a plan with first_principles
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem for validation',
        techniques: ['first_principles'],
      };
      const planResult = server.planThinkingSession(planInput);
      const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
      expect(planId).toBeDefined();
      if (!planId) throw new Error('Plan ID not found');

      // Test Step 1 without components
      const step1Input: ExecuteThinkingStepInput = {
        planId,
        technique: 'first_principles',
        problem: 'Test problem for validation',
        currentStep: 1,
        totalSteps: 5,
        output: 'Breaking down the problem into parts',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(step1Input);
      const response = JSON.parse(result.content[0].text);

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Step 1 (Deconstruction)');
      expect(response.error.message).toContain('Example:');
      expect(response.error.message).toContain('components');
      expect(response.error.message).toContain('breakdown');
      expect(response.error.recovery).toBeDefined();
      expect(response.error.context?.example).toBeDefined();
    });

    it('should accept alternative field names', async () => {
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem for validation',
        techniques: ['first_principles'],
      };
      const planResult = server.planThinkingSession(planInput);
      const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
      if (!planId) throw new Error('Plan ID not found');

      // Step 2 with alternative field name "principles" instead of "fundamentalTruths"
      const step2Input: ExecuteThinkingStepInput = {
        planId,
        technique: 'first_principles',
        problem: 'Test problem for validation',
        currentStep: 2,
        totalSteps: 5,
        output: 'Identifying fundamental truths',
        nextStepNeeded: true,
        principles: ['Truth 1', 'Truth 2'], // Alternative field name
      } as any;

      const result = await server.executeThinkingStep(step2Input);
      const response = JSON.parse(result.content[0].text);

      // Should NOT get an error when using alternative field name
      expect(response.error).toBeUndefined();
      expect(response.currentStep).toBe(2);
      expect(response.technique).toBe('first_principles');
    });
  });

  describe('NeuroComputational Handler', () => {
    it('should have documented fields in API schema', () => {
      const schema = EXECUTE_THINKING_STEP_TOOL.inputSchema;

      // Check that all NeuroComputational fields are documented
      expect(schema.properties).toHaveProperty('neuralMappings');
      expect(schema.properties).toHaveProperty('patternGenerations');
      expect(schema.properties).toHaveProperty('interferenceAnalysis');
      expect(schema.properties).toHaveProperty('computationalModels');
      expect(schema.properties).toHaveProperty('optimizationCycles');
      expect(schema.properties).toHaveProperty('convergenceMetrics');
      expect(schema.properties).toHaveProperty('finalSynthesis');
    });

    it('should provide helpful error for complex nested fields', async () => {
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['neuro_computational'],
      };
      const planResult = server.planThinkingSession(planInput);
      const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
      if (!planId) throw new Error('Plan ID not found');

      // Step 3 with incomplete interferenceAnalysis
      const step3Input: ExecuteThinkingStepInput = {
        planId,
        technique: 'neuro_computational',
        problem: 'Test problem',
        currentStep: 3,
        totalSteps: 6,
        output: 'Analyzing interference',
        nextStepNeeded: true,
        interferenceAnalysis: {
          constructive: ['Synergy found'],
          // Missing destructive
        },
      } as any;

      const result = await server.executeThinkingStep(step3Input);
      const response = JSON.parse(result.content[0].text);

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('BOTH constructive AND destructive');
      expect(response.error.message).toContain('Example:');
    });
  });

  describe('BiomimeticPath Handler', () => {
    it('should have newly documented fields in API schema', () => {
      const schema = EXECUTE_THINKING_STEP_TOOL.inputSchema;

      // Check that all Biomimetic fields are now documented
      expect(schema.properties).toHaveProperty('immuneResponse');
      expect(schema.properties).toHaveProperty('antibodies');
      expect(schema.properties).toHaveProperty('mutations');
      expect(schema.properties).toHaveProperty('selectionPressure');
      expect(schema.properties).toHaveProperty('symbioticRelationships');
      expect(schema.properties).toHaveProperty('ecosystemBalance');
      expect(schema.properties).toHaveProperty('swarmBehavior');
      expect(schema.properties).toHaveProperty('resiliencePatterns');
      expect(schema.properties).toHaveProperty('redundancy');
      expect(schema.properties).toHaveProperty('naturalSynthesis');
      expect(schema.properties).toHaveProperty('biologicalStrategies');
    });

    it('should provide helpful biological context in errors', async () => {
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['biomimetic_path'],
      };
      const planResult = server.planThinkingSession(planInput);
      const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
      if (!planId) throw new Error('Plan ID not found');

      const step1Input: ExecuteThinkingStepInput = {
        planId,
        technique: 'biomimetic_path',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Analyzing biological defense mechanisms',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(step1Input);
      const response = JSON.parse(result.content[0].text);

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Immune Response Detection');
      expect(response.error.message).toContain('defensive biological patterns');
      expect(response.error.message).toContain('Example:');
    });
  });

  describe('MetaLearning Handler', () => {
    it('should have metaSynthesis field documented', () => {
      const schema = EXECUTE_THINKING_STEP_TOOL.inputSchema;

      // Check that the missing metaSynthesis field is now documented
      expect(schema.properties).toHaveProperty('metaSynthesis');
      expect(schema.properties.metaSynthesis).toHaveProperty('description');
      expect(schema.properties.metaSynthesis.description).toContain('Meta-level synthesis');
    });

    it('should accept alternative field names for flexibility', async () => {
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['meta_learning'],
      };
      const planResult = server.planThinkingSession(planInput);
      const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
      if (!planId) throw new Error('Plan ID not found');

      // Step 5 with alternative field
      const step5Input: ExecuteThinkingStepInput = {
        planId,
        technique: 'meta_learning',
        problem: 'Test problem',
        currentStep: 5,
        totalSteps: 5,
        output: 'Meta-synthesis complete',
        nextStepNeeded: false,
        synthesisStrategy: 'Adaptive meta-learning strategy', // Alternative to metaSynthesis
      } as any;

      const result = await server.executeThinkingStep(step5Input);
      const response = JSON.parse(result.content[0].text);

      // Should NOT get an error when using alternative field name
      expect(response.error).toBeUndefined();
      expect(response.currentStep).toBe(5);
      expect(response.technique).toBe('meta_learning');
    });
  });

  describe('Validation Consistency Across All Techniques', () => {
    it('should ensure all techniques work with minimal required fields', async () => {
      const techniques = [
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
        'cultural_integration',
        'collective_intel',
        'disney_method',
        'nine_windows',
        'quantum_superposition',
        'temporal_creativity',
        'paradoxical_problem',
        'meta_learning',
        'biomimetic_path',
        'first_principles',
        'neuro_computational',
      ];

      for (const technique of techniques) {
        const planInput: PlanThinkingSessionInput = {
          problem: `Test ${technique}`,
          techniques: [technique as any],
        };
        const planResult = server.planThinkingSession(planInput);
        const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
        expect(planId).toBeDefined();
        if (!planId) continue;

        // Test that minimal fields work for techniques without strict validation
        if (
          ![
            'first_principles',
            'neuro_computational',
            'meta_learning',
            'biomimetic_path',
            'paradoxical_problem',
          ].includes(technique)
        ) {
          const stepInput: ExecuteThinkingStepInput = {
            planId,
            technique: technique as any,
            problem: `Test ${technique}`,
            currentStep: 1,
            totalSteps: 3,
            output: `Executing ${technique} step 1`,
            nextStepNeeded: true,
          };

          const result = await server.executeThinkingStep(stepInput);
          const response = JSON.parse(result.content[0].text);

          // Should succeed with just the required fields
          expect(response.error).toBeUndefined();
          expect(response.technique).toBe(technique);
          expect(response.currentStep).toBe(1);
        }
      }
    });
  });

  describe('Error Message Quality', () => {
    it('should include example in every validation error', async () => {
      const techniquesWithValidation = [
        { technique: 'first_principles', step: 1 },
        { technique: 'biomimetic_path', step: 2 },
        { technique: 'meta_learning', step: 3 },
        { technique: 'neuro_computational', step: 4 },
      ];

      for (const { technique, step } of techniquesWithValidation) {
        const planInput: PlanThinkingSessionInput = {
          problem: 'Test problem',
          techniques: [technique as any],
        };
        const planResult = server.planThinkingSession(planInput);
        const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
        if (!planId) continue;

        const stepInput: ExecuteThinkingStepInput = {
          planId,
          technique: technique as any,
          problem: 'Test problem',
          currentStep: step,
          totalSteps: 5,
          output: `Step ${step} output`,
          nextStepNeeded: true,
        };

        const result = await server.executeThinkingStep(stepInput);
        const response = JSON.parse(result.content[0].text);

        if (response.error) {
          // Every error should include an example
          expect(response.error.message).toContain('Example:');
          expect(response.error.message).toContain('{');
          expect(response.error.message).toContain('}');
          expect(response.error.context?.example).toBeDefined();
        }
      }
    });

    it('should provide actionable recovery suggestions', async () => {
      const planInput: PlanThinkingSessionInput = {
        problem: 'Test problem',
        techniques: ['first_principles'],
      };
      const planResult = server.planThinkingSession(planInput);
      const planId = planResult.content[0].text.match(/"planId":\s*"([^"]+)"/)?.[1];
      if (!planId) throw new Error('Plan ID not found');

      const stepInput: ExecuteThinkingStepInput = {
        planId,
        technique: 'first_principles',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 5,
        output: 'Breaking down',
        nextStepNeeded: true,
      };

      const result = await server.executeThinkingStep(stepInput);
      const response = JSON.parse(result.content[0].text);

      expect(response.error).toBeDefined();
      expect(response.error.recovery).toBeDefined();
      expect(Array.isArray(response.error.recovery)).toBe(true);
      expect(response.error.recovery.length).toBeGreaterThan(0);
      expect(response.error.recovery[0]).toContain('Provide');
    });
  });
});
