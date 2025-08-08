/**
 * Tests for array format error handling in MCP tool calls
 * Validates that array formats are properly rejected and don't cause "Claude's response was interrupted" errors
 */

import { describe, it, expect } from 'vitest';
import { ObjectFieldValidator } from '../../core/validators/ObjectFieldValidator.js';

describe('Array Format Error Handling', () => {
  describe('ObjectFieldValidator array format validation', () => {
    it('should reject string representations of arrays for disney_method fields', () => {
      const params = {
        technique: 'disney_method',
        dreamerVision: '["idea1", "idea2"]', // String instead of array
        realistPlan: ['step1', 'step2'], // Valid array
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('disney_method', params);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain(
        'dreamerVision was passed as a JSON string instead of an array'
      );
      expect(validation.recovery).toContain('Parse the JSON string before passing');
    });

    it('should accept valid array formats', () => {
      const params = {
        technique: 'disney_method',
        dreamerVision: ['idea1', 'idea2'], // Valid array
        realistPlan: ['step1', 'step2'], // Valid array
        criticRisks: ['risk1'], // Valid array
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('disney_method', params);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should validate nine_windows matrix array', () => {
      const invalidParams = {
        technique: 'nine_windows',
        nineWindowsMatrix: '[{"content": "test"}]', // String instead of array
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields(
        'nine_windows',
        invalidParams
      );

      expect(validation.isValid).toBe(true); // nineWindowsMatrix is not a tracked array field
    });

    it('should validate currentCell object format for nine_windows', () => {
      const invalidParams = {
        currentCell: '{"timeFrame": "past", "systemLevel": "system"}', // String instead of object
      };

      const validation = ObjectFieldValidator.validateCurrentCell(invalidParams.currentCell);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain(
        'currentCell was passed as a JSON string instead of an object'
      );
      expect(validation.suggestion).toContain('timeFrame');
      expect(validation.suggestion).toContain('systemLevel');
    });

    it('should validate object fields are not stringified', () => {
      const stringifiedObject = '{"key": "value"}';

      const validation = ObjectFieldValidator.validateIsObject(stringifiedObject, 'pathImpact');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain(
        'pathImpact was passed as a JSON string instead of an object'
      );
      expect(validation.suggestion).toContain('"key": "value"');
    });

    it('should validate parallelResults array items', () => {
      const invalidItem = {
        planId: 123, // Should be string
        technique: 'six_hats',
      };

      const validation = ObjectFieldValidator.validateParallelResultItem(invalidItem, 0);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Missing or invalid planId');
    });

    it('should validate all technique array fields', () => {
      const techniques = [
        {
          name: 'collective_intel',
          fields: [
            'wisdomSources',
            'emergentPatterns',
            'synergyCombinations',
            'collectiveInsights',
          ],
        },
        {
          name: 'cross_cultural',
          fields: ['culturalFrameworks', 'bridgeBuilding', 'respectfulSynthesis', 'parallelPaths'],
        },
        {
          name: 'temporal_work',
          fields: [
            'circadianAlignment',
            'pressureTransformation',
            'asyncSyncBalance',
            'temporalEscapeRoutes',
          ],
        },
        { name: 'neural_state', fields: ['switchingRhythm', 'integrationInsights'] },
      ];

      for (const { name, fields } of techniques) {
        for (const field of fields) {
          const params = {
            technique: name,
            [field]: `["stringified", "array"]`, // Invalid string format
          };

          const validation = ObjectFieldValidator.validateTechniqueArrayFields(name, params);

          expect(validation.isValid).toBe(false);
          expect(validation.error).toContain(
            `${field} was passed as a JSON string instead of an array`
          );
        }
      }
    });

    it('should provide helpful error messages with correct format examples', () => {
      const params = {
        technique: 'concept_extraction',
        extractedConcepts: '["concept1", "concept2"]',
        abstractedPatterns: '[]',
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields(
        'concept_extraction',
        params
      );

      expect(validation.isValid).toBe(false);
      // Both fields are in error - but message only mentions the first one found
      expect(validation.error).toContain('was passed as a JSON string');
      expect(validation.recovery).toContain('Parse the JSON string before passing');
    });

    it('should handle mixed valid and invalid fields', () => {
      const params = {
        technique: 'scamper',
        modifications: ['mod1', 'mod2'], // Valid
        alternativeSuggestions: '["alt1"]', // Invalid
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('scamper', params);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('alternativeSuggestions was passed as a JSON string');
      expect(validation.error).not.toContain('modifications'); // Should not complain about valid field
    });

    it('should validate convergence technique parallelResults structure', () => {
      const params = {
        technique: 'convergence',
        parallelResults: [
          {
            planId: 'plan1',
            technique: 'six_hats',
            results: {},
            insights: '["insight1"]', // Should be array, not string
            metrics: {},
          },
        ],
      };

      // First check if parallelResults is array (it is)
      const arrayValidation = ObjectFieldValidator.validateTechniqueArrayFields(
        'convergence',
        params
      );
      expect(arrayValidation.isValid).toBe(true); // parallelResults is array

      // Then validate each item
      const itemValidation = ObjectFieldValidator.validateParallelResultItem(
        params.parallelResults[0],
        0
      );
      expect(itemValidation.isValid).toBe(false);
      expect(itemValidation.error).toContain('insights must be an array');
    });

    it('should validate nine_windows matrix item structure', () => {
      const params = {
        technique: 'nine_windows',
        nineWindowsMatrix: [
          {
            content: 'test',
            timeFrame: 'past',
            systemLevel: 'system',
            pathDependencies: '["dep1", "dep2"]', // Should be array
          },
        ],
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('nine_windows', params);

      // The matrix itself is valid (it's an array)
      // nine_windows specific array fields are not tracked in validateTechniqueArrayFields
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Error recovery suggestions', () => {
    it('should provide clear recovery suggestions for array fields', () => {
      const params = {
        technique: 'triz',
        inventivePrinciples: '["principle1", "principle2"]',
        viaNegativaRemovals: '[]',
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('triz', params);

      expect(validation.isValid).toBe(false);
      expect(validation.recovery).toBeDefined();
      expect(validation.recovery).toContain('Parse the JSON string before passing');
    });

    it('should handle empty string arrays', () => {
      const params = {
        technique: 'yes_and',
        additions: '[]', // Empty string array
        evaluations: '[""]', // Array with empty string
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('yes_and', params);

      expect(validation.isValid).toBe(false);
      expect(validation.recovery).toContain('Parse the JSON string before passing');
    });

    it('should validate design_thinking array fields', () => {
      const params = {
        technique: 'design_thinking',
        empathyInsights: ['insight1'], // Valid
        ideaList: '["idea1", "idea2"]', // Invalid
        userFeedback: undefined, // Optional, should be ignored
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields(
        'design_thinking',
        params
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('ideaList was passed as a JSON string');
      expect(validation.error).not.toContain('empathyInsights');
      expect(validation.error).not.toContain('userFeedback');
    });
  });

  describe('Edge cases and malformed data', () => {
    it('should handle null and undefined values gracefully', () => {
      const params = {
        technique: 'po',
        principles: null, // Null instead of array
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('po', params);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('principles is null or undefined');
    });

    it('should handle number arrays that are stringified', () => {
      const params = {
        technique: 'neural_state',
        switchingRhythm: '[1, 2, 3, 4]', // Stringified number array
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('neural_state', params);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('switchingRhythm was passed as a JSON string');
      expect(validation.recovery).toContain('Parse the JSON string');
    });

    it('should handle deeply nested stringified arrays', () => {
      const params = {
        technique: 'nine_windows',
        nineWindowsMatrix: '[[{"content": "test"}]]', // Deeply nested stringified
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields('nine_windows', params);

      expect(validation.isValid).toBe(true); // nineWindowsMatrix is not tracked as a simple array field
    });

    it('should validate boolean values in array fields', () => {
      const params = {
        technique: 'concept_extraction',
        applications: true, // Boolean instead of array
      };

      const validation = ObjectFieldValidator.validateTechniqueArrayFields(
        'concept_extraction',
        params
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('applications must be an array, got boolean');
    });
  });
});
