# Error Recovery Implementation Guide

A practical guide for implementing error recovery in new features of the Creative Thinking MCP
Server.

## Quick Reference

### Error Handling Checklist

- [ ] Use appropriate error class (`ValidationError`, `SessionError`, etc.)
- [ ] Include error code from `ErrorCode` enum
- [ ] Provide actionable error message
- [ ] Add contextual details for debugging
- [ ] Implement graceful degradation where possible
- [ ] Write tests for error scenarios
- [ ] Log errors to stderr (not stdout)
- [ ] Document recovery behavior

## Common Patterns

### 1. Input Validation Pattern

```typescript
// ✅ Good: Early validation with specific guidance
function validateInput(input: any): ValidationResult {
  const validator = ValidationStrategyFactory.createValidator('discover');
  const validation = validator.validate(input);

  if (!validation.valid) {
    return {
      isValid: false,
      error: new ValidationError(
        ErrorCode.INVALID_INPUT,
        validation.errors.join('; '),
        'problem', // field name
        { providedValue: input.problem }
      ),
    };
  }

  return { isValid: true, data: input };
}

// ❌ Bad: Generic error without guidance
if (!input.problem) {
  throw new Error('Invalid input');
}
```

### 2. Session Recovery Pattern

```typescript
// ✅ Good: Create session if not found
const session = sessionManager.getSession(sessionId);
if (!session && sessionId) {
  // Create new session with provided ID (supports recovery)
  return sessionManager.createSession(sessionData, sessionId);
}

// ❌ Bad: Fail immediately
if (!session) {
  throw new Error('Session not found');
}
```

### 3. Graceful Degradation Pattern

```typescript
// ✅ Good: Continue with reduced functionality
try {
  await persistenceAdapter.save(sessionData);
  response.persistenceStatus = 'saved';
} catch (error) {
  if (error.code === ErrorCode.PERSISTENCE_NOT_AVAILABLE) {
    response.persistenceStatus = 'memory-only';
    response.warning = 'Data saved in memory only';
  } else {
    response.persistenceStatus = 'failed';
    response.error = error.message;
  }
}

// ❌ Bad: Fail the entire operation
await persistenceAdapter.save(sessionData); // Crashes if persistence unavailable
```

### 4. Workflow Guidance Pattern

```typescript
// ✅ Good: Guide user through correct workflow
if (!planId) {
  return errorContextBuilder.buildWorkflowError('plan_not_found', {
    planId: input.planId,
    workflow: [
      {
        step: 1,
        tool: 'discover_techniques',
        args: { problem: 'Your problem here' },
        returns: 'Recommended techniques'
      },
      {
        step: 2,
        tool: 'plan_thinking_session',
        args: { problem: '...', techniques: ['...'] },
        returns: { planId: 'plan_xyz' }
      },
      {
        step: 3,
        tool: 'execute_thinking_step',
        args: { planId: 'plan_xyz', ... }
      }
    ]
  });
}

// ❌ Bad: Unclear error
if (!planId) {
  throw new Error('Missing planId');
}
```

## Implementation Examples

### Example: Adding a New Technique

```typescript
// 1. Define technique-specific validation
class CustomTechniqueValidator {
  validate(input: CustomTechniqueInput): ValidationResult {
    const errors: string[] = [];

    if (!input.customField) {
      errors.push('customField is required for custom_technique');
    }

    if (input.customValue && input.customValue < 0) {
      errors.push('customValue must be non-negative');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          errors.join('; '),
          'customField',
          { technique: 'custom_technique', errors }
        ),
      };
    }

    return { isValid: true };
  }
}

// 2. Implement error recovery in handler
class CustomTechniqueHandler extends BaseTechniqueHandler {
  async execute(input: CustomTechniqueInput, context: ExecutionContext) {
    try {
      // Validate input
      const validation = this.validator.validate(input);
      if (!validation.isValid) {
        return this.buildErrorResponse(validation.error);
      }

      // Execute with recovery
      const result = await this.performOperation(input);

      // Handle partial success
      if (result.warnings) {
        return this.buildPartialSuccessResponse(result);
      }

      return this.buildSuccessResponse(result);
    } catch (error) {
      // Check if recoverable
      if (this.isRecoverable(error)) {
        return this.attemptRecovery(error, input, context);
      }

      // Non-recoverable error
      return this.buildErrorResponse(
        new ExecutionError(
          ErrorCode.TECHNIQUE_NOT_SUPPORTED,
          `Custom technique failed: ${error.message}`,
          { technique: 'custom_technique', originalError: error }
        )
      );
    }
  }

  private isRecoverable(error: any): boolean {
    return error.code === 'TEMPORARY_FAILURE' || error.code === 'RESOURCE_BUSY';
  }

  private async attemptRecovery(
    error: any,
    input: CustomTechniqueInput,
    context: ExecutionContext
  ) {
    // Log recovery attempt
    console.error('[CustomTechnique] Attempting recovery from:', error.code);

    // Try alternative approach
    if (error.code === 'RESOURCE_BUSY') {
      await this.delay(1000); // Wait before retry
      return this.execute(input, context); // Retry once
    }

    // Degrade gracefully
    return this.buildPartialSuccessResponse({
      data: this.getDefaultOutput(input),
      warning: 'Used fallback processing due to temporary issue',
    });
  }
}
```

