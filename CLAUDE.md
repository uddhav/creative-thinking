# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

This is a **Creative Thinking MCP Server** implementing a three-layer tool architecture for
structured problem-solving. The server provides fourteen enhanced thinking techniques through a
unified framework that combines generative creativity with systematic risk assessment.

## Development Commands

### Build and Run

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript and set executable permissions
npm run dev          # Run TypeScript compiler in watch mode
npm start            # Run the compiled server
```

### Testing

```bash
# Run tests
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report

# The project includes comprehensive test suites:
# - Export functionality tests (CSV, JSON, Markdown exporters)
# - Persistence adapter tests (filesystem operations)
# - Option Generation Engine tests (all 8 strategies, evaluation, caching)
# - Layered tools architecture tests (discovery, planning, execution)
# - Ergodicity and path dependency tracking tests
# - Early warning system and escape protocol tests
# - All tests use Vitest v3 framework with coverage reporting
```

### Running the Server

```bash
# Run the server directly after building
node dist/index.js

# Test with npx (after publishing)
npx -y github:uddhav/creative-thinking
```

### Docker Usage

```bash
# Build Docker image
docker build -t creative-thinking .

# Run the server in Docker
docker run -it creative-thinking
```

## Architecture

### Core Structure

- **Three-layer architecture**: Discovery, Planning, and Execution layers
- **Three primary tools**: `discover_techniques`, `plan_thinking_session`, `execute_thinking_step`
- **Fourteen thinking techniques**: Six Hats, PO, Random Entry, SCAMPER, Concept Extraction, Yes
  And, Design Thinking, TRIZ, Neural State, Temporal Work, Cross-Cultural, Collective Intelligence,
  Disney Method, Nine Windows
- **Session management**: Full state persistence with branching and revision support
- **Visual output**: Structured console output with progress tracking
- **Option Generation Engine**: Automatic activation when flexibility < 0.4 with 12 generation
  strategies
- **Ergodicity tracking**: Path dependency awareness and absorbing barrier detection
- **Early Warning System**: Multi-level alerts for approaching creative constraints
- **Error Context Builder**: Centralized error handling with actionable guidance
- **Orchestrator Pattern**: Complex workflow management (Ergodicity, Risk Assessment, Response
  Building)
- **Export System**: Multi-format support (JSON, CSV, Markdown)
- **Validation Strategy**: Comprehensive input validation
- **Persistence Architecture**: Adapter pattern with filesystem and memory backends

### Key Types and Interfaces

```typescript
type LateralTechnique =
  | 'six_hats'
  | 'po'
  | 'random_entry'
  | 'scamper'
  | 'concept_extraction'
  | 'yes_and'
  | 'design_thinking'
  | 'triz'
  | 'neural_state'
  | 'temporal_work'
  | 'cross_cultural'
  | 'collective_intel'
  | 'disney_method'
  | 'nine_windows';
type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green';
type ScamperAction =
  | 'substitute'
  | 'combine'
  | 'adapt'
  | 'modify'
  | 'put_to_other_use'
  | 'eliminate'
  | 'reverse'
  | 'parameterize';
type DisneyRole = 'dreamer' | 'realist' | 'critic';
type DesignThinkingStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test';

// Layer-specific interfaces
interface DiscoverTechniquesInput {
  problem: string;
  context?: string;
  preferredOutcome?: 'innovative' | 'systematic' | 'risk-aware' | 'collaborative' | 'analytical';
  constraints?: string[];
}

interface PlanThinkingSessionInput {
  problem: string;
  techniques: LateralTechnique[];
  objectives?: string[];
  constraints?: string[];
  timeframe?: 'quick' | 'thorough' | 'comprehensive';
}

interface ExecuteThinkingStepInput {
  technique: LateralTechnique;
  problem: string;
  currentStep: number;
  totalSteps: number;
  output: string;
  nextStepNeeded: boolean;

  // Technique-specific parameters
  hatColor?: SixHatsColor;
  provocation?: string;
  principles?: string[];
  randomStimulus?: string;
  connections?: string[];
  scamperAction?: ScamperAction;

  // Concept Extraction specific
  successExample?: string;
  extractedConcepts?: string[];
  abstractedPatterns?: string[];
  applications?: string[];

  // Yes, And... specific
  initialIdea?: string;
  additions?: string[];
  evaluations?: string[];
  synthesis?: string;

  // Unified Framework: Risk/Adversarial fields
  risks?: string[];
  failureModes?: string[];
  mitigations?: string[];
  antifragileProperties?: string[];
  blackSwans?: string[];

  // Advanced features
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;
}

