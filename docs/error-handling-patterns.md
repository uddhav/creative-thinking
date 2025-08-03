# Error Handling Patterns

This document describes the error handling patterns used in the Creative Thinking MCP Server and
provides guidance for consistent error handling across the codebase.

## Overview

The Creative Thinking MCP Server uses a layered approach to error handling that ensures consistency,
provides helpful context, and maintains MCP protocol compliance.

## Error Response Types

### 1. Hard Errors (isError: true)

These are returned when the operation cannot proceed and must fail immediately.

**When to use:**

- Plan not found
- Technique mismatch with plan
- Invalid technique names (when no plan context)
- Critical system failures

**Format:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error message with context"
    }
  ],
  "isError": true
}
```

**Examples:**

- `WORKFLOW ERROR: Plan not found (planId: non-existent-plan)`
- `TECHNIQUE MISMATCH ERROR: Plan expects 'concept_extraction' but received 'disney_method'`

### 2. Soft Errors (Success with Error Context)

These are returned when the operation can continue but with degraded functionality or error
information embedded in metadata.

**When to use:**

- Invalid step numbers (out of range)
- Non-critical validation failures
- Recovery from temporary failures

**Format:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"sessionId\": \"...\",
      \"executionMetadata\": {
        \"errorContext\": {
          \"providedStep\": -1,
          \"validRange\": \"1-6\",
          \"technique\": \"six_hats\",
          \"message\": \"Step -1 is outside valid range\"
        }
      }
    }"
  }],
  "isError": false
}
```

### 3. Feature Status Responses

These indicate the status of optional features without failing the operation.

**When to use:**

- AutoSave disabled/failed
- Optional features not configured
- Graceful degradation scenarios

**Format:**

```json
{
  "autoSaveStatus": "disabled",
  "autoSaveMessage": "Persistence is not configured. Session data is stored in memory only."
}
```

## Error Codes (ErrorCode Enum)

### Validation Errors

- `INVALID_INPUT` - Generic invalid input
- `MISSING_REQUIRED_FIELD` - Required field not provided
- `INVALID_TECHNIQUE` - Unknown technique name
- `INVALID_FIELD_VALUE` - Field value doesn't meet requirements

### Session Errors

- `SESSION_NOT_FOUND` - Session ID doesn't exist
- `SESSION_EXPIRED` - Session exceeded TTL
- `SESSION_ALREADY_EXISTS` - Duplicate session ID
- `SESSION_TOO_LARGE` - Session exceeds size limit
- `MAX_SESSIONS_EXCEEDED` - Too many active sessions

### Plan Errors

- `PLAN_NOT_FOUND` - Plan ID doesn't exist
- `PLAN_EXPIRED` - Plan exceeded TTL

### Business Logic Errors

- `INVALID_STEP` - Step number out of range
- `INVALID_STEP_SEQUENCE` - Steps executed out of order
- `TECHNIQUE_NOT_SUPPORTED` - Technique not implemented
- `TECHNIQUE_MISMATCH` - Technique doesn't match plan
- `WORKFLOW_REQUIRED` - Missing required workflow context

### System Errors

- `INTERNAL_ERROR` - Unexpected system failure
- `PERSISTENCE_ERROR` - Generic persistence failure
- `PERSISTENCE_NOT_AVAILABLE` - Persistence not configured
- `PERSISTENCE_WRITE_FAILED` - Failed to save data
- `PERSISTENCE_READ_FAILED` - Failed to read data

### Resource Errors

- `RESOURCE_LIMIT_EXCEEDED` - Memory/CPU limits exceeded
- `TIMEOUT_ERROR` - Operation timed out

## Error Handling Guidelines

### 1. Use Appropriate Error Type

```typescript
// Hard error - operation cannot continue
if (!plan) {
  return responseBuilder.buildErrorResponse(
    new CreativeThinkingError(
      ErrorCode.PLAN_NOT_FOUND,
      `WORKFLOW ERROR: Plan not found (planId: ${planId})`,
      'execution'
    ),
    'execution'
  );
}

// Soft error - operation continues with context
if (step < 1 || step > maxSteps) {
  const errorContext = errorContextBuilder.buildStepErrorContext({
    providedStep: step,
    validRange: `1-${maxSteps}`,
    technique,
    message: `Step ${step} is outside valid range`,
  });
  // Include in response metadata, not as error
}
```

### 2. Provide Helpful Context

Always include:

- What went wrong
- Why it went wrong
- What the valid values/actions are
- How to fix it (when possible)

