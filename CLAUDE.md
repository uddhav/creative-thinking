# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

Creative Thinking MCP Server — a three-layer tool architecture for structured problem-solving.
Provides 28 thinking techniques through a unified framework combining generative creativity with
systematic risk assessment, analytical verification, and behavioral economics insights. Supports
persona-driven sessions and multi-persona debates.

## Commands

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript (MUST run before committing — dist/ is checked in)
npm run test:run         # Run all tests once
npm test                 # Run tests in watch mode
npm run test:coverage    # Run tests with V8 coverage report
npm run lint             # ESLint check (--max-warnings 0)
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all src files
npm run format:check     # Prettier check without writing
npm run typecheck        # TypeScript type check without emitting
npm run dev              # TypeScript watch mode for development
npm run check:all        # Lint + Build + Test (quiet output)
```

### Running a Single Test

```bash
npx vitest run src/__tests__/techniques/SixHatsHandler.test.ts    # Single file
npx vitest run --testNamePattern "should handle normal"            # By test name
npx vitest run src/__tests__/core/                                 # Directory
```

### Pre-Commit Requirements

1. `npm run build` — dist/ folder must be updated and committed with src changes
2. `npm run test:run` — all tests must pass
3. `npm run lint` — zero warnings allowed

A pre-push hook blocks pushes when dist/ is out of sync with src/.

## Architecture

### Hard Constraint: Three Tools Only

The MCP server exposes **exactly three tools** — no more, no less:

- `discover_techniques` — Analyzes problems, recommends techniques (Discovery layer)
- `plan_thinking_session` — Creates structured workflows with step sequences (Planning layer)
- `execute_thinking_step` — Executes individual steps with state management (Execution layer)

All new functionality must be integrated into these three tools. This constraint is non-negotiable.

### Source Layout

```
src/
├── index.ts                  # LateralThinkingServer class + MCP server init
├── core/                     # SessionManager, MemoryManager, ResponseBuilder, validation
│   └── session/              # SessionEncoder, PlanManager, SessionCleaner, SessionLock
├── layers/
│   ├── discovery.ts          # Discovery layer + discovery/ subfolder (ProblemAnalyzer, TechniqueScorer)
│   ├── planning.ts           # Planning layer + planning/ subfolder (ExecutionGraphGenerator)
│   └── execution.ts          # Execution layer + execution/ subfolder (validators, orchestrators)
├── techniques/
│   ├── BaseTechniqueHandler.ts   # Abstract base class all handlers extend
│   ├── TechniqueRegistry.ts      # Singleton registry — imports and registers all 28 handlers
│   └── [TechniqueName]Handler.ts # One file per technique
├── personas/                 # Persona system for personality-driven sessions
│   ├── types.ts              # PersonaDefinition, DebateConfig, PersonaStepContext
│   ├── catalog.ts            # BUILTIN_PERSONAS (8 built-in) + external JSON loading
│   ├── PersonaResolver.ts    # String → PersonaDefinition resolution (built-in, custom:, external)
│   ├── PersonaGuidanceInjector.ts # Injects persona voice into technique step guidance
│   ├── DebateOrchestrator.ts # Creates per-persona parallel plans + synthesis plan
│   └── DebateSynthesizer.ts  # Structures debate outcomes: agreements, disagreements, blind spots
├── types/
│   ├── index.ts              # LateralTechnique union type, SessionData, ALL_LATERAL_TECHNIQUES
│   └── planning.ts           # Input/output types for the three-layer workflow
├── server/
│   ├── ToolDefinitions.ts    # MCP tool JSON schemas for all three tools
│   └── PromptsHandler.ts     # 9 MCP prompts for guided sessions
├── ergodicity/               # Path dependency tracking, early warning system, escape protocols
├── persistence/              # Adapter pattern: filesystem (default) and PostgreSQL backends
├── errors/                   # ErrorFactory, ErrorContextBuilder, typed error classes
├── sampling/                 # MCP Sampling integration for AI-enhanced features
├── complexity/               # NLP-based complexity analysis
├── nlp/                      # Natural language processing service
├── reality/                  # Reality gradient assessment
├── telemetry/                # Opt-in anonymous analytics
├── export/                   # Session export (JSON, CSV, Markdown)
└── utils/                    # VisualFormatter, logging, crypto helpers
```

### Key Patterns

**Technique Handler Pattern**: Every technique implements `BaseTechniqueHandler`:

- `getTechniqueInfo()` — name, emoji, totalSteps, description
- `getStepInfo(step)` — step name, focus, emoji
- `getStepGuidance(step, problem)` — detailed prompt guidance per step
- `validateStep(step, data)` — technique-specific validation
- `extractInsights(history)` — insight extraction from session history

Registered via `TechniqueRegistry.registerHandlers()` (singleton).

**Execution Flow**: `LateralThinkingServer` (src/index.ts) delegates to layer modules:

- Discovery: `src/layers/discovery.ts` → `ProblemAnalyzer` + `TechniqueScorer` +
  `TechniqueRecommender`
- Planning: `src/layers/planning.ts` → `ExecutionGraphGenerator` creates DAGs
- Execution: `src/layers/execution.ts` → `ExecutionValidator` → `ErgodicityOrchestrator` →
  `ExecutionResponseBuilder`

**Session Management**: `SessionManager` coordinates 9 sub-components (encoder, cleaner,
persistence, metrics, lock, plan manager, etc.). Base64-encoded sessions survive server restarts
with 24-hour TTL. Memory threshold at 80% heap triggers GC.

**MCP Protocol**: stdout is reserved for JSON-RPC only. All visual/debug output goes to stderr.
ESLint rules enforce this.

### Persona System

The persona system enables personality-driven thinking sessions and multi-persona debates. It flows
through the existing three tools via optional parameters — no 4th tool.

**How it works:**

- `discover_techniques` accepts `persona` (single) or `personas` (array for debate). The persona's
  `techniqueBias` boosts relevant techniques in scoring. The persona's `preferredOutcome` overrides
  the default unless an explicit `preferredOutcome` is provided.
- `plan_thinking_session` accepts `persona`/`personas` + `debateFormat`. For single persona,
  `PersonaGuidanceInjector` prepends persona context to each step's guidance. For multiple personas,
  `DebateOrchestrator` creates parallel per-persona plans + a synthesis plan using
  `competing_hypotheses`.
- `execute_thinking_step` accepts `persona` to identify which persona is speaking during debate.

**Built-in personas** (8): `rory_sutherland`, `rich_hickey`, `joe_armstrong`, `tarantino`,
`security_engineer`, `veritasium`, `design_thinker`, `nassim_taleb`. Each has `techniqueBias`,
`keyPrinciples`, `challengeQuestions`, `evaluationCriteria`, and `thinkingStyle` with strengths and
blind spots.

**Custom personas**: `custom:Security-minded Rust engineer` — dynamically generated via keyword
analysis from NLPService.

**External personas**: `PERSONA_CATALOG_PATH` env var points to a JSON file that merges with
built-in catalog. Same ID overrides built-in.

**Debate mode**: LLM-orchestrated (not server-driven). Server provides structure via
`DebateOrchestrator` (parallel plans + coordination strategy), LLM executes each persona's steps
sequentially, then runs synthesis steps. `DebateSynthesizer` formats outcomes.

### Type System

The `LateralTechnique` union type in `src/types/index.ts` defines all 28 valid technique
identifiers. When adding a technique, this type and the `ALL_LATERAL_TECHNIQUES` array must both be
updated.

### Error Handling

Error code ranges: E100 (validation), E200 (workflow), E300 (state), E400 (system), E500
(permission), E600 (config), E700 (technique). All errors include recovery guidance. Use
`ErrorFactory` to create, `ErrorContextBuilder` to enrich.

## Adding a New Technique

Comprehensive checklist in [CONTRIBUTING.md](./CONTRIBUTING.md) — the key touchpoints:

1. **Type union**: `src/types/index.ts` — add to `LateralTechnique` and `ALL_LATERAL_TECHNIQUES`
2. **Persistence type**: `src/persistence/types.ts` — add to `TechniqueType`
3. **Handler**: `src/techniques/[Name]Handler.ts` extending `BaseTechniqueHandler`
4. **Registry**: `src/techniques/TechniqueRegistry.ts` — import and register
5. **Planning integration**: `src/layers/planning.ts` — `getExpectedOutputs()`,
   `getExpectedOutputForStep()`
6. **Session tracking**: `src/core/session/SessionCompletionTracker.ts` — `techniqueStepCounts`
7. **Ergodicity**: `src/ergodicity/index.ts` and `src/ergodicity/pathMemory.ts` — step maps
8. **Visual**: `src/utils/VisualFormatter.ts` — `techniqueEmojis`
9. **Recommender**: `src/layers/discovery/TechniqueRecommender.ts`
10. **Tool schema enum**: `src/server/ToolDefinitions.ts` — add to `plan_thinking_session` technique
    enum
11. **Tests**: `src/__tests__/techniques/[Name]Handler.test.ts`

For ACTION steps (vs THINKING steps), define `ReflexiveEffects` with triggers, realityChanges,
futureConstraints, and reversibility level. See CONTRIBUTING.md for details.

## Adding a New Persona

1. **Definition**: `src/personas/catalog.ts` — add to `BUILTIN_PERSONAS` with full
   `PersonaDefinition` (id, name, tagline, perspective, techniqueBias, preferredOutcome,
   keyPrinciples, evaluationCriteria, challengeQuestions, thinkingStyle)
2. **Tests**: `src/__tests__/personas/catalog.test.ts` — auto-validates all fields via iteration
3. **Prompt** (optional): `src/server/PromptsHandler.ts` — add a prompt shortcut if warranted

## Tests

2,400+ tests across 158 files using Vitest. 10-second timeout per test. Coverage target >80%.

```
src/__tests__/
├── integration/    # MCP protocol compliance, full workflows, persistence, performance
├── core/           # SessionManager, MemoryManager, validation
├── techniques/     # Individual handler tests (one per technique)
├── personas/       # Catalog validation, PersonaResolver, GuidanceInjector, Debate, discovery integration
├── ergodicity/     # Path tracking, early warning, escalation
├── errors/         # Error handling and recovery
├── layers/         # Discovery and planning layer tests
├── server/         # Tool definition and prompt handler tests
└── helpers/        # Shared test utilities
```

Tests auto-build before running (`pretest` script runs `npm run build`).

## Important Constraints

- **dist/ is checked in** — required for `npx github:uddhav/creative-thinking` distribution
- **Sequential execution only** — steps execute in order for coherence (no parallel execution)
- **Conventional Commits** required — `fix:` (patch), `feat:` (minor), `feat!:` (major)
- **Never log to stdout** — it breaks MCP protocol
- **Never add a 4th tool** — all functionality fits within the three-tool workflow
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless explicitly requested
