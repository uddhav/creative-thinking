/**
 * Integration test for array field validation in parallel tool calls
 * Tests the exact scenario that was causing "Claude's response was interrupted" errors
 */

import { describe, it, expect } from 'vitest';
import { ObjectFieldValidator } from '../../core/validators/ObjectFieldValidator.js';

describe('Array Field Validation', () => {
  describe('ObjectFieldValidator integration', () => {
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

    it('should accept valid Disney Method arrays', () => {
      const params = {
        planId: 'test-plan',
        technique: 'disney_method',
        problem: 'test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Dreamer output',
        nextStepNeeded: true,
        disneyRole: 'dreamer',
        dreamerVision: ['idea1', 'idea2'], // Proper array format
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('disney_method', params);
      expect(result.isValid).toBe(true);
    });

    it('should validate array fields for Design Thinking', () => {
      const params = {
        empathyInsights: '["insight1", "insight2"]', // JSON string - should fail
        ideaList: ['idea1', 'idea2'], // Valid array
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('design_thinking', params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empathyInsights');
      expect(result.error).toContain('JSON string instead of an array');
    });

    it('should validate array fields for Collective Intelligence', () => {
      const params = {
        wisdomSources: { source: 'invalid' }, // Object instead of array - should fail
        emergentPatterns: ['pattern1', 'pattern2'], // Valid array
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('collective_intel', params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('wisdomSources');
      expect(result.error).toContain('is an object but should be an array');
    });

    it('should validate common risk fields for any technique', () => {
      const params = {
        risks: null, // Null instead of array - should fail
        failureModes: ['mode1', 'mode2'], // Valid array
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('six_hats', params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('risks');
      expect(result.error).toContain('null or undefined');
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

    it('should provide helpful recovery suggestions', () => {
      const params = {
        dreamerVision: '["idea1", "idea2"]',
      };

      const result = ObjectFieldValidator.validateTechniqueArrayFields('disney_method', params);
      expect(result.isValid).toBe(false);
      expect(result.recovery).toContain('Parse the JSON string');
    });

    it('should validate all techniques', () => {
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
        };

        const result = ObjectFieldValidator.validateTechniqueArrayFields(technique, params);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('risks');
      });
    });
  });
});
