/**
 * Tests for ObjectFieldValidator - Validates object and array fields in tool inputs
 * Tests array field validation for all techniques to prevent "Claude's response was interrupted" errors
 */

import { describe, it, expect } from 'vitest';
import { ObjectFieldValidator } from '../../../core/validators/ObjectFieldValidator.js';

describe('ObjectFieldValidator', () => {
  describe('validateIsObject', () => {
    it('should accept valid objects', () => {
      const result = ObjectFieldValidator.validateIsObject({ key: 'value' }, 'testField');
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual({ key: 'value' });
    });

    it('should reject null values', () => {
      const result = ObjectFieldValidator.validateIsObject(null, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should reject undefined values', () => {
      const result = ObjectFieldValidator.validateIsObject(undefined, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should reject arrays', () => {
      const result = ObjectFieldValidator.validateIsObject(['item'], 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is an array but should be an object');
    });

    it('should reject JSON strings', () => {
      const jsonString = '{"key": "value"}';
      const result = ObjectFieldValidator.validateIsObject(jsonString, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('was passed as a JSON string instead of an object');
    });

    it('should detect truncated JSON', () => {
      const truncatedJson = '{"key": "value"';
      const result = ObjectFieldValidator.validateIsObject(truncatedJson, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('truncated JSON string');
    });

    it('should reject primitive values', () => {
      const result = ObjectFieldValidator.validateIsObject(42, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be an object, got number');
    });
  });

  describe('validateStringArray', () => {
    it('should accept valid string arrays', () => {
      const result = ObjectFieldValidator.validateStringArray(['item1', 'item2'], 'testArray');
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual(['item1', 'item2']);
    });

    it('should accept empty arrays', () => {
      const result = ObjectFieldValidator.validateStringArray([], 'testArray');
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should reject null values', () => {
      const result = ObjectFieldValidator.validateStringArray(null, 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should reject undefined values', () => {
      const result = ObjectFieldValidator.validateStringArray(undefined, 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should reject JSON string arrays', () => {
      const jsonString = '["item1", "item2"]';
      const result = ObjectFieldValidator.validateStringArray(jsonString, 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('was passed as a JSON string instead of an array');
      expect(result.recovery).toContain('Parse the JSON string');
    });

    it('should reject invalid JSON array strings', () => {
      const invalidJson = '["item1", "item2"';
      const result = ObjectFieldValidator.validateStringArray(invalidJson, 'testArray');
      expect(result.isValid).toBe(false);
      // Since it doesn't end with ], it's treated as a regular string, not a JSON array attempt
      expect(result.error).toContain('is a string but should be an array');
    });

    it('should reject plain strings', () => {
      const result = ObjectFieldValidator.validateStringArray('not an array', 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is a string but should be an array');
      expect(result.recovery).toContain('wrap it in brackets');
    });

    it('should reject objects', () => {
      const result = ObjectFieldValidator.validateStringArray({ key: 'value' }, 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is an object but should be an array');
    });

    it('should reject arrays with non-string elements', () => {
      const result = ObjectFieldValidator.validateStringArray(['string', 42, true], 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('[1] is not a string (got number)');
    });

    it('should reject arrays with null elements', () => {
      const result = ObjectFieldValidator.validateStringArray(['string', null], 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('[1] is not a string (got object)');
    });

    it('should reject arrays with object elements', () => {
      const result = ObjectFieldValidator.validateStringArray(
        ['string', { key: 'value' }],
        'testArray'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('[1] is not a string (got object)');
    });
  });

  describe('validateDisneyMethodArrays', () => {
    it('should accept valid Disney Method arrays', () => {
      const params = {
        dreamerVision: ['idea1', 'idea2'],
        realistPlan: ['step1', 'step2'],
        criticRisks: ['risk1', 'risk2'],
      };
      const result = ObjectFieldValidator.validateDisneyMethodArrays(params);
      expect(result.isValid).toBe(true);
    });

    it('should accept partial Disney Method arrays', () => {
      const params = {
        dreamerVision: ['idea1', 'idea2'],
      };
      const result = ObjectFieldValidator.validateDisneyMethodArrays(params);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid dreamerVision format', () => {
      const params = {
        dreamerVision: '["idea1", "idea2"]', // JSON string instead of array
      };
      const result = ObjectFieldValidator.validateDisneyMethodArrays(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('dreamerVision');
      expect(result.error).toContain('JSON string instead of an array');
    });

    it('should reject invalid realistPlan format', () => {
      const params = {
        realistPlan: { plan: 'step1' }, // Object instead of array
      };
      const result = ObjectFieldValidator.validateDisneyMethodArrays(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('realistPlan');
      expect(result.error).toContain('is an object but should be an array');
    });

    it('should reject invalid criticRisks format', () => {
      const params = {
        criticRisks: 'risk1', // String instead of array
      };
      const result = ObjectFieldValidator.validateDisneyMethodArrays(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('criticRisks');
      expect(result.error).toContain('is a string but should be an array');
    });
  });

  describe('validateTechniqueArrayFields', () => {
    it('should validate Disney Method arrays', () => {
      const params = {
        dreamerVision: ['idea1', 'idea2'],
        realistPlan: ['step1', 'step2'],
        criticRisks: ['risk1', 'risk2'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('disney_method', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate Cross-Cultural arrays', () => {
      const params = {
        culturalFrameworks: ['framework1', 'framework2'],
        bridgeBuilding: ['bridge1', 'bridge2'],
        respectfulSynthesis: ['synthesis1'],
        parallelPaths: ['path1', 'path2'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('cross_cultural', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate Collective Intelligence arrays', () => {
      const params = {
        wisdomSources: ['source1', 'source2'],
        emergentPatterns: ['pattern1'],
        synergyCombinations: ['combo1', 'combo2'],
        collectiveInsights: ['insight1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('collective_intel', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate Design Thinking arrays', () => {
      const params = {
        empathyInsights: ['insight1'],
        ideaList: ['idea1', 'idea2'],
        failureModesPredicted: ['failure1'],
        stressTestResults: ['result1'],
        userFeedback: ['feedback1'],
        failureInsights: ['insight1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('design_thinking', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate common risk arrays for any technique', () => {
      const params = {
        risks: ['risk1', 'risk2'],
        failureModes: ['mode1'],
        mitigations: ['mitigation1'],
        antifragileProperties: ['property1'],
        blackSwans: ['event1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('six_hats', params);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid array fields for any technique', () => {
      const params = {
        risks: '["risk1", "risk2"]', // JSON string instead of array
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('six_hats', params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('risks');
      expect(result.error).toContain('JSON string instead of an array');
    });

    it('should validate Neural State arrays', () => {
      const params = {
        switchingRhythm: ['rhythm1', 'rhythm2'],
        integrationInsights: ['insight1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('neural_state', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate Temporal Work arrays', () => {
      const params = {
        circadianAlignment: ['alignment1'],
        pressureTransformation: ['transformation1'],
        asyncSyncBalance: ['balance1'],
        temporalEscapeRoutes: ['route1', 'route2'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('temporal_work', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate SCAMPER arrays', () => {
      const params = {
        modifications: ['mod1', 'mod2'],
        alternativeSuggestions: ['suggestion1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('scamper', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate PO arrays', () => {
      const params = {
        principles: ['principle1'],
        connections: ['connection1', 'connection2'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('po', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate Nine Windows arrays', () => {
      const params = {
        interdependencies: ['dep1', 'dep2'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('nine_windows', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate TRIZ arrays', () => {
      const params = {
        inventivePrinciples: ['principle1'],
        viaNegativaRemovals: ['removal1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('triz', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate Yes And arrays', () => {
      const params = {
        additions: ['addition1'],
        evaluations: ['evaluation1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields('yes_and', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate Concept Extraction arrays', () => {
      const params = {
        extractedConcepts: ['concept1'],
        abstractedPatterns: ['pattern1'],
        applications: ['app1'],
      };
      const result = ObjectFieldValidator.validateTechniqueArrayFields(
        'concept_extraction',
        params
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCurrentCell', () => {
    it('should accept valid currentCell structure', () => {
      const currentCell = {
        timeFrame: 'present',
        systemLevel: 'system',
      };
      const result = ObjectFieldValidator.validateCurrentCell(currentCell);
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual(currentCell);
    });

    it('should reject invalid timeFrame', () => {
      const currentCell = {
        timeFrame: 'invalid',
        systemLevel: 'system',
      };
      const result = ObjectFieldValidator.validateCurrentCell(currentCell);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid timeFrame');
    });

    it('should reject invalid systemLevel', () => {
      const currentCell = {
        timeFrame: 'present',
        systemLevel: 'invalid',
      };
      const result = ObjectFieldValidator.validateCurrentCell(currentCell);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid systemLevel');
    });

    it('should reject missing timeFrame', () => {
      const currentCell = {
        systemLevel: 'system',
      };
      const result = ObjectFieldValidator.validateCurrentCell(currentCell);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required property: timeFrame');
    });

    it('should reject missing systemLevel', () => {
      const currentCell = {
        timeFrame: 'present',
      };
      const result = ObjectFieldValidator.validateCurrentCell(currentCell);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required property: systemLevel');
    });

    it('should reject JSON string input', () => {
      const jsonString = '{"timeFrame": "present", "systemLevel": "system"}';
      const result = ObjectFieldValidator.validateCurrentCell(jsonString);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('was passed as a JSON string instead of an object');
    });
  });

  describe('validateNineWindowsMatrixItem', () => {
    it('should accept valid matrix item', () => {
      const item = {
        timeFrame: 'past',
        systemLevel: 'sub-system',
        content: 'Some content',
        pathDependencies: ['dep1'],
        irreversible: true,
      };
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(item, 0);
      expect(result.isValid).toBe(true);
    });

    it('should accept minimal valid matrix item', () => {
      const item = {
        timeFrame: 'present',
        systemLevel: 'system',
        content: 'Some content',
      };
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(item, 0);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid timeFrame', () => {
      const item = {
        timeFrame: 'invalid',
        systemLevel: 'system',
        content: 'Some content',
      };
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid or missing timeFrame');
    });

    it('should reject missing content', () => {
      const item = {
        timeFrame: 'present',
        systemLevel: 'system',
      };
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing or invalid content');
    });

    it('should reject non-array pathDependencies', () => {
      const item = {
        timeFrame: 'present',
        systemLevel: 'system',
        content: 'Some content',
        pathDependencies: 'not an array',
      };
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('pathDependencies must be an array');
    });
  });

  describe('validateParallelResultItem', () => {
    it('should accept valid parallel result item', () => {
      const item = {
        planId: 'plan123',
        technique: 'six_hats',
        results: { output: 'result' },
        insights: ['insight1'],
        metrics: { confidence: 0.8 },
      };
      const result = ObjectFieldValidator.validateParallelResultItem(item, 0);
      expect(result.isValid).toBe(true);
    });

    it('should accept minimal valid parallel result item', () => {
      const item = {
        planId: 'plan123',
        technique: 'six_hats',
      };
      const result = ObjectFieldValidator.validateParallelResultItem(item, 0);
      expect(result.isValid).toBe(true);
    });

    it('should reject missing planId', () => {
      const item = {
        technique: 'six_hats',
      };
      const result = ObjectFieldValidator.validateParallelResultItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing or invalid planId');
    });

    it('should reject empty planId', () => {
      const item = {
        planId: '',
        technique: 'six_hats',
      };
      const result = ObjectFieldValidator.validateParallelResultItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing or invalid planId');
    });

    it('should reject missing technique', () => {
      const item = {
        planId: 'plan123',
      };
      const result = ObjectFieldValidator.validateParallelResultItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing or invalid technique');
    });

    it('should reject non-object results', () => {
      const item = {
        planId: 'plan123',
        technique: 'six_hats',
        results: 'not an object',
      };
      const result = ObjectFieldValidator.validateParallelResultItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('results');
    });

    it('should reject non-array insights', () => {
      const item = {
        planId: 'plan123',
        technique: 'six_hats',
        insights: 'not an array',
      };
      const result = ObjectFieldValidator.validateParallelResultItem(item, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('insights must be an array');
    });
  });

  describe('Real-world failure scenarios', () => {
    it('should reject the exact failing Disney Method request structure', () => {
      // This is the exact structure that was causing "Claude's response was interrupted"
      const params = {
        planId: 'test-plan',
        technique: 'disney_method',
        problem: 'test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Dreamer output',
        nextStepNeeded: true,
        disneyRole: 'dreamer',
        dreamerVision: '["idea1", "idea2"]', // JSON string instead of array - the bug!
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('disney_method', params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('dreamerVision');
      expect(result.error).toContain('JSON string instead of an array');
      expect(result.recovery).toContain('Parse the JSON string');
    });

    it('should handle malformed array fields in parallel tool calls', () => {
      // Simulating what happens with parallel tool calls
      const params = {
        technique: 'cross_cultural',
        culturalFrameworks: { framework: 'test' }, // Object instead of array
        bridgeBuilding: 'single string', // String instead of array
        respectfulSynthesis: null, // Null instead of array
        parallelPaths: undefined, // Undefined (should be ignored)
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('cross_cultural', params);
      expect(result.isValid).toBe(false);
      // Should fail on the first invalid field
      expect(result.error).toContain('culturalFrameworks');
    });

    it('should handle arrays with mixed types', () => {
      const params = {
        technique: 'collective_intel',
        wisdomSources: ['valid', 123, { obj: 'test' }, null], // Mixed types
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('collective_intel', params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('[1] is not a string');
    });

    it('should handle deeply nested JSON strings', () => {
      const params = {
        technique: 'design_thinking',
        empathyInsights: '["insight1", "insight2", "insight3"]',
        ideaList: '[{"idea": "test"}]', // JSON array of objects
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('design_thinking', params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empathyInsights');
      expect(result.error).toContain('JSON string instead of an array');
    });

    it('should validate all common risk fields across techniques', () => {
      const techniques = [
        'six_hats',
        'po',
        'random_entry',
        'scamper',
        'concept_extraction',
        'yes_and',
        'design_thinking',
        'triz',
        'neural_state',
        'temporal_work',
        'cross_cultural',
        'collective_intel',
        'disney_method',
        'nine_windows',
      ];

      techniques.forEach(technique => {
        const params = {
          risks: '["risk1"]', // JSON string - should fail
          failureModes: ['mode1'], // Valid array
          mitigations: { mit: 'test' }, // Object - should fail
          antifragileProperties: null, // Null - should fail
          blackSwans: ['event1'], // Valid array
        };

        const result = ObjectFieldValidator.validateTechniqueArrayFields(technique, params);
        expect(result.isValid).toBe(false);
        // Should fail on first invalid field (risks)
        expect(result.error).toContain('risks');
      });
    });
  });
});