### Example: Adding Session Operation

```typescript
// Error-resilient session operation
async function exportSession(sessionId: string, format: ExportFormat) {
  try {
    // 1. Validate session exists
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return errorContextBuilder.buildSessionError({
        errorType: 'not_found',
        sessionId,
        message: `Session ${sessionId} not found`,
        guidance: 'Ensure the session exists before exporting',
      });
    }

    // 2. Validate export format
    if (!SUPPORTED_FORMATS.includes(format)) {
      return new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        `Unsupported format: ${format}. Use one of: ${SUPPORTED_FORMATS.join(', ')}`,
        'format'
      );
    }

    // 3. Export with error handling
    const exporter = ExporterFactory.create(format);
    const result = await exporter.export(session);

    // 4. Handle export-specific errors
    if (result.truncated) {
      return {
        ...result,
        warning: 'Session data was truncated due to size limits',
      };
    }

    return result;
  } catch (error) {
    // 5. Transform technical errors to user-friendly messages
    if (error.code === 'ENOSPC') {
      return new ExecutionError(
        ErrorCode.RESOURCE_LIMIT_EXCEEDED,
        'Export failed: Insufficient disk space',
        { operation: 'export', format }
      );
    }

    // 6. Generic error fallback
    return createErrorResponse(error, 'session');
  }
}
```

## Testing Error Recovery

### Unit Test Template

```typescript
describe('Error Recovery: CustomTechnique', () => {
  let handler: CustomTechniqueHandler;

  beforeEach(() => {
    handler = new CustomTechniqueHandler();
  });

  describe('Input Validation', () => {
    it('should reject missing required fields', async () => {
      const result = await handler.execute({
        // Missing customField
        technique: 'custom_technique',
        problem: 'Test',
      });

      expect(result.isError).toBe(true);
      expect(result.error.code).toBe(ErrorCode.INVALID_FIELD_VALUE);
      expect(result.error.message).toContain('customField is required');
    });

    it('should provide helpful validation messages', async () => {
      const result = await handler.execute({
        customField: '',
        customValue: -5,
      });

      const error = JSON.parse(result.content[0].text);
      expect(error.details.errors).toHaveLength(2);
      expect(error.details.errors).toContain('customValue must be non-negative');
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should retry on temporary failures', async () => {
      // Mock temporary failure then success
      jest
        .spyOn(handler, 'performOperation')
        .mockRejectedValueOnce({ code: 'RESOURCE_BUSY' })
        .mockResolvedValueOnce({ data: 'success' });

      const result = await handler.execute(validInput);

      expect(result.isError).toBe(false);
      expect(handler.performOperation).toHaveBeenCalledTimes(2);
    });

    it('should degrade gracefully on non-recoverable errors', async () => {
      jest.spyOn(handler, 'performOperation').mockRejectedValue(new Error('Network timeout'));

      const result = await handler.execute(validInput);

      expect(result.isError).toBe(false);
      expect(result.warning).toContain('fallback processing');
    });
  });

  describe('Error Context', () => {
    it('should preserve error context through layers', async () => {
      const result = await executeThinkingStep({
        technique: 'custom_technique',
        invalidField: true,
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.error.layer).toBe('execution');
      expect(response.error.details).toHaveProperty('technique');
      expect(response.error.timestamp).toBeDefined();
    });
  });
});
```

### Integration Test Template

