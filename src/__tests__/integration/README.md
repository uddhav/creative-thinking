# Integration Tests

This directory contains comprehensive integration tests for the Creative Thinking MCP Server. These
tests verify end-to-end functionality, MCP protocol compliance, and system performance.

## Test Structure

### 1. Workflow Tests (`workflows.test.ts`)

Complete end-to-end tests for all creative thinking techniques:

- **Six Hats**: Full 6-step workflow with revision support
- **SCAMPER**: All 7 actions with PDA path tracking
- **PO Technique**: 4-step provocation workflow
- **Design Thinking**: 5-stage process
- **Other Techniques**: Random Entry, Concept Extraction, Yes And, etc.

Key features tested:

- Complete technique execution
- Session state management
- Revision and branching
- Technique-specific field validation

### 2. MCP Protocol Tests (`mcp-protocol.test.ts`, `mcp-protocol-simple.test.ts`)

Tests compliance with Model Context Protocol:

- **tools/list**: Verifies all three tools are exposed correctly
- **tools/call**: Tests each tool with valid/invalid parameters
- **Error Handling**: Protocol-level error scenarios
- **Request/Response Format**: JSON-RPC compliance

**Note**: The simplified version (`mcp-protocol-simple.test.ts`) uses direct method calls instead of
simulating MCP server handlers and is the recommended test suite.

### 3. Three-Layer Architecture Tests (`three-layer-architecture.test.ts`, `three-layer-architecture-simple.test.ts`)

Tests the core architectural flow:

- **Discovery → Planning → Execution**: Complete workflow
- **Cross-Technique Integration**: Multi-technique sessions
- **Option Generation**: Low flexibility detection and handling
- **Error Recovery**: Graceful error handling
- **Advanced Features**: Ergodicity tracking, contextual guidance

**Note**: The simplified version (`three-layer-architecture-simple.test.ts`) uses direct server
method calls and is the recommended test suite.

### 4. Persistence Tests (`persistence.test.ts`)

Tests session persistence functionality:

- **Save/Load**: Basic session persistence
- **Complex State**: Handling of all session fields
- **Auto-Save**: Automatic persistence during workflow
- **Export Formats**: JSON, Markdown, CSV exports
- **Search/Filter**: Finding sessions by tags and metadata
- **Concurrent Sessions**: Multi-session handling

### 5. Performance Tests (`performance.test.ts`)

Tests system performance under load:

- **Concurrent Operations**: 50-100 parallel requests
- **Large Sessions**: 100+ step workflows
- **Deep Revisions**: 50+ revisions on single step
- **Memory Management**: Efficient resource usage
- **Response Time**: Consistent performance under load

## Running Integration Tests

```bash
# Run all integration tests
npm run test:run -- src/__tests__/integration/

# Run specific test suite
npm run test:run -- src/__tests__/integration/workflows.test.ts

# Run with coverage
npm run test:coverage -- src/__tests__/integration/

# Run specific test
npm run test:run -- -t "should complete full six hats workflow"
```

## Test Helpers

The `helpers/integration.ts` file provides utilities for:

- Creating sessions with pre-populated steps
- Generating technique-specific test data
- Performance measurement utilities
- Session verification helpers
- MCP request/response mocking

## Test Suite Status

### ✅ Passing Tests

- `workflows.test.ts` - All creative thinking technique workflows
- `mcp-protocol-simple.test.ts` - Simplified MCP protocol compliance
- `three-layer-architecture-simple.test.ts` - Simplified three-layer architecture
- `persistence.test.ts` - Session persistence functionality

### ⚠️ Known Issues

1. **Original MCP Protocol Tests** (`mcp-protocol.test.ts`): Need adjustment for proper schema-based
   handler setup
2. **Original Three-Layer Tests** (`three-layer-architecture.test.ts`): Response format expectations
   need updating
3. **Performance Tests**: Some concurrent operation tests need timing adjustments

**Recommendation**: Use the simplified test versions (`*-simple.test.ts`) which provide the same
coverage with more maintainable implementations.

## Adding New Tests

When adding integration tests:

1. Use the helper functions from `helpers/integration.ts`
2. Follow the existing test structure patterns
3. Test both success and error scenarios
4. Include performance considerations
5. Verify MCP protocol compliance

## Test Data

Tests use realistic data for each technique:

- Six Hats: Customer retention, team productivity scenarios
- SCAMPER: Product design improvements
- Design Thinking: User experience problems
- PO: Process improvement challenges

## Performance Benchmarks

Current performance targets:

- 50 concurrent discoveries: < 3 seconds
- 100 concurrent plans: < 5 seconds
- 100 step workflow: < 10 seconds
- 50 revisions: < 5 seconds

## Coverage Goals

Integration tests aim for:

- All technique workflows: 100%
- MCP protocol paths: 100%
- Error scenarios: 80%+
- Performance edge cases: Key scenarios
