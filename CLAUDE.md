# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Creative Thinking MCP Server** implementing a three-layer tool architecture for structured problem-solving. The server provides eight enhanced thinking techniques through a unified framework that combines generative creativity with systematic risk assessment.

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
- **Eight thinking techniques**: Six Hats, PO, Random Entry, SCAMPER, Concept Extraction, Yes And, Design Thinking, TRIZ
- **Session management**: Full state persistence with branching and revision support
- **Visual output**: Structured console output with progress tracking
- **Option Generation Engine**: Automatic activation when flexibility < 0.4 with 8 generation strategies
- **Ergodicity tracking**: Path dependency awareness and absorbing barrier detection
- **Early Warning System**: Multi-level alerts for approaching creative constraints

### Key Types and Interfaces
```typescript
type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper' | 'concept_extraction' | 'yes_and' | 'design_thinking' | 'triz';
type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green';
type ScamperAction = 'substitute' | 'combine' | 'adapt' | 'modify' | 'put_to_other_use' | 'eliminate' | 'reverse';
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

## Unified Framework Integration

The implementation now supports the unified generative/adversarial framework from SPECIFICATIONS.md:

1. **Dual Thinking Mode Indicators**: Visual indicators (✨ creative, ⚠️ critical) show current mode
2. **Risk/Adversarial Fields**: All techniques support risks, failureModes, mitigations, antifragileProperties, blackSwans
3. **Meta-Learning Metrics**: Sessions track creativityScore, risksCaught, antifragileFeatures
4. **Enhanced Visual Output**: Risk sections (yellow) and mitigations (green) displayed separately

## Important Implementation Details

1. **Session ID Generation**: Uses UUID for secure, unique IDs (format: `session_${randomUUID()}`)
2. **Revision Support**: Creates branches in session history for exploring alternatives
3. **Session Completion**: When `nextStepNeeded` is false, triggers insight extraction and session summary
4. **Error Handling**: Validates parameters and provides clear error messages
5. **Type Safety**: Comprehensive TypeScript types for all parameters and returns
6. **Visual Formatting**: 
   - Uses chalk.bold for headers
   - Technique-specific colors (blue, red, yellow, green, etc.)
   - Box drawing with ┌─┐│└┘ characters
   - Progress indicators with filled/empty circles
7. **Step Validation**: Ensures steps are sequential and within bounds for each technique
8. **Technique Step Counts**:
   - Six Hats: 6 steps (one per thinking hat)
   - PO: 4 steps (provocation → exploration → verification → solution)
   - Random Entry: 3 steps (stimulus → connections → validation)
   - SCAMPER: 7 steps (one per transformation action)
   - Concept Extraction: 4 steps (identify → extract → abstract → apply)
   - Yes, And: 4 steps (accept → build → evaluate → integrate)
   - Design Thinking: 5 steps (empathize → define → ideate → prototype → test)
   - TRIZ: 4 steps (identify → remove → apply → minimize)

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

**This is a hard constraint that must never be violated.** All functionality must be integrated into these three tools:
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

## Code Submission Guidelines

## Pre-Commit Checklist (MANDATORY)
1. **Run build**: `npm run build` to ensure TypeScript compiles
2. **Run tests**: `npm run test:run` for affected areas
3. **Run lint LAST**: `npm run lint` (fix with `npm run lint -- --fix`)
4. **NEVER commit if ANY of the above fail**

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
- **Note**: The `dist/` directory is intentionally not in `.gitignore` for GitHub distribution via npx
- **Publishing**: Uses `prepublishOnly` script to ensure fresh build before npm publish
- **npm Packaging**: `.npmignore` excludes source files, keeping only compiled output