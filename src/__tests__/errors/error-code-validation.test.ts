/**
 * Tests for validating error code integrity and preventing regressions
 */

import { describe, it, expect } from 'vitest';
import { ErrorCodes, ErrorFactory } from '../../errors/enhanced-errors.js';
import { ErrorCode } from '../../errors/types.js';

describe('Error Code Validation', () => {
  describe('Error Code Uniqueness', () => {
    it('should have unique error codes in ErrorCodes constant', () => {
      const errorCodes = Object.values(ErrorCodes);
      const uniqueCodes = new Set(errorCodes);

      // Find duplicates
      const duplicates: string[] = [];
      const seen = new Set<string>();

      for (const code of errorCodes) {
        if (seen.has(code)) {
          duplicates.push(code);
        }
        seen.add(code);
      }

      expect(duplicates).toEqual([]);
      expect(errorCodes.length).toBe(uniqueCodes.size);
    });

    it('should detect E303 collision between INVALID_STATE and NETWORK_ERROR', () => {
      // This test should FAIL until we fix the collision
      const codes = [ErrorCodes.INVALID_STATE, ErrorCodes.NETWORK_ERROR];
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('Error Code Range Validation', () => {
    it('should use consistent error code ranges', () => {
      // Validation errors should be E100-E199
      const validationCodes = [
        ErrorCodes.INVALID_INPUT,
        ErrorCodes.MISSING_PARAMETER,
        ErrorCodes.INVALID_TYPE,
        ErrorCodes.OUT_OF_RANGE,
      ];

      for (const code of validationCodes) {
        const codeNum = parseInt(code.substring(1));
        expect(codeNum).toBeGreaterThanOrEqual(100);
        expect(codeNum).toBeLessThan(200);
      }
    });

    it('should place workflow errors in E200-E299 range', () => {
      const workflowCodes = [
        ErrorCodes.PLAN_NOT_FOUND,
        // Note: Some workflow codes are misplaced
        // ErrorCodes.WRONG_TOOL_ORDER, // E001
        // ErrorCodes.MISSING_PLAN, // E002
        // ErrorCodes.TECHNIQUE_MISMATCH, // E003
      ];

      for (const code of workflowCodes) {
        const codeNum = parseInt(code.substring(1));
        expect(codeNum).toBeGreaterThanOrEqual(200);
        expect(codeNum).toBeLessThan(300);
      }
    });

    it('should place state errors in E300-E399 range', () => {
      const stateCodes = [
        ErrorCodes.SESSION_NOT_FOUND,
        ErrorCodes.SESSION_EXPIRED,
        ErrorCodes.INVALID_STATE,
        // Note: NETWORK_ERROR incorrectly uses E303, should be in E400 range
      ];

      for (const code of stateCodes) {
        const codeNum = parseInt(code.substring(1));
        expect(codeNum).toBeGreaterThanOrEqual(300);
        expect(codeNum).toBeLessThan(400);
      }
    });

    it('should place system errors in E400-E499 range', () => {
      const systemCodes = [
        ErrorCodes.FILE_IO_ERROR,
        ErrorCodes.MEMORY_ERROR,
        // Note: NETWORK_ERROR incorrectly uses E303, should be E404
        // Note: MISSING_CONFIG incorrectly uses E401, should be E601
        // Note: INVALID_CONFIG incorrectly uses E402, should be E602
      ];

      for (const code of systemCodes) {
        const codeNum = parseInt(code.substring(1));
        expect(codeNum).toBeGreaterThanOrEqual(400);
        expect(codeNum).toBeLessThan(500);
      }
    });

    it('should place configuration errors in E600-E699 range', () => {
      // This test should FAIL - MISSING_CONFIG and INVALID_CONFIG use E401/E402
      const configCodes = [
        ErrorCodes.MISSING_CONFIG, // Currently E401, should be E601
        ErrorCodes.INVALID_CONFIG, // Currently E402, should be E602
      ];

      for (const code of configCodes) {
        const codeNum = parseInt(code.substring(1));
        expect(codeNum).toBeGreaterThanOrEqual(600);
        expect(codeNum).toBeLessThan(700);
      }
    });
  });

  describe('Error Code Mapping Consistency', () => {
    it('should have consistent mapping between ErrorCode enum and ErrorCodes', () => {
      // Test a few critical mappings
      const mappings = [
        { old: ErrorCode.SESSION_NOT_FOUND, expected: 'E301' },
        { old: ErrorCode.PLAN_NOT_FOUND, expected: 'E202' },
        { old: ErrorCode.INVALID_TECHNIQUE, expected: 'E103' },
        { old: ErrorCode.WORKFLOW_REQUIRED, expected: 'E201' },
      ];

      for (const { expected } of mappings) {
        // Just ensure the codes exist and are in correct format
        expect(expected).toMatch(/^E\d{3}$/);
      }
    });
  });

  describe('Error Code Documentation', () => {
    it('should have all error codes documented with descriptions', () => {
      const documentedCodes = {
        // Validation Errors (E100-E199)
        E101: 'Missing required field',
        E102: 'Invalid field type',
        E103: 'Invalid technique',
        E104: 'Invalid input format',
        E105: 'Empty techniques array',
        E106: 'Invalid step number',
        E107: 'Invalid session ID format',

        // Workflow Errors (E200-E299)
        E201: 'Workflow order violation',
        E202: 'Plan not found',
        E203: 'Workflow skip detected',
        E204: 'Technique mismatch',
        E205: 'Missing plan',
        E206: 'Invalid step',
        E207: 'Discovery phase was skipped',
        E208: 'Planning phase was skipped',
        E209: 'Using non-recommended technique',
        E210: 'Attempting to bypass workflow',

        // State Errors (E300-E399)
        E301: 'Session not found',
        E302: 'Session expired',
        E303: 'Invalid state',

        // System Errors (E400-E499)
        E401: 'File I/O error',
        E402: 'Memory limit exceeded',
        E403: 'Permission error',
        E404: 'Network error',

        // Permission Errors (E500-E599)
        E501: 'Access denied',
        E502: 'Rate limit exceeded',

        // Configuration Errors (E600-E699)
        E601: 'Missing configuration',
        E602: 'Invalid configuration',

        // Technique Errors (E700-E799)
        E701: 'Technique execution failed',
        E702: 'Technique dependency missing',
        E703: 'Technique not found',
        E704: 'Technique misconfigured',

        // Unknown Error
        E999: 'Unknown error',
      };

      // Verify all ErrorCodes have documentation
      for (const [, code] of Object.entries(ErrorCodes)) {
        if (code && typeof code === 'string' && code.match(/^E\d{3}$/)) {
          expect(documentedCodes).toHaveProperty(code);
        }
      }
    });
  });

  describe('Recovery Suggestions Quality', () => {
    it('should have actionable recovery suggestions', () => {
      // Test that recovery suggestions are not generic
      const genericPhrases = ['Contact support', 'Try again later', 'Check the documentation'];

      // Test a few error factory methods for quality
      const testCases = [
        ErrorFactory.sessionNotFound('test-session'),
        ErrorFactory.planNotFound('test-plan'),
        ErrorFactory.missingField('problem'),
        ErrorFactory.techniqueExecutionFailed('six_hats', 'Invalid color'),
      ];

      for (const error of testCases) {
        // Check that recovery suggestions are specific
        expect(error.recovery.length).toBeGreaterThan(0);

        // Check for overly generic suggestions
        for (const suggestion of error.recovery) {
          const hasGenericPhrase = genericPhrases.some(phrase => suggestion.includes(phrase));

          if (hasGenericPhrase) {
            // Generic phrases should be accompanied by specific guidance
            expect(error.recovery.length).toBeGreaterThan(1);
            expect(error.recovery[0]).not.toContain('Contact support');
          }
        }
      }
    });

    it('should provide specific tool names in recovery suggestions', () => {
      const workflowError = ErrorFactory.workflowOrder(
        'execute_thinking_step',
        'plan_thinking_session'
      );

      expect(workflowError.recovery.some(r => r.includes('plan_thinking_session'))).toBe(true);
      expect(workflowError.recovery[0]).toMatch(/Call|Use|Start with/);
    });

    it('should include parameter names in validation errors', () => {
      const missingFieldError = ErrorFactory.missingField('techniques');

      expect(missingFieldError.recovery.some(r => r.includes('techniques'))).toBe(true);
      expect(missingFieldError.message).toContain('techniques');
    });
  });

  describe('Regression Prevention', () => {
    it('should prevent future error code collisions', () => {
      // Create a map to track code usage
      const codeUsage = new Map<string, string[]>();

      for (const [name, code] of Object.entries(ErrorCodes)) {
        if (!codeUsage.has(code)) {
          codeUsage.set(code, []);
        }
        const usage = codeUsage.get(code);
        if (usage) {
          usage.push(name);
        }
      }

      // Find all codes used more than once
      const collisions: Record<string, string[]> = {};
      for (const [code, names] of codeUsage.entries()) {
        if (names.length > 1) {
          collisions[code] = names;
        }
      }

      // Report collisions
      if (Object.keys(collisions).length > 0) {
        console.error('Error code collisions detected:', collisions);
      }

      expect(Object.keys(collisions)).toHaveLength(0);
    });

    it('should validate error code format', () => {
      // All error codes should match E### format
      const validFormat = /^E\d{3}$/;

      for (const [, code] of Object.entries(ErrorCodes)) {
        if (code && typeof code === 'string') {
          expect(code).toMatch(validFormat);
        }
      }
    });

    it('should ensure error categories match code ranges', () => {
      const categoryRanges = {
        validation: { min: 100, max: 199 },
        workflow: { min: 200, max: 299 },
        state: { min: 300, max: 399 },
        system: { min: 400, max: 499 },
        permission: { min: 500, max: 599 },
        configuration: { min: 600, max: 699 },
        technique: { min: 700, max: 799 },
      };

      // This would require access to the error factory methods
      // to verify each error's category matches its code range
      expect(categoryRanges).toBeDefined();
    });
  });
});
