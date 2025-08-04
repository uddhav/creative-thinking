# Error Code Reference

This document provides a comprehensive reference for all error codes in the Creative Thinking MCP
Server.

## Error Code Ranges

| Range     | Category      | Description                               |
| --------- | ------------- | ----------------------------------------- |
| E100-E199 | Validation    | Input validation and parameter errors     |
| E200-E299 | Workflow      | Workflow sequence and process errors      |
| E300-E399 | State         | Session and state management errors       |
| E400-E499 | System        | System-level and infrastructure errors    |
| E500-E599 | Permission    | Access control and rate limiting          |
| E600-E699 | Configuration | Configuration and setup errors            |
| E700-E799 | Technique     | Technique execution errors                |
| E800-E899 | Convergence   | Parallel execution and convergence errors |
| E999      | Unknown       | Unhandled or unexpected errors            |

## Detailed Error Codes

### Validation Errors (E100-E199)

| Code | Name              | Description                 | Recovery Steps                                                                                                                                           |
| ---- | ----------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E101 | INVALID_INPUT     | Missing required field      | • Provide the missing field in your request<br>• Ensure all required fields are included<br>• Example: `{ "problem": "...", "techniques": [...] }`       |
| E102 | MISSING_PARAMETER | Invalid field type          | • Change field from current type to expected type<br>• Example: if techniques is string, change to array<br>• Use JSON.stringify() to verify structure   |
| E103 | INVALID_TYPE      | Invalid technique specified | • Use valid techniques: six_hats, po, random_entry, etc.<br>• Call discover_techniques for recommendations<br>• Techniques must match those in your plan |
| E104 | OUT_OF_RANGE      | Invalid input format        | • Ensure input is valid JSON format<br>• Verify required fields and types<br>• Check example requests in documentation                                   |
| E105 | EMPTY_ARRAY       | Empty techniques array      | • Provide at least one technique<br>• Call discover_techniques if unsure<br>• Example: `"techniques": ["six_hats"]`                                      |
| E106 | INVALID_NUMBER    | Invalid step number         | • Steps must be between 1 and totalSteps<br>• Increment currentStep by 1 each time<br>• Check technique-specific step counts                             |
| E107 | INVALID_FORMAT    | Invalid session ID format   | • Use the sessionId returned from previous calls<br>• Format: `session_[uuid]`<br>• Don't modify the sessionId                                           |

### Workflow Errors (E200-E299)

| Code | Name                    | Description                     | Recovery Steps                                                                                                                             |
| ---- | ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| E201 | WRONG_TOOL_ORDER        | Workflow order violation        | • Follow: discover → plan → execute<br>• Start with discover_techniques<br>• Each step builds on the previous                              |
| E202 | MISSING_PLAN            | Plan not found                  | • Call plan_thinking_session first<br>• Verify planId matches returned value<br>• Plans expire after 1 hour                                |
| E203 | WORKFLOW_SKIP           | Workflow skip detected          | • Complete all required steps<br>• Don't skip planning phase<br>• Use the three-tool workflow                                              |
| E204 | TECHNIQUE_MISMATCH      | Technique doesn't match plan    | • Use technique specified in plan<br>• Create new plan for different technique<br>• Check plan details before executing                    |
| E205 | MISSING_WORKFLOW_STEP   | Required workflow step missing  | • Complete the missing step first<br>• Check workflow status<br>• Review the three-step process                                            |
| E206 | INVALID_STEP            | Invalid step in sequence        | • Steps must be sequential<br>• Current step should be previous + 1<br>• Can't skip or repeat steps                                        |
| E207 | DISCOVERY_SKIPPED       | Discovery phase was skipped     | • Call discover_techniques first<br>• Discovery provides technique recommendations<br>• Example: `discover_techniques({ problem: "..." })` |
| E208 | PLANNING_SKIPPED        | Planning phase was skipped      | • Call plan_thinking_session after discovery<br>• Planning creates structured workflow<br>• Use recommended techniques                     |
| E209 | UNAUTHORIZED_TECHNIQUE  | Using non-recommended technique | • Use techniques from discovery phase<br>• Run discovery for new recommendations<br>• Techniques should match problem type                 |
| E210 | WORKFLOW_BYPASS_ATTEMPT | Attempting to bypass workflow   | • Follow three-step workflow<br>• Each phase builds on previous<br>• Start with discover_techniques                                        |

### State Errors (E300-E399)

| Code | Name              | Description              | Recovery Steps                                                                                                    |
| ---- | ----------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| E301 | SESSION_NOT_FOUND | Session doesn't exist    | • Start new session with plan_thinking_session<br>• Check your sessionId parameter<br>• Sessions may have expired |
| E302 | SESSION_EXPIRED   | Session has expired      | • Create a new session<br>• Sessions expire after 1 hour<br>• Save work regularly                                 |
| E303 | INVALID_STATE     | Invalid session state    | • Session may be corrupted<br>• Create a new session<br>• Check for concurrent modifications                      |
| E304 | STATE_TRANSITION  | Invalid state transition | • Follow proper state sequence<br>• Can't go backwards in workflow<br>• Reset if needed                           |
| E305 | SESSION_LOCKED    | Session is locked        | • Wait for current operation to complete<br>• Avoid concurrent requests<br>• Check for hanging operations         |

