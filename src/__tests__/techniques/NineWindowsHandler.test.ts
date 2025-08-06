/**
 * NineWindowsHandler unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NineWindowsHandler } from '../../techniques/NineWindowsHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('NineWindowsHandler', () => {
  let handler: NineWindowsHandler;

  beforeEach(() => {
    handler = new NineWindowsHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique information', () => {
      const info = handler.getTechniqueInfo();

      expect(info).toMatchObject({
        name: 'Nine Windows',
        emoji: '🪟',
        totalSteps: 9,
        description: 'Explore problems across time and system levels',
        focus: 'Systematic analysis through space-time matrix',
      });
      // Check parallelSteps exists
      expect(info.parallelSteps).toBeDefined();
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for past steps (1-3)', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1).toEqual({
        name: 'Past Sub-system',
        focus: 'Component history',
        emoji: '🔧',
      });

      const step2 = handler.getStepInfo(2);
      expect(step2).toEqual({
        name: 'Past System',
        focus: 'System evolution',
        emoji: '⚙️',
      });

      const step3 = handler.getStepInfo(3);
      expect(step3).toEqual({
        name: 'Past Super-system',
        focus: 'Environmental history',
        emoji: '🌍',
      });
    });

    it('should return correct info for present steps (4-6)', () => {
      const step4 = handler.getStepInfo(4);
      expect(step4).toEqual({
        name: 'Present Sub-system',
        focus: 'Current components',
        emoji: '🔩',
      });

      const step5 = handler.getStepInfo(5);
      expect(step5).toEqual({
        name: 'Present System',
        focus: 'Current state',
        emoji: '🎯',
      });

      const step6 = handler.getStepInfo(6);
      expect(step6).toEqual({
        name: 'Present Super-system',
        focus: 'Current environment',
        emoji: '🏞️',
      });
    });

    it('should return correct info for future steps (7-9)', () => {
      const step7 = handler.getStepInfo(7);
      expect(step7).toEqual({
        name: 'Future Sub-system',
        focus: 'Component evolution',
        emoji: '🚀',
      });

      const step8 = handler.getStepInfo(8);
      expect(step8).toEqual({
        name: 'Future System',
        focus: 'System possibilities',
        emoji: '🎪',
      });

      const step9 = handler.getStepInfo(9);
      expect(step9).toEqual({
        name: 'Future Super-system',
        focus: 'Environmental changes',
        emoji: '🌅',
      });
    });

    it('should throw validation error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(10)).toThrow(ValidationError);

      try {
        handler.getStepInfo(11);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.code).toBe(ErrorCode.INVALID_STEP);
          expect(error.message).toContain('Invalid step 11 for Nine Windows');
          expect(error.field).toBe('step');
          expect(error.details).toEqual({ providedStep: 11, validRange: [1, 9] });
        }
      }
    });
  });

  describe('getStepGuidance', () => {
    it('should return specific guidance for each time frame', () => {
      const problem = 'reduce carbon emissions';

      // Past
      const guidance1 = handler.getStepGuidance(1, problem);
      expect(guidance1).toContain('Past Sub-system');
      expect(guidance1).toContain('component decisions');
      expect(guidance1).toContain(problem);

      // Present
      const guidance5 = handler.getStepGuidance(5, problem);
      expect(guidance5).toContain('Present System');
      expect(guidance5).toContain('current system state');

      // Future
      const guidance9 = handler.getStepGuidance(9, problem);
      expect(guidance9).toContain('Future Super-system');
      expect(guidance9).toContain('environment change');
    });

    it('should handle out of bounds gracefully', () => {
      const problem = 'test problem';
      const guidance0 = handler.getStepGuidance(0, problem);
      expect(guidance0).toContain('Complete the Nine Windows analysis');

      const guidance10 = handler.getStepGuidance(10, problem);
      expect(guidance10).toContain('Complete the Nine Windows analysis');
    });

    it('should mention path dependencies in future steps', () => {
      const problem = 'technology adoption';

      const guidance7 = handler.getStepGuidance(7, problem);
      expect(guidance7).toContain('path dependencies');

      const guidance8 = handler.getStepGuidance(8, problem);
      expect(guidance8).toContain('irreversible');
    });
  });

  describe('validateStep', () => {
    it('should validate all 9 steps correctly', () => {
      for (let i = 1; i <= 9; i++) {
        expect(handler.validateStep(i, {})).toBe(true);
      }
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(10, {})).toBe(false);
    });
  });

  describe('getCellByCoordinates', () => {
    it('should map coordinates to correct step numbers', () => {
      // Past row
      expect(handler.getCellByCoordinates('past', 'sub-system')).toBe(1);
      expect(handler.getCellByCoordinates('past', 'system')).toBe(2);
      expect(handler.getCellByCoordinates('past', 'super-system')).toBe(3);

      // Present row
      expect(handler.getCellByCoordinates('present', 'sub-system')).toBe(4);
      expect(handler.getCellByCoordinates('present', 'system')).toBe(5);
      expect(handler.getCellByCoordinates('present', 'super-system')).toBe(6);

      // Future row
      expect(handler.getCellByCoordinates('future', 'sub-system')).toBe(7);
      expect(handler.getCellByCoordinates('future', 'system')).toBe(8);
      expect(handler.getCellByCoordinates('future', 'super-system')).toBe(9);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from past system evolution (step 2)', () => {
      const history = [
        {
          currentStep: 2,
          output:
            'Manual processes evolved into semi-automated systems. This created technical debt.',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain(
        'Historical pattern: Manual processes evolved into semi-automated systems'
      );
    });

    it('should extract insights from present system state (step 5)', () => {
      const history = [
        {
          currentStep: 5,
          output: 'System is at 70% capacity. Performance degradation visible.',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Current reality: System is at 70% capacity');
    });

    it('should extract insights from future possibilities (step 8)', () => {
      const history = [
        {
          currentStep: 8,
          output:
            'Quantum computing could revolutionize our approach. But requires significant investment.',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain(
        'Future possibility: Quantum computing could revolutionize our approach'
      );
    });

    it('should extract interdependencies when found', () => {
      const history = [
        {
          currentStep: 5,
          interdependencies: ['System A depends on System B', 'External API dependency'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Key dependency: System A depends on System B');
    });

    it('should recognize completed Nine Windows session', () => {
      const history = [
        {
          currentStep: 8,
          output: 'Some analysis',
          nextStepNeeded: true,
        },
        {
          currentStep: 9,
          output: 'Final cell analysis',
          nextStepNeeded: false,
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain(
        'Nine Windows completed - systemic understanding achieved across time and scale'
      );
    });

    it('should handle empty history', () => {
      const insights = handler.extractInsights([]);
      expect(insights).toEqual([]);
    });

    it('should handle history without relevant steps', () => {
      const history = [
        {
          currentStep: 1,
          output: 'Component analysis',
        },
        {
          currentStep: 3,
          output: 'Environmental factors',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toHaveLength(0);
    });
  });
});
