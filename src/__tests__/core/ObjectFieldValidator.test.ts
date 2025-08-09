/**
 * Tests for ObjectFieldValidator
 * Validates that object fields are properly validated and malformed inputs are rejected
 */

import { describe, it, expect } from 'vitest';
import { ObjectFieldValidator } from '../../core/validators/ObjectFieldValidator.js';

describe('ObjectFieldValidator', () => {
  describe('validateIsObject', () => {
    it('should accept valid objects', () => {
      const result = ObjectFieldValidator.validateIsObject({ key: 'value' }, 'testField');
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual({ key: 'value' });
    });

    it('should reject null', () => {
      const result = ObjectFieldValidator.validateIsObject(null, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should reject undefined', () => {
      const result = ObjectFieldValidator.validateIsObject(undefined, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should reject arrays', () => {
      const result = ObjectFieldValidator.validateIsObject([1, 2, 3], 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is an array but should be an object');
    });

    it('should reject primitives', () => {
      const result = ObjectFieldValidator.validateIsObject(42, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be an object, got number');
    });

    it('should reject strings', () => {
      const result = ObjectFieldValidator.validateIsObject('not an object', 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is a string but should be an object');
    });

    it('should detect and reject JSON strings', () => {
      const result = ObjectFieldValidator.validateIsObject('{"key": "value"}', 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('was passed as a JSON string instead of an object');
      expect(result.suggestion).toContain('Pass the object directly');
    });

    it('should detect truncated JSON strings', () => {
      const result = ObjectFieldValidator.validateIsObject('{"key": "value"', 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('contains truncated JSON string');
      expect(result.suggestion).toContain('Ensure the JSON string is complete');
    });

    it('should detect malformed JSON with missing closing quote', () => {
      const result = ObjectFieldValidator.validateIsObject(
        '{"systemLevel": "sub-system", "timeFrame": "past',
        'currentCell'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('truncated JSON string');
      expect(result.suggestion).toContain('properly closed');
    });

    it('should reject invalid JSON', () => {
      const result = ObjectFieldValidator.validateIsObject('{key: value}', 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('contains invalid JSON');
    });

    it('should reject JSON arrays', () => {
      const result = ObjectFieldValidator.validateIsObject('[1, 2, 3]', 'testField');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('JSON array string but should be an object');
    });
  });

  describe('validateCurrentCell', () => {
    it('should accept valid currentCell', () => {
      const result = ObjectFieldValidator.validateCurrentCell({
        timeFrame: 'past',
        systemLevel: 'sub-system',
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject currentCell with invalid timeFrame', () => {
      const result = ObjectFieldValidator.validateCurrentCell({
        timeFrame: 'invalid',
        systemLevel: 'sub-system',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid timeFrame');
      expect(result.error).toContain('Must be one of: past, present, future');
    });

    it('should reject currentCell with invalid systemLevel', () => {
      const result = ObjectFieldValidator.validateCurrentCell({
        timeFrame: 'past',
        systemLevel: 'invalid',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid systemLevel');
      expect(result.error).toContain('Must be one of: sub-system, system, super-system');
    });

    it('should reject currentCell missing timeFrame', () => {
      const result = ObjectFieldValidator.validateCurrentCell({
        systemLevel: 'sub-system',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required property: timeFrame');
    });

    it('should reject currentCell missing systemLevel', () => {
      const result = ObjectFieldValidator.validateCurrentCell({
        timeFrame: 'past',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required property: systemLevel');
    });

    it('should reject string instead of object', () => {
      const result = ObjectFieldValidator.validateCurrentCell('{"timeFrame": "past"}');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('was passed as a JSON string instead of an object');
    });

    it('should handle the exact malformed input from the user error', () => {
      // This simulates the truncated JSON string from the user's error
      const malformedInput = '{"systemLevel": "sub-system", "timeFrame": "past';
      const result = ObjectFieldValidator.validateCurrentCell(malformedInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('truncated JSON string');
      expect(result.suggestion).toContain('timeFrame');
      expect(result.suggestion).toContain('systemLevel');
    });
  });

  describe('validateNineWindowsMatrixItem', () => {
    it('should accept valid matrix item', () => {
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(
        {
          timeFrame: 'past',
          systemLevel: 'system',
          content: 'Historical context',
          pathDependencies: ['dep1', 'dep2'],
          irreversible: false,
        },
        0
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept matrix item without optional fields', () => {
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(
        {
          timeFrame: 'present',
          systemLevel: 'super-system',
          content: 'Current state',
        },
        1
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject matrix item with invalid timeFrame', () => {
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(
        {
          timeFrame: 'tomorrow',
          systemLevel: 'system',
          content: 'Test',
        },
        0
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid or missing timeFrame');
    });

    it('should reject matrix item missing content', () => {
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(
        {
          timeFrame: 'past',
          systemLevel: 'system',
        },
        0
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing or invalid content');
    });

    it('should reject matrix item with non-array pathDependencies', () => {
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(
        {
          timeFrame: 'past',
          systemLevel: 'system',
          content: 'Test',
          pathDependencies: 'not an array',
        },
        0
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('pathDependencies must be an array');
    });

    it('should reject matrix item with non-boolean irreversible', () => {
      const result = ObjectFieldValidator.validateNineWindowsMatrixItem(
        {
          timeFrame: 'past',
          systemLevel: 'system',
          content: 'Test',
          irreversible: 'yes',
        },
        0
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('irreversible must be a boolean');
    });
  });
});
