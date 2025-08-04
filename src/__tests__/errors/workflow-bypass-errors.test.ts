/**
 * Tests for Workflow Bypass Error Codes
 */

import { describe, it, expect } from 'vitest';
import { ErrorFactory, ErrorCodes } from '../../errors/enhanced-errors.js';

describe('Workflow Bypass Errors', () => {
  describe('Discovery Skipped Error', () => {
    it('should create discovery skipped error with proper code', () => {
      const error = ErrorFactory.discoverySkipped();

      expect(error.code).toBe('E207');
      expect(error.category).toBe('workflow');
      expect(error.message).toContain('Discovery phase skipped');
      expect(error.recovery).toContain('Call discover_techniques with your problem statement');
      expect(error.context?.requiredTool).toBe('discover_techniques');
      expect(error.context?.severity).toBe('high');
    });
  });

  describe('Planning Skipped Error', () => {
    it('should create planning skipped error with proper code', () => {
      const error = ErrorFactory.planningSkipped();

      expect(error.code).toBe('E208');
      expect(error.category).toBe('workflow');
      expect(error.message).toContain('Planning phase skipped');
      expect(error.recovery).toContain('Call plan_thinking_session after discovery');
      expect(error.context?.requiredTool).toBe('plan_thinking_session');
    });
  });

  describe('Unauthorized Technique Error', () => {
    it('should create unauthorized technique error with recommendations', () => {
      const recommendedTechniques = ['six_hats', 'scamper', 'triz'];
      const error = ErrorFactory.unauthorizedTechnique('random_entry', recommendedTechniques);

      expect(error.code).toBe('E209');
      expect(error.category).toBe('workflow');
      expect(error.message).toContain("Technique 'random_entry' was not recommended");
      expect(error.recovery[0]).toContain('six_hats, scamper, triz');
      expect(error.context?.attemptedTechnique).toBe('random_entry');
      expect(error.context?.recommendedTechniques).toEqual(recommendedTechniques);
    });

    it('should handle empty recommendations gracefully', () => {
      const error = ErrorFactory.unauthorizedTechnique('po', []);

      expect(error.recovery[0]).toContain('Use one of the recommended techniques: ');
      expect(error.recovery).toContain('Run discovery again if you need different recommendations');
    });
  });

  describe('Workflow Bypass Attempt Error', () => {
    it('should create workflow bypass attempt error', () => {
      const error = ErrorFactory.workflowBypassAttempt('Direct execution without planning');

      expect(error.code).toBe('E210');
      expect(error.category).toBe('workflow');
      expect(error.severity).toBe('medium'); // Base severity from WorkflowError
      expect(error.context?.severity).toBe('critical'); // Override severity in context
      expect(error.message).toContain('Direct execution without planning');
      expect(error.recovery).toContain('Follow the mandatory three-step workflow');
      expect(error.recovery).toContain('Start with discover_techniques');
    });

    it('should handle different bypass attempt types', () => {
      const attemptTypes = [
        'Skipping discovery and planning',
        'Using execute without plan',
        'Attempting to use non-recommended technique',
        'Trying to bypass workflow validation',
      ];

      attemptTypes.forEach(attemptType => {
        const error = ErrorFactory.workflowBypassAttempt(attemptType);
        expect(error.message).toContain(attemptType);
        expect(error.context?.attemptType).toBe(attemptType);
      });
    });
  });

  describe('Error Code Uniqueness', () => {
    it('should have unique error codes for all workflow bypass errors', () => {
      const codes = [
        ErrorCodes.DISCOVERY_SKIPPED,
        ErrorCodes.PLANNING_SKIPPED,
        ErrorCodes.UNAUTHORIZED_TECHNIQUE,
        ErrorCodes.WORKFLOW_BYPASS_ATTEMPT,
      ];

      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);

      // Verify they are in the correct range (E200-E299)
      codes.forEach(code => {
        const codeNum = parseInt(code.substring(1));
        expect(codeNum).toBeGreaterThanOrEqual(200);
        expect(codeNum).toBeLessThan(300);
      });
    });
  });

  describe('Integration with WorkflowGuard', () => {
    it('should provide actionable recovery for workflow violations', () => {
      // Test that recovery steps are specific and actionable
      const scenarios = [
        {
          error: ErrorFactory.discoverySkipped(),
          expectedRecovery: 'discover_techniques({ problem: "How to innovate?" })',
        },
        {
          error: ErrorFactory.planningSkipped(),
          expectedRecovery: 'plan_thinking_session',
        },
        {
          error: ErrorFactory.unauthorizedTechnique('random_entry', ['six_hats']),
          expectedRecovery: 'six_hats',
        },
        {
          error: ErrorFactory.workflowBypassAttempt('test'),
          expectedRecovery: 'three-step workflow',
        },
      ];

      scenarios.forEach(({ error, expectedRecovery }) => {
        const recoveryText = error.recovery.join(' ');
        expect(recoveryText).toContain(expectedRecovery);
      });
    });
  });
});
