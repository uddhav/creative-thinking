import { describe, it, expect } from 'vitest';
import { sanitizeStackTrace, createSafeErrorResponse } from '../../../utils/sanitizeStackTrace.js';

describe('sanitizeStackTrace', () => {
  it('should remove absolute paths with user directories', () => {
    const stack = `Error: Test error
    at Object.<anonymous> (/Users/john/Workspace/project/src/file.ts:10:5)
    at Module._compile (node:internal/modules/cjs/loader:1120:14)`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).not.toContain('/Users/john');
    expect(sanitized).toContain('~/');
    expect(sanitized).toContain('file.ts:10:5');
  });

  it('should remove Windows paths', () => {
    const stack = `Error: Test error
    at Object.<anonymous> (C:\\Users\\jane\\Documents\\project\\src\\file.ts:10:5)`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).not.toContain('C:\\Users\\jane');
    expect(sanitized).toContain('~\\');
  });

  it('should remove Linux home paths', () => {
    const stack = `Error: Test error
    at Object.<anonymous> (/home/user/projects/app/src/file.ts:10:5)`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).not.toContain('/home/user');
    expect(sanitized).toContain('~/');
  });

  it('should truncate node_modules paths', () => {
    const stack = `Error: Test error
    at Object.<anonymous> (/Users/john/project/node_modules/express/lib/router/index.js:284:14)`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).toContain('node_modules/...');
    expect(sanitized).not.toContain('express/lib/router');
  });

  it('should remove sensitive query parameters', () => {
    const stack = `Error: Test error
    at fetch (https://api.example.com/endpoint?token=secret123&key=apikey456&normal=value)`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).not.toContain('secret123');
    expect(sanitized).not.toContain('apikey456');
    expect(sanitized).toContain('token=***');
    expect(sanitized).toContain('key=***');
  });

  it('should hide port numbers', () => {
    const stack = `Error: Connection failed
    at connect (http://localhost:3000/api)
    at connect (http://192.168.1.1:8080/service)`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).not.toContain(':3000');
    expect(sanitized).not.toContain(':8080');
    expect(sanitized).toContain(':****');
  });

  it('should skip internal Node.js frames', () => {
    const stack = `Error: Test error
    at Object.<anonymous> (/app/src/file.ts:10:5)
    at node:internal/modules/cjs/loader:1120:14
    at node:async_hooks:202:14
    at node:events:513:28`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).not.toContain('node:internal');
    expect(sanitized).not.toContain('node:async_hooks');
    expect(sanitized).not.toContain('node:events');
    expect(sanitized).toContain('file.ts:10:5');
  });

  it('should limit stack depth', () => {
    const frames = [];
    for (let i = 1; i <= 10; i++) {
      frames.push(`    at function${i} (/app/file.ts:${i}:1)`);
    }
    const stack = `Error: Test error\n${frames.join('\n')}`;

    const sanitized = sanitizeStackTrace(stack, 3);

    expect(sanitized).toContain('function1');
    expect(sanitized).toContain('function2');
    expect(sanitized).toContain('function3');
    expect(sanitized).not.toContain('function4');
    expect(sanitized).toContain('... stack trace truncated ...');
  });

  it('should handle undefined stack', () => {
    const sanitized = sanitizeStackTrace(undefined);
    expect(sanitized).toBe('');
  });

  it('should handle empty stack', () => {
    const sanitized = sanitizeStackTrace('');
    expect(sanitized).toBe('');
  });

  it('should preserve the error message line', () => {
    const stack = `Error: Something went wrong
    at function1 (/app/file.ts:10:5)`;

    const sanitized = sanitizeStackTrace(stack);

    expect(sanitized).toContain('Error: Something went wrong');
  });
});

describe('createSafeErrorResponse', () => {
  it('should return sanitized error in development', () => {
    const error = new Error('Test error');
    error.stack = `Error: Test error
    at /Users/john/project/src/file.ts:10:5`;

    const safeError = createSafeErrorResponse(error, true);

    expect(safeError.message).toBe('Test error');
    expect(safeError.type).toBe('Error');
    expect(safeError.stack).toBeDefined();
    expect(safeError.stack).not.toContain('/Users/john');
  });

  it('should hide details in production', () => {
    const error = new Error('Sensitive error with details');
    error.stack = 'Sensitive stack trace';

    const safeError = createSafeErrorResponse(error, false);

    expect(safeError.message).toBe('An unexpected error occurred');
    expect(safeError.stack).toBeUndefined();
    expect(safeError.type).toBeUndefined();
  });

  it('should handle custom error types in development', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const error = new CustomError('Custom error message');
    const safeError = createSafeErrorResponse(error, true);

    expect(safeError.type).toBe('CustomError');
    expect(safeError.message).toBe('Custom error message');
  });

  it('should handle non-Error objects in development', () => {
    const error = 'String error';
    const safeError = createSafeErrorResponse(error, true);

    expect(safeError.message).toBe('String error');
    expect(safeError.stack).toBeUndefined();
    expect(safeError.type).toBeUndefined();
  });

  it('should handle non-Error objects in production', () => {
    const error = { custom: 'error object' };
    const safeError = createSafeErrorResponse(error, false);

    expect(safeError.message).toBe('An unexpected error occurred');
    expect(safeError.stack).toBeUndefined();
    expect(safeError.type).toBeUndefined();
  });

  it('should handle null error', () => {
    const safeError = createSafeErrorResponse(null, true);

    expect(safeError.message).toBe('null');
    expect(safeError.stack).toBeUndefined();
    expect(safeError.type).toBeUndefined();
  });

  it('should handle undefined error', () => {
    const safeError = createSafeErrorResponse(undefined, true);

    expect(safeError.message).toBe('undefined');
    expect(safeError.stack).toBeUndefined();
    expect(safeError.type).toBeUndefined();
  });
});