```typescript
describe('Error Recovery Integration', () => {
  it('should maintain session consistency through errors', async () => {
    // Create session
    const plan = await planThinkingSession({
      problem: 'Test recovery',
      techniques: ['custom_technique'],
    });

    // Execute valid step
    const step1 = await executeThinkingStep({
      planId: plan.planId,
      currentStep: 1,
      customField: 'valid',
    });

    expect(step1.isError).toBe(false);
    const { sessionId } = JSON.parse(step1.content[0].text);

    // Trigger error
    const errorStep = await executeThinkingStep({
      planId: plan.planId,
      currentStep: 2,
      // Missing required field
    });

    // Verify session still valid
    const session = sessionManager.getSession(sessionId);
    expect(session).toBeDefined();
    expect(session.history).toHaveLength(1); // Error step not recorded

    // Continue with valid step
    const step3 = await executeThinkingStep({
      planId: plan.planId,
      currentStep: 2, // Retry step 2
      customField: 'valid',
    });

    expect(step3.isError).toBe(false);
    expect(session.history).toHaveLength(2); // Now recorded
  });
});
```

## Anti-Patterns to Avoid

### 1. Silent Failures

```typescript
// ❌ Bad: Swallowing errors
try {
  await riskyOperation();
} catch (error) {
  // Silent failure - user has no idea what happened
}

// ✅ Good: Log and handle appropriately
try {
  await riskyOperation();
} catch (error) {
  console.error('[Component] Risky operation failed:', error);
  return degradedResponse(error);
}
```

### 2. Generic Error Messages

```typescript
// ❌ Bad: Unhelpful error
throw new Error('Operation failed');

// ✅ Good: Specific, actionable error
throw new ValidationError(
  ErrorCode.INVALID_FIELD_VALUE,
  'Step number must be between 1 and 6 for six_hats technique',
  'currentStep',
  { provided: 10, validRange: '1-6' }
);
```

### 3. Inconsistent Error Formats

```typescript
// ❌ Bad: Different error formats
if (error1) return { error: error1.message };
if (error2) return { message: error2.toString() };
if (error3) throw error3;

// ✅ Good: Consistent error response
if (error) {
  return createErrorResponse(error, 'execution');
}
```

### 4. Error State Corruption

```typescript
// ❌ Bad: Partial state updates on error
session.history.push(stepData);
session.metrics.stepCount++;
await validateStep(stepData); // Might throw - state now corrupted

// ✅ Good: Validate before state changes
const validation = await validateStep(stepData);
if (validation.isValid) {
  session.history.push(stepData);
  session.metrics.stepCount++;
}
```

## Performance Considerations

### 1. Error Creation Cost

```typescript
// Consider caching frequently used errors
const COMMON_ERRORS = {
  PLAN_NOT_FOUND: (planId: string) =>
    errorContextBuilder.buildWorkflowError('plan_not_found', { planId }),

  INVALID_TECHNIQUE: (technique: string) =>
    new ValidationError(
      ErrorCode.INVALID_TECHNIQUE,
      `Unknown technique: ${technique}`,
      'technique'
    ),
};
```

### 2. Recovery Overhead

```typescript
// Implement circuit breaker for expensive recovery
class RecoveryCircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  canAttemptRecovery(): boolean {
    if (Date.now() - this.lastFailure > this.timeout) {
      this.failures = 0; // Reset after timeout
    }
    return this.failures < this.threshold;
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
  }

  recordSuccess() {
    this.failures = 0;
  }
}
```

## Debugging Error Recovery

### 1. Error Context Logging

```typescript
// Enhanced error logging for debugging
function logError(error: any, context: any) {
  console.error('[ErrorRecovery] Error occurred:', {
    code: error.code,
    message: error.message,
    layer: error.layer,
    context: {
      sessionId: context.sessionId,
      technique: context.technique,
      step: context.currentStep,
      timestamp: new Date().toISOString(),
    },
    stack: error.stack,
  });
}
```

### 2. Error Tracking

```typescript
// Track error patterns for analysis
class ErrorTracker {
  private errors: Map<string, number> = new Map();

  track(error: CreativeThinkingError) {
    const key = `${error.code}:${error.layer}`;
    this.errors.set(key, (this.errors.get(key) || 0) + 1);
  }

  getTopErrors(limit = 10): Array<[string, number]> {
    return Array.from(this.errors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
}
```

## Summary

Implementing robust error recovery requires:

1. **Consistent error types** - Use the defined error hierarchy
2. **Early validation** - Catch issues before they propagate
3. **Graceful degradation** - Continue with reduced functionality when possible
4. **Clear guidance** - Help users understand and fix issues
5. **State preservation** - Maintain consistency through error conditions
6. **Comprehensive testing** - Cover error scenarios explicitly

By following these patterns and avoiding common pitfalls, new features can maintain the high
reliability standards of the Creative Thinking MCP Server.