```typescript
// Good
throw new CreativeThinkingError(
  ErrorCode.TECHNIQUE_MISMATCH,
  `TECHNIQUE MISMATCH ERROR: Plan expects '${plan.technique}' but received '${input.technique}'. Please use the correct technique for this plan.`,
  'execution',
  { planId, expectedTechnique: plan.technique, receivedTechnique: input.technique }
);

// Bad
throw new Error('Wrong technique');
```

### 3. Design for Recovery

**Session Creation Pattern:** When a non-existent session ID is provided, the system creates a new
session with that ID. This supports:

1. Session recovery after crashes
2. Custom session IDs from external systems
3. Stateless operation

```typescript
let session = sessionManager.getSession(sessionId);
if (!session) {
  // Create new session instead of failing
  session = sessionManager.createSession({
    id: sessionId,
    ...defaultSessionData,
  });
}
```

### 4. Handle Resource Constraints Gracefully

```typescript
try {
  await sessionManager.addToSession(sessionId, data);
} catch (error) {
  if (error.code === ErrorCode.SESSION_TOO_LARGE) {
    // Evict old data or compress
    sessionManager.cleanupSession(sessionId);
    await sessionManager.addToSession(sessionId, data);
  } else {
    throw error;
  }
}
```

### 5. MCP Protocol Compliance

**Critical**: All visual output must go to stderr, not stdout.

```typescript
// Correct
process.stderr.write('Visual output here\n');
console.error('[Debug] Information');

// Wrong - violates MCP protocol
console.log('This breaks MCP');
process.stdout.write('This also breaks MCP');
```

## Testing Error Scenarios

### 1. Test Both Error Types

```typescript
it('should return hard error for missing plan', async () => {
  const result = await executeThinkingStep({ planId: 'missing' });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toMatch(/WORKFLOW.*ERROR.*Plan.*not.*found/i);
});

it('should return soft error for invalid step', async () => {
  const result = await executeThinkingStep({ currentStep: -1 });
  expect(result.isError).not.toBe(true);
  const errorContext = extractErrorContext(result);
  expect(errorContext.providedStep).toBe(-1);
});
```

### 2. Test Recovery Mechanisms

```typescript
it('should recover from persistence failure', async () => {
  const result = await executeThinkingStep({ autoSave: true });
  expect(result.isError).not.toBe(true);
  const response = JSON.parse(result.content[0].text);
  expect(response.autoSaveStatus).toBe('disabled');
});
```

### 3. Test Resource Limits

```typescript
it('should handle memory limits gracefully', async () => {
  const manager = new SessionManager({ maxMemoryMB: 0.001 });
  // Create large sessions
  // Verify eviction happens
  // Verify system remains stable
});
```

## Common Patterns

### Pattern 1: Validation with Workflow Guidance

```typescript
const validation = validator.validate(input);
if (!validation.valid) {
  if (validation.workflow) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: validation.errors[0],
              workflow: validation.workflow,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
  return buildErrorResponse(validation.errors);
}
```

### Pattern 2: Graceful Feature Degradation

```typescript
if (input.autoSave) {
  try {
    await sessionManager.saveSessionToPersistence(sessionId);
  } catch (error) {
    // Don't fail the operation, just report status
    response.autoSaveStatus = 'failed';
    response.autoSaveError = error.message;
  }
}
```

### Pattern 3: Context-Aware Error Messages

```typescript
const errorContext = {
  layer: 'execution',
  technique: input.technique,
  step: input.currentStep,
  sessionId: session?.id,
  timestamp: new Date().toISOString(),
};

throw new CreativeThinkingError(
  ErrorCode.INVALID_STEP,
  `Step ${input.currentStep} is invalid for ${input.technique}`,
  'execution',
  errorContext
);
```

## Best Practices

1. **Be Consistent**: Use the same error patterns across similar scenarios
2. **Be Helpful**: Include actionable information in error messages
3. **Be Graceful**: Prefer recovery over failure when possible
4. **Be Compliant**: Always follow MCP protocol requirements
5. **Be Testable**: Write tests for all error scenarios
6. **Be Documentative**: Document non-obvious error handling decisions

## Migration Guide

When updating error handling in existing code:

1. Identify the error type (hard vs soft)
2. Use appropriate ErrorCode enum value
3. Include helpful context in the error message
4. Add error details object when beneficial
5. Update tests to match new error format
6. Ensure MCP compliance (no stdout output)

## References

- [Error Types Definition](../src/errors/types.ts)
- [Response Builder](../src/core/ResponseBuilder.ts)
- [Error Context Builder](../src/core/ErrorContextBuilder.ts)
- [MCP Protocol Compliance Test](../src/__tests__/integration/mcp-protocol-compliance.test.ts)
