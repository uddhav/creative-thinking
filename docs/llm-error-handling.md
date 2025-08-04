# LLM Error Handling Guide

This guide is specifically designed for Language Model developers who are integrating with the
Creative Thinking MCP Server. It explains how to programmatically handle errors, implement automatic
recovery, and build resilient LLM applications.

## Table of Contents

1. [Overview](#overview)
2. [Error Response Format](#error-response-format)
3. [Parsing Enhanced Errors](#parsing-enhanced-errors)
4. [Automatic Recovery Patterns](#automatic-recovery-patterns)
5. [Error Code Reference](#error-code-reference)
6. [Implementation Examples](#implementation-examples)
7. [Best Practices](#best-practices)
8. [Testing Error Handling](#testing-error-handling)

## Overview

The Creative Thinking MCP Server uses an enhanced error system designed specifically to help LLMs:

- Parse structured error responses programmatically
- Follow recovery steps automatically
- Implement retry logic with exponential backoff
- Maintain conversation context during error recovery
- Learn from errors to prevent future occurrences

Key features for LLMs:

- Consistent JSON error format
- Machine-readable error codes
- Ordered recovery steps
- Retry timing information
- Context preservation fields

## Error Response Format

All errors follow this consistent JSON structure:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{...stringified JSON...}"
    }
  ],
  "isError": true
}
```

The stringified JSON contains:

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
    "documentation": "https://docs.creative-thinking.dev/errors#state",
    "retryable": false,
    "timestamp": 1701234567890
  },
  "recovery": {
    "steps": [...],
    "canRetry": false,
    "retryDelay": null
  },
  "llmGuidance": "Error: Session 'abc123' not found..."
}
```

## Parsing Enhanced Errors

### Python Example

```python
import json
from typing import Dict, List, Optional, Any

class MCPErrorHandler:
    def parse_error_response(self, response: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse MCP error response and extract error details."""
        if not response.get("isError"):
            return None

        # Extract the stringified JSON from content
        content = response.get("content", [])
        if not content or content[0].get("type") != "text":
            return None

        try:
            error_data = json.loads(content[0]["text"])
            return error_data
        except json.JSONDecodeError:
            return None

    def get_error_code(self, error_data: Dict[str, Any]) -> str:
        """Extract error code from parsed error data."""
        return error_data.get("error", {}).get("code", "UNKNOWN")

    def get_recovery_steps(self, error_data: Dict[str, Any]) -> List[str]:
        """Extract ordered recovery steps."""
        return error_data.get("error", {}).get("recovery", [])

    def is_retryable(self, error_data: Dict[str, Any]) -> bool:
        """Check if error is retryable."""
        return error_data.get("recovery", {}).get("canRetry", False)

    def get_retry_delay(self, error_data: Dict[str, Any]) -> Optional[int]:
        """Get retry delay in milliseconds."""
        return error_data.get("recovery", {}).get("retryDelay")
```

### TypeScript Example

```typescript
interface MCPErrorResponse {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
}

interface ParsedError {
  error: {
    code: string;
    message: string;
    category: string;
    severity: string;
    recovery: string[];
    context?: Record<string, any>;
    retryable?: boolean;
    timestamp: number;
  };
  recovery: {
    steps: string[];
    canRetry: boolean;
    retryDelay?: number;
  };
  llmGuidance: string;
}

class MCPErrorHandler {
  parseErrorResponse(response: MCPErrorResponse): ParsedError | null {
    if (!response.isError) return null;

    const content = response.content?.[0];
    if (!content || content.type !== 'text') return null;

    try {
      return JSON.parse(content.text) as ParsedError;
    } catch {
      return null;
    }
  }

  async handleError(error: ParsedError): Promise<any> {
    const errorCode = error.error.code;
    const recovery = error.error.recovery;

    // Implement automatic recovery based on error code
    switch (errorCode) {
      case 'E201': // Session not found
        return this.createNewSession();

      case 'E001': // Wrong tool order
        return this.startFromDiscovery();

      case 'E403': // Persistence error (retryable)
        if (error.recovery.canRetry) {
          await this.delay(error.recovery.retryDelay || 1000);
          return this.retryLastOperation();
        }
        break;
    }

    // Fall back to first recovery suggestion
    return this.executeRecoveryStep(recovery[0]);
  }
}
```

## Automatic Recovery Patterns

### 1. Workflow Recovery Pattern

When encountering workflow errors, automatically restart from the correct step:

```python
class WorkflowRecovery:
    def __init__(self, mcp_client):
        self.client = mcp_client
        self.workflow_state = {}

    async def handle_workflow_error(self, error_data):
        error_code = error_data["error"]["code"]

        if error_code == "E001":  # Wrong tool order
            # Start from discovery
            return await self.start_workflow()

        elif error_code == "E201":  # Session not found
            # Check if we have a planId
            if self.workflow_state.get("planId"):
                # Create new session with existing plan
                return await self.resume_with_plan()
            else:
                # Start fresh
                return await self.start_workflow()

        elif error_code == "E003":  # Technique mismatch
            # Use the correct technique from plan
            context = error_data["error"]["context"]
            correct_technique = context["planTechnique"]
            return await self.execute_with_technique(correct_technique)

    async def start_workflow(self):
        # Step 1: Discovery
        discovery = await self.client.discover_techniques({
            "problem": self.workflow_state["problem"],
            "preferredOutcome": "innovative"
        })

        # Step 2: Planning
        plan = await self.client.plan_thinking_session({
            "problem": self.workflow_state["problem"],
            "techniques": discovery["recommendations"][0]["technique"]
        })

        self.workflow_state["planId"] = plan["planId"]

        # Step 3: Execution
        return await self.execute_step(1)
```

### 2. Retry Pattern with Exponential Backoff

```python
import asyncio
import random

class RetryHandler:
    def __init__(self, max_attempts=3, max_delay=30000):
        self.max_attempts = max_attempts
        self.max_delay = max_delay

    async def execute_with_retry(self, operation, *args, **kwargs):
        last_error = None

        for attempt in range(1, self.max_attempts + 1):
            try:
                return await operation(*args, **kwargs)
            except MCPError as e:
                last_error = e
                error_data = self.parse_error(e)

                if not error_data.get("recovery", {}).get("canRetry"):
                    raise

                if attempt < self.max_attempts:
                    # Calculate delay with jitter
                    base_delay = error_data["recovery"].get("retryDelay", 1000)
                    delay = min(
                        base_delay * (2 ** (attempt - 1)),
                        self.max_delay
                    )
                    jitter = random.uniform(0.8, 1.2)
                    actual_delay = delay * jitter / 1000  # Convert to seconds

                    await asyncio.sleep(actual_delay)

        raise last_error
```

### 3. Context Preservation Pattern

Maintain context across error recovery:

```python
class ContextPreservingErrorHandler:
    def __init__(self):
        self.context_stack = []
        self.session_states = {}

    def save_context(self, operation_type, params):
        """Save context before operations that might fail."""
        self.context_stack.append({
            "operation": operation_type,
            "params": params,
            "timestamp": time.time()
        })

    def restore_context(self, error_code):
        """Restore appropriate context based on error."""
        if error_code in ["E201", "E202"]:  # Session/Plan not found
            # Find last successful session operation
            for ctx in reversed(self.context_stack):
                if ctx["operation"] in ["plan_thinking_session", "execute_thinking_step"]:
                    return ctx["params"]

        return self.context_stack[-1]["params"] if self.context_stack else {}

    async def handle_with_context(self, operation, params):
        self.save_context(operation.__name__, params)

        try:
            result = await operation(**params)
            # Save successful session state
            if "sessionId" in result:
                self.session_states[result["sessionId"]] = {
                    "params": params,
                    "result": result
                }
            return result
        except MCPError as e:
            error_data = self.parse_error(e)
            error_code = error_data["error"]["code"]

            # Restore context and retry with modifications
            restored_params = self.restore_context(error_code)

            # Modify params based on error
            if error_code == "E201":  # Session not found
                restored_params.pop("sessionId", None)  # Let system create new

            return await self.recover_with_context(operation, restored_params, error_data)
```

## Error Code Reference

### Quick Reference Table

| Code | Category   | Description       | Auto-Recovery Action           |
| ---- | ---------- | ----------------- | ------------------------------ |
| E001 | workflow   | Wrong tool order  | Start with discover_techniques |
| E101 | validation | Missing field     | Add required field             |
| E102 | validation | Invalid type      | Convert to correct type        |
| E103 | validation | Invalid technique | Use valid technique            |
| E201 | state      | Session not found | Create new session             |
| E202 | state      | Plan not found    | Create new plan                |
| E301 | system     | File I/O error    | Retry with delay               |
| E403 | system     | Persistence error | Use in-memory fallback         |

### Error Code Patterns

```python
ERROR_CODE_ACTIONS = {
    # Workflow errors (E0xx) - restart workflow
    "E001": "start_from_discovery",
    "E002": "create_plan",
    "E003": "use_correct_technique",

    # Validation errors (E1xx) - fix input
    "E101": "add_missing_field",
    "E102": "fix_field_type",
    "E103": "use_valid_technique",

    # State errors (E2xx) - recreate state
    "E201": "create_new_session",
    "E202": "create_new_plan",
    "E203": "check_workflow_state",

    # System errors (E3xx, E4xx) - retry or fallback
    "E301": "retry_with_backoff",
    "E303": "retry_network_operation",
    "E403": "use_memory_storage",

    # Convergence errors (E6xx, E8xx) - sequential fallback
    "E601": "use_sequential_mode",
    "E801": "retry_failed_parallel",
}

def get_recovery_action(error_code: str) -> str:
    # Get specific action or generic based on pattern
    if error_code in ERROR_CODE_ACTIONS:
        return ERROR_CODE_ACTIONS[error_code]

    # Pattern-based fallbacks
    if error_code.startswith("E0"):
        return "restart_workflow"
    elif error_code.startswith("E1"):
        return "validate_input"
    elif error_code.startswith("E2"):
        return "recreate_state"
    elif error_code.startswith("E3") or error_code.startswith("E4"):
        return "retry_operation"

    return "follow_recovery_steps"
```

## Implementation Examples

### Complete LLM Error Handler

```python
class CreativeThinkingLLMClient:
    def __init__(self, mcp_client):
        self.client = mcp_client
        self.error_handler = MCPErrorHandler()
        self.retry_handler = RetryHandler()
        self.context_handler = ContextPreservingErrorHandler()
        self.workflow_state = {}

    async def think_creatively(self, problem: str, technique: str = None):
        """High-level method with automatic error handling."""
        self.workflow_state["problem"] = problem

        try:
            # Step 1: Discovery (with error handling)
            discovery = await self._discover_with_recovery(problem)

            # Step 2: Planning (with error handling)
            techniques = [technique] if technique else [discovery["recommendations"][0]["technique"]]
            plan = await self._plan_with_recovery(problem, techniques)

            # Step 3: Execution (with error handling)
            results = await self._execute_with_recovery(plan)

            return results

        except Exception as e:
            # Last resort: log and return error summary
            return self._create_error_summary(e)

    async def _discover_with_recovery(self, problem: str):
        """Execute discovery with automatic error recovery."""
        async def discover():
            return await self.client.discover_techniques({
                "problem": problem,
                "preferredOutcome": "innovative"
            })

        return await self.retry_handler.execute_with_retry(discover)

    async def _plan_with_recovery(self, problem: str, techniques: List[str]):
        """Execute planning with automatic error recovery."""
        async def plan():
            try:
                return await self.client.plan_thinking_session({
                    "problem": problem,
                    "techniques": techniques,
                    "timeframe": "thorough"
                })
            except Exception as e:
                error_data = self.error_handler.parse_error_response(e.response)
                if error_data and error_data["error"]["code"] == "E001":
                    # Wrong tool order - need to discover first
                    await self._discover_with_recovery(problem)
                    # Retry planning
                    return await self.client.plan_thinking_session({
                        "problem": problem,
                        "techniques": techniques,
                        "timeframe": "thorough"
                    })
                raise

        return await self.retry_handler.execute_with_retry(plan)

    async def _execute_with_recovery(self, plan: Dict[str, Any]):
        """Execute thinking steps with automatic error recovery."""
        results = []
        current_step = 1
        session_id = None

        while current_step <= plan["totalSteps"]:
            try:
                result = await self._execute_single_step(
                    plan["planId"],
                    plan["techniques"][0],
                    plan["problem"],
                    current_step,
                    plan["totalSteps"],
                    session_id
                )

                results.append(result)
                session_id = result.get("sessionId", session_id)

                if not result.get("nextStepNeeded", True):
                    break

                current_step += 1

            except Exception as e:
                error_data = self.error_handler.parse_error_response(e.response)
                if not error_data:
                    raise

                error_code = error_data["error"]["code"]

                # Handle specific errors
                if error_code == "E201":  # Session not found
                    # Continue without session ID (will create new)
                    session_id = None
                elif error_code == "E303":  # Invalid step
                    # Skip to next valid step
                    current_step += 1
                elif error_code in ["E301", "E403"]:  # System errors
                    # Retry with backoff
                    if error_data["recovery"]["canRetry"]:
                        await asyncio.sleep(error_data["recovery"]["retryDelay"] / 1000)
                        continue
                else:
                    # Follow first recovery suggestion
                    recovery_action = await self._execute_recovery(
                        error_data["error"]["recovery"][0],
                        error_data["error"]["context"]
                    )
                    if recovery_action:
                        continue

                # If we can't recover, add error to results and continue
                results.append({"error": error_data, "step": current_step})
                current_step += 1

        return {
            "results": results,
            "insights": self._extract_insights(results),
            "success": all(not r.get("error") for r in results)
        }
```

### Error Learning Pattern

LLMs can learn from errors to prevent future occurrences:

```python
class ErrorLearningHandler:
    def __init__(self):
        self.error_patterns = {}
        self.successful_recoveries = {}

    def record_error(self, error_code: str, context: Dict[str, Any], recovery_used: str):
        """Record error patterns for learning."""
        key = f"{error_code}:{self._context_key(context)}"

        if key not in self.error_patterns:
            self.error_patterns[key] = {
                "count": 0,
                "contexts": [],
                "recoveries_tried": {}
            }

        self.error_patterns[key]["count"] += 1
        self.error_patterns[key]["contexts"].append(context)
        self.error_patterns[key]["recoveries_tried"][recovery_used] = \
            self.error_patterns[key]["recoveries_tried"].get(recovery_used, 0) + 1

    def record_recovery_success(self, error_code: str, context: Dict[str, Any], recovery: str):
        """Record successful recovery strategies."""
        key = f"{error_code}:{self._context_key(context)}"

        if key not in self.successful_recoveries:
            self.successful_recoveries[key] = {}

        self.successful_recoveries[key][recovery] = \
            self.successful_recoveries[key].get(recovery, 0) + 1

    def get_best_recovery(self, error_code: str, context: Dict[str, Any]) -> Optional[str]:
        """Get the most successful recovery strategy for this error pattern."""
        key = f"{error_code}:{self._context_key(context)}"

        if key in self.successful_recoveries:
            # Return recovery with highest success count
            return max(
                self.successful_recoveries[key].items(),
                key=lambda x: x[1]
            )[0]

        return None

    def should_prevent_operation(self, operation: str, params: Dict[str, Any]) -> Optional[str]:
        """Check if this operation is likely to fail based on history."""
        # Check if similar operations have consistently failed
        for pattern_key, pattern_data in self.error_patterns.items():
            if pattern_data["count"] > 3:  # Repeated failures
                # Check if current operation matches pattern
                if self._matches_pattern(operation, params, pattern_data["contexts"]):
                    return f"This operation has failed {pattern_data['count']} times. Consider alternative approach."

        return None
```

## Best Practices

### 1. Always Parse Errors Properly

```python
# Good
error_data = self.parse_error_response(response)
if error_data:
    error_code = error_data["error"]["code"]
    recovery_steps = error_data["error"]["recovery"]

# Bad - Don't assume error structure
error_code = response["error"]["code"]  # May fail
```

### 2. Respect Retry Delays

```python
# Good
if error_data["recovery"]["canRetry"]:
    delay = error_data["recovery"]["retryDelay"] or 1000
    await asyncio.sleep(delay / 1000)
    return await retry_operation()

# Bad - Immediate retry without delay
return await retry_operation()  # May overwhelm system
```

### 3. Follow Recovery Steps in Order

```python
# Good
recovery_steps = error_data["error"]["recovery"]
for step in recovery_steps:
    try:
        result = await self.execute_recovery_step(step)
        if result["success"]:
            return result
    except:
        continue  # Try next step

# Bad - Only trying first step
return await self.execute_recovery_step(recovery_steps[0])
```

### 4. Preserve Context Across Retries

```python
# Good
class StatefulErrorHandler:
    def __init__(self):
        self.operation_context = {}

    async def execute_with_context(self, operation, params):
        # Save context
        operation_id = str(uuid.uuid4())
        self.operation_context[operation_id] = {
            "params": params.copy(),
            "timestamp": time.time()
        }

        try:
            result = await operation(**params)
            return result
        except MCPError as e:
            # Restore context for retry
            original_params = self.operation_context[operation_id]["params"]
            return await self.retry_with_context(operation, original_params, e)
```

### 5. Handle Cascading Errors

```python
# Good - Prevent error cascades
class CascadePreventionHandler:
    def __init__(self):
        self.recent_errors = []
        self.error_threshold = 5
        self.time_window = 60  # seconds

    def should_circuit_break(self) -> bool:
        """Check if too many errors occurred recently."""
        current_time = time.time()
        # Remove old errors
        self.recent_errors = [
            e for e in self.recent_errors
            if current_time - e["timestamp"] < self.time_window
        ]

        return len(self.recent_errors) >= self.error_threshold

    async def execute_with_circuit_breaker(self, operation, params):
        if self.should_circuit_break():
            raise CircuitBreakerOpen("Too many recent errors. Waiting before retry.")

        try:
            return await operation(**params)
        except MCPError as e:
            self.recent_errors.append({
                "error": e,
                "timestamp": time.time()
            })
            raise
```

## Testing Error Handling

### Unit Testing Error Recovery

```python
import pytest
from unittest.mock import Mock, AsyncMock

class TestErrorRecovery:
    @pytest.mark.asyncio
    async def test_session_not_found_recovery(self):
        # Mock MCP client
        mock_client = Mock()
        mock_client.execute_thinking_step = AsyncMock()

        # First call fails with session not found
        mock_client.execute_thinking_step.side_effect = [
            MCPError({
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "error": {
                            "code": "E201",
                            "message": "Session not found",
                            "recovery": ["Start a new session with discover_techniques"],
                            "category": "state",
                            "severity": "medium"
                        },
                        "recovery": {
                            "canRetry": False
                        }
                    })
                }],
                "isError": True
            }),
            # Second call succeeds with new session
            {"sessionId": "new_session", "output": "Success"}
        ]

        handler = CreativeThinkingLLMClient(mock_client)
        result = await handler._execute_single_step(
            "plan_123", "six_hats", "Test problem", 1, 6, "old_session"
        )

        assert result["sessionId"] == "new_session"
        assert mock_client.execute_thinking_step.call_count == 2
        # Second call should not have old session ID
        second_call_args = mock_client.execute_thinking_step.call_args_list[1]
        assert "sessionId" not in second_call_args[1] or second_call_args[1]["sessionId"] != "old_session"

    @pytest.mark.asyncio
    async def test_retry_with_backoff(self):
        # Test that retry respects delays
        mock_client = Mock()
        error_response = {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": {
                        "code": "E403",
                        "message": "Persistence error",
                        "category": "system",
                        "severity": "high",
                        "retryable": True
                    },
                    "recovery": {
                        "canRetry": True,
                        "retryDelay": 1000
                    }
                })
            }],
            "isError": True
        }

        # Fail twice, succeed on third
        mock_operation = AsyncMock()
        mock_operation.side_effect = [
            MCPError(error_response),
            MCPError(error_response),
            {"success": True}
        ]

        retry_handler = RetryHandler(max_attempts=3)

        start_time = time.time()
        result = await retry_handler.execute_with_retry(mock_operation)
        end_time = time.time()

        assert result["success"] is True
        assert mock_operation.call_count == 3
        # Should have waited at least 2 seconds (1s + 2s with backoff)
        assert end_time - start_time >= 2.0
```

### Integration Testing

```python
class TestErrorIntegration:
    @pytest.mark.asyncio
    async def test_full_workflow_with_errors(self):
        """Test complete workflow with various errors."""
        client = CreativeThinkingLLMClient(real_mcp_client)

        # Test workflow that will encounter errors
        result = await client.think_creatively(
            "How to handle errors gracefully in distributed systems?"
        )

        # Should complete despite errors
        assert result["success"] is True
        assert len(result["results"]) > 0
        assert result["insights"] is not None

        # Check that errors were handled
        error_steps = [r for r in result["results"] if r.get("error")]
        assert len(error_steps) < len(result["results"])  # Some steps succeeded
```

## Advanced Patterns

### Predictive Error Prevention

```python
class PredictiveErrorHandler:
    def __init__(self):
        self.operation_history = deque(maxlen=100)
        self.error_predictor = self._train_predictor()

    def predict_error_probability(self, operation: str, params: Dict) -> float:
        """Predict likelihood of error for given operation."""
        features = self._extract_features(operation, params)
        return self.error_predictor.predict_proba([features])[0][1]

    async def execute_with_prediction(self, operation, params):
        error_prob = self.predict_error_probability(operation.__name__, params)

        if error_prob > 0.7:
            # High error probability - take preventive action
            preventive_params = self._adjust_params_for_success(params, error_prob)
            return await operation(**preventive_params)

        return await operation(**params)
```

### Error Recovery Chains

```python
class RecoveryChain:
    def __init__(self):
        self.recovery_strategies = []

    def add_strategy(self, error_codes: List[str], strategy):
        """Add recovery strategy for specific error codes."""
        self.recovery_strategies.append({
            "codes": error_codes,
            "strategy": strategy
        })
        return self

    async def execute(self, operation, params):
        """Execute with chained recovery strategies."""
        try:
            return await operation(**params)
        except MCPError as e:
            error_data = parse_error(e)
            error_code = error_data["error"]["code"]

            for strategy_config in self.recovery_strategies:
                if error_code in strategy_config["codes"]:
                    recovery_result = await strategy_config["strategy"](
                        error_data, params
                    )
                    if recovery_result["success"]:
                        return recovery_result["result"]

            # No strategy worked
            raise

# Usage
recovery_chain = RecoveryChain()
recovery_chain.add_strategy(
    ["E201", "E202"],  # Session/Plan not found
    create_new_state_strategy
).add_strategy(
    ["E301", "E303", "E403"],  # System errors
    retry_with_backoff_strategy
).add_strategy(
    ["E001", "E002", "E003"],  # Workflow errors
    restart_workflow_strategy
)

result = await recovery_chain.execute(
    client.execute_thinking_step,
    step_params
)
```

## Conclusion

The Creative Thinking MCP Server's enhanced error system is designed to make LLM integration as
smooth as possible. By following the patterns and practices in this guide, you can build resilient
LLM applications that gracefully handle errors and provide a seamless user experience.

Key takeaways:

1. Always parse error responses properly
2. Follow recovery steps in order
3. Respect retry delays and limits
4. Preserve context across retries
5. Learn from errors to prevent future occurrences
6. Test error handling thoroughly

For more examples and the latest updates, see the
[project repository](https://github.com/uddhav/creative-thinking).
