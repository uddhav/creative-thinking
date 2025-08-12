/**
 * Test that WorkflowGuard's validTechniques stays in sync with TechniqueRegistry
 * This prevents the E209 error where valid techniques are incorrectly rejected
 */

import { describe, it, expect } from 'vitest';
import { WorkflowGuard } from '../../core/WorkflowGuard.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ExecutionValidator } from '../../core/ValidationStrategies.js';
import type { LateralTechnique } from '../../types/index.js';

describe('WorkflowGuard Techniques Synchronization', () => {
  it('should have all techniques from TechniqueRegistry in validTechniques', () => {
    const workflowGuard = new WorkflowGuard();
    const techniqueRegistry = TechniqueRegistry.getInstance();

    // Get all registered techniques from the registry
    const registeredTechniques = techniqueRegistry.getAllTechniques();

    // Get validTechniques from WorkflowGuard (using a workaround since it's private)
    // We'll test this by checking if each technique doesn't trigger an invalid_technique violation
    const validTechniques: string[] = [];

    // Test each registered technique to see if WorkflowGuard accepts it
    for (const technique of registeredTechniques) {
      const args = {
        planId: 'test_plan_123',
        technique,
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
      };

      // Record a fake discovery and planning call to bypass those checks
      workflowGuard.recordCall('discover_techniques', { problem: 'Test problem' });
      workflowGuard.recordCall('plan_thinking_session', {
        problem: 'Test problem',
        techniques: [technique],
      });

      // Check if this technique triggers an invalid_technique violation
      const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', args);

      // If there's no violation or it's not about invalid technique, the technique is valid
      if (!violation || violation.type !== 'invalid_technique') {
        validTechniques.push(technique);
      }
    }

    // All registered techniques should be valid in WorkflowGuard
    expect([...validTechniques].sort()).toEqual([...registeredTechniques].sort());

    // Also verify the count matches what we expect (23 techniques)
    expect(registeredTechniques.length).toBe(23);
    expect(validTechniques.length).toBe(23);

    // Explicitly check for the three techniques that were missing
    expect(validTechniques).toContain('quantum_superposition');
    expect(validTechniques).toContain('temporal_creativity');
    expect(validTechniques).toContain('paradoxical_problem');
    expect(validTechniques).toContain('biomimetic_path');
    expect(validTechniques).toContain('cultural_path');
    expect(validTechniques).toContain('neuro_computational');
    expect(validTechniques).toContain('cultural_creativity');
  });

  it('should validate all LateralTechnique type values are registered', () => {
    const techniqueRegistry = TechniqueRegistry.getInstance();

    // List all techniques from the LateralTechnique type
    // This list must be manually maintained to match the type definition
    const lateralTechniqueValues: LateralTechnique[] = [
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
      'quantum_superposition',
      'temporal_creativity',
      'paradoxical_problem',
      'meta_learning',
      'biomimetic_path',
      'first_principles',
      'cultural_path',
      'neuro_computational',
      'cultural_creativity',
    ];

    // All type values should be registered
    for (const technique of lateralTechniqueValues) {
      expect(techniqueRegistry.isValidTechnique(technique)).toBe(true);
    }

    // Registry should have exactly these techniques
    const registeredTechniques = techniqueRegistry.getAllTechniques();
    expect([...registeredTechniques].sort()).toEqual(lateralTechniqueValues.sort());
  });

  it('should reject truly invalid techniques', () => {
    const workflowGuard = new WorkflowGuard();

    // Test with a completely made-up technique name
    const args = {
      planId: 'test_plan_123',
      technique: 'made_up_technique',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 3,
      output: 'Test output',
      nextStepNeeded: true,
    };

    // Record fake calls to bypass discovery/planning checks
    workflowGuard.recordCall('discover_techniques', { problem: 'Test problem' });
    workflowGuard.recordCall('plan_thinking_session', {
      problem: 'Test problem',
      techniques: ['six_hats'],
    });

    const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', args);

    expect(violation).toBeDefined();
    expect(violation?.type).toBe('invalid_technique');
    expect(violation?.message).toContain("Invalid technique 'made_up_technique'");
  });

  it('should have ValidationStrategies in sync with TechniqueRegistry', () => {
    const techniqueRegistry = TechniqueRegistry.getInstance();
    const executionValidator = new ExecutionValidator();

    // Get all registered techniques
    const registeredTechniques = techniqueRegistry.getAllTechniques();

    // Test that ValidationStrategies accepts all registered techniques
    for (const technique of registeredTechniques) {
      const input = {
        planId: 'test_plan_123',
        technique,
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const result = executionValidator.validate(input);

      // Check that the technique doesn't cause an "INVALID TECHNIQUE" error
      const hasInvalidTechniqueError = result.errors.some(
        error => error.includes('INVALID TECHNIQUE') && error.includes(technique)
      );

      if (hasInvalidTechniqueError) {
        console.error(`Technique ${technique} is incorrectly marked as invalid`);
        console.error('Errors:', result.errors);
      }

      expect(hasInvalidTechniqueError).toBe(false);
    }

    // Test that an invalid technique is rejected
    const invalidInput = {
      planId: 'test_plan_123',
      technique: 'completely_invalid_technique',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 3,
      output: 'Test output',
      nextStepNeeded: true,
    };

    const invalidResult = executionValidator.validate(invalidInput);
    const hasInvalidError = invalidResult.errors.some(error => error.includes('INVALID TECHNIQUE'));

    expect(hasInvalidError).toBe(true);
  });
});
