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
interface LateralThinkingData {
  problem?: string;
  technique: 'six_thinking_hats' | 'po' | 'random_entry' | 'scamper';
  // Technique-specific parameters...
  session_id?: string;
  revision?: string;
  complete?: boolean;
}

interface SessionData {
  id: string;
  problem: string;
  technique: string;
  history: Array<{ timestamp: Date; step: any; result: any }>;
  branches: Map<string, SessionData>;
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

1. **Session ID Generation**: Uses timestamp-based IDs for uniqueness
2. **Revision Support**: Creates branches in session history for exploring alternatives
3. **Complete Flag**: Triggers insight extraction and session summary
4. **Error Handling**: Validates parameters and provides clear error messages
5. **Type Safety**: Comprehensive TypeScript types for all parameters and returns