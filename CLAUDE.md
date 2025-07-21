# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Creative Thinking MCP Server** that implements a unified creative-adversarial framework combining generative thinking techniques with systematic verification and risk assessment. The server provides six enhanced methodologies: Six Thinking Hats Plus (with Black Swan awareness), PO with Systematic Verification, Random Entry with Systematic Doubt, SCAMPER with Pre-Mortem Analysis, Concept Extraction with Failure Mode Analysis, and Yes, And with Critical Evaluation.

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
# - All tests use Vitest framework with coverage reporting
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

Note: No test suite is included in this project.

## Architecture

### Core Structure
- **Single file implementation**: All server logic is in `src/index.ts`
- **Single tool design**: Exposes one `lateralthinking` tool with technique-specific parameters
- **Session management**: Maintains state across multiple thinking steps with revision support
- **Visual output**: Uses chalk for colored, formatted console output with emojis and box-drawing

### Key Types and Interfaces
```typescript
type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper' | 'concept_extraction' | 'yes_and';
type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green';
type ScamperAction = 'substitute' | 'combine' | 'adapt' | 'modify' | 'put_to_other_use' | 'eliminate' | 'reverse';

interface LateralThinkingArgs {
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
    input: LateralThinkingArgs;
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
4. Handle the single `lateralthinking` tool with parameter validation

### Visual Output System
- Uses chalk for terminal colors
- Emojis as technique indicators (🎩, 💥, 🎲, 🔄, 🔍, 🤝)
- Box-drawing characters for structured display
- Controlled by `DISABLE_THOUGHT_LOGGING` environment variable

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
   - Six Hats Plus: 6 steps (enhanced hat colors with meta-awareness)
   - PO Verified: 4 steps (provocation, verify provocation, extract & test principles, develop robust solutions)
   - Random Entry Doubted: 3 steps (stimulus, connections with doubt, validated solutions)
   - SCAMPER Pre-Mortem: 7 steps (each action with "what could go wrong?" analysis)
   - Concept Extraction Bounded: 4 steps (identify, extract with limitations, abstract with boundaries, apply with risk assessment)
   - Yes, And Evaluated: 4 steps (accept (yes), build (and), evaluate risks (but), integrate)

## Code Style Guidelines

- Use TypeScript strict mode
- Async/await pattern for all asynchronous operations
- Comprehensive error messages with actionable guidance
- Consistent use of template literals for string formatting
- Visual output should be clear and structured with proper spacing

## Package Distribution

- **Binary**: The package exposes a `creative-thinking` command via `dist/index.js`
- **Note**: The `dist/` directory is intentionally not in `.gitignore` for GitHub distribution via npx
- **Publishing**: Uses `prepublishOnly` script to ensure fresh build before npm publish
- **npm Packaging**: `.npmignore` excludes source files, keeping only compiled output