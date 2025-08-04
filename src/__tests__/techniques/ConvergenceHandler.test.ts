/**
 * Tests for ConvergenceHandler
 */

import { describe, it, expect } from 'vitest';
import { ConvergenceHandler } from '../../techniques/ConvergenceHandler.js';

describe('ConvergenceHandler', () => {
  const handler = new ConvergenceHandler();

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();
      expect(info).toEqual({
        name: 'convergence',
        emoji: '🔀',
        description: 'Synthesize results from parallel creative thinking sessions',
        totalSteps: 3,
      });
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for step 1', () => {
      const stepInfo = handler.getStepInfo(1);
      expect(stepInfo).toEqual({
        name: 'Analysis',
        focus: 'Categorize and extract insights from parallel results',
        emoji: '📊',
      });
    });

    it('should return correct info for step 2', () => {
      const stepInfo = handler.getStepInfo(2);
      expect(stepInfo).toEqual({
        name: 'Pattern Detection',
        focus: 'Identify synergies, conflicts, and emergent patterns',
        emoji: '🔀',
      });
    });

    it('should return correct info for step 3', () => {
      const stepInfo = handler.getStepInfo(3);
      expect(stepInfo).toEqual({
        name: 'Synthesis',
        focus: 'Create unified recommendations and action plan',
        emoji: '🎯',
      });
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow('Invalid step number: 0');
      expect(() => handler.getStepInfo(4)).toThrow('Invalid step number: 4');
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'improve customer retention';

    it('should return guidance for step 1', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toBe(
        `📊 Analyze and categorize results from all parallel techniques for: "${problem}"`
      );
    });

    it('should return guidance for step 2', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toBe(
        `🔀 Identify patterns, synergies, and conflicts across different approaches`
      );
    });

    it('should return guidance for step 3', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toBe(`🎯 Synthesize unified recommendations and create action plan`);
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepGuidance(0, problem)).toThrow('Invalid step number: 0');
      expect(() => handler.getStepGuidance(4, problem)).toThrow('Invalid step number: 4');
    });
  });

  describe('validateStep', () => {
    it('should validate step numbers correctly', () => {
      expect(handler.validateStep(1, {})).toBe(false); // No parallelResults
      expect(handler.validateStep(2, {})).toBe(false);
      expect(handler.validateStep(3, {})).toBe(false);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(4, {})).toBe(false);
    });

    it('should require parallelResults array', () => {
      expect(handler.validateStep(1, { parallelResults: [] })).toBe(false); // Empty array
      expect(handler.validateStep(1, { parallelResults: null })).toBe(false);
      expect(handler.validateStep(1, { parallelResults: 'not an array' })).toBe(false);
      expect(handler.validateStep(1, { parallelResults: [{ technique: 'six_hats' }] })).toBe(true);
    });

    it('should validate all steps with proper data', () => {
      const validData = { parallelResults: [{ technique: 'six_hats' }, { technique: 'scamper' }] };
      expect(handler.validateStep(1, validData)).toBe(true);
      expect(handler.validateStep(2, validData)).toBe(true);
      expect(handler.validateStep(3, validData)).toBe(true);
    });
  });

  describe('extractInsights', () => {
    it('should extract convergence-specific insights', () => {
      const history = [
        { output: 'Analysis found 5 common themes across techniques' },
        { output: 'Discovered 3 synergistic combinations' },
        { output: 'Identified 2 conflicts requiring resolution' },
        { output: 'Generated 8 unified recommendations' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Common themes identified across parallel techniques');
      expect(insights).toContain('Synergistic combinations discovered between techniques');
      expect(insights).toContain('Conflicts resolved through contextual analysis');
      expect(insights).toContain('Unified recommendations synthesized from multiple perspectives');
    });

    it('should fall back to generic extraction if no specific insights', () => {
      const history = [
        { output: 'Processing step 1' },
        { output: 'Moving to step 2' },
        { output: 'This is a very long output that should trigger generic extraction logic' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should handle empty history', () => {
      const insights = handler.extractInsights([]);
      expect(insights).toEqual([]);
    });
  });
});
