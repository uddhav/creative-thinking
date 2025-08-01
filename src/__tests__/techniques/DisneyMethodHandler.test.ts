/**
 * DisneyMethodHandler unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DisneyMethodHandler } from '../../techniques/DisneyMethodHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('DisneyMethodHandler', () => {
  let handler: DisneyMethodHandler;

  beforeEach(() => {
    handler = new DisneyMethodHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique information', () => {
      const info = handler.getTechniqueInfo();

      expect(info).toEqual({
        name: 'Disney Method',
        emoji: '🎬',
        totalSteps: 3,
        description: 'Transform ideas through Dreamer, Realist, and Critic perspectives',
        focus: 'Sequential implementation-focused creativity',
      });
    });
  });

  describe('getStepInfo', () => {
    it('should return correct step info for each role', () => {
      const dreamer = handler.getStepInfo(1);
      expect(dreamer).toEqual({
        name: 'Dreamer',
        focus: 'What if anything were possible?',
        emoji: '🌟',
      });

      const realist = handler.getStepInfo(2);
      expect(realist).toEqual({
        name: 'Realist',
        focus: 'How could we actually do this?',
        emoji: '🔨',
      });

      const critic = handler.getStepInfo(3);
      expect(critic).toEqual({
        name: 'Critic',
        focus: 'What could go wrong?',
        emoji: '🔍',
      });
    });

    it('should throw validation error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(4)).toThrow(ValidationError);

      try {
        handler.getStepInfo(5);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.code).toBe(ErrorCode.INVALID_STEP);
          expect(error.message).toContain('Invalid step 5 for Disney Method');
          expect(error.field).toBe('step');
          expect(error.details).toEqual({ providedStep: 5, validRange: [1, 3] });
        }
      }
    });
  });

  describe('getStepGuidance', () => {
    it('should return specific guidance for each step', () => {
      const problem = 'improve customer onboarding';

      const dreamerGuidance = handler.getStepGuidance(1, problem);
      expect(dreamerGuidance).toContain('DREAMER');
      expect(dreamerGuidance).toContain('Imagine the ideal solution');
      expect(dreamerGuidance).toContain(problem);

      const realistGuidance = handler.getStepGuidance(2, problem);
      expect(realistGuidance).toContain('REALIST');
      expect(realistGuidance).toContain('How could we implement');

      const criticGuidance = handler.getStepGuidance(3, problem);
      expect(criticGuidance).toContain('CRITIC');
      expect(criticGuidance).toContain('What could go wrong');
    });

    it('should handle out of bounds gracefully', () => {
      const problem = 'test problem';
      const guidance0 = handler.getStepGuidance(0, problem);
      expect(guidance0).toContain('Complete the Disney Method process');

      const guidance4 = handler.getStepGuidance(4, problem);
      expect(guidance4).toContain('Complete the Disney Method process');
    });
  });

  describe('validateStep', () => {
    it('should validate steps correctly', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(2, {})).toBe(true);
      expect(handler.validateStep(3, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(4, {})).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from dreamer vision', () => {
      const history = [
        {
          currentStep: 1,
          dreamerVision: [
            'Create an AI-powered onboarding assistant',
            'Personalized learning paths',
          ],
          output: 'Dreamer phase complete',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Vision: Create an AI-powered onboarding assistant');
    });

    it('should extract insights from realist plan', () => {
      const history = [
        {
          currentStep: 2,
          realistPlan: ['Build MVP with core features', 'Integrate with existing systems'],
          output: 'Realist phase complete',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Key action: Build MVP with core features');
    });

    it('should extract insights from critic risks', () => {
      const history = [
        {
          currentStep: 3,
          criticRisks: ['Data privacy concerns', 'Integration complexity'],
          output: 'Critic phase complete',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Critical risk: Data privacy concerns');
    });

    it('should recognize completed Disney Method session', () => {
      const history = [
        {
          currentStep: 1,
          dreamerVision: ['Amazing vision'],
          nextStepNeeded: true,
        },
        {
          currentStep: 2,
          realistPlan: ['Practical plan'],
          nextStepNeeded: true,
        },
        {
          currentStep: 3,
          criticRisks: ['Some risks'],
          nextStepNeeded: false,
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain(
        'Disney Method completed - vision transformed into actionable plan'
      );
    });

    it('should handle empty history', () => {
      const insights = handler.extractInsights([]);
      expect(insights).toEqual([]);
    });

    it('should handle history without technique-specific fields', () => {
      const history = [
        {
          currentStep: 1,
          output: 'Just some output without specific fields',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toHaveLength(0);
    });
  });
});
