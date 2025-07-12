# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Creative Thinking MCP Server** that implements structured lateral thinking techniques as an MCP (Model Context Protocol) tool. The server provides four creativity methodologies: Six Thinking Hats, PO (Provocative Operation), Random Entry, and SCAMPER.

## Development Commands

### Build and Run
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript and set executable permissions
npm run dev          # Run TypeScript compiler in watch mode
npm start            # Run the compiled server
```

### Testing the Server
```bash
# Run the server directly after building
node dist/index.js

# Test with npx (after publishing)
npx -y github:uddhav/creative-thinking
```

## Architecture

### Core Structure
- **Single file implementation**: All server logic is in `src/index.ts`
- **Single tool design**: Exposes one `lateralthinking` tool with technique-specific parameters
- **Session management**: Maintains state across multiple thinking steps with revision support
- **Visual output**: Uses chalk for colored, formatted console output with emojis and box-drawing

### Key Types and Interfaces
```typescript
type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper';
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
- Emojis as technique indicators (🎩, 💥, 🎲, 🔄)
- Box-drawing characters for structured display
- Controlled by `DISABLE_THOUGHT_LOGGING` environment variable

## Important Implementation Details

1. **Session ID Generation**: Uses timestamp-based IDs for uniqueness (format: `session_${Date.now()}`)
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
   - Six Hats: 6 steps (one per hat color)
   - PO: 4 steps (provocation, suspend judgment, extract principles, develop ideas)
   - Random Entry: 3 steps (stimulus, connections, solutions)
   - SCAMPER: 7 steps (one per action)

## Code Style Guidelines

- Use TypeScript strict mode
- Async/await pattern for all asynchronous operations
- Comprehensive error messages with actionable guidance
- Consistent use of template literals for string formatting
- Visual output should be clear and structured with proper spacing