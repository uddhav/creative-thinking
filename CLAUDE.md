# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

Creative Thinking MCP Server — a three-layer tool architecture for structured problem-solving.
Provides 32 thinking techniques through a unified framework combining generative creativity with
systematic risk assessment, analytical verification, and behavioral economics insights. Supports
persona-driven sessions and multi-persona debates.

The `creative-thinking` package ships **two distinct binaries with different shapes**:

- **`socketes`** (`dist/cli.js`) — a single-turn CLI. Each invocation runs one operation (`discover`
  / `plan` / `execute` / `session`) and exits. State persists between invocations on the local
  filesystem under `PERSISTENCE_PATH` (defaults to `~/.creative-thinking`). This is the preferred
  surface for skill-driven and shell use.
- **`creative-thinking`** (`dist/mcp-server-main.js`) — the long-running stdio MCP server. Speaks
  JSON-RPC over stdin/stdout for an MCP client to drive. Same three tools, same handlers as the CLI
  under the hood — kept for backwards compatibility.

There is no remote / HTTP / SSE transport for either binary.

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

### Running the `socketes` CLI Locally

After `npm run build`, the CLI is at `dist/cli.js`. The CLI does one operation per invocation and
exits — drive it from a skill or shell.

```bash
node dist/cli.js --help                                       # discover what's available
node dist/cli.js discover --problem "..."                      # → JSON on stdout, exit 0
node dist/cli.js plan --problem "..." --techniques six_hats    # → planId persisted to disk
node dist/cli.js execute --plan <planId> --technique six_hats \
    --problem "..." --step 1 --total-steps 7 --output "..." --next-step-needed
node dist/cli.js execute --plan <planId> --technique six_hats \
    --problem "..." --step 7 --total-steps 7 --output "..." --no-next-step-needed
node dist/cli.js session list --status active --limit 20
```

**Number steps within the technique.** A plan of `triz` (4 steps) then `six_hats` (7) numbers the
first hat as `--step 1 --total-steps 7`: each technique counts its own steps, which also keeps
parallel branches independent. Plan-wide numbering (`--step 5 --total-steps 11` for that same hat)
is equally accepted — `--total-steps` is what tells the server which convention you mean, so it must
match the convention `--step` is using. Note the plan response carries the plan-wide count as
`estimatedSteps`; there is no `totalSteps` key on it. Both forms were accepted and neither was
documented, which is how a technique running second in a plan came to report no insights at all.

**`nextStepNeeded` is required on every `execute` call and has no default.** Leave the field unset
and the call fails with `nextStepNeeded must be a boolean` — on any step, not just the last. Pass
`--next-step-needed` while steps remain, and `--no-next-step-needed` on the final step. It is the
**field** that is required, not the flag: `{"nextStepNeeded": true}` on stdin satisfies it with no
flag at all, as does `{"output": "..."}` for the equally-required `output`. A session that never
receives the negated form never completes, and an incomplete session emits no final synthesis.

State on disk under `PERSISTENCE_PATH` (default `~/.creative-thinking`):

