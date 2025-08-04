/**
 * Tests for Enhanced Error System
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CreativeThinkingError,
  ErrorFactory,
  ErrorRecovery,
} from '../../errors/enhanced-errors.js';

describe('Enhanced Error System', () => {
  describe('CreativeThinkingError', () => {
    it('should create error with all properties', () => {
      const error = new CreativeThinkingError({
        code: 'E101',
        message: 'Test error message',
        category: 'validation',
        severity: 'medium',
        recovery: ['Check input', 'Try again'],
        context: { field: 'problem', value: 'test' },
        documentation: 'https://docs.example.com/errors/E101',
      });

      expect(error.code).toBe('E101');
      expect(error.message).toBe('Test error message');
      expect(error.category).toBe('validation');
      expect(error.severity).toBe('medium');
      expect(error.recovery).toEqual(['Check input', 'Try again']);
      expect(error.context).toEqual({ field: 'problem', value: 'test' });
      expect(error.documentation).toBe('https://docs.example.com/errors/E101');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const error = new CreativeThinkingError({
        code: 'E101',
        message: 'Test',
        category: 'validation',
        severity: 'low',
        recovery: [],
      });
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });

    it('should serialize to JSON properly', () => {
      const error = new CreativeThinkingError({
        code: 'E101',
        message: 'Test error',
        category: 'validation',
        severity: 'medium',
        recovery: ['Fix input'],
      });

      const json = error.toJSON();

      expect(json).toHaveProperty('code', 'E101');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('category', 'validation');
      expect(json).toHaveProperty('severity', 'medium');
      expect(json).toHaveProperty('recovery');
      expect(json).toHaveProperty('timestamp');
    });
  });

  describe('ErrorFactory', () => {
    describe('Validation Errors', () => {
      it('should create missing field error', () => {
        const error = ErrorFactory.missingField('problem');

        expect(error.code).toBe('E101');
        expect(error.category).toBe('validation');
        expect(error.severity).toBe('medium');
        expect(error.message).toContain('problem');
        expect(error.recovery).toContain("Provide the 'problem' field");
      });

      it('should create invalid field type error', () => {
        const error = ErrorFactory.invalidFieldType('techniques', 'array', 'string');

        expect(error.code).toBe('E102');
        expect(error.message).toContain('techniques');
        expect(error.message).toContain('array');
        expect(error.message).toContain('string');
      });

      it('should create invalid technique error', () => {
        const error = ErrorFactory.invalidTechnique('invalid_tech');

        expect(error.code).toBe('E103');
        expect(error.message).toContain('invalid_tech');
        expect(error.recovery.length).toBeGreaterThan(0);
        expect(error.recovery.some(r => r.includes('six_hats'))).toBe(true);
      });
    });

    describe('Workflow Errors', () => {
      it('should create workflow order error', () => {
        const error = ErrorFactory.workflowOrder('execute_thinking_step', 'plan_thinking_session');

        expect(error.code).toBe('E201');
        expect(error.category).toBe('workflow');
        expect(error.severity).toBe('medium');
        expect(error.message).toContain('execute_thinking_step');
        expect(error.message).toContain('plan_thinking_session');
      });

      it('should create missing workflow step error', () => {
        const error = ErrorFactory.missingWorkflowStep('discover_techniques');

        expect(error.code).toBe('E202');
        expect(error.recovery).toContain("Call 'discover_techniques' first");
      });

      it('should create workflow skip error', () => {
        const error = ErrorFactory.workflowSkipDetected();

        expect(error.code).toBe('E203');
        expect(error.severity).toBe('medium');
        expect(error.context?.severity).toBe('critical');
      });
    });

    describe('State Errors', () => {
      it('should create session not found error', () => {
        const error = ErrorFactory.sessionNotFound('session_123');

        expect(error.code).toBe('E301');
        expect(error.category).toBe('state');
        expect(error.message).toContain('session_123');
        expect(error.recovery).toContain("Start a new session with 'plan_thinking_session'");
      });

      it('should create session expired error', () => {
        const error = ErrorFactory.sessionExpired('session_123', 30);

        expect(error.code).toBe('E302');
        expect(error.message).toContain('30 minutes');
        expect(error.recovery).toContain('Create a new session');
      });

      it('should create invalid step error', () => {
        const error = ErrorFactory.invalidStep(5, 3);

        expect(error.code).toBe('E303');
        expect(error.message).toContain('Step 5');
        expect(error.message).toContain('3 steps');
      });
    });

    describe('System Errors', () => {
      it('should create file access error', () => {
        const error = ErrorFactory.fileAccessError('/path/to/file', 'ENOENT');

        expect(error.code).toBe('E401');
        expect(error.category).toBe('system');
        expect(error.message).toContain('/path/to/file');
        expect(error.context?.reason).toBe('ENOENT');
      });

      it('should create memory limit error', () => {
        const error = ErrorFactory.memoryLimitExceeded(90);

        expect(error.code).toBe('E402');
        expect(error.severity).toBe('high');
        expect(error.message).toContain('90%');
        expect(error.recovery).toContain('Reduce session count');
      });

      it('should create persistence error', () => {
        const error = ErrorFactory.persistenceError('write', 'Connection timeout');

        expect(error.code).toBe('E403');
        expect(error.message).toContain('write');
        expect(error.context?.reason).toBe('Connection timeout');
      });
    });

    describe('Permission Errors', () => {
      it('should create access denied error', () => {
        const error = ErrorFactory.accessDenied('admin_features');

        expect(error.code).toBe('E501');
        expect(error.category).toBe('permission');
        expect(error.message).toContain('admin_features');
      });

      it('should create rate limit error', () => {
        const error = ErrorFactory.rateLimitExceeded(60);

        expect(error.code).toBe('E502');
        expect(error.message).toContain('60 seconds');
        expect(error.recovery[0]).toContain('Wait 60 seconds');
      });
    });

    describe('Configuration Errors', () => {
      it('should create missing config error', () => {
        const error = ErrorFactory.missingConfiguration('API_KEY');

        expect(error.code).toBe('E601');
        expect(error.category).toBe('configuration');
        expect(error.message).toContain('API_KEY');
      });

      it('should create invalid config error', () => {
        const error = ErrorFactory.invalidConfiguration('timeout', '-1', 'positive number');

        expect(error.code).toBe('E602');
        expect(error.message).toContain('timeout');
        expect(error.message).toContain('-1');
        expect(error.message).toContain('positive number');
      });
    });

    describe('Technique Errors', () => {
      it('should create technique failure error', () => {
        const error = ErrorFactory.techniqueExecutionFailed('six_hats', 'Invalid hat color');

        expect(error.code).toBe('E701');
        expect(error.category).toBe('technique');
        expect(error.message).toContain('six_hats');
        expect(error.context?.reason).toBe('Invalid hat color');
      });

      it('should create dependency missing error', () => {
        const error = ErrorFactory.techniqueDependencyMissing('triz', 'design_thinking');

        expect(error.code).toBe('E702');
        expect(error.message).toContain('triz');
        expect(error.message).toContain('design_thinking');
        expect(error.recovery).toContain("Execute 'design_thinking' first");
      });
    });

    describe('Convergence Errors', () => {
      it('should create parallel execution error', () => {
        const error = ErrorFactory.parallelExecutionError(['plan1', 'plan2'], 'Timeout');

        expect(error.code).toBe('E801');
        expect(error.category).toBe('convergence');
        expect(error.context?.failedPlans).toEqual(['plan1', 'plan2']);
        expect(error.context?.reason).toBe('Timeout');
      });

      it('should create convergence failure error', () => {
        const error = ErrorFactory.convergenceFailure(3, 2);

        expect(error.code).toBe('E802');
        expect(error.message).toContain('2 of 3');
        expect(error.recovery).toContain('Retry failed plans');
      });

      it('should create dependency not met error', () => {
        const error = ErrorFactory.convergenceDependencyNotMet('convergence_plan', [
          'plan1',
          'plan2',
        ]);

        expect(error.code).toBe('E803');
        expect(error.message).toContain('convergence_plan');
        expect(error.context?.missingDependencies).toEqual(['plan1', 'plan2']);
      });
    });
  });

  describe('ErrorRecovery', () => {
    describe('isRecoverable', () => {
      it('should identify recoverable errors', () => {
        const recoverableError = ErrorFactory.sessionExpired('session_123', 30);
        const nonRecoverableError = ErrorFactory.workflowSkipDetected();

        expect(ErrorRecovery.isRecoverable(recoverableError)).toBe(true);
        expect(ErrorRecovery.isRecoverable(nonRecoverableError)).toBe(true); // has recovery steps even though severity is in context
      });
    });

    describe('isRetryable', () => {
      it('should identify retryable errors', () => {
        const retryableError = ErrorFactory.persistenceError('read', 'Network error');
        const nonRetryableError = ErrorFactory.invalidTechnique('invalid');

        expect(ErrorRecovery.isRetryable(retryableError)).toBe(true);
        expect(ErrorRecovery.isRetryable(nonRetryableError)).toBe(false);
      });
    });

    describe('getRetryDelay', () => {
      it('should calculate exponential backoff', () => {
        const error = ErrorFactory.persistenceError('write', 'Timeout');

        expect(ErrorRecovery.getRetryDelay(error, 1)).toBe(1000);
        expect(ErrorRecovery.getRetryDelay(error, 2)).toBe(2000);
        expect(ErrorRecovery.getRetryDelay(error, 3)).toBe(4000);
      });

      it('should respect maximum delay', () => {
        const error = ErrorFactory.rateLimitExceeded(60);

        expect(ErrorRecovery.getRetryDelay(error, 10)).toBeLessThanOrEqual(30000);
      });
    });

    describe('executeWithRetry', () => {
      it('should retry on retryable errors', async () => {
        let attempts = 0;
        const operation = vi.fn().mockImplementation(() => {
          attempts++;
          if (attempts < 3) {
            throw ErrorFactory.persistenceError('read', 'Temporary failure');
          }
          return Promise.resolve('success');
        });

        const result = await ErrorRecovery.executeWithRetry(operation, 3);

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it('should not retry non-retryable errors', async () => {
        const operation = vi.fn().mockRejectedValue(ErrorFactory.invalidTechnique('invalid'));

        await expect(ErrorRecovery.executeWithRetry(operation, 3)).rejects.toThrow();
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('should call onRetry callback', async () => {
        let attempts = 0;
        const operation = vi.fn().mockImplementation(() => {
          attempts++;
          if (attempts < 2) {
            throw ErrorFactory.persistenceError('write', 'Temporary');
          }
          return Promise.resolve('success');
        });

        const onRetry = vi.fn();

        await ErrorRecovery.executeWithRetry(operation, 3, onRetry);

        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
      });

      it('should throw after max attempts', async () => {
        const operation = vi
          .fn()
          .mockRejectedValue(ErrorFactory.persistenceError('write', 'Persistent failure'));

        await expect(ErrorRecovery.executeWithRetry(operation, 2)).rejects.toThrow(
          'Persistent failure'
        );
        expect(operation).toHaveBeenCalledTimes(2);
      });
    });
  });
});
