import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
  ValidationError,
  SessionError,
  PlanError,
  ExecutionError,
  PersistenceError,
  createErrorResponse,
  isErrorResponse,
  type ErrorResponse,
} from '../../errors/index.js';

describe('Standardized Error Responses', () => {
  describe('Error Classes', () => {
    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid value provided',
        'testField',
        { value: 'bad' }
      );

      expect(error.code).toBe(ErrorCode.INVALID_FIELD_VALUE);
      expect(error.message).toBe('Invalid value provided');
      expect(error.layer).toBe('discovery');
      expect(error.field).toBe('testField');
      expect(error.details).toEqual({ value: 'bad' });
      expect(error.timestamp).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });

    it('should create SessionError with correct properties', () => {
      const error = new SessionError(
        ErrorCode.SESSION_NOT_FOUND,
        'Session not found',
        'session-123'
      );

      expect(error.code).toBe(ErrorCode.SESSION_NOT_FOUND);
      expect(error.message).toBe('Session not found');
      expect(error.layer).toBe('session');
      expect(error.sessionId).toBe('session-123');
      expect(error.name).toBe('SessionError');
    });

    it('should create PlanError with correct properties', () => {
      const error = new PlanError(ErrorCode.PLAN_NOT_FOUND, 'Plan not found', 'plan-456');

      expect(error.code).toBe(ErrorCode.PLAN_NOT_FOUND);
      expect(error.layer).toBe('planning');
      expect(error.planId).toBe('plan-456');
      expect(error.name).toBe('PlanError');
    });

    it('should create ExecutionError with correct properties', () => {
      const error = new ExecutionError(ErrorCode.INTERNAL_ERROR, 'Execution failed', { step: 3 });

      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.layer).toBe('execution');
      expect(error.details).toEqual({ step: 3 });
      expect(error.name).toBe('ExecutionError');
    });

    it('should create PersistenceError with correct properties', () => {
      const error = new PersistenceError(ErrorCode.PERSISTENCE_ERROR, 'Failed to save', 'save', {
        reason: 'disk full',
      });

      expect(error.code).toBe(ErrorCode.PERSISTENCE_ERROR);
      expect(error.layer).toBe('persistence');
      expect(error.operation).toBe('save');
      expect(error.name).toBe('PersistenceError');
    });
  });

  describe('Error Response Conversion', () => {
    it('should convert CreativeThinkingError to ErrorResponse', () => {
      const error = new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Field is required',
        'username'
      );

      const response = error.toResponse();

      expect(response.isError).toBe(true);
      expect(response.error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
      expect(response.error.message).toBe('Field is required');
      expect(response.error.layer).toBe('discovery');
      expect(response.error.timestamp).toBeDefined();
    });

    it('should create error response from standard Error', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error, 'execution');

      expect(response.isError).toBe(true);
      expect(response.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(response.error.message).toBe('Something went wrong');
      expect(response.error.layer).toBe('execution');
      expect(response.error.details).toHaveProperty('name', 'Error');
      expect(response.error.details).toHaveProperty('stack');
    });

    it('should create error response from unknown error', () => {
      const error = 'String error';
      const response = createErrorResponse(error, 'session');

      expect(response.isError).toBe(true);
      expect(response.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(response.error.message).toBe('String error');
      expect(response.error.layer).toBe('session');
      expect(response.error.details).toBe('String error');
    });

    it('should use default layer when not specified', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error);

      expect(response.error.layer).toBe('execution');
    });
  });

  describe('Error Response Type Guard', () => {
    it('should identify valid error response', () => {
      const response: ErrorResponse = {
        isError: true,
        error: {
          code: ErrorCode.INVALID_INPUT,
          message: 'Invalid input',
          layer: 'discovery',
          timestamp: new Date().toISOString(),
        },
      };

      expect(isErrorResponse(response)).toBe(true);
    });

    it('should reject non-error responses', () => {
      const notError1 = { isError: false, error: {} };
      const notError2 = { error: { message: 'test' } };
      const notError3 = { isError: true };
      const notError4 = null;
      const notError5 = undefined;
      const notError6 = 'string';
      const notError7 = 123;

      expect(isErrorResponse(notError1)).toBe(false);
      expect(isErrorResponse(notError2)).toBe(false);
      expect(isErrorResponse(notError3)).toBe(false);
      expect(isErrorResponse(notError4)).toBe(false);
      expect(isErrorResponse(notError5)).toBe(false);
      expect(isErrorResponse(notError6)).toBe(false);
      expect(isErrorResponse(notError7)).toBe(false);
    });
  });

  describe('Error Code Coverage', () => {
    it('should have all error codes defined', () => {
      // Validation errors
      expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD');
      expect(ErrorCode.INVALID_TECHNIQUE).toBe('INVALID_TECHNIQUE');
      expect(ErrorCode.INVALID_FIELD_VALUE).toBe('INVALID_FIELD_VALUE');

      // Session errors
      expect(ErrorCode.SESSION_NOT_FOUND).toBe('SESSION_NOT_FOUND');
      expect(ErrorCode.SESSION_EXPIRED).toBe('SESSION_EXPIRED');

      // Plan errors
      expect(ErrorCode.PLAN_NOT_FOUND).toBe('PLAN_NOT_FOUND');
      expect(ErrorCode.PLAN_EXPIRED).toBe('PLAN_EXPIRED');

      // Business logic errors
      expect(ErrorCode.INVALID_STEP_SEQUENCE).toBe('INVALID_STEP_SEQUENCE');
      expect(ErrorCode.TECHNIQUE_NOT_SUPPORTED).toBe('TECHNIQUE_NOT_SUPPORTED');
      expect(ErrorCode.TECHNIQUE_MISMATCH).toBe('TECHNIQUE_MISMATCH');
      expect(ErrorCode.WORKFLOW_REQUIRED).toBe('WORKFLOW_REQUIRED');

      // System errors
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.PERSISTENCE_ERROR).toBe('PERSISTENCE_ERROR');
      expect(ErrorCode.PERSISTENCE_NOT_AVAILABLE).toBe('PERSISTENCE_NOT_AVAILABLE');

      // Resource errors
      expect(ErrorCode.RESOURCE_LIMIT_EXCEEDED).toBe('RESOURCE_LIMIT_EXCEEDED');
      expect(ErrorCode.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
    });
  });

  describe('Error Response Format', () => {
    it('should match expected structure', () => {
      const error = new SessionError(
        ErrorCode.SESSION_EXPIRED,
        'Session has expired',
        'session-789',
        { lastAccess: '2024-01-01' }
      );

      const response = error.toResponse();

      // Check structure
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('isError', true);
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
      expect(response.error).toHaveProperty('layer');
      expect(response.error).toHaveProperty('timestamp');
      expect(response.error).toHaveProperty('details');

      // Check values
      expect(response.error.code).toBe(ErrorCode.SESSION_EXPIRED);
      expect(response.error.message).toBe('Session has expired');
      expect(response.error.layer).toBe('session');
      expect(response.error.details).toEqual({ lastAccess: '2024-01-01' });

      // Check timestamp format (ISO 8601)
      const timestamp = new Date(response.error.timestamp);
      expect(timestamp.toISOString()).toBe(response.error.timestamp);
    });
  });
});
