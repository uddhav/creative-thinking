# Error Recovery Guide

This guide helps you understand and recover from errors when using the Creative Thinking MCP Server.
The enhanced error system provides detailed error information with specific recovery steps to help
both humans and LLMs resolve issues quickly.

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Error Messages](#understanding-error-messages)
3. [Error Categories](#error-categories)
4. [Common Errors and Solutions](#common-errors-and-solutions)
5. [Error Prevention Best Practices](#error-prevention-best-practices)
6. [Troubleshooting Flowchart](#troubleshooting-flowchart)
7. [LLM Integration](#llm-integration)

## Introduction

The Creative Thinking MCP Server uses an enhanced error system that:

- Provides clear, actionable error messages
- Includes step-by-step recovery instructions
- Categorizes errors by type and severity
- Supports automatic retry for transient errors
- Helps LLMs recover from errors programmatically

Every error includes:

- A unique error code for easy identification
- A human-readable message explaining what went wrong
- Recovery steps listed in order of preference
- Context information to help diagnose the issue
- Links to relevant documentation

## Understanding Error Messages

### Error Response Format

```json
{
  "error": {
    "code": "E201",
    "message": "Session 'abc123' not found. The session may have expired or been deleted.",
    "category": "state",
    "severity": "medium",
    "recovery": [
      "Start a new session with discover_techniques",
      "Check if the sessionId is correct",
      "If using persistence, ensure the session was saved",
      "List available sessions if persistence is enabled"
    ],
    "context": {
      "sessionId": "abc123"
    },
    "documentation": "https://docs.creative-thinking.dev/errors#state"
  },
  "recovery": {
    "steps": [...],
    "canRetry": false,
    "retryDelay": null
  },
  "llmGuidance": "Error: Session 'abc123' not found..."
}
```

### Severity Levels

- **low**: Minor issues that don't block operation (e.g., optional parameters)
- **medium**: Issues requiring user action but with clear fixes
- **high**: Serious issues that may require workflow changes
- **critical**: System failures requiring immediate attention

## Error Categories

### 1. Validation Errors (E101-E104)

Issues with input parameters, missing fields, or invalid values.

**Characteristics:**

- Usually easy to fix
- Clear guidance on correct format
- Examples provided when helpful

### 2. Workflow Errors (E001-E004, E201-E203)

Problems with the three-layer workflow sequence or tool usage.

**Characteristics:**

- Guide you to the correct workflow
- Show the expected sequence
- Prevent workflow violations

### 3. State Errors (E201-E204, E301-E303)

Session or plan management issues.

**Characteristics:**

- May require creating new sessions
- Can often be recovered automatically
- Preserve existing work when possible

### 4. System Errors (E301-E304, E401-E403)

Infrastructure issues like file I/O, memory, or network problems.

**Characteristics:**

- Often retryable
- May degrade gracefully
- Include system-specific guidance

### 5. Permission Errors (E501-E502)

Access control and rate limiting issues.

**Characteristics:**

- Clear about what's restricted
- Suggest alternatives
- Include retry timing for rate limits

### 6. Configuration Errors (E601-E602)

Missing or invalid configuration settings.

**Characteristics:**

- Specific about what's needed
- Reference environment variables
- Link to configuration docs

### 7. Technique Errors (E501-E502, E701-E702)

Issues specific to thinking techniques.

**Characteristics:**

- Technique-specific guidance
- Suggest parameter adjustments
- Recommend alternative techniques

### 8. Convergence Errors (E601-E603, E801-E803)

Problems with parallel execution or plan convergence.

**Characteristics:**

- Identify failed components
- Suggest sequential fallback
- Help with dependency resolution

## Common Errors and Solutions

### Error: Wrong Tool Order (E001)

**Message:** "Wrong tool order. Used 'execute_thinking_step' but expected one of:
discover_techniques, plan_thinking_session"

**Solution:**

```javascript
// ❌ Wrong: Jumping directly to execution
await execute_thinking_step({
  technique: 'six_hats',
  problem: 'How to improve team communication?',
  currentStep: 1,
  // ...
});

// ✅ Correct: Follow the three-step workflow
// Step 1: Discover techniques
const discovery = await discover_techniques({
  problem: 'How to improve team communication?',
  preferredOutcome: 'collaborative',
});

// Step 2: Plan the session
const plan = await plan_thinking_session({
  problem: 'How to improve team communication?',
  techniques: ['six_hats'],
  timeframe: 'thorough',
});

// Step 3: Execute steps
const result = await execute_thinking_step({
  planId: plan.planId,
  technique: 'six_hats',
  problem: 'How to improve team communication?',
  currentStep: 1,
  totalSteps: 6,
  output: 'Initial thoughts...',
  nextStepNeeded: true,
});
```

### Error: Missing Required Field (E101)

**Message:** "Missing required field: 'problem'"

**Solution:**

```javascript
// ❌ Wrong: Missing required field
await discover_techniques({
  preferredOutcome: 'innovative',
});

// ✅ Correct: Include all required fields
await discover_techniques({
  problem: 'How to reduce production costs?', // Required
  preferredOutcome: 'innovative', // Optional
  context: 'Manufacturing environment', // Optional
  constraints: ['Limited budget', '3 months'], // Optional
});
```

### Error: Invalid Technique (E103)

**Message:** "Invalid technique: 'mind_map'"

**Solution:**

```javascript
// ❌ Wrong: Using non-existent technique
await plan_thinking_session({
  problem: 'Design new product',
  techniques: ['mind_map', 'brainstorm'], // Invalid techniques
});

// ✅ Correct: Use valid techniques
await plan_thinking_session({
  problem: 'Design new product',
  techniques: ['scamper', 'design_thinking'], // Valid techniques
});

// Valid techniques:
// - six_hats, po, random_entry, scamper, concept_extraction
// - yes_and, design_thinking, triz, neural_state, temporal_work
// - cross_cultural, collective_intel, disney_method, nine_windows
```

### Error: Session Not Found (E201)

**Message:** "Session 'xyz789' not found. The session may have expired or been deleted."

**Solution:**

```javascript
// The system will often create a session automatically, but if not:

// Option 1: Start fresh with discovery
const discovery = await discover_techniques({
  problem: 'Your problem here',
});

// Option 2: If you have a planId, use it with a new session
await execute_thinking_step({
  planId: 'your-plan-id',
  sessionId: 'new-session-id', // Will be created automatically
  // ... other parameters
});
```

### Error: Invalid Step (E303)

**Message:** "Invalid step: Step 8 requested but technique only has 6 steps"

**Solution:**

```javascript
// ❌ Wrong: Step out of range
await execute_thinking_step({
  technique: 'six_hats',
  currentStep: 8, // Six Hats only has 6 steps
  totalSteps: 6,
  // ...
});

// ✅ Correct: Use valid step number
await execute_thinking_step({
  technique: 'six_hats',
  currentStep: 3, // Valid: 1-6 for Six Hats
  totalSteps: 6,
  // ...
});

// Check technique step counts:
// - Six Hats: 6 steps
// - SCAMPER: 8 steps
// - Nine Windows: 9 steps
// - Design Thinking: 5 steps
// etc.
```

### Error: Persistence Not Available (E403)

**Message:** "Persistence error during save: Storage not configured"

**Solution:**

```javascript
// This is often just a warning - the session continues in memory

// To enable persistence:
// 1. Set environment variables:
//    PERSISTENCE_TYPE=filesystem
//    PERSISTENCE_PATH=.creative-thinking

// 2. Or accept in-memory operation:
//    The system works perfectly without persistence
//    Sessions last for the server lifetime
```

### Error: Memory Limit Exceeded (E402)

**Message:** "Memory limit exceeded: 92% of available memory in use"

**Solution:**

```javascript
// The system automatically manages memory by:
// 1. Evicting old inactive sessions
// 2. Clearing completed sessions

// You can help by:
// - Completing sessions with nextStepNeeded: false
// - Using smaller problem descriptions
// - Running fewer parallel sessions
```

## Error Prevention Best Practices

### 1. Always Follow the Three-Layer Workflow

```javascript
// The correct sequence every time:
discover_techniques() → plan_thinking_session() → execute_thinking_step()
```

### 2. Validate Input Before Sending

```javascript
// Check required fields
function validateDiscoveryInput(input) {
  if (!input.problem || input.problem.trim() === '') {
    throw new Error('Problem description is required');
  }

  if (
    input.preferredOutcome &&
    !['innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'].includes(
      input.preferredOutcome
    )
  ) {
    throw new Error('Invalid preferred outcome');
  }
}
```

### 3. Handle Errors Gracefully

```javascript
try {
  const result = await execute_thinking_step(input);
  // Process result
} catch (error) {
  if (error.code === 'E201') {
    // Session not found - start over
    const discovery = await discover_techniques({ problem: input.problem });
    // Continue...
  } else if (error.retryable) {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, error.retryDelayMs));
    const result = await execute_thinking_step(input);
  } else {
    // Log and handle unrecoverable error
    console.error('Error:', error.message);
    console.error('Recovery steps:', error.recovery);
  }
}
```

### 4. Use Session IDs Consistently

```javascript
// Store session and plan IDs
let sessionId;
let planId;

// Reuse them across steps
const step1 = await execute_thinking_step({
  sessionId, // Same session
  planId, // Same plan
  currentStep: 1,
  // ...
});

const step2 = await execute_thinking_step({
  sessionId, // Same session
  planId, // Same plan
  currentStep: 2,
  // ...
});
```

### 5. Monitor Resource Usage

```javascript
// Check for warnings in responses
if (response.warnings) {
  response.warnings.forEach(warning => {
    if (warning.includes('memory')) {
      // Consider reducing session count
    }
  });
}
```

## Troubleshooting Flowchart

```
Start
  │
  ├─ Is it a validation error (E1xx)?
  │   └─ Yes → Check input format against documentation
  │        └─ Fix input parameters and retry
  │
  ├─ Is it a workflow error (E0xx, E2xx)?
  │   └─ Yes → Are you following the 3-step process?
  │        ├─ No → Start with discover_techniques
  │        └─ Yes → Check if using correct tool for current step
  │
  ├─ Is it a state error (E2xx, E3xx)?
  │   └─ Yes → Is it a missing session/plan?
  │        ├─ Yes → Create new session/plan or check ID
  │        └─ No → Check if session expired (create new)
  │
  ├─ Is it a system error (E3xx, E4xx)?
  │   └─ Yes → Is it retryable?
  │        ├─ Yes → Wait and retry with exponential backoff
  │        └─ No → Check system resources/configuration
  │
  └─ Is it a technique error (E5xx, E7xx)?
      └─ Yes → Check technique parameters
           └─ Try simpler parameters or different technique
```

## LLM Integration

### Parsing Enhanced Errors

LLMs can use the structured error format for automatic recovery:

```python
# Python example for LLMs
import json
import time

def handle_mcp_error(error_response):
    error = error_response.get('error', {})
    recovery = error_response.get('recovery', {})

    # Check if retryable
    if recovery.get('canRetry'):
        retry_delay = recovery.get('retryDelay', 1000) / 1000
        time.sleep(retry_delay)
        return 'retry'

    # Follow recovery steps
    recovery_steps = error.get('recovery', [])
    if recovery_steps:
        # Implement first recovery suggestion
        first_step = recovery_steps[0]

        if 'discover_techniques' in first_step:
            return 'start_discovery'
        elif 'Create a new session' in first_step:
            return 'new_session'
        elif 'Check' in first_step:
            return 'validate_input'

    return 'manual_intervention'
```

### Using Error Codes

```javascript
// Map error codes to actions
const errorActions = {
  E001: 'start_workflow',
  E101: 'fix_validation',
  E201: 'create_session',
  E301: 'retry_operation',
  E403: 'check_persistence',
  E601: 'check_config',
};

function getActionForError(errorCode) {
  return errorActions[errorCode] || 'check_documentation';
}
```

### Automatic Retry Logic

```javascript
async function executeWithRetry(operation, maxAttempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if retryable
      if (!error.retryable || attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = error.retryDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
const result = await executeWithRetry(() => execute_thinking_step(stepInput));
```

## Getting Help

If you encounter an error not covered in this guide:

1. Check the error code in the [error code reference](./ERROR_RECOVERY_PATTERNS.md)
2. Review the context information in the error response
3. Follow the recovery steps in order
4. Consult the technique-specific documentation
5. Report persistent issues to the
   [issue tracker](https://github.com/uddhav/creative-thinking/issues)

Remember: The enhanced error system is designed to help you recover quickly. Most errors have
automatic recovery paths or clear manual fixes. When in doubt, starting fresh with
`discover_techniques` often resolves workflow-related issues.
