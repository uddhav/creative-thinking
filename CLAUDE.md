# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

This is a **Creative Thinking MCP Server** implementing a three-layer tool architecture for
structured problem-solving. The server provides sixteen enhanced thinking techniques through a
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
- **16 thinking techniques** with specific step counts
- **Unified framework**: All techniques support risk/adversarial fields
- **Sequential execution**: Server executes techniques step-by-step for depth and coherence
- **Session resilience**: Base64 encoding allows sessions to survive server restarts

### Client-Server Execution Architecture

The server provides execution intelligence while clients control strategy:

1. **DAG Generation (Planning Phase)** - Server analyzes and provides execution graph
   - Each node includes complete parameters for `execute_thinking_step`
   - Dependencies marked as 'hard' (blocking) or 'soft' (preferential)
   - Sync points identified between technique boundaries
   - Time multipliers show relative performance (e.g., "5x" slower if sequential)

2. **Client-Controlled Execution** - Clients decide how to execute
   - Can execute sequentially for simplicity and coherence
   - Can execute in parallel based on dependency information
   - Server handles each step independently as it arrives

3. **Stateless Step Execution** - Each step is independent
   - SessionManager maintains context regardless of execution order
   - No race conditions between parallel steps
   - Base64 encoded sessions can survive server restarts
   - 24-hour expiry window for encoded sessions

### Claude-Specific Instructions

When working with this codebase:

1. **ALWAYS run `npm run build` before committing** - The dist/ folder must be updated
2. **Use stderr for all output** - stdout is reserved for JSON-RPC protocol
3. **Follow the three-tool constraint** - Never add new tools beyond the three core ones
4. **Run tasks with subagents** to preserve main agent context
5. **Check CONTRIBUTING.md** for detailed architecture and guidelines
6. **Understand sequential flow** - Each step must complete before the next begins

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
- Quantum Superposition: 6 steps (state generation → interference mapping → entanglement analysis →
  amplitude evolution → measurement context → state collapse)
- Temporal Creativity: 6 steps (archaeological analysis → present synthesis → future projection →
  option creation → cyclical refinement → path integration)

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
