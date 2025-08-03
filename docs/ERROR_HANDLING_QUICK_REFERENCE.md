# Error Handling Quick Reference

## Error Classes & When to Use Them

| Error Class        | Use When                | Error Codes                                                                               |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `ValidationError`  | Input validation fails  | `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`, `INVALID_TECHNIQUE`, `INVALID_FIELD_VALUE`     |
| `SessionError`     | Session operations fail | `SESSION_NOT_FOUND`, `SESSION_EXPIRED`, `SESSION_ALREADY_EXISTS`, `MAX_SESSIONS_EXCEEDED` |
| `PlanError`        | Planning phase issues   | `PLAN_NOT_FOUND`, `PLAN_EXPIRED`                                                          |
| `ExecutionError`   | Execution problems      | `INVALID_STEP`, `TECHNIQUE_MISMATCH`, `WORKFLOW_REQUIRED`                                 |
| `PersistenceError` | Storage issues          | `PERSISTENCE_NOT_AVAILABLE`, `PERSISTENCE_WRITE_FAILED`, `PERSISTENCE_READ_FAILED`        |

## Common Error Patterns

### Input Validation

```typescript
const validation = validator.validate(input);
if (!validation.valid) {
  throw new ValidationError(ErrorCode.INVALID_INPUT, validation.errors.join('; '), 'fieldName', {
    providedValue: input.fieldName,
  });
}
```

### Session Not Found

```typescript
const session = sessionManager.getSession(sessionId);
if (!session && sessionId) {
  // Create new session (supports recovery)
  session = sessionManager.createSession(data, sessionId);
}
```

### Graceful Degradation

```typescript
try {
  await persistenceAdapter.save(data);
  response.status = 'saved';
} catch (error) {
  if (error.code === ErrorCode.PERSISTENCE_NOT_AVAILABLE) {
    response.status = 'memory-only';
    response.warning = 'Data saved in memory only';
  }
}
```

### Workflow Guidance

```typescript
if (!planId) {
  return errorContextBuilder.buildWorkflowError('plan_not_found', {
    planId: input.planId,
    workflow: [
      /* step-by-step guidance */
    ],
  });
}
```

## Error Response Format

```typescript
{
  error: {
    code: ErrorCode,
    message: string,
    details?: any,
    layer: ErrorLayer,
    timestamp: string
  },
  isError: true
}
```

## Do's and Don'ts

### ✅ DO

- Use specific error codes
- Provide actionable messages
- Include recovery guidance
- Log to stderr (not stdout)
- Test error scenarios
- Preserve session state
- Degrade gracefully

### ❌ DON'T

- Throw generic errors
- Log to stdout
- Swallow errors silently
- Break session state
- Use inconsistent formats
- Expose internal details
- Crash the server

## Error Testing Template

```typescript
it('should handle [error scenario] gracefully', async () => {
  // Arrange: Set up error condition
  jest
    .spyOn(component, 'method')
    .mockRejectedValue(new SpecificError(ErrorCode.SPECIFIC_CODE, 'Message'));

  // Act: Trigger the error
  const result = await operation();

  // Assert: Verify graceful handling
  expect(result.isError).toBe(true);
  expect(result.error.code).toBe(ErrorCode.SPECIFIC_CODE);
  expect(result.error.guidance).toBeDefined();

  // Verify recovery
  const recovery = await validOperation();
  expect(recovery.isError).toBe(false);
});
```

## Logging Format

```typescript
console.error(`[${component}] ${error.code}: ${error.message}`, {
  sessionId,
  technique,
  step: currentStep,
  details: error.details,
});
```

## Common Recovery Strategies

1. **Retry with backoff**: Temporary failures
2. **Create on demand**: Missing resources
3. **Use defaults**: Missing optional data
4. **Degrade features**: Service unavailable
5. **Guide workflow**: User mistakes
6. **Clean and retry**: Corrupted state

## Error Context Builder Usage

```typescript
// Plan not found
errorContextBuilder.buildWorkflowError('plan_not_found', {
  planId: 'missing-plan-id',
});

// Technique mismatch
errorContextBuilder.buildWorkflowError('technique_mismatch', {
  planId: 'plan_123',
  technique: 'wrong_technique',
  expectedTechniques: ['six_hats', 'scamper'],
});

// Session error
errorContextBuilder.buildSessionError({
  errorType: 'not_found',
  sessionId: 'session_123',
  message: 'Session expired or not found',
});

// Step error context
errorContextBuilder.buildStepErrorContext({
  providedStep: 10,
  validRange: '1-6',
  technique: 'six_hats',
});
```

## Memory Management

- Monitor memory usage
- Evict old sessions at 90% capacity
- Log eviction events
- Preserve active sessions

## Performance Tips

- Cache common errors
- Implement circuit breakers
- Limit retry attempts
- Track error patterns
- Batch error logging

## Debugging Checklist

- [ ] Check error code and layer
- [ ] Verify error message clarity
- [ ] Review error context/details
- [ ] Confirm graceful degradation
- [ ] Test recovery path
- [ ] Check logs (stderr)
- [ ] Verify state consistency
