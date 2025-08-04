/**
 * Tests for ExecutionValidator convergence validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionValidator } from '../../../layers/execution/ExecutionValidator.js';
import type { ExecuteThinkingStepInput } from '../../../types/index.js';
import type { SessionManager } from '../../../core/SessionManager.js';
import type { TechniqueRegistry } from '../../../techniques/TechniqueRegistry.js';
import type { VisualFormatter } from '../../../utils/VisualFormatter.js';

describe('ExecutionValidator', () => {
  let validator: ExecutionValidator;
  let mockSessionManager: SessionManager;
  let mockTechniqueRegistry: TechniqueRegistry;
  let mockVisualFormatter: VisualFormatter;

  beforeEach(() => {
    mockSessionManager = {} as SessionManager;
    mockTechniqueRegistry = {} as TechniqueRegistry;
    mockVisualFormatter = {} as VisualFormatter;

    validator = new ExecutionValidator(
      mockSessionManager,
      mockTechniqueRegistry,
      mockVisualFormatter
    );
  });

  describe('validateConvergenceTechnique', () => {
    it('should validate convergence technique with required fields', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'plan_123',
        technique: 'convergence',
        problem: 'Synthesize results',
        currentStep: 1,
        totalSteps: 1,
        output: 'Converging...',
        nextStepNeeded: false,
        parallelResults: [
          {
            planId: 'plan_1',
            technique: 'six_hats',
            results: { insights: ['insight1'] },
            insights: ['Key insight'],
            metrics: { effectiveness: 0.8 },
          },
        ],
      };

      const result = validator.validateConvergenceTechnique(input);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject convergence technique without parallelResults', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'plan_123',
        technique: 'convergence',
        problem: 'Synthesize results',
        currentStep: 1,
        totalSteps: 1,
        output: 'Converging...',
        nextStepNeeded: false,
      };

      const result = validator.validateConvergenceTechnique(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.content?.[0]?.text).toContain(
        "Missing required parameter 'parallelResults' for tool 'convergence'"
      );
    });

    it('should reject convergence technique with empty parallelResults', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'plan_123',
        technique: 'convergence',
        problem: 'Synthesize results',
        currentStep: 1,
        totalSteps: 1,
        output: 'Converging...',
        nextStepNeeded: false,
        parallelResults: [],
      };

      const result = validator.validateConvergenceTechnique(input);
      expect(result.isValid).toBe(false);
      expect(result.error?.content?.[0]?.text).toContain(
        "Invalid input for 'parallelResults'. Expected non-empty array"
      );
    });

    it('should reject non-convergence technique with parallel fields', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'plan_123',
        technique: 'six_hats',
        problem: 'Analyze problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Blue hat thinking...',
        nextStepNeeded: true,
        parallelResults: [
          // Should not have this
          {
            planId: 'plan_1',
            technique: 'po',
            results: { insights: ['insight1'] },
            insights: ['Key insight'],
            metrics: { effectiveness: 0.8 },
          },
        ],
      };

      const result = validator.validateConvergenceTechnique(input);
      expect(result.isValid).toBe(false);
      expect(result.error?.content?.[0]?.text).toContain('should not have parallel');
    });

    it('should accept non-convergence technique without parallel fields', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'plan_123',
        technique: 'six_hats',
        problem: 'Analyze problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Blue hat thinking...',
        nextStepNeeded: true,
      };

      const result = validator.validateConvergenceTechnique(input);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
