/**
 * Tests for ExecutionModeController - Simplified for sequential-only mode
 */

import { describe, it, expect } from 'vitest';
import { ExecutionModeController } from '../../../layers/discovery/ExecutionModeController.js';
import type { DiscoverTechniquesInput } from '../../../types/planning.js';
import type { LateralTechnique } from '../../../types/index.js';

describe('ExecutionModeController', () => {
  const controller = new ExecutionModeController();

  const createInput = (
    overrides: Partial<DiscoverTechniquesInput> = {}
  ): DiscoverTechniquesInput => ({
    problem: 'Test problem',
    ...overrides,
  });

  describe('determineExecutionMode', () => {
    it('should always return sequential mode', () => {
      const input = createInput();
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.reason).toContain('Sequential execution is the only supported mode');
    });

    it('should return sequential even when parallel is requested', () => {
      const input = createInput({ executionMode: 'parallel' });
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
    });

    it('should add warning for excessive techniques', () => {
      const input = createInput();
      // 8 techniques - should trigger warning
      const techniques: LateralTechnique[] = [
        'six_hats',
        'po',
        'random_entry',
        'scamper',
        'design_thinking',
        'triz',
        'concept_extraction',
        'yes_and',
      ];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('8 techniques recommended');
      expect(result.warnings?.[0]).toContain('consider if all are necessary');
    });

    it('should add warning for time constraints', () => {
      const input = createInput({
        constraints: ['time limit', 'need quick results'],
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Time constraint'))).toBe(true);
    });

    it('should handle auto mode by returning sequential', () => {
      const input = createInput({ executionMode: 'auto' });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
    });
  });

  describe('validateExecutionMode', () => {
    it('should validate sequential mode', () => {
      const result = controller.validateExecutionMode('sequential');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject parallel mode', () => {
      const result = controller.validateExecutionMode('parallel');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not supported');
      expect(result.error).toContain('sequential');
    });

    it('should reject auto mode', () => {
      const result = controller.validateExecutionMode('auto');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not supported');
    });
  });

  describe('edge cases', () => {
    it('should handle empty techniques array', () => {
      const input = createInput();
      const techniques: LateralTechnique[] = [];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
    });

    it('should handle single technique', () => {
      const input = createInput();
      const techniques: LateralTechnique[] = ['six_hats'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.warnings).toBeUndefined();
    });

    it('should handle many techniques with time constraint', () => {
      const input = createInput({
        constraints: ['time pressure'],
      });
      // 8 techniques to trigger warning
      const techniques: LateralTechnique[] = [
        'six_hats',
        'po',
        'random_entry',
        'scamper',
        'design_thinking',
        'triz',
        'concept_extraction',
        'yes_and',
      ];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.warnings?.length).toBe(2); // Both excessive techniques and time constraint warnings
    });
  });
});
