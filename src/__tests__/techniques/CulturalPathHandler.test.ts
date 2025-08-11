/**
 * Tests for CulturalPathHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CulturalPathHandler } from '../../techniques/CulturalPathHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('CulturalPathHandler', () => {
  let handler: CulturalPathHandler;

  beforeEach(() => {
    handler = new CulturalPathHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Cultural Path Navigation');
      expect(info.emoji).toBe('🗺️');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toBe(
        'Navigate solution pathways through cultural contexts and social landscapes to find viable paths forward'
      );
      expect(info.focus).toBe('Path-dependent navigation through cultural complexity');
      expect(info.enhancedFocus).toContain('Maps and navigates the cultural terrain');
      expect(info.enhancedFocus).toContain('viable pathways');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.parallelSteps?.description).toBe(
        'Steps build sequentially from mapping to synthesis'
      );
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for step 1 - Cultural Landscape Mapping', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Cultural Landscape Mapping');
      expect(step1.focus).toBe('Map cultural contexts and path dependencies');
      expect(step1.emoji).toBe('🗺️');
      expect(step1.description).toContain('Identify cultural contexts, values, traditions');
    });

    it('should return correct info for step 2 - Context Sensitivity Analysis', () => {
      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Context Sensitivity Analysis');
      expect(step2.focus).toBe('Assess cultural constraints and opportunities');
      expect(step2.emoji).toBe('🎭');
      expect(step2.description).toContain('Analyze how different cultural contexts');
    });

    it('should return correct info for step 3 - Cross-Cultural Bridge Building', () => {
      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Cross-Cultural Bridge Building');
      expect(step3.focus).toBe('Create paths that connect diverse perspectives');
      expect(step3.emoji).toBe('🌉');
      expect(step3.description).toContain('Design solutions that bridge cultural differences');
    });

    it('should return correct info for step 4 - Adaptive Path Navigation', () => {
      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Adaptive Path Navigation');
      expect(step4.focus).toBe('Navigate flexibly through cultural terrain');
      expect(step4.emoji).toBe('🧭');
      expect(step4.description).toContain('Develop adaptive strategies');
    });

    it('should return correct info for step 5 - Cultural Synthesis', () => {
      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Cultural Synthesis');
      expect(step5.focus).toBe('Integrate diverse cultural wisdom');
      expect(step5.emoji).toBe('🌍');
      expect(step5.description).toContain('Synthesize insights from multiple cultural paths');
    });

    it('should throw error for invalid step numbers', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(6)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(-1)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(100)).toThrow(ValidationError);

      try {
        handler.getStepInfo(6);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Invalid step 6');
        expect((error as ValidationError).message).toContain('Valid steps are 1-5');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'How to design a global collaboration platform';

    it('should provide guidance for step 1 - Cultural Landscape Mapping', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Map the cultural landscape');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('cultural contexts');
      expect(guidance).toContain('stakeholder values');
      expect(guidance).toContain('social norms');
      expect(guidance).toContain('traditions');
      expect(guidance).toContain('power dynamics');
    });

    it('should provide guidance for step 2 - Context Sensitivity Analysis', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Analyze context sensitivity');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('cultural contexts affect solution viability');
      expect(guidance).toContain('taboos and sacred cows');
      expect(guidance).toContain('cultural blindspots');
      expect(guidance).toContain('timing sensitivities');
    });

    it('should provide guidance for step 3 - Cross-Cultural Bridge Building', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Build cross-cultural bridges');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('connect diverse cultural perspectives');
      expect(guidance).toContain('translation mechanisms');
      expect(guidance).toContain('shared value identification');
      expect(guidance).toContain('inclusive narratives');
    });

    it('should provide guidance for step 4 - Adaptive Path Navigation', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Navigate adaptively');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('flexible strategies');
      expect(guidance).toContain('cultural feedback');
      expect(guidance).toContain('pivot protocols');
      expect(guidance).toContain('diplomatic alternatives');
    });

    it('should provide guidance for step 5 - Cultural Synthesis', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Synthesize cultural insights');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('multiple cultural paths');
      expect(guidance).toContain('indigenous knowledge');
      expect(guidance).toContain('Eastern and Western approaches');
      expect(guidance).toContain('culturally intelligent solutions');
    });

    it('should provide default guidance for invalid steps', () => {
      const guidance = handler.getStepGuidance(10, problem);
      expect(guidance).toContain('Continue cultural path analysis');
      expect(guidance).toContain(problem);
    });
  });

  describe('validateStep', () => {
    it('should validate step 1 data correctly', () => {
      const validData = {
        culturalFactors: ['Value systems', 'Social hierarchies'],
        pathConstraints: ['Legal frameworks', 'Religious considerations'],
        output: 'Cultural landscape mapped',
      };

      expect(handler.validateStep(1, validData)).toBe(true);

      // Test missing culturalFactors
      const missingFactors = {
        pathConstraints: ['Legal frameworks'],
        output: 'Missing cultural factors',
      };
      expect(() => handler.validateStep(1, missingFactors)).toThrow(ValidationError);

      // Test missing pathConstraints
      const missingConstraints = {
        culturalFactors: ['Value systems'],
        output: 'Missing path constraints',
      };
      expect(() => handler.validateStep(1, missingConstraints)).toThrow(ValidationError);

      // Test completely missing fields
      const invalidData = {
        output: 'Missing both fields',
      };

      try {
        handler.validateStep(1, invalidData);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect((error as ValidationError).message).toContain(
          'both cultural factors AND path constraints'
        );
      }
    });

    it('should validate step 2 data correctly', () => {
      const validData = {
        contextAnalysis: 'Context variations mapped',
        culturalVariations: ['Western approach', 'Eastern approach'],
        output: 'Context sensitivity analyzed',
      };

      expect(handler.validateStep(2, validData)).toBe(true);

      // Test missing contextAnalysis
      const missingContext = {
        culturalVariations: ['Western approach'],
        output: 'Missing context analysis',
      };
      expect(() => handler.validateStep(2, missingContext)).toThrow(ValidationError);

      // Test missing culturalVariations
      const missingVariations = {
        contextAnalysis: 'Context mapped',
        output: 'Missing variations',
      };
      expect(() => handler.validateStep(2, missingVariations)).toThrow(ValidationError);
    });

    it('should validate step 3 data correctly', () => {
      const validData = {
        bridgeStrategies: ['Common ground identification', 'Shared goals'],
        sharedValues: ['Human dignity', 'Collaboration'],
        output: 'Bridges built',
      };

      expect(handler.validateStep(3, validData)).toBe(true);

      // Test missing bridgeStrategies
      const missingStrategies = {
        sharedValues: ['Human dignity'],
        output: 'Missing bridge strategies',
      };
      expect(() => handler.validateStep(3, missingStrategies)).toThrow(ValidationError);

      // Test missing sharedValues
      const missingValues = {
        bridgeStrategies: ['Common ground'],
        output: 'Missing shared values',
      };
      expect(() => handler.validateStep(3, missingValues)).toThrow(ValidationError);
    });

    it('should validate step 4 data correctly', () => {
      const validData = {
        adaptiveStrategies: ['Flexible implementation', 'Context-aware features'],
        pivotProtocols: ['Feedback loops', 'Adjustment mechanisms'],
        output: 'Adaptive navigation complete',
      };

      expect(handler.validateStep(4, validData)).toBe(true);

      // Test missing adaptiveStrategies
      const missingAdaptive = {
        pivotProtocols: ['Feedback loops'],
        output: 'Missing adaptive strategies',
      };
      expect(() => handler.validateStep(4, missingAdaptive)).toThrow(ValidationError);

      // Test missing pivotProtocols
      const missingPivot = {
        adaptiveStrategies: ['Flexible implementation'],
        output: 'Missing pivot protocols',
      };
      expect(() => handler.validateStep(4, missingPivot)).toThrow(ValidationError);
    });

    it('should validate step 5 data correctly', () => {
      const validData = {
        culturalSynthesis: 'Integrated cultural wisdom',
        integratedSolution: 'Complete culturally-aware solution',
        output: 'Synthesis complete',
      };

      expect(handler.validateStep(5, validData)).toBe(true);

      // Test missing culturalSynthesis
      const missingSynthesis = {
        integratedSolution: 'Complete solution',
        output: 'Missing synthesis',
      };
      expect(() => handler.validateStep(5, missingSynthesis)).toThrow(ValidationError);

      // Test missing integratedSolution
      const missingSolution = {
        culturalSynthesis: 'Integrated wisdom',
        output: 'Missing solution',
      };
      expect(() => handler.validateStep(5, missingSolution)).toThrow(ValidationError);
    });

    it('should reject invalid step numbers', () => {
      const data = { output: 'test' };
      expect(handler.validateStep(0, data)).toBe(false);
      expect(handler.validateStep(6, data)).toBe(false);
      expect(handler.validateStep(-1, data)).toBe(false);
    });

    it('should handle output as string', () => {
      expect(handler.validateStep(1, 'Applied cultural landscape mapping')).toBe(true);
      expect(handler.validateStep(3, 'Built cross-cultural bridges')).toBe(true);
    });

    it('should handle null and undefined data', () => {
      expect(handler.validateStep(1, null)).toBe(true); // null is treated as valid by base validator
      expect(handler.validateStep(1, undefined)).toBe(true); // undefined is also treated as valid by base validator
    });
  });

  describe('getPromptContext', () => {
    it('should return correct context for step 1', () => {
      const context = handler.getPromptContext(1);
      expect(context.technique).toBe('cultural_path');
      expect(context.step).toBe(1);
      expect(context.stepName).toBe('Cultural Landscape Mapping');
      expect(context.focus).toBe('Map cultural contexts and path dependencies');
      expect(context.emoji).toBe('🗺️');
      expect(context.capabilities).toBeDefined();
      expect(context.capabilities).toHaveProperty('landscapeMapping');
    });

    it('should return correct context for step 3', () => {
      const context = handler.getPromptContext(3);
      expect(context.step).toBe(3);
      expect(context.stepName).toBe('Cross-Cultural Bridge Building');
      expect(context.capabilities).toHaveProperty('bridgeBuilding');
    });

    it('should return correct context for step 5', () => {
      const context = handler.getPromptContext(5);
      expect(context.step).toBe(5);
      expect(context.stepName).toBe('Cultural Synthesis');
      expect(context.capabilities).toHaveProperty('culturalSynthesis');
    });

    it('should include all required capabilities', () => {
      const context = handler.getPromptContext(1);
      const capabilities = context.capabilities as Record<string, string>;

      expect(capabilities.landscapeMapping).toBe('Cultural context and path dependency analysis');
      expect(capabilities.contextSensitivity).toBe('Cultural constraints and opportunities');
      expect(capabilities.bridgeBuilding).toBe('Cross-cultural connection strategies');
      expect(capabilities.adaptiveNavigation).toBe('Flexible cultural response mechanisms');
      expect(capabilities.culturalSynthesis).toBe('Integration of diverse cultural wisdom');
    });
  });
});
