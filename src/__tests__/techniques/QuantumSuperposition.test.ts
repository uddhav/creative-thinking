/**
 * Tests for Quantum Superposition technique handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuantumSuperpositionHandler } from '../../techniques/QuantumSuperpositionHandler.js';
import { ValidationError } from '../../errors/types.js';

describe('QuantumSuperpositionHandler', () => {
  let handler: QuantumSuperpositionHandler;

  beforeEach(() => {
    handler = new QuantumSuperpositionHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique information', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Quantum Superposition');
      expect(info.emoji).toBe('⚛️');
      expect(info.totalSteps).toBe(6);
      expect(info.description).toContain('multiple contradictory solution states');
      expect(info.focus).toContain('Simultaneous exploration');
      expect(info.enhancedFocus).toContain('quantum principles');
      expect(info.parallelSteps?.canParallelize).toBe(false);
    });
  });

  describe('getStepInfo', () => {
    it('should return correct step information for each step', () => {
      const steps = [
        { name: 'State Generation', emoji: '⚛️' },
        { name: 'Interference Mapping', emoji: '🌊' },
        { name: 'Entanglement Analysis', emoji: '🔗' },
        { name: 'Amplitude Evolution', emoji: '📈' },
        { name: 'Measurement Context', emoji: '📏' },
        { name: 'State Collapse', emoji: '💫' },
      ];

      steps.forEach((expectedStep, index) => {
        const stepInfo = handler.getStepInfo(index + 1);
        expect(stepInfo.name).toBe(expectedStep.name);
        expect(stepInfo.emoji).toBe(expectedStep.emoji);
        expect(stepInfo.focus).toBeDefined();
      });
    });

    it('should throw error for invalid step number', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(7)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(-1)).toThrow(ValidationError);
    });
  });

  describe('getStepGuidance', () => {
    it('should provide specific guidance for each step', () => {
      const problem = 'How to balance performance and flexibility';

      // Step 1: State Generation
      const guidance1 = handler.getStepGuidance(1, problem);
      expect(guidance1).toContain('Generate 3-5 mutually exclusive solution states');
      expect(guidance1).toContain(problem);
      expect(guidance1).toContain('efficiency, flexibility, robustness');

      // Step 2: Interference Mapping
      const guidance2 = handler.getStepGuidance(2, problem);
      expect(guidance2).toContain('interference patterns');
      expect(guidance2).toContain('constructive');
      expect(guidance2).toContain('destructive');

      // Step 3: Entanglement Analysis
      const guidance3 = handler.getStepGuidance(3, problem);
      expect(guidance3).toContain('entanglements');
      expect(guidance3).toContain('dependencies');

      // Step 4: Amplitude Evolution
      const guidance4 = handler.getStepGuidance(4, problem);
      expect(guidance4).toContain('probability amplitudes');
      expect(guidance4).toContain('likelihood');

      // Step 5: Measurement Context
      const guidance5 = handler.getStepGuidance(5, problem);
      expect(guidance5).toContain('measurement context');
      expect(guidance5).toContain('constraints');

      // Step 6: State Collapse
      const guidance6 = handler.getStepGuidance(6, problem);
      expect(guidance6).toContain('Collapse to the optimal solution');
      expect(guidance6).toContain('preserving insights');
    });
  });

  describe('validateStep', () => {
    it('should validate basic step parameters', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(6, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(7, {})).toBe(false);
    });

    it('should validate step 1 specific fields', () => {
      const validData = {
        solutionStates: ['State 1', 'State 2', 'State 3'],
      };
      expect(handler.validateStep(1, validData)).toBe(true);

      const invalidData = {
        solutionStates: 'not an array',
      };
      expect(handler.validateStep(1, invalidData)).toBe(false);
    });

    it('should validate step 2 interference patterns', () => {
      const validData = {
        interferencePatterns: {
          constructive: ['Pattern 1'],
          destructive: ['Pattern 2'],
        },
      };
      expect(handler.validateStep(2, validData)).toBe(true);

      const invalidData = {
        interferencePatterns: 'not an object',
      };
      expect(handler.validateStep(2, invalidData)).toBe(false);
    });

    it('should validate step 3 entanglements', () => {
      const validData = {
        entanglements: [{ states: ['State 1', 'State 2'], dependency: 'Shared resource' }],
      };
      expect(handler.validateStep(3, validData)).toBe(true);

      const invalidData = {
        entanglements: 'not an array',
      };
      expect(handler.validateStep(3, invalidData)).toBe(false);
    });

    it('should validate step 4 amplitudes', () => {
      const validData = {
        amplitudes: {
          'State 1': 0.5,
          'State 2': 0.3,
          'State 3': 0.2,
        },
      };
      expect(handler.validateStep(4, validData)).toBe(true);

      const invalidData = {
        amplitudes: 'not an object',
      };
      expect(handler.validateStep(4, invalidData)).toBe(false);
    });

    it('should validate step 5 measurement criteria', () => {
      const validData = {
        measurementCriteria: ['Performance', 'Cost', 'Maintainability'],
      };
      expect(handler.validateStep(5, validData)).toBe(true);

      const invalidData = {
        measurementCriteria: 'not an array',
      };
      expect(handler.validateStep(5, invalidData)).toBe(false);
    });

    it('should validate step 6 collapse fields', () => {
      const validData = {
        chosenState: 'State 2',
        preservedInsights: ['Insight from State 1', 'Insight from State 3'],
      };
      expect(handler.validateStep(6, validData)).toBe(true);

      const invalidChosenState = {
        chosenState: 123, // Not a string
      };
      expect(handler.validateStep(6, invalidChosenState)).toBe(false);

      const invalidInsights = {
        preservedInsights: 'not an array',
      };
      expect(handler.validateStep(6, invalidInsights)).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract solution states from history', () => {
      const history = [
        {
          output: 'Some general output',
          solutionStates: [
            'Maximize performance at all costs',
            'Optimize for maintainability',
            'Balance cost and features',
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Solution state: Maximize performance at all costs');
      expect(insights).toContain('Solution state: Optimize for maintainability');
      expect(insights).toContain('Solution state: Balance cost and features');
    });

    it('should extract preserved insights from history', () => {
      const history = [
        {
          output: 'Final collapsed state',
          preservedInsights: [
            'Performance optimization techniques from State 1',
            'Cost reduction strategies from State 3',
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Preserved: Performance optimization techniques from State 1');
      expect(insights).toContain('Preserved: Cost reduction strategies from State 3');
    });

    it('should combine multiple sources of insights', () => {
      const history = [
        {
          output: 'Initial exploration phase with multiple possibilities',
          solutionStates: ['State A', 'State B'],
        },
        {
          output: 'Collapse phase preserving key insights from abandoned states',
          preservedInsights: ['Key insight 1', 'Key insight 2'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.length).toBeGreaterThan(2);
      expect(insights).toContain('Solution state: State A');
      expect(insights).toContain('Preserved: Key insight 1');
    });

    it('should limit insights to 10 and remove duplicates', () => {
      const history = [];

      // Add many duplicate insights
      for (let i = 0; i < 20; i++) {
        history.push({
          output: `Very long output that should be extracted as an insight because it's quite detailed and comprehensive. ${i % 3}`,
          solutionStates: ['Duplicate State', `Unique State ${i}`],
        });
      }

      const insights = handler.extractInsights(history);
      expect(insights.length).toBeLessThanOrEqual(10);

      // Check for no duplicates
      const uniqueInsights = new Set(insights);
      expect(uniqueInsights.size).toBe(insights.length);
    });
  });
});
