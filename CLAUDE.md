# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

This is a **Creative Thinking MCP Server** implementing a three-layer tool architecture for
structured problem-solving. The server provides fourteen enhanced thinking techniques through a
unified framework that combines generative creativity with systematic risk assessment.

## Quick Reference

For detailed developer documentation, architecture, and contribution guidelines, see
[CONTRIBUTING.md](./CONTRIBUTING.md).

### Essential Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript (ALWAYS run before committing)
npm run test:run     # Run tests once
npm run lint         # Check code style
npm run format       # Run prettier to format all files
```

### Key Architecture Points

- **Three tools only**: `discover_techniques`, `plan_thinking_session`, `execute_thinking_step`
- **Three-layer architecture**: Discovery → Planning → Execution
- **MCP Protocol**: stdout for JSON-RPC only, stderr for visual output
- **14 thinking techniques** with specific step counts
- **Unified framework**: All techniques support risk/adversarial fields
- **DAG-based parallel execution**: Server generates graphs, clients control parallelism
- **Session resilience**: Base64 encoding allows sessions to survive server restarts

### Parallel Execution via DAG Generation

**CRITICAL**: This server generates Directed Acyclic Graphs (DAGs) for client-side parallel
execution:

1. **Client-Side Parallel Execution** - The server generates execution graphs, clients control
   parallelism
   - `plan_thinking_session` returns a DAG with complete parameters for each step
   - Nodes include dependencies to indicate which steps can run in parallel
   - Clients decide whether to execute techniques sequentially or in parallel
   - MCP protocol requires single tool calls - parallelism is achieved through concurrent requests

2. **ExecutionGraphGenerator** - Creates DAGs from workflow plans
   - Analyzes technique dependencies (parallel vs sequential vs hybrid)
   - Calculates parallelizable groups and critical path
   - Provides complete parameters for each `execute_thinking_step` call
   - Returns instructions for the invoker on how to use the DAG

3. **Session Resilience** - Sessions can survive server memory loss
   - Base64 encoded sessions contain all state needed to resume
   - SessionEncoder handles encoding/decoding transparently
   - 24-hour expiry window for encoded sessions
   - Both planIds and sessionIds support encoding

4. **Error Handling** - Enhanced error reporting with context
   - All errors include timestamps and detailed context
   - `isError: true` flag for client-side error detection
   - Detailed error messages with recovery suggestions
   - Proper JSON-RPC error responses for protocol violations

### DAG Structure

When `plan_thinking_session` returns an execution graph, it contains:

```typescript
{
  executionGraph: {
    nodes: [
      {
        id: "node-1",
        stepNumber: 1,
        technique: "six_hats",
        parameters: {
          planId: "plan_abc123",
          technique: "six_hats",
          problem: "...",
          currentStep: 1,
          totalSteps: 6,
          output: "",
          nextStepNeeded: true,
          hatColor: "blue"
        },
        dependencies: [],  // No dependencies - can run immediately
        estimatedDuration: 3000,
        canSkipIfFailed: true
      },
      // ... more nodes
    ],
    metadata: {
      totalNodes: 15,
      maxParallelism: 6,  // Up to 6 steps can run simultaneously
      criticalPath: ["node-1", "node-7", "node-13"],
      parallelizableGroups: [["node-1", "node-2", "node-3"], ["node-7", "node-8"]]
    },
    instructions: {
      forInvoker: "Execute nodes with empty or satisfied dependencies in parallel...",
      executionStrategy: "parallel-capable",
      errorHandling: "continue-on-non-critical-failure"
    }
  }
}
```

Clients use the `dependencies` array to determine execution order and parallelism opportunities.

### Claude-Specific Instructions

When working with this codebase:

1. **ALWAYS run `npm run build` before committing** - The dist/ folder must be updated
2. **Use stderr for all output** - stdout is reserved for JSON-RPC protocol
3. **Follow the three-tool constraint** - Never add new tools beyond the three core ones
4. **Run tasks with subagents** to preserve main agent context
5. **Check CONTRIBUTING.md** for detailed architecture and guidelines
6. **Understand the DAG structure** - Plans return execution graphs for client-side parallelism

### Technique Step Counts Reference

- Six Hats: 6 steps (one per thinking hat)
- PO: 4 steps (provocation → exploration → verification → solution)
- Random Entry: 3 steps (stimulus → connections → validation)
- SCAMPER: 8 steps (one per transformation action including parameterize)
- Concept Extraction: 4 steps (identify → extract → abstract → apply)
- Yes, And: 4 steps (accept → build → evaluate → integrate)
- Design Thinking: 5 steps (empathize → define → ideate → prototype → test)
- TRIZ: 4 steps (identify → remove → apply → minimize)
- Neural State: 4 steps (assess → identify suppression → develop rhythm → integrate)
- Temporal Work: 5 steps (map landscape → circadian alignment → pressure transformation → async-sync
  balance → escape routes)
- Cross-Cultural: 5 steps (map landscape → identify touchpoints → build bridges → synthesize
  respectfully → implement adaptively)
- Collective Intelligence: 5 steps (identify sources → gather wisdom → find patterns → create
  synergy → synthesize insight)
- Disney Method: 3 steps (dreamer → realist → critic)
- Nine Windows: 9 steps (3×3 matrix: past/present/future × sub-system/system/super-system)

### PR Integration Checklist

When reviewing PRs for new techniques:

1. Check planning tool enum at src/index.ts (~line 3631-3640)
2. Check execution tool enum at src/index.ts (~line 3692-3701)
3. Add technique fields to execution tool schema
4. Test through MCP protocol, not just unit tests

### Important Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless explicitly requested
