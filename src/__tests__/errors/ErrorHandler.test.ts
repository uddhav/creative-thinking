/**
 * Tests for Error Handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import { ErrorFactory } from '../../errors/enhanced-errors.js';
import {
  ValidationError,
  SessionError,
  PlanError,
  ExecutionError,
  ErrorCode,
} from '../../errors/types.js';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('handleError', () => {
    it('should handle enhanced errors directly', () => {
      const enhancedError = ErrorFactory.missingField('problem');
      const response = errorHandler.handleError(enhancedError, 'discovery');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error).toEqual({
        code: 'E101',
        message: expect.stringContaining('problem'),
        recovery: expect.arrayContaining(["Provide the 'problem' field"]),
        severity: 'medium',
        category: 'validation',
        layer: 'discovery',
        context: {
          field: 'problem',
        },
      });
    });

    it('should convert ValidationError to enhanced error', () => {
      const validationError = new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required field 'techniques'"
      );

      const response = errorHandler.handleError(validationError, 'planning');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error?.code).toBe('E101');
      expect(parsedError.error?.category).toBe('validation');
      expect(parsedError.error?.recovery).toContain(
        'Check the API documentation for required fields'
      );
    });

    it('should convert SessionError to enhanced error', () => {
      const sessionError = new SessionError(
        ErrorCode.SESSION_NOT_FOUND,
        'Session session_123 not found'
      );

      const response = errorHandler.handleError(sessionError, 'execution');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error?.code).toBe('E301');
      expect(parsedError.error?.category).toBe('state');
      expect(parsedError.error?.recovery).toContain(
        "Start a new session with 'plan_thinking_session'"
      );
    });

    it('should convert PlanError to enhanced error', () => {
      const planError = new PlanError(ErrorCode.WORKFLOW_REQUIRED, 'Workflow steps required');

      const response = errorHandler.handleError(planError, 'planning');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error?.code).toBe('E201');
      expect(parsedError.error?.category).toBe('workflow');
    });

    it('should convert ExecutionError to enhanced error', () => {
      const executionError = new ExecutionError(
        ErrorCode.INVALID_STEP,
        'Invalid step 5 for technique with 3 steps'
      );

      const response = errorHandler.handleError(executionError, 'execution');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error?.code).toBe('E303');
      expect(parsedError.error?.category).toBe('state');
    });

    it('should handle generic errors', () => {
      const genericError = new Error('Something went wrong');
      const response = errorHandler.handleError(genericError, 'discovery');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error?.code).toBe('E999');
      expect(parsedError.error?.message).toBe('Something went wrong');
      expect(parsedError.error?.category).toBe('system');
    });

    it('should handle string errors', () => {
      const response = errorHandler.handleError('String error', 'planning');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error?.code).toBe('E999');
      expect(parsedError.error?.message).toBe('String error');
    });

    it('should handle unknown errors', () => {
      const response = errorHandler.handleError({ weird: 'object' }, 'execution');

      expect(response.isError).toBe(true);
      const parsedError = JSON.parse(response.content[0].text);
      expect(parsedError.error?.code).toBe('E999');
      expect(parsedError.error?.message).toBe('An unexpected error occurred');
    });

    it('should include context in error response', () => {
      const error = ErrorFactory.invalidFieldType('techniques', 'array', 'string');
      const context = { providedValue: 'single_technique' };

      const response = errorHandler.handleError(error, 'planning', context);

      const parsedError2 = JSON.parse(response.content[0].text);
      expect(parsedError2.error?.context).toEqual({
        field: 'techniques',
        expectedType: 'array',
        actualType: 'string',
        providedValue: 'single_technique',
      });
    });
  });

  describe('wrapError', () => {
    it('should wrap standard errors with enhanced errors', () => {
      const standardError = new ValidationError(
        ErrorCode.INVALID_TECHNIQUE,
        'Unknown technique: invalid_tech'
      );

      const enhanced = errorHandler.wrapError(standardError);

      expect(enhanced.code).toBe('E103');
      expect(enhanced.category).toBe('validation');
      expect(enhanced.message).toContain('Unknown technique: invalid_tech');
      expect(enhanced.recovery.length).toBeGreaterThan(0);
    });

    it('should preserve context when wrapping', () => {
      const standardError = new SessionError(
        ErrorCode.SESSION_TOO_LARGE,
        'Session exceeds size limit'
      );

      const enhanced = errorHandler.wrapError(standardError, {
        sessionSize: 1024000,
        limit: 512000,
      });

      expect(enhanced.context).toMatchObject({
        sessionSize: 1024000,
        limit: 512000,
      });
    });
  });

  describe('getRecoverySuggestions', () => {
    it('should return recovery suggestions for error code', () => {
      const suggestions = errorHandler.getRecoverySuggestions(ErrorCode.SESSION_NOT_FOUND);

      expect(suggestions).toContain("Start a new session with 'plan_thinking_session'");
      expect(suggestions).toContain('Check your sessionId parameter');
    });

    it('should return generic suggestions for unknown codes', () => {
      const suggestions = errorHandler.getRecoverySuggestions('UNKNOWN_CODE' as any);

      expect(suggestions).toContain('Check the error message for details');
      expect(suggestions).toContain('Consult the documentation');
    });
  });

  describe('isRetryable', () => {
    it('should identify retryable error codes', () => {
      expect(errorHandler.isRetryable(ErrorCode.PERSISTENCE_ERROR)).toBe(true);
      expect(errorHandler.isRetryable(ErrorCode.PERSISTENCE_WRITE_FAILED)).toBe(true);
      expect(errorHandler.isRetryable(ErrorCode.PERSISTENCE_READ_FAILED)).toBe(true);
      expect(errorHandler.isRetryable(ErrorCode.TIMEOUT_ERROR)).toBe(true);
    });

    it('should identify non-retryable error codes', () => {
      expect(errorHandler.isRetryable(ErrorCode.INVALID_TECHNIQUE)).toBe(false);
      expect(errorHandler.isRetryable(ErrorCode.MISSING_REQUIRED_FIELD)).toBe(false);
      expect(errorHandler.isRetryable(ErrorCode.WORKFLOW_REQUIRED)).toBe(false);
    });
  });

  describe('getSeverity', () => {
    it('should return appropriate severity for error codes', () => {
      expect(errorHandler.getSeverity(ErrorCode.MISSING_REQUIRED_FIELD)).toBe('medium');
      expect(errorHandler.getSeverity(ErrorCode.WORKFLOW_REQUIRED)).toBe('high');
      expect(errorHandler.getSeverity(ErrorCode.INTERNAL_ERROR)).toBe('critical');
      expect(errorHandler.getSeverity(ErrorCode.SESSION_EXPIRED)).toBe('low');
    });
  });

  describe('Error Code Mapping', () => {
    it('should map all validation error codes', () => {
      const validationCodes = [
        ErrorCode.INVALID_INPUT,
        ErrorCode.MISSING_REQUIRED_FIELD,
        ErrorCode.INVALID_TECHNIQUE,
        ErrorCode.INVALID_FIELD_VALUE,
      ];

      validationCodes.forEach(code => {
        const mapping = (errorHandler as any)['mapErrorCode'](code);
        expect(mapping.category).toBe('validation');
        expect(mapping.code).toMatch(/^E1\d{2}$/);
      });
    });

    it('should map all session error codes', () => {
      const sessionCodes = [
        ErrorCode.SESSION_NOT_FOUND,
        ErrorCode.SESSION_EXPIRED,
        ErrorCode.SESSION_ALREADY_EXISTS,
        ErrorCode.SESSION_TOO_LARGE,
        ErrorCode.MAX_SESSIONS_EXCEEDED,
      ];

      sessionCodes.forEach(code => {
        const mapping = (errorHandler as any)['mapErrorCode'](code);
        expect(mapping.category).toBe('state');
        expect(mapping.code).toMatch(/^E3\d{2}$/);
      });
    });

    it('should map all system error codes', () => {
      const systemCodes = [
        ErrorCode.INTERNAL_ERROR,
        ErrorCode.PERSISTENCE_ERROR,
        ErrorCode.PERSISTENCE_NOT_AVAILABLE,
        ErrorCode.PERSISTENCE_WRITE_FAILED,
        ErrorCode.PERSISTENCE_READ_FAILED,
      ];

      systemCodes.forEach(code => {
        const mapping = (errorHandler as any)['mapErrorCode'](code);
        expect(mapping.category).toBe('system');
        expect(mapping.code).toMatch(/^E4\d{2}$/);
      });
    });
  });

  describe('executeWithRetry', () => {
    it('should delegate to ErrorRecovery', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const onRetry = vi.fn();

      const result = await errorHandler.executeWithRetry(operation, 3, onRetry);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw ErrorFactory.persistenceError('write', 'Temporary failure');
        }
        return Promise.resolve('success');
      });

      const result = await errorHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});
