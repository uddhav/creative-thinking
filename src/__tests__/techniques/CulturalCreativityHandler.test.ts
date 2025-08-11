/**
 * Unit tests for CulturalCreativityHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CulturalCreativityHandler } from '../../techniques/CulturalCreativityHandler.js';
import { ValidationError } from '../../errors/types.js';

describe('CulturalCreativityHandler', () => {
  let handler: CulturalCreativityHandler;

  beforeEach(() => {
    handler = new CulturalCreativityHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique information', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Cultural Creativity Orchestration');
      expect(info.emoji).toBe('🌐');
      expect(info.totalSteps).toBe(4);
      expect(info.description).toContain('multi-cultural creative synthesis');
      expect(info.description).toContain('without appropriation');
      expect(info.focus).toBe('Respectful multi-cultural innovation synthesis');
      expect(info.enhancedFocus).toContain('mapping');
      expect(info.enhancedFocus).toContain('touchpoint');
      expect(info.enhancedFocus).toContain('bridge building');
      expect(info.enhancedFocus).toContain('authentic synthesis');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.parallelSteps?.description).toContain('respectful integration');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for step 1 - Cultural Mapping', () => {
      const step = handler.getStepInfo(1);
      expect(step.name).toBe('Cultural Mapping');
      expect(step.focus).toBe('Map cultural contexts and frameworks');
      expect(step.emoji).toBe('🗺️');
      expect(step.description).toContain('historical contexts');
      expect(step.description).toContain('power dynamics');
    });

    it('should return correct info for step 2 - Touchpoint Identification', () => {
      const step = handler.getStepInfo(2);
      expect(step.name).toBe('Touchpoint Identification');
      expect(step.focus).toBe('Find respectful connection points');
      expect(step.emoji).toBe('🤝');
      expect(step.description).toContain('natural connections');
      expect(step.description).toContain('friction zones');
    });

    it('should return correct info for step 3 - Bridge Building', () => {
      const step = handler.getStepInfo(3);
      expect(step.name).toBe('Bridge Building');
      expect(step.focus).toBe('Create respectful connections');
      expect(step.emoji).toBe('🌉');
      expect(step.description).toContain('translation protocols');
      expect(step.description).toContain('trust');
    });

    it('should return correct info for step 4 - Authentic Synthesis', () => {
      const step = handler.getStepInfo(4);
      expect(step.name).toBe('Authentic Synthesis');
      expect(step.focus).toBe('Create new combinations with attribution');
      expect(step.emoji).toBe('🎨');
      expect(step.description).toContain('acknowledge all sources');
      expect(step.description).toContain('authenticity');
    });

    it('should throw error for invalid step numbers', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(5)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(-1)).toThrow(ValidationError);
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'Create global product design';

    it('should provide guidance for step 1', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain(problem);
      expect(guidance).toContain('cultural contexts');
      expect(guidance).toContain('historical contexts');
      expect(guidance).toContain('power dynamics');
      expect(guidance).toContain('constraints');
      expect(guidance).toContain('taboos');
    });

    it('should provide guidance for step 2', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain(problem);
      expect(guidance).toContain('touchpoints');
      expect(guidance).toContain('natural connections');
      expect(guidance).toContain('shared');
      expect(guidance).toContain('complementary strengths');
      expect(guidance).toContain('friction zones');
    });

    it('should provide guidance for step 3', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain(problem);
      expect(guidance).toContain('bridges');
      expect(guidance).toContain('translation protocols');
      expect(guidance).toContain('bidirectional exchange');
      expect(guidance).toContain('trust');
      expect(guidance).toContain('authentic');
    });

    it('should provide guidance for step 4', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain(problem);
      expect(guidance).toContain('Synthesize');
      expect(guidance).toContain('attribution');
      expect(guidance).toContain('acknowledge all sources');
      expect(guidance).toContain('superficial adoption');
      expect(guidance).toContain('authenticity');
    });

    it('should provide default guidance for invalid steps', () => {
      const guidance = handler.getStepGuidance(99, problem);
      expect(guidance).toContain('Continue cultural creativity orchestration');
      expect(guidance).toContain(problem);
    });
  });

  describe('validateStep', () => {
    it('should validate step 1 data correctly', () => {
      const validData = {
        culturalContexts: ['Western individualism', 'Eastern collectivism'],
        powerDynamics: ['Historical colonialism', 'Economic disparities'],
        output: 'Cultural landscape mapped',
      };

      expect(handler.validateStep(1, validData)).toBe(true);

      // Test missing culturalContexts
      const missingContexts = {
        powerDynamics: ['Some dynamics'],
        output: 'test',
      };
      expect(() => handler.validateStep(1, missingContexts)).toThrow(ValidationError);

      // Test missing powerDynamics
      const missingDynamics = {
        culturalContexts: ['Some contexts'],
        output: 'test',
      };
      expect(() => handler.validateStep(1, missingDynamics)).toThrow(ValidationError);
    });

    it('should validate step 2 data correctly', () => {
      const validData = {
        naturalConnections: ['Shared human needs', 'Common challenges'],
        frictionZones: ['Language barriers', 'Value conflicts'],
        output: 'Touchpoints identified',
      };

      expect(handler.validateStep(2, validData)).toBe(true);

      // Test missing naturalConnections
      const missingConnections = {
        frictionZones: ['Some friction'],
        output: 'test',
      };
      expect(() => handler.validateStep(2, missingConnections)).toThrow(ValidationError);

      // Test missing frictionZones
      const missingFriction = {
        naturalConnections: ['Some connections'],
        output: 'test',
      };
      expect(() => handler.validateStep(2, missingFriction)).toThrow(ValidationError);
    });

    it('should validate step 3 data correctly', () => {
      const validData = {
        translationProtocols: ['Metaphor mapping', 'Concept bridging'],
        trustMechanisms: ['Transparency', 'Reciprocity'],
        output: 'Bridges built',
      };

      expect(handler.validateStep(3, validData)).toBe(true);

      // Test missing translationProtocols
      const missingProtocols = {
        trustMechanisms: ['Some trust'],
        output: 'test',
      };
      expect(() => handler.validateStep(3, missingProtocols)).toThrow(ValidationError);

      // Test missing trustMechanisms
      const missingTrust = {
        translationProtocols: ['Some protocols'],
        output: 'test',
      };
      expect(() => handler.validateStep(3, missingTrust)).toThrow(ValidationError);
    });

    it('should validate step 4 data correctly', () => {
      const validData = {
        attributionMap: {
          'Design element A': 'Japanese minimalism',
          'Feature B': 'African Ubuntu philosophy',
        },
        authenticityMeasures: ['Community validation', 'Cultural expert review'],
        output: 'Synthesis complete',
      };

      expect(handler.validateStep(4, validData)).toBe(true);

      // Test missing attributionMap
      const missingAttribution = {
        authenticityMeasures: ['Some measures'],
        output: 'test',
      };
      expect(() => handler.validateStep(4, missingAttribution)).toThrow(ValidationError);

      // Test missing authenticityMeasures
      const missingAuthenticity = {
        attributionMap: { test: 'value' },
        output: 'test',
      };
      expect(() => handler.validateStep(4, missingAuthenticity)).toThrow(ValidationError);
    });

    it('should reject invalid step numbers', () => {
      const data = { output: 'test' };
      expect(handler.validateStep(0, data)).toBe(false);
      expect(handler.validateStep(5, data)).toBe(false);
      expect(handler.validateStep(-1, data)).toBe(false);
    });

    it('should handle undefined data gracefully', () => {
      expect(handler.validateStep(1, undefined)).toBe(true);
    });

    it('should handle null data gracefully', () => {
      expect(handler.validateStep(1, null)).toBe(true);
    });

    it('should handle output as string', () => {
      expect(handler.validateStep(1, 'test output')).toBe(true);
    });
  });

  describe('getPromptContext', () => {
    it('should return appropriate context for step 1', () => {
      const context = handler.getPromptContext(1);

      expect(context.technique).toBe('cultural_creativity');
      expect(context.step).toBe(1);
      expect(context.stepName).toBe('Cultural Mapping');
      expect(context.focus).toBe('Map cultural contexts and frameworks');
      expect(context.emoji).toBe('🗺️');
      expect(context.principles).toBeDefined();
      expect(context.principles).toHaveProperty('attribution', 'Attribution over appropriation');
      expect(context.capabilities).toBeDefined();
      expect(context.capabilities).toHaveProperty(
        'culturalMapping',
        'Map contexts, power dynamics, and frameworks'
      );
    });

    it('should return appropriate context for step 4', () => {
      const context = handler.getPromptContext(4);

      expect(context.technique).toBe('cultural_creativity');
      expect(context.step).toBe(4);
      expect(context.stepName).toBe('Authentic Synthesis');
      expect(context.focus).toBe('Create new combinations with attribution');
      expect(context.emoji).toBe('🎨');
      expect(context.principles).toHaveProperty('inclusion', 'Inclusion over universalization');
      expect(context.capabilities).toHaveProperty(
        'synthesis',
        'Generate attributed innovations with authenticity'
      );
    });

    it('should include all key principles', () => {
      const context = handler.getPromptContext(1);
      const principles = context.principles as Record<string, string>;

      expect(principles.attribution).toBe('Attribution over appropriation');
      expect(principles.depth).toBe('Depth over surface features');
      expect(principles.collaboration).toBe('Collaboration over extraction');
      expect(principles.evolution).toBe('Evolution over preservation');
      expect(principles.inclusion).toBe('Inclusion over universalization');
    });

    it('should include all capabilities', () => {
      const context = handler.getPromptContext(1);
      const capabilities = context.capabilities as Record<string, string>;

      expect(capabilities.culturalMapping).toBeDefined();
      expect(capabilities.touchpointIdentification).toBeDefined();
      expect(capabilities.bridgeBuilding).toBeDefined();
      expect(capabilities.synthesis).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should provide meaningful error messages for invalid steps', () => {
      try {
        handler.getStepInfo(10);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toContain('Invalid step 10');
        expect(validationError.message).toContain('Cultural Creativity Orchestration');
        expect(validationError.message).toContain('1-4');
      }
    });

    it('should provide context in validation errors', () => {
      const invalidData = {
        output: 'test',
      };

      try {
        handler.validateStep(1, invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toContain('cultural contexts AND power dynamics');
        expect(validationError.field).toBe('culturalMapping');
        expect((validationError.details as any)?.technique).toBe('cultural_creativity');
      }
    });
  });
});