### System Errors (E400-E499)

| Code | Name              | Description                 | Recovery Steps                                                                        |
| ---- | ----------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| E401 | FILE_IO_ERROR     | File system error           | • Check file permissions<br>• Verify path exists<br>• Ensure sufficient disk space    |
| E402 | MEMORY_ERROR      | Memory limit exceeded       | • Reduce session size<br>• Clear old sessions<br>• Increase memory limits             |
| E403 | PERSISTENCE_ERROR | Storage error               | • Check storage configuration<br>• Use memory-only mode<br>• Verify write permissions |
| E404 | NETWORK_ERROR     | Network communication error | • Check network connectivity<br>• Retry after a moment<br>• Verify server is running  |
| E405 | TIMEOUT           | Operation timeout           | • Retry the operation<br>• Break into smaller steps<br>• Check server resources       |

### Permission Errors (E500-E599)

| Code | Name           | Description         | Recovery Steps                                                                     |
| ---- | -------------- | ------------------- | ---------------------------------------------------------------------------------- |
| E501 | ACCESS_DENIED  | Access denied       | • Check authentication<br>• Verify permissions<br>• Contact administrator          |
| E502 | RATE_LIMIT     | Rate limit exceeded | • Wait before retrying<br>• Reduce request frequency<br>• Check rate limit headers |
| E503 | QUOTA_EXCEEDED | Quota exceeded      | • Check usage limits<br>• Upgrade plan if needed<br>• Clear old data               |

### Configuration Errors (E600-E699)

| Code | Name            | Description            | Recovery Steps                                                                                    |
| ---- | --------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| E601 | MISSING_CONFIG  | Missing configuration  | • Provide required configuration<br>• Check environment variables<br>• Review setup documentation |
| E602 | INVALID_CONFIG  | Invalid configuration  | • Verify configuration format<br>• Check for typos<br>• Use configuration examples                |
| E603 | CONFIG_CONFLICT | Configuration conflict | • Resolve conflicting settings<br>• Check precedence rules<br>• Use consistent values             |

### Technique Errors (E700-E799)

| Code | Name                    | Description                   | Recovery Steps                                                                                          |
| ---- | ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| E701 | TECHNIQUE_FAILED        | Technique execution failed    | • Check technique parameters<br>• Verify input format<br>• Review technique requirements                |
| E702 | DEPENDENCY_MISSING      | Technique dependency missing  | • Complete required technique first<br>• Check technique prerequisites<br>• Follow recommended sequence |
| E703 | TECHNIQUE_NOT_FOUND     | Technique not available       | • Use supported techniques only<br>• Check technique spelling<br>• Call discover_techniques             |
| E704 | TECHNIQUE_MISCONFIGURED | Technique configuration error | • Verify technique settings<br>• Check parameter types<br>• Use default configuration                   |

### Convergence Errors (E800-E899)

| Code | Name               | Description                | Recovery Steps                                                                           |
| ---- | ------------------ | -------------------------- | ---------------------------------------------------------------------------------------- |
| E801 | PARALLEL_EXECUTION | Parallel execution error   | • Check failed parallel tasks<br>• Retry failed operations<br>• Consider sequential mode |
| E802 | CONVERGENCE_FAILED | Convergence failure        | • Review partial results<br>• Retry failed branches<br>• Check dependencies              |
| E803 | DEPENDENCY_NOT_MET | Dependencies not satisfied | • Complete dependencies first<br>• Check execution order<br>• Verify all prerequisites   |

### Unknown Error (E999)

| Code | Name          | Description      | Recovery Steps                                                             |
| ---- | ------------- | ---------------- | -------------------------------------------------------------------------- |
| E999 | UNKNOWN_ERROR | Unexpected error | • Check error details<br>• Review request format<br>• Report if persistent |

## Common Scenarios and Solutions

### Scenario 1: Starting a New Workflow

```
Error: E201 - Workflow order violation
Solution: Always start with discover_techniques, then plan_thinking_session, then execute_thinking_step
```

### Scenario 2: Session Expired During Work

```
Error: E302 - Session expired
Solution: Create a new plan and session, optionally saving your previous work
```

### Scenario 3: Wrong Technique in Execution

```
Error: E204 - Technique mismatch
Solution: Use the exact technique specified in your plan, or create a new plan
```

### Scenario 4: Invalid Input Format

```
Error: E102 - Invalid field type
Solution: Ensure techniques is an array, not a string: ["six_hats"] not "six_hats"
```

## Best Practices

1. **Always follow the three-step workflow**: discover → plan → execute
2. **Save your planId and sessionId**: You'll need them for subsequent calls
3. **Check error recovery steps**: Each error provides specific guidance
4. **Use discover_techniques**: Get personalized technique recommendations
5. **Validate inputs**: Ensure JSON is properly formatted before sending

## Error Handling Example

```javascript
try {
  const result = await executeThinkingStep(params);
  if (result.isError) {
    const error = JSON.parse(result.content[0].text);
    console.error(`Error ${error.error.code}: ${error.error.message}`);
    console.log('Recovery steps:', error.error.recovery);
    // Follow recovery steps...
  }
} catch (e) {
  // Handle network or other errors
  console.error('Request failed:', e);
}
```
