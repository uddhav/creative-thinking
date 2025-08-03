# Error Recovery Patterns

This document outlines the error handling and recovery patterns used throughout the Creative
Thinking MCP Server, providing guidance for maintainers and contributors on how to handle errors
consistently and gracefully.

## Table of Contents

1. [Overview](#overview)
2. [Error Type Hierarchy](#error-type-hierarchy)
3. [Error Recovery Patterns](#error-recovery-patterns)
4. [Implementation Examples](#implementation-examples)
5. [Best Practices](#best-practices)
6. [Testing Error Scenarios](#testing-error-scenarios)

## Overview

The Creative Thinking MCP Server implements a comprehensive error handling system designed to:

- Provide meaningful error messages to users
- Maintain system stability during error conditions
- Enable graceful recovery from failures
- Preserve session state when possible
- Guide users toward correct usage patterns

### Key Principles

1. **Fail gracefully**: Never crash the server; always return structured error responses
2. **Preserve state**: Maintain session integrity even when errors occur
3. **Guide users**: Provide actionable error messages with clear remediation steps
4. **Layer isolation**: Handle errors at the appropriate architectural layer
5. **Consistency**: Use standardized error types and response formats

## Error Type Hierarchy

### Base Error Classes

```typescript
// Base error class for all Creative Thinking errors
class CreativeThinkingError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly layer: ErrorLayer,
    public readonly details?: unknown
  ) {
    super(message);
    this.timestamp = new Date().toISOString();
  }
}
```

### Specialized Error Classes

```typescript
// Validation errors (discovery layer)
class ValidationError extends CreativeThinkingError

// Session management errors
class SessionError extends CreativeThinkingError

// Planning phase errors
class PlanError extends CreativeThinkingError

// Execution phase errors
class ExecutionError extends CreativeThinkingError

// Persistence layer errors
class PersistenceError extends CreativeThinkingError
```

### Error Codes

Error codes are organized by category:

- **Validation**: `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`, `INVALID_TECHNIQUE`
- **Session**: `SESSION_NOT_FOUND`, `SESSION_EXPIRED`, `MAX_SESSIONS_EXCEEDED`
- **Planning**: `PLAN_NOT_FOUND`, `PLAN_EXPIRED`
- **Execution**: `INVALID_STEP`, `TECHNIQUE_MISMATCH`, `WORKFLOW_REQUIRED`
- **System**: `INTERNAL_ERROR`, `RESOURCE_LIMIT_EXCEEDED`, `TIMEOUT_ERROR`

## Error Recovery Patterns

### 1. Validation Error Recovery

**Pattern**: Validate input early and provide specific guidance

```typescript
// Example from ExecutionValidator
validatePlan(input: ExecuteThinkingStepInput) {
  if (!input.planId) {
    return {
      isValid: false,
      error: errorContextBuilder.buildWorkflowError('plan_not_found', {
        planId: 'missing',
        workflow: [
          { step: 1, tool: 'discover_techniques', args: { problem: '...' } },
          { step: 2, tool: 'plan_thinking_session', args: { ... } },
          { step: 3, tool: 'execute_thinking_step', args: { ... } }
        ]
      })
    };
  }
  // Continue validation...
}
```

**Recovery**: Guide user through correct workflow sequence

### 2. Session Not Found Recovery

**Pattern**: Create session on-demand when not found

```typescript
// From ExecutionValidator
if (!session && sessionId) {
  // DESIGN DECISION: Create session with provided ID
  // Supports: crash recovery, custom IDs, stateless operation
  session = sessionManager.createSession(
    {
      technique: input.technique,
      problem: input.problem,
      history: [],
      branches: {},
      insights: [],
    },
    sessionId
  );
}
```

**Recovery**: Automatically create missing sessions to support stateless operation

### 3. Invalid Step Recovery

**Pattern**: Return success with error context in metadata

```typescript
// From execution layer
if (!stepValidation.isValid) {
  const errorContext = errorContextBuilder.buildStepErrorContext({
    providedStep: input.currentStep,
    validRange: `1-${techniqueInfo.totalSteps}`,
    technique: input.technique,
  });

  // Return success response with error metadata
  return responseBuilder.buildExecutionResponse(
    sessionId,
    operationData,
    [],
    nextStepGuidance,
    session.history.length,
    { errorContext, techniqueEffectiveness: 0.5 }
  );
}
```

**Recovery**: Continue operation with degraded functionality

### 4. Persistence Failure Recovery

**Pattern**: Degrade gracefully when persistence unavailable

```typescript
// From execution layer
if (input.autoSave) {
  try {
    await sessionManager.saveSessionToPersistence(sessionId);
  } catch (error) {
    if (error instanceof PersistenceError && error.code === ErrorCode.PERSISTENCE_NOT_AVAILABLE) {
      // Add status to response
      response.autoSaveStatus = 'disabled';
      response.autoSaveMessage = 'Persistence not configured. Session stored in memory only.';
    } else {
      response.autoSaveStatus = 'failed';
      response.autoSaveError = error.message;
    }
  }
}
```

**Recovery**: Continue with in-memory storage, notify user

### 5. Memory Limit Recovery

**Pattern**: Evict old sessions when approaching limits

```typescript
// From SessionManager via SessionCleaner
private checkMemoryLimitsOnInterval() {
  const stats = this.memoryManager.calculateMemoryUsage(this.sessions);

  if (stats.estimatedMB > this.config.maxMemoryMB * 0.9) {
    // Evict oldest inactive sessions
    const evicted = this.evictOldestSessions(stats.estimatedMB);
    console.error(`[SessionCleaner] Evicted ${evicted} sessions due to memory pressure`);
  }
}
```

**Recovery**: Automatically manage memory by evicting inactive sessions

### 6. Concurrent Error Handling

**Pattern**: Isolate errors to prevent cascade failures

```typescript
// From error recovery tests
const results = await Promise.all([
  executeThinkingStep(invalidInput1, ...),
  executeThinkingStep(invalidInput2, ...),
  executeThinkingStep(validInput, ...)
]);

// Each operation handles its own errors independently
```

**Recovery**: Process each request independently, preventing error propagation

## Implementation Examples

### Example 1: Comprehensive Error Context

```typescript
// ErrorContextBuilder provides consistent error formatting
buildWorkflowError(errorType: 'plan_not_found', context) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: '❌ WORKFLOW ERROR: Plan not found',
        message: `The planId '${planId}' does not exist`,
        guidance: '⚠️ REQUIRED THREE-STEP WORKFLOW:',
        workflow: [/* step details */],
        example: { correct_sequence: [/* ... */] },
        your_error: `You tried to use planId '${planId}'`,
        fix: '👉 Start over with discover_techniques'
      }, null, 2)
    }],
    isError: true
  };
}
```

### Example 2: Risk Assessment with Intervention

```typescript
// RiskAssessmentOrchestrator
assessRisks(input, session) {
  const assessment = ruinRiskDiscovery.assessRuinRisk(input);

  if (assessment.requiresIntervention) {
    return {
      requiresIntervention: true,
      interventionResponse: buildInterventionResponse(assessment)
    };
  }

  return { requiresIntervention: false };
}
```

### Example 3: State Preservation During Errors

```typescript
// Session state remains intact after validation errors
try {
  // Execute step 1 successfully
  const step1 = await executeThinkingStep(validInput);

  // Step 2 fails validation
  const step2 = await executeThinkingStep(invalidInput);

  // Step 3 can still continue with session state from step 1
  const step3 = await executeThinkingStep(validInput);
} catch (error) {
  // Session state preserved throughout
}
```

## Best Practices

### 1. Error Message Guidelines

- Use clear, actionable language
- Include specific details about what went wrong
- Provide concrete steps to fix the issue
- Include examples when helpful
- Use visual indicators (emojis) sparingly and consistently

### 2. Error Response Structure

```typescript
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    layer: ErrorLayer;
    timestamp: string;
  };
  isError: true;
}
```

### 3. Logging Best Practices

- Log errors to stderr, not stdout (MCP protocol requirement)
- Include contextual information
- Use appropriate log levels
- Avoid logging sensitive information

```typescript
console.error(`[${layer}] ${error.code}: ${error.message}`, {
  sessionId,
  technique,
  step: currentStep,
});
```

### 4. Error Propagation

- Catch errors at appropriate boundaries
- Transform low-level errors into user-friendly messages
- Preserve error context through layers
- Use error codes for programmatic handling

### 5. Testing Error Scenarios

```typescript
describe('Error Recovery', () => {
  it('should handle invalid technique gracefully', async () => {
    const result = await executeThinkingStep({
      technique: 'invalid_technique',
      // ...
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('TECHNIQUE MISMATCH');
  });
});
```

## Testing Error Scenarios

### Unit Testing Patterns

1. **Test error conditions explicitly**

   ```typescript
   it('should handle missing required fields', () => {
     expect(() => planThinkingSession({ problem: '' })).toThrow(/problem/);
   });
   ```

2. **Verify error response format**

   ```typescript
   const errorResponse = JSON.parse(result.content[0].text);
   expect(errorResponse).toHaveProperty('error');
   expect(errorResponse).toHaveProperty('guidance');
   ```

3. **Test error recovery**
   ```typescript
   // Trigger error condition
   const errorResult = await executeWithInvalidStep();
   // Verify system recovers
   const recoveryResult = await executeWithValidStep();
   expect(recoveryResult.isError).toBe(false);
   ```

### Integration Testing Patterns

1. **Test concurrent error handling**
2. **Test cascade failure prevention**
3. **Test resource limit handling**
4. **Test persistence fallback scenarios**

### Error Injection for Testing

```typescript
// Mock persistence failure
jest
  .spyOn(sessionManager, 'saveSessionToPersistence')
  .mockRejectedValue(
    new PersistenceError(ErrorCode.PERSISTENCE_NOT_AVAILABLE, 'Storage not configured')
  );
```

## Monitoring and Observability

### Error Metrics to Track

1. **Error rate by type**: Validation, session, execution errors
2. **Recovery success rate**: How often automatic recovery succeeds
3. **Memory eviction frequency**: Indicates memory pressure
4. **Persistence failure rate**: Storage reliability
5. **User workflow completion**: Success after encountering errors

### Error Alerting Thresholds

- High error rate (>10% of requests)
- Repeated session evictions
- Persistence failures
- Memory limit approaches
- Timeout errors

## Future Improvements

1. **Circuit breaker pattern** for external dependencies
2. **Retry logic** with exponential backoff
3. **Error aggregation** for better insights
4. **Custom error recovery strategies** per technique
5. **Enhanced error context** with more debugging information

## Conclusion

The Creative Thinking MCP Server's error recovery patterns ensure a robust and user-friendly
experience. By following these patterns and best practices, the system maintains stability while
providing clear guidance to users when issues occur. The combination of graceful degradation,
automatic recovery, and informative error messages creates a resilient system that can handle
various failure scenarios without compromising the user experience.