interface SessionState {
  problem: string;
  technique: LateralTechnique;
  currentStep: number;
  totalSteps: number;
  history: Array<{
    step: number;
    timestamp: string;
    input: ExecuteThinkingStepInput;
    output: any;
  }>;
  branches: Map<string, SessionState>;
  insights: string[];
}
```

### MCP Implementation Pattern

The server follows the standard MCP server pattern:

1. Initialize with `Server` from `@modelcontextprotocol/sdk`
2. Set up stdio transport
3. Implement request handlers for `tools/list` and `tools/call`
4. Route requests to appropriate tool handlers:
   - `discover_techniques` → `discoverTechniques()`
   - `plan_thinking_session` → `planThinkingSession()`
   - `execute_thinking_step` → `executeThinkingStep()`

### Visual Output System

- Chalk for terminal colors and formatting
- Progress indicators with visual feedback
- Structured display with box-drawing characters
- Environment variable `DISABLE_THOUGHT_LOGGING` for output control

### MCP Protocol Compliance

**CRITICAL**: This server implements the Model Context Protocol (MCP) which requires strict
separation of concerns:

1. **stdout is reserved for JSON-RPC only** - No visual output, debug messages, or console.log()
   calls should write to stdout
2. **stderr is for visual output and debugging** - All visual formatting, progress indicators, and
   debug messages must use process.stderr.write()
3. **ESLint enforcement** - The project includes ESLint rules that prevent stdout pollution:
   - No `process.stdout.write()` calls
   - No `console.log()` calls (use `console.error()` instead)
4. **Testing** - The MCP protocol compliance test
   (`src/__tests__/integration/mcp-protocol-compliance.test.ts`) verifies:
   - All stdout output is valid JSON-RPC
   - Visual output goes to stderr
   - All 14 techniques comply with protocol requirements

When developing new features or modifying existing code:

- Always use `process.stderr.write()` for visual output
- Use `console.error()` instead of `console.log()` for debugging
- Run the MCP compliance test to verify protocol adherence

## Unified Framework Integration

The implementation now supports the unified generative/adversarial framework from SPECIFICATIONS.md:

1. **Dual Thinking Mode Indicators**: Visual indicators (✨ creative, ⚠️ critical) show current mode
2. **Risk/Adversarial Fields**: All techniques support risks, failureModes, mitigations,
   antifragileProperties, blackSwans
3. **Meta-Learning Metrics**: Sessions track creativityScore, risksCaught, antifragileFeatures
4. **Enhanced Visual Output**: Risk sections (yellow) and mitigations (green) displayed separately

## Important Implementation Details

1. **Session ID Generation**: Uses UUID for secure, unique IDs (format: `session_${randomUUID()}`)
2. **Revision Support**: Creates branches in session history for exploring alternatives
3. **Session Completion**: When `nextStepNeeded` is false, triggers insight extraction and session
   summary
4. **Error Handling**: Validates parameters and provides clear error messages with
   ErrorContextBuilder
5. **Type Safety**: Comprehensive TypeScript types for all parameters and returns
6. **Visual Formatting**:
   - Uses chalk.bold for headers
   - Technique-specific colors (blue, red, yellow, green, etc.)
   - Box drawing with ┌─┐│└┘ characters
   - Progress indicators with filled/empty circles
   - Mode indicators (✨ creative, ⚠️ critical)
   - Warning levels (🟢 SAFE, 🟡 CAUTION, 🟠 WARNING, 🔴 CRITICAL)
7. **Step Validation**: ExecutionValidator ensures steps are sequential and within bounds
8. **Option Generation Strategies**: 12 total (8 core + 4 enhanced)
   - Core: Decomposition, Temporal, Abstraction, Inversion, Stakeholder, Resource, Capability,
     Recombination
   - Enhanced: Neural Optimization, Temporal Flexibility, Cultural Bridging, Collective Divergence
9. **Early Warning Sensors**: ResourceMonitor, CognitiveAssessor, TechnicalDebtAnalyzer
10. **Escape Protocols**: 5 levels from Pattern Interruption to Strategic Pivot
11. **Export Formats**: JSON (full fidelity), CSV (tabular), Markdown (human-readable)
12. **Technique Step Counts**:

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

13. **Disney Method Guidance**:

- Dreamer step: Encourage wild, unconstrained ideas without judgment
- Realist step: Focus on practical implementation and resource requirements
- Critic step: Identify risks and gaps constructively, not destructively
- Track path dependencies between roles - decisions in one role affect others
- Consider multiple cycles through the roles for refinement

14. **Nine Windows Guidance**:

- Work systematically through the 3×3 grid (time × system levels)
- Start with present system (step 5) as the anchor point
- Look for patterns across time dimensions (vertical connections)
- Identify constraints at different system levels (horizontal connections)
- Use insights from past to predict future trends
- Track how sub-system changes propagate to super-system level

## Session Management and Persistence

### AutoSave Feature

The `execute_thinking_step` tool supports an optional `autoSave` parameter:

- When `autoSave: true`, the system attempts to save session data to persistent storage
- Persistence is **optional** - the tool works perfectly without it
- Sessions are always stored in memory during active use

### Persistence Configuration

Persistence can be configured via environment variables:

- `PERSISTENCE_TYPE`: `filesystem` (default) or `memory`
- `PERSISTENCE_PATH`: Directory for filesystem storage (default: `.creative-thinking`)

### AutoSave Behavior

When `autoSave: true` is used:

1. **If persistence is configured**: Session data is saved to disk/storage
2. **If persistence is not configured**:
   - Response includes `autoSaveStatus: "disabled"`
   - Message explains: "Persistence is not configured. Session data is stored in memory only."
3. **If save fails**:
   - Response includes `autoSaveStatus: "failed"` and error details
   - Session continues normally (memory storage is unaffected)

### Important Notes

- **Persistence is optional**: The tool is fully functional without persistence
- **Memory-only mode**: Default behavior when persistence is not configured
- **Graceful degradation**: Persistence failures don't interrupt the thinking process
- **Session lifetime**: In-memory sessions last for the duration of the server process

## Architecture Principles

### Three-Layer Design (Core Principle)

All features must integrate with the layered architecture:

1. **Discovery** - Problem analysis and technique recommendation
2. **Planning** - Workflow creation and step sequencing
3. **Execution** - Guided implementation with state management

### Fundamental Design Decision: Three Tools Only

**IMPORTANT**: This MCP server exposes EXACTLY three tools, no more, no less:

- `discover_techniques` - Analyzes problems and recommends techniques
- `plan_thinking_session` - Creates structured workflows
- `execute_thinking_step` - Executes individual steps in the workflow

**This is a hard constraint that must never be violated.** All functionality must be integrated into
these three tools:

- Escape velocity analysis → Internal to discovery/planning phases
- Option generation → Automatic within discovery when flexibility is low
- Session management → Internal state management
- Any future features → Must be integrated into the existing three-tool workflow

Rationale:

- Clean, focused API that mirrors the natural workflow
- Prevents tool proliferation and API complexity
- Forces thoughtful integration of new features
- Maintains consistency with the three-layer architecture

### Adding New Techniques

When adding new thinking techniques:

1. Update `LateralTechnique` type
2. Add matching logic in `discoverTechniques()`
3. Implement workflow generation in `planThinkingSession()`
4. Ensure proper step handling in `executeThinkingStep()`
5. Include unified framework fields (risks, mitigations, etc.)

## Code Style Guidelines

- TypeScript strict mode required
- Async/await for all asynchronous operations
- Clear, actionable error messages
- Consistent formatting and naming conventions

## Testing Infrastructure

The project includes comprehensive test coverage:

- **Unit Tests**: All core components (strategies, validators, builders)
- **Integration Tests**: Full workflow testing, MCP protocol compliance
- **Performance Tests**: Option generation benchmarks, memory profiling
- **Coverage Target**: >80% across all modules

Test organization:

```
src/__tests__/
├── core/                    # Core component tests
├── ergodicity/             # Ergodicity system tests
├── export/                 # Export functionality tests
├── integration/            # MCP protocol compliance
├── layers/                 # Layer architecture tests
├── persistence/            # Storage adapter tests
└── option-generation-engine-extended.test.ts
```

## Code Submission Guidelines

Run tasks with subagents in order to preserve main agent context.

## Pre-Commit Checklist (MANDATORY)

1. **Run build**: `npm run build` to ensure TypeScript compiles and dist is updated
2. **Run tests**: `npm run test:run` for affected areas
3. **Run lint LAST**: `npm run lint` (fix with `npm run lint -- --fix`)
4. **NEVER commit if ANY of the above fail**
5. **Commit dist files**: Always commit updated dist files with src changes

## Dist File Management

- The `dist/` directory is NOT gitignored to support GitHub distribution via npx
- Always run `npm run build` after modifying src files
- Commit dist changes together with src changes
- Pre-push hook will prevent pushing with uncommitted dist files
- Pre-push hook warns if src is newer than dist

## PR Review Process

1. **ALWAYS run** `gh pr diff <PR>` to see actual changes before merging
2. **NEVER merge** when review says "NEEDS FIXES" or "DO NOT MERGE"
3. **Read ENTIRE review**, especially "Required Fixes" sections
4. **Verify MCP integration** for new techniques:
   - Check planning tool enum at src/index.ts (~line 3631-3640)
   - Check execution tool enum at src/index.ts (~line 3692-3701)
   - Add technique fields to execution tool schema
   - Test through MCP protocol, not just unit tests

## Integration Testing

- Unit tests passing ≠ Feature complete
- New techniques MUST be accessible through MCP interface
- Always test the full user path, not just internal implementation

## Package Distribution

- **Binary**: The package exposes a `creative-thinking` command via `dist/index.js`
- **Note**: The `dist/` directory is intentionally not in `.gitignore` for GitHub distribution via
  npx
- **Publishing**: Uses `prepublishOnly` script to ensure fresh build before npm publish
- **npm Packaging**: `.npmignore` excludes source files, keeping only compiled output
