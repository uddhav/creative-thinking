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
- **Anthropic format is the standard**: Always use `tool_use`/`tool_result` format for parallel tool
  calls

### MCP Protocol Limitations

**CRITICAL**: The MCP (Model Context Protocol) has strict requirements that must be followed:

1. **NO PARALLEL TOOL CALLS AT SERVER LEVEL** - MCP expects single tool calls only
   - Server receives: `{method: "tools/call", params: {name: string, arguments: object}}`
   - NOT arrays like: `[{name: ..., arguments: ...}, ...]`
2. **Error Message Delivery** - The server properly logs and returns error messages
   - All errors are logged to stderr with timestamps and context
   - Error responses include `isError: true` flag for client handling
3. **Standard Compliance** - This server strictly follows MCP protocol
   - No vendor-specific extensions or formats
   - Single tool call per request only
   - Parallel execution happens at client level, not server level

If you see "Claude's response was interrupted" errors, this typically means the client is sending
array-formatted requests that violate MCP protocol. The server will reject these with a clear error
message explaining the issue.

### Claude-Specific Instructions

When working with this codebase:

1. **ALWAYS run `npm run build` before committing** - The dist/ folder must be updated
2. **Use stderr for all output** - stdout is reserved for JSON-RPC protocol
3. **Follow the three-tool constraint** - Never add new tools beyond the three core ones
4. **Run tasks with subagents** to preserve main agent context
5. **Check CONTRIBUTING.md** for detailed architecture and guidelines
6. **Use Anthropic format for all parallel tool calls** - Set
   `CREATIVE_THINKING_RESPONSE_FORMAT=anthropic`

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