- `plans/<planId>.json` — full plan with `techniques` field that the executor needs. The plan store
  mirrors the in-memory `PlanManager` because `ResponseBuilder` strips fields the executor relies
  on; see `src/core/session/planStore.ts`. **Both binaries write and read this.** It began as a CLI
  affordance, which meant the same planId resolved under `socketes` and returned `PLAN_NOT_FOUND`
  under the MCP server after a restart; it was promoted to shared so the two cannot drift again.
  `SessionManager.getPlan` does the disk fallback, so every caller gets it — `WorkflowGuard` reads a
  found plan as proof discovery ran, and hydrating only in `ExecutionValidator` fixed execution
  while the guard still refused the call. Writes are gated on `PERSISTENCE_TYPE` being exactly
  `filesystem` or `postgres` — naming the two adapters rather than excluding `memory`, because
  `getDefaultConfig` throws for anything else and a "not memory" test would write plans for a server
  whose sessions failed to initialise. A default MCP server (in-memory) writes nothing, and under
  `PERSISTENCE_TYPE=memory` the CLI persists nothing either — it was already broken across
  invocations there, since sessions never persisted under that setting. An id that names a file must
  match `^(plan|debate)_[A-Za-z0-9_-]{1,200}$`: `planId` is caller-supplied and validated only as a
  string, so `../outside` otherwise read a file outside `plans/`. Encoded planIds are excluded
  deliberately — they are standard base64, whose alphabet includes `/`, and they carry their own
  plan anyway. **Plans always go to the local filesystem, including under
  `PERSISTENCE_TYPE=postgres`** — fine on one machine, but a multi-instance server still loses them
  (#358), and nothing ever deletes a plan file (#357).
- `sessions/<sessionId>.json` — session history (auto-saved every `execute` step via
  `autoSave: true` defaulted in `src/cli/commands/execute.ts`)
- `metadata/` — filesystem adapter housekeeping

There is no `state/` level. These sat under a `state/` prefix here until a probe looked in the
documented place and found nothing: `src/__tests__/cli/cli.integration.test.ts` points
`PERSISTENCE_PATH` at a temp directory it happens to name `state`, and that fixture's own layout was
written up as the product's. A real `~/.creative-thinking` holds `plans`, `sessions` and `metadata`
at the top level.

Each command also reads a JSON object on stdin (when piped). Flags override stdin fields. Use the
flag form for the common 5–6 params and the stdin form for technique-specific long-tail fields (e.g.
`hatColor`, `scamperAction`, `risks` arrays).

**Cross-process state hydration.** Because each invocation is a fresh process:

- `socketes plan` writes the plan to `plans/`
- `socketes execute --plan X --session Y` first checks if `X` and `Y` are in the in-process
  `PlanManager` / `SessionManager`. If not, it loads them from disk via `hydratePlan` /
  `loadSessionFromPersistence`. See `src/cli/commands/execute.ts`.

**Parallel execution.** The plan response includes `executionGraph.metadata.parallelizableGroups`
that the LLM/skill can use to fan out concurrent invocations. Concurrent executions against
**different** sessionIds are safe. Concurrent executions against the **same** sessionId are
last-writer-wins. In-process, `SessionLock` serialises only same-technique steps — its key is
`sessionId:technique`, so two different techniques on one session interleave freely — and
cross-process it protects nothing, since each process constructs its own lock. Coordinate from the
client; the lock itself is defensive (#354).

### Running the MCP Server Locally

After `npm run build`, the stdio MCP server is at `dist/mcp-server-main.js`:

```bash
node dist/mcp-server-main.js                            # direct
npm start                                     # same, via package script
npx -y github:uddhav/creative-thinking        # from GitHub (uses checked-in dist/)
```

Smoke-test the stdio handshake without an MCP client:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' | node dist/mcp-server-main.js
```

A correct response advertises capabilities for `tools` and `prompts`. Tool calls go through the same
JSON-RPC stream — see `src/__tests__/integration/mcp-client-integration.test.ts` for the full
discover → plan → execute flow exercised by an in-process MCP client.

Register the local development build with Claude Code:

```bash
claude mcp add --transport stdio creative-thinking-dev -- node /absolute/path/to/dist/mcp-server-main.js
```

The package is not currently published to the npm registry — distribution is via GitHub, which is
why `dist/` is checked into the repo.

For ephemeral debug logging during development, write to **stderr** only (`process.stderr.write`,
`console.error`). stdout is reserved for JSON-RPC framing in MCP mode and for the JSON result in CLI
mode — any stray write to stdout corrupts protocol stream / parseable output. ESLint enforces this;
do not relax the rule.

### Shared Architecture Note

`src/index.ts` exports the `LateralThinkingServer` class and the public types — **no side effects**.
Both the CLI (`src/cli.ts`) and the MCP server entry (`src/mcp-server-main.ts`) import the class
from there.

The MCP runtime bootstrap (signal handlers, `StdioServerTransport`, graceful-shutdown machinery,
`server.connect(transport)`) lives entirely in `src/mcp-server-main.ts`. That file is the
`creative-thinking` bin's entry point.

The previous `isMcpEntryPoint` guard inside `src/index.ts` worked under plain `node dist/index.js`
but collapsed under bundlers that inline modules (notably `bun build --compile`, which makes every
module's `import.meta.url` resolve to the bundle's entry URL — so the guard always returned `true`
inside a compiled `socketes` binary and accidentally started an MCP server in the background). With
a dedicated entry file, no detection is needed: side effects are in `mcp-server-main.ts` only,
importing the class is provably safe, and Bun-compiled CLI binaries contain no MCP server code at
all (bundle drops from ~970 to ~700 modules).

**Rule:** keep `src/index.ts` import-safe. New top-level side effects belong in
`src/mcp-server-main.ts` (for MCP-server-only behavior) or in a separate entry file (for new
distribution shapes).

Useful environment variables (full list in `README.md` and `src/config/`):

- `PERSISTENCE_TYPE=filesystem|postgres` — session backend. **Default for the CLI is `filesystem`**;
  default for the MCP server is in-memory unless explicitly set.
- `PERSISTENCE_PATH=~/.creative-thinking` — filesystem session directory
- `PERSONA_CATALOG_PATH=/path/to/personas.json` — merge external personas with the built-in catalog
- `TELEMETRY_ENABLED=true` — opt-in anonymous analytics
- `DISABLE_THOUGHT_LOGGING=true` — suppress visual thought-progress output on stderr. **Default-on
  for the CLI** so stdout stays a single parseable JSON value.

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
│   ├── session/              # SessionEncoder, PlanManager, SessionCleaner, SessionLock
│   └── validators/           # ObjectFieldValidator
├── layers/
│   ├── discovery.ts          # Discovery layer + discovery/ subfolder (ProblemAnalyzer, TechniqueScorer)
│   ├── planning.ts           # Planning layer + planning/ subfolder (ExecutionGraphGenerator)
│   └── execution.ts          # Execution layer + execution/ subfolder (validators, orchestrators)
├── techniques/
│   ├── BaseTechniqueHandler.ts   # Abstract base class all handlers extend
│   ├── TechniqueRegistry.ts      # Singleton registry — imports and registers all 32 handlers
│   └── [TechniqueName]Handler.ts # One per technique (33 files: 32 registered + unwired GenericHandler)
├── personas/                 # Persona system for personality-driven sessions
│   ├── types.ts              # PersonaDefinition, DebateConfig, PersonaStepContext
│   ├── catalog.ts            # BUILTIN_PERSONAS (9 built-in) + external JSON loading
│   ├── PersonaResolver.ts    # String → PersonaDefinition resolution (built-in, custom:, external)
│   ├── PersonaGuidanceInjector.ts # Injects persona voice into technique step guidance
│   ├── DebateOrchestrator.ts # Creates per-persona parallel plans + synthesis plan
│   └── DebateSynthesizer.ts  # Structures debate outcomes: agreements, disagreements, blind spots
├── types/
│   ├── index.ts              # LateralTechnique union type, SessionData, ALL_LATERAL_TECHNIQUES
│   ├── planning.ts           # Input/output types for the three-layer workflow
│   ├── enforcement.ts        # Type enforcement utilities
│   └── guards.ts             # Runtime type guards
├── server/
│   ├── ToolDefinitions.ts    # MCP tool JSON schemas for all three tools
│   ├── RequestHandlers.ts    # Tool request routing and dispatch
│   ├── SessionOperationsHandler.ts # Session lifecycle operations
│   ├── SamplingHandler.ts    # MCP Sampling request handling
│   └── PromptsHandler.ts     # 13 MCP prompts for guided sessions
├── config/                   # CompletionEnforcementConfig, timeouts
├── benchmarks/               # Performance benchmark scripts
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

**Built-in personas** (9): `rory_sutherland`, `rich_hickey`, `joe_armstrong`, `tarantino`,
`security_engineer`, `veritasium`, `design_thinker`, `nassim_taleb`, `charlie_munger`. Each has
`techniqueBias`, `keyPrinciples`, `challengeQuestions`, `evaluationCriteria`, and `thinkingStyle`
with strengths and blind spots.

**Custom personas**: `custom:Security-minded Rust engineer` — dynamically generated via keyword
analysis from NLPService.

**External personas**: `PERSONA_CATALOG_PATH` env var points to a JSON file that merges with
built-in catalog. Same ID overrides built-in.

**Debate mode**: LLM-orchestrated (not server-driven). Server provides structure via
`DebateOrchestrator` (parallel plans + coordination strategy), LLM executes each persona's steps
sequentially, then runs synthesis steps. `DebateSynthesizer` formats outcomes.

### Type System

The `LateralTechnique` union type in `src/types/index.ts` defines all 32 valid technique
identifiers. When adding a technique, this type and the `ALL_LATERAL_TECHNIQUES` array must both be
updated.

### Error Handling

Error code ranges: E100 (validation), E200 (workflow), E300 (state), E400 (system), E500
(permission), E600 (config), E700 (technique). All errors include recovery guidance. Use
`ErrorFactory` to create, `ErrorContextBuilder` to enrich.

## Adding a New Technique

Comprehensive checklist in [CONTRIBUTING.md](./CONTRIBUTING.md) — the key touchpoints:

1. **Type unions (two)**: `src/types/index.ts` — `LateralTechnique` **and**
   `ALL_LATERAL_TECHNIQUES`; plus the **second, independent `LateralTechnique` union** in
   `src/persistence/types.ts`, declared there to avoid a circular import
2. **Handler**: `src/techniques/[Name]Handler.ts` extending `BaseTechniqueHandler`
3. **Registry**: `src/techniques/TechniqueRegistry.ts` — import and register
4. **Seven exhaustive `Record<LateralTechnique, …>` maps** — `tsc` fails until all are present,
   which is the completeness check: `ergodicity/index.ts` (`profiles`, function-local),
   `ergodicity/pathMemory.ts` (`techniqueConstraintMap`), `discovery/TechniqueScorer.ts`
   (`techniqueMetadata`), `discovery/HumanisticQualityCoverage.ts` (`TECHNIQUE_QUALITY_PROFILES`),
   `sampling/features/TechniqueRecommender.ts` (`benefits`), and **two** in
   `utils/VisualFormatter.ts` (`emojis`, `names`). Step counts are **not** among them —
   `SessionCompletionTracker` asks the registry, so a new technique needs nothing there
5. **Planning integration**: `src/layers/planning.ts` — `getExpectedOutputs()`,
   `getExpectedOutputForStep()` (no typecheck; silently absent if skipped)
6. **Recommender**: `src/layers/discovery/TechniqueRecommender.ts` — a case group whose category
   `ProblemAnalyzer` can actually emit, scored with a `TECHNIQUE_FIT` tier (never a raw decimal)
7. **Tool schema (three edits)**: `src/server/ToolDefinitions.ts` — the `enum` array **and** the
   hardcoded technique list in **both** tool description strings
8. **Tests**: `src/__tests__/techniques/[Name]Handler.test.ts`; bump the two counts and the manual
   array in `workflow-techniques-sync.test.ts`; add a `toContain` assertion in
   `category-reachability.test.ts`; regenerate `src/evals/baseline.json` last — the interpolation
   ratchet sits at 1.0, so **every step must reference the problem**

For ACTION steps (vs THINKING steps), define `ReflexiveEffects` with triggers, realityChanges,
futureConstraints, and reversibility level. See CONTRIBUTING.md for details.

## Adding a New Persona

1. **Definition**: `src/personas/catalog.ts` — add to `BUILTIN_PERSONAS` with full
   `PersonaDefinition` (id, name, tagline, perspective, techniqueBias, preferredOutcome,
   keyPrinciples, evaluationCriteria, challengeQuestions, thinkingStyle)
2. **Tests**: `src/__tests__/personas/catalog.test.ts` — auto-validates all fields via iteration
3. **Prompt** (optional): `src/server/PromptsHandler.ts` — add a prompt shortcut if warranted

## Tests

2,650+ tests across 163 files using Vitest. 10-second timeout per test. Coverage target >80%.

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
├── nlp/            # NLP service tests
├── utils/          # Utility function tests
├── issues/         # Regression tests for specific bug fixes
├── persistence/    # Persistence adapter tests
├── sampling/       # MCP Sampling tests
├── telemetry/      # Telemetry tests
├── option-generation/ # Option generation engine tests
├── helpers/        # Shared test utilities
└── *.test.ts       # Top-level tests (validation, reflexivity, session encoding, etc.)
```

`npm test` (watch mode) auto-builds via the `pretest` hook. **`npm run test:run` does not** — npm
fires `pretest` only for the `test` script, so the command used by CI and pre-commit runs against
whatever `dist/` already holds. Build first.

## Release pipeline

The version line jumps from v1.1.0 to v2.0.0 for a reason that is not a breaking change: a commit
body written while fixing the bump logic carried `BREAKING CHANGE:` as the first non-whitespace on a
line, inside an indented example, and semantic-release read it as a footer. Per the never-roll-back
rule below, it was left in place rather than re-tagged. See the commit-body rule under Important
Constraints.

Three workflows, because a repository ruleset on `main` requires every change to arrive through a
pull request. `@semantic-release/git` used to push the version commit directly and was rejected
every time (`GH013: changes must be made through a pull request`), which is why nothing released
between May and August 2026. Version bumps now go through a PR; semantic-release only tags.

1. **`.github/workflows/pr-version-bump.yml`** — `workflow_dispatch` only, dispatched by
   `semantic-release.yml` with the tag it just created. Copies that tag into `package.json` +
   `package-lock.json`, writes a `CHANGELOG.md` entry, and opens a `chore(release):` PR. It does no
   version arithmetic at all: semantic-release decides, this records.

   **It used to run on `pull_request: closed`, and that was a race it lost every time.** Both
   workflows fired on the same merge, and this one read `git describe --tags` before
   semantic-release had written the new tag — so it proposed the _previous_ release's version. Five
   consecutive merges produced a wrong bump PR (#315, #317, #323, #326, #327); one proposed 2.4.2
   against a `package.json` already at 2.4.3, which would have published a version older than one
   already shipped. The old comment called this self-correcting because "the next merge closes the
   gap", but the next merge tags too, so the gap moves instead of closing. Every instance was caught
   only because someone was looking. See #325.

   Because a dispatch carries no PR context, the released PR is recovered from the commit the tag
   points at (`repos/…/commits/{sha}/pulls`) purely to describe the release; a lookup that finds
   nothing produces a plainer changelog entry rather than a wrong version. There is also a guard
   that refuses to move `package.json` backwards.

   Everything user-controlled (PR title, body) reaches the shell via `env:`, never by interpolating
   `${{ … }}` into a `run:` block. Interpolation puts the text into the script _before_ bash parses
   it, so backticks in a PR description execute — that is what made this workflow fail every run
   until August 2026. Keep new steps to the same rule.

2. **`.github/workflows/semantic-release.yml`** — runs on every push to `main`. Calls
   `npx semantic-release`, which analyzes commits since the last tag, determines the version bump
   from Conventional Commits (`fix:` → patch, `feat:` → minor, `feat!:` / `BREAKING CHANGE:` →
   major), and creates the tag plus the GitHub Release with auto-generated notes. It does **not**
   write to `main` — tags are not covered by the pull-request rule. After `semantic-release`
   returns, a follow-up step runs `git describe --tags --exact-match HEAD` to detect whether a new
   tag was created this run; if so, it dispatches **both** `release-binaries.yml` and
   `pr-version-bump.yml` against that tag.

   Dispatching the bump from here is what removes the race: the tag provably exists before the bump
   job starts, because the dispatch step cannot run until the release step that creates it has
   finished. If a dispatch fails, no bump PR appears and `package.json` simply does not advance —
   which is the benign failure, unlike proposing a version that is wrong.

3. **`.github/workflows/release-binaries.yml`** — builds standalone single-file binaries via
   `bun build --compile`. Triggered by:
   - `push: tags: ['v*.*.*']` — manual tag pushes by a developer
     (`git tag v0.7.0 && git push origin v0.7.0`).
   - `workflow_dispatch` — manual / re-run / called by semantic-release.yml.

   Build topology: matrix with `macos-latest` (builds `socketes-darwin-arm64` and
   `socketes-darwin-x64`) and `ubuntu-latest` (builds `socketes-linux-arm64` and
   `socketes-linux-x64`). A `release` job downloads both runners' artifacts, generates `SHA256SUMS`,
   and uploads everything to the GitHub Release with `--clobber` (works whether the Release already
   exists from semantic-release or needs to be created from a manual tag push).

**Why the explicit dispatch instead of relying on `push: tags`?** Tags pushed by `GITHUB_TOKEN`
deliberately don't fire `push: tags` workflows — a GitHub Actions safeguard against runaway loops.
Without the dispatch step, semantic-release-driven releases would never trigger the binary build.

**Why per-platform runners and not a single cross-compile?** Bun's macOS-to-Linux cross-compile from
`macos-latest` has been observed to hang while downloading the Linux runtime (~30 minutes with no
progress). Native runners build their own targets reliably.

**Failure recovery.** If a Release was created but binaries are missing (dispatch failed, build
failed), re-run the binary workflow manually:

```bash
gh workflow run release-binaries.yml --ref v0.7.0 -f tag=v0.7.0
```

The `--clobber` upload step handles re-publishing without needing to delete the existing Release.
**Never roll back a published Release** — fix forward with the next semantic-release-worthy commit.

**Cutting an ad-hoc release** (bypassing semantic-release): bump the version in `package.json`,
update `CHANGELOG.md`, then `git tag vX.Y.Z && git push origin vX.Y.Z`. `release-binaries.yml` fires
from the tag push, creates a new Release with stub notes, and uploads binaries.

For end-user release semantics (Conventional Commit cheat sheet), see `CONTRIBUTING.md` → Release
Process.

## Important Constraints

- **dist/ is checked in** — required for `npx github:uddhav/creative-thinking` distribution
- **Steps within one technique are ordered; independent techniques may run in parallel** — the
  plan's `executionGraph.metadata.parallelizableGroups` says which. (An older line here said
  "sequential execution only", which the server itself contradicts: it accepts and echoes
  `executionMode: "parallel"` and ships parallelization instructions in every plan.)
- **Conventional Commits** required — `fix:` (patch), `feat:` (minor), `feat!:` (major)
- **Never let `BREAKING CHANGE` begin a line in a commit body unless you mean it.** semantic-release
  parses the body, not just the subject. The table below comes from running the resolved parser
  (`conventional-changelog-angular` v8 + `conventional-commits-parser` v6) over each form, not from
  reading its regex — a transcription of that regex got the `BREAKING-CHANGE:` row backwards.

  | Form                       | Matched? |                                                                                      |
  | -------------------------- | -------- | ------------------------------------------------------------------------------------ |
  | indented four spaces       | **yes**  | the original failure; `\s` is stripped                                               |
  | markdown bullet `* …`      | **yes**  | `*` is stripped                                                                      |
  | table pipe `\| …`          | **yes**  | `\|` is stripped                                                                     |
  | line start, no colon       | **yes**  | the separator is `[:\s]+`, so a space suffices                                       |
  | `BREAKING-CHANGE:`         | **yes**  | the parser normalises the hyphen, though the keyword list holds only the spaced form |
  | inline mid-sentence        | no       | the `^` anchor cannot reach it                                                       |
  | plural `BREAKING CHANGES:` | no       | `S` is neither colon nor space                                                       |
  | `BREAKING_CHANGE:`         | no       | not the configured keyword                                                           |

  So indentation, bullets, table cells and dropping the colon all fail to protect. Use an inline
  mention, the plural, or an underscored token. A **pull request description** is also safe — squash
  bodies here are assembled from commit messages, not the PR body.

- **Measure from the built artifact, not by grepping source.** Field types, tool schemas and
  technique lists are all assembled at build time; a regex over `src/` reads the ingredients rather
  than the result and has been wrong three times. It called `provocation` and `successExample`
  string arrays (both are plain strings), `weaknessMapping` an array (it is an object), and
  over-counted the fields a handler reads by 72 because it could not tell the input field `patterns`
  from a local variable of the same name. Import from `dist/`, or probe the running object with a
  `Proxy`, and read the answer off that.
- **Test through the surface the caller uses.** An MCP call passes `RequestHandlers` (required-field
  validation, technique-field validation, workflow-order guard), then `processLateralThinking`, then
  the layer functions, then the response builder. A test that calls a layer function or
  `LateralThinkingServer` directly skips the first two entirely. Three defects on this path —
  session operations refused before dispatch, `isError` dropped from every layer-built error, debate
  mode stripped by the response allowlist — all passed their guards because the guards entered below
  where the fault was.

  **So: if an assertion is about what a caller receives, write it as an integration test driving
  `MCPClientTestHelper` from the start** — not as a unit test to be promoted later, because the
  promotion only ever happens after something has already gone wrong. Share one client per file
  rather than per test: the helper spawns a server, and a session created by one test is visible to
  the next, which is usually what you want and occasionally what bites you.

- **Integration guards run the BUILT server, so rebuild before trusting a kill-check.**
  `MCPClientTestHelper` spawns `node dist/mcp-server-main.js`, and `npm run test:run` has no pretest
  hook — so a kill-check that edits `src/` and runs vitest without `npm run build` tests the old
  `dist/` and comes back green. That green reads as "this guard cannot fail", which is the opposite
  of what happened. Every break must be followed by a build.

  Related: `vitest.config.ts` sets `retry: 2` globally. A real regression still fails all three
  attempts, but a guard that fails intermittently is masked rather than reported.

- **Never log to stdout** — it breaks MCP protocol
- **Never add a 4th tool** — all functionality fits within the three-tool workflow
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless explicitly requested
