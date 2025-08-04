/**
 * Regression tests for specific known error code issues
 * These tests should FAIL until the issues are fixed
 */

import { describe, it, expect } from 'vitest';
import { ErrorCodes } from '../../errors/enhanced-errors.js';

describe('Error Code Regression Tests', () => {
  describe('Known Issues That Need Fixing', () => {
    it('should fix E303 collision between INVALID_STATE and NETWORK_ERROR', () => {
      // This test will FAIL until we fix the collision
      expect(ErrorCodes.INVALID_STATE).not.toBe(ErrorCodes.NETWORK_ERROR);

      // NETWORK_ERROR should be in E400 range
      const networkErrorCode = parseInt(ErrorCodes.NETWORK_ERROR.substring(1));
      expect(networkErrorCode).toBeGreaterThanOrEqual(400);
      expect(networkErrorCode).toBeLessThan(500);
    });

    it('should fix E402 collision between MEMORY_ERROR and INVALID_CONFIG', () => {
      // This test will FAIL until we fix the collision
      expect(ErrorCodes.MEMORY_ERROR).not.toBe(ErrorCodes.INVALID_CONFIG);
    });

    it('should move MISSING_CONFIG from E401 to E601', () => {
      // Configuration errors should be in E600 range
      const configErrorCode = parseInt(ErrorCodes.MISSING_CONFIG.substring(1));
      expect(configErrorCode).toBeGreaterThanOrEqual(600);
      expect(configErrorCode).toBeLessThan(700);

      // Specifically should be E601
      expect(ErrorCodes.MISSING_CONFIG).toBe('E601');
    });

    it('should move INVALID_CONFIG from E402 to E602', () => {
      // Configuration errors should be in E600 range
      const configErrorCode = parseInt(ErrorCodes.INVALID_CONFIG.substring(1));
      expect(configErrorCode).toBeGreaterThanOrEqual(600);
      expect(configErrorCode).toBeLessThan(700);

      // Specifically should be E602
      expect(ErrorCodes.INVALID_CONFIG).toBe('E602');
    });

    it('should move convergence errors to E800 range', () => {
      // Currently they use E601-E603, should be E801-E803
      const convergenceErrors = {
        CONVERGENCE_FAILED: ErrorCodes.CONVERGENCE_FAILED,
        PARALLEL_TIMEOUT: ErrorCodes.PARALLEL_TIMEOUT,
        DEPENDENCY_ERROR: ErrorCodes.DEPENDENCY_ERROR,
      };

      for (const [, code] of Object.entries(convergenceErrors)) {
        const codeNum = parseInt(code.substring(1));
        expect(codeNum).toBeGreaterThanOrEqual(800);
        expect(codeNum).toBeLessThan(900);
      }

      // Specific expected codes
      expect(ErrorCodes.CONVERGENCE_FAILED).toBe('E801');
      expect(ErrorCodes.PARALLEL_TIMEOUT).toBe('E802');
      expect(ErrorCodes.DEPENDENCY_ERROR).toBe('E803');
    });

    it('should move workflow errors to E200 range', () => {
      // Currently some are in E001-E004, should be in E200 range
      const workflowErrors = {
        WRONG_TOOL_ORDER: ErrorCodes.WRONG_TOOL_ORDER,
        MISSING_PLAN: ErrorCodes.MISSING_PLAN,
        TECHNIQUE_MISMATCH: ErrorCodes.TECHNIQUE_MISMATCH,
        INVALID_STEP: ErrorCodes.INVALID_STEP,
      };

      for (const [, code] of Object.entries(workflowErrors)) {
        const codeNum = parseInt(code.substring(1));
        // These should be in E200 range, not E001-E004
        expect(codeNum).toBeGreaterThanOrEqual(200);
        expect(codeNum).toBeLessThan(300);
      }
    });
  });

  describe('Correct Error Codes (Should Pass)', () => {
    it('should have validation errors in correct E100 range', () => {
      const validationErrors = {
        INVALID_INPUT: 'E101',
        MISSING_PARAMETER: 'E102',
        INVALID_TYPE: 'E103',
        OUT_OF_RANGE: 'E104',
      };

      for (const [name, expectedCode] of Object.entries(validationErrors)) {
        expect(ErrorCodes[name]).toBe(expectedCode);
      }
    });

    it('should have state errors in correct E300 range', () => {
      expect(ErrorCodes.SESSION_NOT_FOUND).toBe('E301');
      expect(ErrorCodes.SESSION_EXPIRED).toBe('E302');
      expect(ErrorCodes.INVALID_STATE).toBe('E303'); // This one has collision issue
    });

    it('should have PLAN_NOT_FOUND in correct E202 position', () => {
      // This is correctly placed in workflow range
      expect(ErrorCodes.PLAN_NOT_FOUND).toBe('E202');
    });
  });

  describe('Proposed Error Code Mapping', () => {
    it('should use this proposed error code structure', () => {
      const proposedMapping = {
        // Validation Errors (E100-E199)
        INVALID_INPUT: 'E101',
        MISSING_PARAMETER: 'E102',
        INVALID_TYPE: 'E103',
        OUT_OF_RANGE: 'E104',

        // Workflow Errors (E200-E299)
        WRONG_TOOL_ORDER: 'E201',
        PLAN_NOT_FOUND: 'E202',
        WORKFLOW_SKIP: 'E203',
        TECHNIQUE_MISMATCH: 'E204',
        MISSING_PLAN: 'E205',
        INVALID_STEP: 'E206',

        // State Errors (E300-E399)
        SESSION_NOT_FOUND: 'E301',
        SESSION_EXPIRED: 'E302',
        INVALID_STATE: 'E303',

        // System Errors (E400-E499)
        FILE_IO_ERROR: 'E401',
        MEMORY_ERROR: 'E402',
        PERMISSION_ERROR: 'E403',
        NETWORK_ERROR: 'E404',

        // Permission Errors (E500-E599)
        TECHNIQUE_NOT_FOUND: 'E501',
        TECHNIQUE_ERROR: 'E502',

        // Configuration Errors (E600-E699)
        MISSING_CONFIG: 'E601',
        INVALID_CONFIG: 'E602',

        // Technique Errors (E700-E799)
        // Reserved for future use

        // Convergence Errors (E800-E899)
        CONVERGENCE_FAILED: 'E801',
        PARALLEL_TIMEOUT: 'E802',
        DEPENDENCY_ERROR: 'E803',
      };

      // This shows what the mapping SHOULD be
      // Log disabled to avoid lint warning
      // console.log('Proposed error code mapping:', proposedMapping);
      expect(proposedMapping).toBeDefined();
    });
  });
});
