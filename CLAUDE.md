# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

This is a **Creative Thinking MCP Server** implementing a three-layer tool architecture for
structured problem-solving. The server provides twenty-four enhanced thinking techniques through a
unified framework that combines generative creativity with systematic risk assessment and analytical
verification.

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
- **24 thinking techniques** with specific step counts (including 3 analytical verification
  techniques)
- **Unified framework**: All techniques support risk/adversarial fields
- **Sequential execution**: Server implements sequential-only execution for maximum coherence
- **Session resilience**: Base64 encoding allows sessions to survive server restarts

### Sequential Execution Architecture

The server implements a sequential execution model:

1. **Planning Phase** - Server creates structured workflows
   - Analyzes problem and selects appropriate techniques
   - Creates clear step progression through techniques
   - Provides guidance for each step in sequence
   - Maintains context throughout thinking process

2. **Sequential Execution** - Steps build progressively
   - Each step builds on previous insights
   - Natural flow of creative thinking
   - Full exploration of each technique
   - Path dependencies tracked throughout

3. **Stateless Step Processing** - Server handles each step
   - SessionManager maintains full context
   - Session state preserved between steps
   - Base64 encoded sessions can survive server restarts
   - 24-hour expiry window for encoded sessions

### Claude-Specific Instructions

When working with this codebase:

1. **ALWAYS run `npm run build` before committing** - The dist/ folder must be updated
2. **Use stderr for all output** - stdout is reserved for JSON-RPC protocol
3. **Follow the three-tool constraint** - Never add new tools beyond the three core ones
4. **Run tasks with subagents** to preserve main agent context
5. **Check CONTRIBUTING.md** for detailed architecture and guidelines
6. **Understand sequential flow** - Steps execute in order for maximum coherence

### Technique Step Counts Reference (24 Total)

**Creative Techniques:**

- Six Hats: 6 steps (one per thinking hat)
- PO: 4 steps (provocation → exploration → verification → solution)
- Random Entry: 3 steps (stimulus → connections → validation)
- SCAMPER: 8 steps (one per transformation action including parameterize)
- Concept Extraction: 4 steps (identify → extract → abstract → apply)
- Yes, And: 4 steps (accept → build → evaluate → integrate)
- Design Thinking: 5 steps (empathize → define → ideate → prototype → test)
- TRIZ: 4 steps (identify → remove → apply → minimize)
- Disney Method: 3 steps (dreamer → realist → critic)
- Nine Windows: 9 steps (3×3 matrix: past/present/future × sub-system/system/super-system)

**Advanced Techniques:**

- Neural State: 4 steps (assess → identify suppression → develop rhythm → integrate)
- Temporal Work: 5 steps (map landscape → circadian alignment → pressure transformation → async-sync
  balance → escape routes)
- Cross-Cultural: 5 steps (map landscape → identify touchpoints → build bridges → synthesize
  respectfully → implement adaptively)
- Collective Intelligence: 5 steps (identify sources → gather wisdom → find patterns → create
  synergy → synthesize insight)
- Quantum Superposition: 6 steps (state generation → interference mapping → entanglement analysis →
  amplitude evolution → measurement context → state collapse)
- Temporal Creativity: 6 steps (archaeological analysis → present synthesis → future projection →
  option creation → cyclical refinement → path integration)
- Paradoxical Problem Solving: 5 steps (identify contradiction → explore paradox → synthesize unity
  → generate novel solutions → transcend paradox)
- Meta-Learning: 5 steps (pattern recognition → learning accumulation → strategy evolution →
  feedback integration → meta-synthesis)
- Biomimetic Path Management: 6 steps (immune response → evolutionary variation → ecosystem dynamics
  → swarm intelligence → resilience patterns → natural synthesis)
- First Principles: 5 steps (deconstruct → foundation identification → assumption challenging →
  reconstruction → solution synthesis)
- NeuroComputational: 6 steps (neural mapping → pattern generation → interference analysis →
  computational synthesis → optimization cycles → convergence)

**Analytical Verification Techniques (NEW):**

- Criteria-Based Analysis: 5 steps (baseline assessment → cognitive criteria → motivational analysis
  → reality monitoring → validity synthesis)
- Linguistic Forensics: 6 steps (content mapping → pattern recognition → pronoun analysis →
  complexity assessment → emotional profiling → coherence verification)
- Competing Hypotheses: 8 steps (hypothesis generation → evidence mapping → matrix construction →
  diagnostic assessment → deception modeling → Bayesian update → sensitivity analysis → decision
  synthesis)

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
