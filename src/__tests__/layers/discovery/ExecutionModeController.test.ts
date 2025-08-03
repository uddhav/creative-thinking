/**
 * Tests for ExecutionModeController
 */

import { describe, it, expect } from 'vitest';
import { ExecutionModeController } from '../../../layers/discovery/ExecutionModeController.js';
import { ParallelismDetector } from '../../../layers/discovery/ParallelismDetector.js';
import { ParallelismValidator } from '../../../layers/discovery/ParallelismValidator.js';
import type { DiscoverTechniquesInput } from '../../../types/planning.js';
import type { LateralTechnique } from '../../../types/index.js';

describe('ExecutionModeController', () => {
  const detector = new ParallelismDetector();
  const validator = new ParallelismValidator();
  const controller = new ExecutionModeController(detector, validator);

  const createInput = (
    overrides: Partial<DiscoverTechniquesInput> = {}
  ): DiscoverTechniquesInput => ({
    problem: 'Test problem',
    ...overrides,
  });

  describe('determineExecutionMode', () => {
    it('should respect explicit sequential mode', () => {
      const input = createInput({ executionMode: 'sequential' });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.reason).toContain('Explicitly requested sequential');
      expect(result.confidence).toBe(1.0);
    });

    it('should validate explicit parallel mode', () => {
      const input = createInput({ executionMode: 'parallel' });
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('parallel');
      expect(result.reason).toContain('Explicitly requested parallel');
      expect(result.convergenceOptions).toBeDefined();
    });

    it('should fall back to sequential if parallel validation fails', () => {
      const input = createInput({ executionMode: 'parallel' });
      const techniques: LateralTechnique[] = ['six_hats']; // Only one technique

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.reason).toContain('Cannot execute in parallel');
      expect(result.warnings).toContain('Falling back to sequential execution');
    });

    it('should detect parallel intent from problem text', () => {
      const input = createInput({
        problem: 'I want to explore multiple approaches simultaneously',
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('parallel');
      expect(result.reason).toContain('Detected parallel intent');
    });

    it('should default to sequential without parallel indicators', () => {
      const input = createInput({ problem: 'Solve this step by step' });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.reason).toContain('No parallel execution indicators');
    });

    it('should handle auto mode with many techniques', () => {
      const input = createInput({ executionMode: 'auto' });
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry', 'scamper'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('parallel');
      expect(result.reason).toContain('Auto-selected parallel mode');
    });

    it('should select parallel for innovative outcome in auto mode', () => {
      const input = createInput({
        executionMode: 'auto',
        preferredOutcome: 'innovative',
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('parallel');
    });

    it('should detect time pressure and suggest parallel', () => {
      const input = createInput({
        executionMode: 'auto',
        constraints: ['Need quick results', 'Limited time available'],
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('parallel');
    });

    it('should include convergence options for parallel mode', () => {
      const input = createInput({
        problem: 'Explore in parallel then synthesize results',
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.convergenceOptions).toBeDefined();
      expect(result.convergenceOptions?.method).toBe('execute_thinking_step');
    });

    it('should detect LLM handoff convergence', () => {
      const input = createInput({
        problem: 'Explore in parallel then hand off to LLM for synthesis',
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.convergenceOptions?.method).toBe('llm_handoff');
    });
  });

  describe('analyzeExecutionMode', () => {
    it('should provide detailed analysis', () => {
      const input = createInput({
        problem: 'Use parallel creative thinking to explore options',
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const analysis = controller.analyzeExecutionMode(input, techniques);
      expect(analysis.mode).toBe('parallel');
      expect(analysis.detectedKeywords).toContain('parallel creative thinking');
      expect(analysis.validationResult).toBeDefined();
      expect(analysis.validationResult?.isValid).toBe(true);
    });

    it('should include validation warnings in analysis', () => {
      const input = createInput({
        problem: 'Explore multiple approaches',
        maxParallelism: 2,
      });
      const techniques: LateralTechnique[] = ['design_thinking', 'triz', 'six_hats'];

      const analysis = controller.analyzeExecutionMode(input, techniques);
      expect(analysis.validationResult?.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty techniques array', () => {
      const input = createInput({ executionMode: 'parallel' });
      const techniques: LateralTechnique[] = [];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.warnings).toBeDefined();
    });

    it('should handle conflicting signals gracefully', () => {
      const input = createInput({
        problem: 'Use parallel approaches',
        executionMode: 'sequential',
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po'];

      const result = controller.determineExecutionMode(input, techniques);
      // Explicit mode should take precedence
      expect(result.mode).toBe('sequential');
      expect(result.reason).toContain('Explicitly requested');
    });

    it('should handle max parallelism constraints', () => {
      const input = createInput({
        executionMode: 'parallel',
        maxParallelism: 2,
      });
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry'];

      const result = controller.determineExecutionMode(input, techniques);
      expect(result.mode).toBe('sequential');
      expect(result.reason).toContain('exceeds maximum');
    });
  });
});
