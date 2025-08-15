import { describe, it, expect, beforeEach } from 'vitest';
import { CulturalIntegrationHandler } from '../../techniques/CulturalIntegrationHandler.js';

describe('CulturalIntegrationHandler', () => {
  let handler: CulturalIntegrationHandler;

  beforeEach(() => {
    handler = new CulturalIntegrationHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Cultural Integration');
      expect(info.emoji).toBe('🌍');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toContain('diverse cultural perspectives');
      expect(info.focus).toContain('culturally-aware solutions');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('relationship');
      expect(info.reflexivityProfile?.overallReversibility).toBe('medium');
      expect(info.reflexivityProfile?.riskLevel).toBe('medium');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const expectedSteps = [
        { name: 'Cultural Landscape Mapping', type: 'thinking' },
        { name: 'Touchpoint Discovery', type: 'thinking' },
        { name: 'Bridge Building', type: 'action' },
        { name: 'Perspective Weaving', type: 'thinking' },
        { name: 'Respectful Synthesis', type: 'action' },
      ];

      expectedSteps.forEach((expected, index) => {
        const stepInfo = handler.getStepInfo(index + 1);
        expect(stepInfo.name).toBe(expected.name);
        expect(stepInfo.type).toBe(expected.type);
        expect(stepInfo.emoji).toBeDefined();
        expect(stepInfo.focus).toBeDefined();
      });
    });

    it('should have reflexive effects for action steps', () => {
      const bridgeStep = handler.getStepInfo(3);
      const synthesisStep = handler.getStepInfo(5);

      expect(bridgeStep.reflexiveEffects).toBeDefined();
      expect(bridgeStep.reflexiveEffects?.reversibility).toBe('low');
      expect(bridgeStep.reflexiveEffects?.triggers).toContain('Building cultural bridges');

      expect(synthesisStep.reflexiveEffects).toBeDefined();
      expect(synthesisStep.reflexiveEffects?.reversibility).toBe('medium');
      expect(synthesisStep.reflexiveEffects?.triggers).toContain('Implementing synthesis');
    });

    it('should return fallback info for invalid step', () => {
      const invalidStep = handler.getStepInfo(0);
      expect(invalidStep.name).toBe('Unknown Step');
      expect(invalidStep.focus).toContain('Cultural Integration');

      const beyondStep = handler.getStepInfo(6);
      expect(beyondStep.name).toBe('Unknown Step');
      expect(beyondStep.focus).toContain('Cultural Integration');
    });
  });

  describe('getStepGuidance', () => {
    it('should provide comprehensive guidance for each step', () => {
      const problem = 'global product launch';

      for (let i = 1; i <= 5; i++) {
        const guidance = handler.getStepGuidance(i, problem);
        expect(guidance).toContain(problem);
        expect(guidance.length).toBeGreaterThan(100);
      }
    });

    it('should provide specific guidance for cultural landscape mapping', () => {
      const guidance = handler.getStepGuidance(1, 'test problem');
      expect(guidance).toContain('cultural frameworks');
      expect(guidance).toContain('power dynamics');
      expect(guidance).toContain('constraints');
      expect(guidance).toContain('taboos');
    });

    it('should provide specific guidance for bridge building', () => {
      const guidance = handler.getStepGuidance(3, 'test problem');
      expect(guidance).toContain('authentic bridges');
      expect(guidance).toContain('translation');
      expect(guidance).toContain('trust');
    });
  });

  describe('validateStep', () => {
    it('should validate that output field exists', () => {
      const validData = {
        output: 'test',
      };
      expect(handler.validateStep(1, validData)).toBe(true);
      expect(handler.validateStep(2, validData)).toBe(true);
      expect(handler.validateStep(3, validData)).toBe(true);
      expect(handler.validateStep(4, validData)).toBe(true);
      expect(handler.validateStep(5, validData)).toBe(true);

      const invalidData = {};
      expect(handler.validateStep(1, invalidData)).toBe(false);
    });

    it('should accept additional fields without validation', () => {
      const dataWithExtraFields = {
        output: 'test',
        culturalFactors: ['factor1'],
        touchpoints: ['point1'],
        bridgeStrategies: ['strategy1'],
        wovenPerspectives: ['perspective1'],
        culturalSynthesis: 'synthesis',
      };
      // All steps should accept data with any additional fields
      for (let step = 1; step <= 5; step++) {
        expect(handler.validateStep(step, dataWithExtraFields)).toBe(true);
      }
    });
  });

  // getPromptContext is not implemented in BaseTechniqueHandler
  // Remove this test as it's not part of the interface
});
