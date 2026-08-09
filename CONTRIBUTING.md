# Contributing to Creative Thinking MCP Server

Welcome! This document contains all the information you need to contribute to the Creative Thinking
MCP Server. Whether you're fixing a bug, adding a feature, or improving documentation, this guide
will help you get started.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture & Design](#architecture--design)
3. [Development Workflow](#development-workflow)
4. [Error Handling](#error-handling)
5. [Performance & Monitoring](#performance--monitoring)
6. [Features & Configuration](#features--configuration)
7. [Testing Guidelines](#testing-guidelines)
8. [Release Process](#release-process)
9. [Code Style Guidelines](#code-style-guidelines)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- TypeScript knowledge

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/creative-thinking.git
cd creative-thinking

# Install dependencies
npm install

# Build the project
npm run build    # Compile TypeScript and set executable permissions

# Run in development mode
npm run dev      # Run TypeScript compiler in watch mode

# Start the server
npm start        # Run the compiled server
```

### Docker Setup

```bash
# Build Docker image
docker build -t creative-thinking .

# Run the server in Docker
docker run -it creative-thinking
```

### Environment Configuration

The server supports various environment variables for configuration:

```bash
# Persistence
PERSISTENCE_TYPE=filesystem  # or 'memory'
PERSISTENCE_PATH=.creative-thinking

# Visual output
DISABLE_THOUGHT_LOGGING=true
SHOW_TECHNIQUE_INDICATORS=true

# Telemetry (opt-in)
TELEMETRY_ENABLED=true
TELEMETRY_LEVEL=detailed
TELEMETRY_STORAGE=filesystem
```

## Architecture & Design

### Three-Layer Architecture

The server implements a strict three-layer architecture:

1. **Discovery Layer** - Problem analysis and technique recommendation
2. **Planning Layer** - Workflow creation and step sequencing
3. **Execution Layer** - Guided implementation with state management

### Core Principles

#### Three Tools Only

This MCP server exposes **exactly three tools**, no more, no less:

- `discover_techniques` - Analyzes problems and recommends techniques
- `plan_thinking_session` - Creates structured workflows
- `execute_thinking_step` - Executes individual steps in the workflow

**This is a hard constraint that must never be violated.** All functionality must be integrated into
these three tools.

### Key Components

#### Thinking Techniques

A hand-maintained list used to live here and had drifted eleven techniques out of date, because
nothing made it fail when the catalogue grew. The authoritative sources are:

- `ALL_LATERAL_TECHNIQUES` in `src/types/index.ts` — the canonical identifiers
- `src/techniques/*Handler.ts` — one handler per technique, each carrying its own step count,
  display name, and focus in `getTechniqueInfo()`
- [`SPECIFICATIONS.md`](./SPECIFICATIONS.md) — prose descriptions

Prefer reading those over duplicating them. If you do add a summary here, expect it to rot.

#### Support Systems

- **Session Management** - Full state persistence with branching
- **ExecutionGraphGenerator** - Creates execution plans for techniques
- **SessionEncoder** - Base64 encoding for session resilience
- **Option Generation Engine** - Activates when flexibility < 0.4
- **Early Warning System** - Multi-level alerts for creative constraints
- **Ergodicity Tracking** - Path dependency and absorbing barrier detection
- **Export System** - Multi-format support (JSON, CSV, Markdown)
- **Error Context Builder** - Centralized error handling with guidance
- **Validation Strategy** - Comprehensive input validation

### MCP Protocol Compliance

**CRITICAL**: This server implements the Model Context Protocol (MCP) which requires strict
separation of concerns:

1. **stdout is reserved for JSON-RPC only** - No visual output or debug messages
2. **stderr is for visual output and debugging** - All formatting and progress indicators
3. **ESLint enforcement** - Rules prevent stdout pollution
4. **Testing** - MCP compliance test verifies protocol adherence

### Early Warning System Architecture

The Early Warning System detects approaching "absorbing barriers" - irreversible lock-in states:

#### Sensor Types

1. **ResourceMonitor** - Tracks energy, burn rate, efficiency
2. **CognitiveAssessor** - Monitors flexibility and perspective diversity
3. **TechnicalDebtAnalyzer** - Measures solution complexity

#### Warning Levels

- 🟢 **SAFE**: > 60% distance from barrier
- 🟡 **CAUTION**: 40-60% distance from barrier
- 🟠 **WARNING**: 20-40% distance from barrier
- 🔴 **CRITICAL**: < 20% distance from barrier

#### Escape Protocols

Five levels of escape strategies, from Pattern Interruption to Strategic Pivot.

### Client-Server Execution Architecture

The server provides execution intelligence through DAG generation while clients control the actual
execution strategy:

#### Server-Side: DAG Generation

The server analyzes problems and generates a Directed Acyclic Graph (DAG) that:

1. **Identifies Dependencies**:
   - Hard dependencies (must complete before proceeding)
   - Soft dependencies (preferential but not required)
   - Sync points between technique boundaries

2. **Provides Execution Intelligence**:
   - Recommends execution strategy (sequential/parallel/hybrid)
   - Calculates time multipliers for different strategies
   - Identifies parallelization opportunities

3. **Maintains Independence**:
   - Each node contains complete parameters
   - Steps can be executed in any order respecting dependencies
   - Server processes steps atomically as they arrive

#### Sequential Execution Model

The server implements sequential-only execution:

1. **Sequential Execution**:
   - Maximum coherence and depth
   - Each step builds on previous insights
   - Natural flow of creative thinking
   - Full exploration of each technique

#### Server Processing

The server handles arriving steps independently:

1. **Stateless Processing**: Each step processed without assuming order
2. **Context Preservation**: SessionManager maintains state regardless of execution order
3. **Atomic Operations**: No race conditions between parallel steps
4. **Session Resilience**: Base64 encoding survives restarts

#### SessionEncoder

Enables session resilience through base64 encoding:

1. **Encoding**: Converts session state to base64 tokens
   - Includes planId, technique, step numbers, problem
   - Optional: history length, last output
   - Timestamp for 24-hour expiry

2. **Decoding**: Restores sessions from encoded tokens
   - Validates expiry and step numbers
   - Creates minimal session if not in memory
   - Transparent to clients

3. **Benefits**:
   - Survives server restarts
   - No external storage needed
   - Backward compatible with regular IDs

## Development Workflow

### Pre-Commit Checklist (MANDATORY)

1. **Run build**: `npm run build` to ensure TypeScript compiles
2. **Run tests**: `npm run test:run` for affected areas
3. **Run lint LAST**: `npm run lint` (fix with `npm run lint -- --fix`)
4. **NEVER commit if ANY of the above fail**
5. **Commit dist files**: Always commit updated dist files with src changes

### Code Submission Guidelines

- Run tasks with subagents to preserve main agent context
- Always follow the three-step workflow
- Each phase builds on the previous
- Use clear, actionable error messages

### PR Review Process

1. **ALWAYS run** `gh pr diff <PR>` to see actual changes
2. **NEVER merge** when review says "NEEDS FIXES"
3. **Read ENTIRE review**, especially "Required Fixes"
4. **Verify MCP integration** for new techniques

### Should this be a new technique at all?

The checklist below answers _how_ to add a technique. This section answers _whether_ to.
Historically only the former existed, so the catalogue could grow without anything ever arguing
against a candidate.

A candidate must clear **all four** bars:

1. **Distinct method, not a variation.** It asks the user to do something no existing technique
   asks. "Same moves, different vocabulary" is a variation — extend the existing handler instead.
   Read the closest two or three existing handlers in full before claiming novelty; overlap is
   usually discovered here.
2. **Distinguishable output.** Run the candidate and its nearest neighbour on the same problem. If
   the two outputs would be substantially the same, you have one technique, not two.
3. **Reachable.** It must be recommended by at least one category that
   `ProblemAnalyzer.categorizeProblem` can actually emit. A technique wired only to an unreachable
   category is dead on arrival — see `src/__tests__/layers/discovery/category-reachability.test.ts`.
4. **Clears the guidance bar.** Every step must reference the problem (see the prose rules below).
   The ratchet in `src/__tests__/evals/guidanceMetrics.test.ts` enforces this for new techniques and
   will fail the build otherwise.

Disqualifying signs: it exists mainly to name-check a book or author; it is a single cognitive move
better placed as a step inside an existing technique; its guidance would delegate the real work to
another technique.

**Removal is allowed.** If a technique fails bar 2 against a newer one, retiring it is a legitimate
change. A catalogue that only ever grows is not curated.

### Writing step guidance

The guidance strings are the product — they are what the model consumes. Rules:

- **Every step must interpolate `problem`.** Not decoratively appended, but woven into the
  instruction so the step reads specifically about this problem. Guidance identical for "reduce
  churn" and "design a bridge" is boilerplate.
- **Second person, imperative.** "List every constraint acting on X", not "The practitioner should
  consider constraints."
- **Keep steps comparable in length** to the rest of the handler. Wild swings between handlers
  reflect authoring date rather than technique complexity.
- **Out-of-range steps return** `` `Complete the ${info.name} process for: "${problem}"` `` — one
  contract across all handlers. Do not throw from `getStepGuidance`.
- **`extractInsights` must read `entry.output`.** Returning constant strings keyed by index
  fabricates insight that the session never produced.

### Adding New Techniques

Once a candidate clears the bars above, follow this comprehensive checklist:

#### 1. Core Type Definitions (2 files)

- [ ] `src/types/index.ts`: Add to `LateralTechnique` type union
- [ ] `src/persistence/types.ts`: Add to `TechniqueType` type union

#### 2. Technique Handler Implementation (2 files)

- [ ] `src/techniques/[TechniqueName]Handler.ts`: Create handler extending `BaseTechniqueHandler`
  - Implement `getTechniqueInfo()` with name, emoji, totalSteps, description, focus, enhancedFocus,
    parallelSteps
  - Implement `getStepInfo(step)` returning step name, focus, emoji, and optional description
  - Implement `getStepGuidance(step, problem)` with detailed guidance for each step
  - Implement `validateStep(step, data)` with technique-specific validation
  - Implement `getPromptContext(step)` with capabilities and context
- [ ] `src/techniques/TechniqueRegistry.ts`: Import and register the handler

#### 3. Reflexivity Design (IMPORTANT: New requirement)

When designing technique steps, you MUST distinguish between THINKING and ACTION steps:

**THINKING Steps** (no reflexivity):

- Analyzing, evaluating, brainstorming
- No external commitments or implementations
- Easily reversible, no lasting effects
- Examples: "Analyze current state", "Generate ideas", "Evaluate options"

**ACTION Steps** (trigger reflexivity):

- Implementing, communicating, building, allocating
- Create real-world changes that affect future options
- Consider reversibility: high/medium/low
- Examples: "Share findings with team", "Implement solution", "Allocate resources"

For each ACTION step, define `ReflexiveEffects`:

```typescript
reflexiveEffects: {
  triggers: string[];        // What actions trigger reflexivity
  realityChanges: string[];  // How reality changes post-action
  futureConstraints: string[]; // What must be considered going forward
  reversibility: 'high' | 'medium' | 'low'; // How easily can this be undone
}
```

Consider the technique's overall reflexivity profile:

- **Relationship reflexivity**: Changes stakeholder dynamics
- **Path reflexivity**: Forecloses future options
- **Structural reflexivity**: Alters system architecture
- **Behavioral reflexivity**: Changes work patterns
- **Technical reflexivity**: Creates tool/method dependencies

#### 4. Planning Layer Integration (`src/layers/planning.ts`)

- [ ] Add to `getExpectedOutputs()` function with 3 expected outputs
- [ ] Add to `getExpectedOutputForStep()` function with step-by-step outputs
- [ ] Add to `getRisksForStep()` function (optional, technique-specific risks)
- [ ] Add to `getSuccessCriteriaForStep()` function (optional)

#### 5. Session Tracking (`src/core/session/SessionCompletionTracker.ts`)

- [ ] Add to `techniqueStepCounts` Record with correct step count

#### 6. Ergodicity Integration (2 files)

- [ ] `src/ergodicity/index.ts`: Add to `TECHNIQUE_STEP_MAP` constant
- [ ] `src/ergodicity/pathMemory.ts`: Add to `TECHNIQUE_STEPS` constant

#### 6. Visual Formatting (`src/utils/VisualFormatter.ts`)

- [ ] Add to `techniqueEmojis` mapping with appropriate emoji

#### 7. Recommendation Systems (2 files)

- [ ] `src/layers/discovery/TechniqueRecommender.ts`: Add recommendation logic
- [ ] `src/sampling/features/TechniqueRecommender.ts`: Add to sampling logic

#### 8. Test Coverage (3+ files)

- [ ] `src/__tests__/techniques/[TechniqueName]Handler.test.ts`: Create comprehensive unit tests
  - Test `getTechniqueInfo()` returns correct metadata
  - Test `getStepInfo()` for all steps
  - Test `getStepGuidance()` generates appropriate guidance
  - Test `validateStep()` accepts valid data and rejects invalid data
  - Test `getPromptContext()` returns proper context
  - Test error handling for invalid steps
- [ ] `src/__tests__/core/workflow-techniques-sync.test.ts`: Update technique count
- [ ] `src/__tests__/sampling/IdeaEnhancer.test.ts`: Update if needed

#### 9. Documentation Updates (4 files)

- [ ] `README.md`: Update technique count and add to technique list
- [ ] `CHANGELOG.md`: Add entry for new technique
- [ ] `CLAUDE.md`: Update technique counts and step reference
- [ ] `CONTRIBUTING.md`: Update if adding new patterns

#### 10. Build and Distribution

- [ ] Run `npm run build` to update all dist/ files
- [ ] Run `npm run test:run` to ensure all tests pass
- [ ] Run `npm run lint` to check code style
- [ ] Ensure all dist/ files are committed with source changes

#### Integration Checklist

- [ ] Technique appears in discovery tool recommendations
- [ ] Planning tool generates correct workflow
- [ ] Execution tool handles all steps properly
- [ ] Session persistence works correctly
- [ ] Visual formatting displays correctly
- [ ] Error messages are clear and actionable
- [ ] MCP protocol compliance verified

## Error Handling

### Error Code Ranges

| Range     | Category      | Description                            |
| --------- | ------------- | -------------------------------------- |
| E100-E199 | Validation    | Input validation and parameter errors  |
| E200-E299 | Workflow      | Workflow sequence and process errors   |
| E300-E399 | State         | Session and state management errors    |
| E400-E499 | System        | System-level and infrastructure errors |
| E500-E599 | Permission    | Access control and rate limiting       |
| E600-E699 | Configuration | Configuration and setup errors         |
| E700-E799 | Technique     | Technique execution errors             |
| E999      | Unknown       | Unhandled or unexpected errors         |

### Error Classes & Usage

| Error Class        | Use When                | Example Codes                               |
| ------------------ | ----------------------- | ------------------------------------------- |
| `ValidationError`  | Input validation fails  | `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`   |
| `SessionError`     | Session operations fail | `SESSION_NOT_FOUND`, `SESSION_EXPIRED`      |
| `PlanError`        | Planning phase issues   | `PLAN_NOT_FOUND`, `PLAN_EXPIRED`            |
| `ExecutionError`   | Execution problems      | `INVALID_STEP`, `TECHNIQUE_MISMATCH`        |
| `PersistenceError` | Storage issues          | `PERSISTENCE_NOT_AVAILABLE`, `WRITE_FAILED` |

### Common Error Patterns

#### Input Validation

```typescript
const validation = validator.validate(input);
if (!validation.valid) {
  throw new ValidationError(ErrorCode.INVALID_INPUT, validation.errors.join('; '), 'fieldName', {
    providedValue: input.fieldName,
  });
}
```

#### Graceful Degradation

```typescript
try {
  await persistenceAdapter.save(data);
  response.status = 'saved';
} catch (error) {
  if (error.code === ErrorCode.PERSISTENCE_NOT_AVAILABLE) {
    response.status = 'memory-only';
    response.warning = 'Data saved in memory only';
  }
}
```

### Error Response Format

```typescript
{
  error: {
    code: ErrorCode,
    message: string,
    details?: any,
    layer: ErrorLayer,
    timestamp: string,
    recovery?: string[]  // Step-by-step recovery instructions
  },
  isError: true
}
```

### Best Practices

#### ✅ DO

- Use specific error codes
- Provide actionable messages
- Include recovery guidance
- Log to stderr (not stdout)
- Test error scenarios
- Preserve session state
- Degrade gracefully

#### ❌ DON'T

- Throw generic errors
- Log to stdout
- Swallow errors silently
- Break session state
- Use inconsistent formats
- Expose internal details
- Crash the server

## Performance & Monitoring

### Performance Baselines

Performance tests track key metrics across different environments:

- **Duration**: Operation completion time
- **Memory**: Heap usage before/after operations
- **Concurrency**: Parallel operation handling

### Understanding Benchmark Results

```
[github-actions] 50 concurrent discoveries completed in 1234ms
[github-actions] Memory usage - Before: 85MB, After: 120MB, Increase: 35MB
```

#### Good Performance Indicators

- Durations within expected ranges
- Linear memory growth with load
- Consistent results across runs
- Low variance between percentiles

#### Warning Signs

- Duration exceeding baseline by >10%
- Memory growth >2MB per session
- High variance between runs
- P99 significantly higher than P95

### Performance Profiling

#### Local Profiling

```bash
# Run with profiler
node --prof dist/index.js

# Generate flame graph
node --prof-process isolate-*.log > profile.txt

# Use Chrome DevTools
node --inspect dist/index.js
```

#### Memory Profiling

```bash
# Heap snapshots
node --expose-gc --inspect dist/index.js

# In Chrome DevTools:
# 1. Take heap snapshot
# 2. Run operations
# 3. Take another snapshot
# 4. Compare snapshots
```

### Telemetry System

The telemetry system collects anonymous usage data (opt-in):

#### Configuration

```bash
# Enable telemetry
TELEMETRY_ENABLED=true
TELEMETRY_LEVEL=detailed  # basic, detailed, full
TELEMETRY_STORAGE=filesystem
TELEMETRY_PRIVACY_MODE=balanced  # strict, balanced, minimal
```

#### Privacy Levels

- **Strict**: Maximum privacy, aggregate metrics only
- **Balanced**: Anonymous session IDs, core metrics
- **Minimal**: Full telemetry for detailed insights

#### Data Collected

- Technique start/complete events
- Session metrics
- Effectiveness scores
- Insight generation counts
- Risk identification rates
- No personal information or content

### Performance Optimization Patterns

#### Dynamic Recommendation System

The recommendation system dynamically adjusts the number of techniques based on problem complexity:

**Complexity-Based Limits**:

- **Low complexity**: 2-3 base techniques + 1 wildcard
- **Medium complexity**: 3-5 base techniques + 1 wildcard
- **High complexity**: 5-7 base techniques + 2 wildcards

**Performance Optimizations**:

- **Technique info caching**: Avoids repeated registry lookups
- **Early wildcard exit**: Skip computation when not needed (17.5% probability)
- **Set-based exclusions**: O(1) lookup instead of O(n) array filtering
- **Lazy evaluation**: Only fetch technique info when actually needed

**Configuration**:

- `WILDCARD_PROBABILITY`: Default 0.175 (17.5% chance)
- `MAX_TECHNIQUE_RECOMMENDATIONS`: Override max recommendations

**Rationale**:

- 17.5% wildcard probability = ~1 in 6 chance, prevents algorithmic pigeonholing
- Dynamic limits adapt to problem complexity
- Not artificially limited to 3 techniques anymore

#### Batch Operations

```typescript
// Bad: Multiple individual operations
for (const item of items) {
  await processItem(item);
}

// Good: Batch processing
await Promise.all(items.map(processItem));
```

#### Object Pooling

```typescript
// Good: Reuse objects
const bufferPool = new ObjectPool(() => new Buffer(1024));
function process() {
  const buffer = bufferPool.acquire();
  // use buffer
  bufferPool.release(buffer);
}
```

## Features & Configuration

### Visual Indicators

Visual indicators provide real-time technique state information:

#### Enabling

```bash
export SHOW_TECHNIQUE_INDICATORS=true
```

#### Indicator Types

1. **Technique State**
   - Six Hats: `[🔵 Blue Hat]`, `[⚪ White Hat]`, etc.
   - SCAMPER: `[🔄 SUBSTITUTE]`, `[🔗 COMBINE]`, etc.
   - Design Thinking: `[💚 Empathize]`, `[🎯 Define]`, etc.

2. **Risk Level**
   - `[🟢 Low Risk]` - 0 risks
   - `[🟡 Medium Risk]` - 1-2 risks
   - `[🔴 High Risk]` - 3-4 risks
   - `[⚫ Ruin Risk]` - 5+ risks

3. **Flexibility Score**
   - `[🔶 Flexibility: XX%]` - Caution (30-40%)
   - `[⚠️  Flexibility: XX%]` - Warning (20-30%)
   - `[⛔ Flexibility: XX%]` - Critical (<20%)

### Session Management

Sessions support:

- Full state persistence
- Branching for alternatives
- Revision tracking
- AutoSave functionality

#### Persistence Configuration

```bash
PERSISTENCE_TYPE=filesystem  # or memory
PERSISTENCE_PATH=.creative-thinking
```

#### AutoSave Behavior

- Optional parameter in `execute_thinking_step`
- Graceful degradation if persistence unavailable
- Sessions always stored in memory during use

### Option Generation Engine

Automatically activates when flexibility drops below 0.4:

#### Generation Strategies (12 total)

- **Core**: Decomposition, Temporal, Abstraction, Inversion, Stakeholder, Resource, Capability,
  Recombination
- **Enhanced**: Neural Optimization, Temporal Flexibility, Cultural Bridging, Collective Divergence

## Testing Guidelines

### Test Organization

```
src/__tests__/
├── core/                    # Core component tests
├── ergodicity/             # Ergodicity system tests
├── export/                 # Export functionality tests
├── integration/            # MCP protocol compliance
├── layers/                 # Layer architecture tests
└── persistence/            # Storage adapter tests
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.ts
```

### Test Requirements

- Coverage target: >80%
- Test all error scenarios
- Include integration tests
- Test MCP protocol compliance
- Performance benchmarks

### Writing Tests

```typescript
describe('Component', () => {
  it('should handle normal operation', async () => {
    // Arrange
    const input = {
      /* test data */
    };

    // Act
    const result = await component.process(input);

    // Assert
    expect(result).toMatchObject({
      success: true,
      data: expect.any(Object),
    });
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios with recovery
  });
});
```

## Release Process

This project uses semantic-release for automated versioning.

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type     | Release | Description                      |
| -------- | ------- | -------------------------------- |
| `fix:`   | Patch   | Bug fixes (1.0.0 → 1.0.1)        |
| `feat:`  | Minor   | New features (1.0.0 → 1.1.0)     |
| `feat!:` | Major   | Breaking changes (1.0.0 → 2.0.0) |

### Examples

```bash
# Patch release
git commit -m "fix: correct risk dismissal threshold calculation"

# Minor release
git commit -m "feat: add quantum thinking technique"

# Major release
git commit -m "feat!: redesign tool API

BREAKING CHANGE: The execute_thinking_step tool now requires a planId parameter"
```

### Automated Release Process

Two workflows split the work, because a repository ruleset on `main` requires every change to arrive
through a pull request. `@semantic-release/git` used to commit the version bump straight to `main`
and was rejected every time (`GH013`), which is why nothing released between May and August 2026. It
has been removed from `.releaserc.json`.

On merge of any PR to `main`, `.github/workflows/pr-version-bump.yml` runs and:

1. Determines the bump (patch / minor / major) from the PR title, body and commits.
2. Bumps `package.json` / `package-lock.json` and prepends a `CHANGELOG.md` entry.
3. Opens a `chore(release):` pull request with the result — satisfying the ruleset rather than
   fighting it. Its own `if:` guard skips `chore(release)` titles, so merging that PR cannot loop.

On push to `main`, `.github/workflows/semantic-release.yml` runs and:

1. Analyzes commits since the last release tag.
2. Determines the version bump (patch / minor / major) per Conventional Commits.
3. Creates the tag (e.g. `v0.7.0`) and the GitHub Release with auto-generated notes via
   `@semantic-release/github`. It no longer writes to `main` — tags are not covered by the
   pull-request rule.
4. Dispatches `release-binaries.yml` against the new tag (see below). When no commit since the last
   release warrants a bump, semantic-release no-ops and no tag is pushed.

Both derive the bump from Conventional Commits and should agree, but they compute it independently
and nothing enforces a match. If `package.json` and the newest tag ever disagree, the tag is the
released artifact and `package.json` is what needs correcting.

If no `feat:` / `fix:` / `feat!:` commit landed since the last release, the workflow runs but
produces no release.

### Standalone binary release pipeline

`.github/workflows/release-binaries.yml` builds single-file `socketes` binaries for four target/arch
combinations and attaches them to the GitHub Release.

**Triggers:**

- `push: tags: ['v*.*.*']` — direct tag pushes from a developer
  (`git tag v0.7.0 && git push origin v0.7.0`). Use this for ad-hoc releases or to re-publish if a
  binary upload failed.
- `workflow_dispatch` (manual) — run from the Actions UI with a `tag` input. Same effect as a tag
  push but useful when re-running.
- Dispatched explicitly from `semantic-release.yml` after that workflow publishes a release.
  **Why:** tags pushed by `GITHUB_TOKEN` deliberately don't fire `push: tags` workflows (anti-loop
  safeguard), so the explicit dispatch is necessary to close the auto-release loop.

**Build topology:**

- **macos-latest** runner builds `socketes-darwin-arm64` and `socketes-darwin-x64` via
  `npm run build:bin:darwin`.
- **ubuntu-latest** runner builds `socketes-linux-arm64` and `socketes-linux-x64` via
  `npm run build:bin:linux`.

A separate `release` job downloads both runners' artifacts, generates `SHA256SUMS`, and uploads
everything to the Release. If the Release already exists (the common path when triggered by
semantic-release), assets are uploaded with `--clobber`. If not (manual tag push without a Release),
a new Release is created.

**Cross-platform note.** Per-runner native builds are deliberate: Bun's macOS-to-Linux cross-compile
has been observed to hang while downloading the Linux runtime. `npm run build:bin:all` is provided
for local dev convenience on macOS but only the per-platform scripts run in CI.

### Failure recovery

If `semantic-release.yml` succeeds (Release exists with notes) but `release-binaries.yml` fails or
its dispatch was missed, re-run it manually:

```bash
gh workflow run release-binaries.yml --ref v0.7.0 -f tag=v0.7.0
```

The workflow's "if Release exists, upload binaries with `--clobber`" branch handles the partial
state cleanly. No action needed on the existing Release.

If the binary build itself is broken (TypeScript error, Bun compile failure), fix forward on `main`
— semantic-release will pick up the next bump on the next release-worthy commit. Do not roll back
published Releases.

### Cutting a release manually

For ad-hoc releases that bypass semantic-release:

```bash
# 1. Update CHANGELOG.md and package.json version by hand
# 2. Tag and push
git tag v0.7.0
git push origin v0.7.0
```

`release-binaries.yml` fires from the tag push, builds binaries, and creates a new Release with stub
notes. Edit the Release notes after the fact if needed.

## Code Style Guidelines

### TypeScript Requirements

- Strict mode enabled
- No `any` types without justification
- Comprehensive type definitions
- Async/await for asynchronous operations

### Naming Conventions

- Classes: PascalCase (e.g., `SessionManager`)
- Interfaces: PascalCase with 'I' prefix optional
- Functions/methods: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case for utilities, PascalCase for classes

### Code Organization

- One class/major component per file
- Group related functionality in directories
- Export through index.ts files
- Keep files under 300 lines when possible

### Documentation

- JSDoc for public APIs
- Inline comments for complex logic
- README files for major modules
- Examples for new features

### Import Order

1. Node.js built-ins
2. External dependencies
3. Internal absolute imports
4. Internal relative imports
5. Type imports

```typescript
import { readFile } from 'fs/promises';
import chalk from 'chalk';
import { SessionManager } from '@/core/SessionManager';
import { validateInput } from './utils';
import type { SessionData } from '@/types';
```

### Error Messages

- Be specific and actionable
- Include context about what failed
- Suggest recovery steps
- Use error codes consistently

### Git Workflow

1. Create feature branch from main
2. Make atomic commits
3. Write descriptive commit messages
4. Create PR with detailed description
5. Address review feedback
6. Squash merge to main

## Important Notes

### Binary Distribution

- The `dist/` directory is intentionally not in `.gitignore`
- Always run `npm run build` before committing
- Package exposes `creative-thinking` command via `dist/index.js`
- Uses `prepublishOnly` script for npm publish

### Security Considerations

- Never log sensitive information
- Validate all inputs
- Use secure random generation
- Follow principle of least privilege
- No network calls without user consent

### Performance Considerations

- Monitor memory usage
- Implement proper cleanup
- Use streaming for large data
- Cache expensive computations
- Profile before optimizing

## Getting Help

- Check existing issues on GitHub
- Review test files for examples
- Look at implementation patterns
- Ask questions in discussions
- Submit detailed bug reports

## Contributing Checklist

Before submitting a PR:

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm run test:run`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] PR description is detailed
- [ ] No console.log statements
- [ ] Error handling is comprehensive
- [ ] Performance impact considered

Thank you for contributing to the Creative Thinking MCP Server!
