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

#### Thinking Techniques (14 total)

- **Six Hats** - Parallel thinking with different perspectives (6 steps)
- **PO** - Provocative operation for creative disruption (4 steps)
- **Random Entry** - Lateral connection from random stimuli (3 steps)
- **SCAMPER** - Systematic transformation checklist (8 steps)
- **Concept Extraction** - Abstract patterns from success (4 steps)
- **Yes, And** - Build on ideas collaboratively (4 steps)
- **Design Thinking** - Human-centered design process (5 steps)
- **TRIZ** - Systematic innovation methodology (4 steps)
- **Neural State** - Optimize cognitive states (4 steps)
- **Temporal Work** - Time-based perspective shifts (5 steps)
- **Cross-Cultural** - Diverse cultural perspectives (5 steps)
- **Collective Intelligence** - Harness group wisdom (5 steps)
- **Disney Method** - Three roles for creative planning (3 steps)
- **Nine Windows** - Systematic innovation matrix (9 steps)

#### Support Systems

- **Session Management** - Full state persistence with branching
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

### Adding New Techniques

When adding a new thinking technique:

1. Update `LateralTechnique` type
2. Add matching logic in `discoverTechniques()`
3. Implement workflow generation in `planThinkingSession()`
4. Ensure proper step handling in `executeThinkingStep()`
5. Include unified framework fields (risks, mitigations, etc.)
6. Add comprehensive tests
7. Update documentation

## Parallel Execution

### Overview

Parallel execution allows multiple thinking techniques to run simultaneously, providing **2-3x performance improvement** while maintaining the quality of insights. This is particularly useful when exploring complex problems that benefit from multiple perspectives.

### Key Features

- **Automatic parallelism detection**: The system identifies techniques that can run in parallel
- **Smart dependency management**: Techniques with dependencies execute in the correct order
- **Real-time progress tracking**: Monitor the status of all parallel sessions
- **Convergence synthesis**: Automatically combine insights from parallel sessions
- **Timeout protection**: Prevents runaway sessions with configurable timeouts
- **Performance metrics**: Track efficiency and optimization opportunities

### Architecture Components

1. **ParallelismDetector**: Identifies which techniques can run in parallel
2. **ParallelPlanGenerator**: Creates execution plans with parallel groups
3. **SessionSynchronizer**: Manages shared context between parallel sessions
4. **ProgressCoordinator**: Tracks and reports progress across sessions
5. **SessionTimeoutMonitor**: Prevents runaway sessions
6. **ConvergenceExecutor**: Synthesizes results from parallel sessions
7. **ParallelExecutionMetrics**: Collects performance data

### Implementation Details

#### Enabling Parallel Execution

Set the `executionMode` to `'parallel'` when planning a thinking session:

```typescript
const input: PlanThinkingSessionInput = {
  problem: 'How can we improve customer satisfaction?',
  techniques: ['six_hats', 'scamper', 'po'],
  executionMode: 'parallel', // Enable parallel execution
  timeframe: 'thorough',
};
```

#### Convergence Strategies

- **merge**: Combine all insights from parallel sessions
- **select**: Choose the best insights based on quality metrics
- **hierarchical**: Organize insights by importance and relevance

#### Timeout Configuration

- **quick**: 30 seconds per session
- **thorough**: 5 minutes per session
- **comprehensive**: 15 minutes per session

### Performance Benchmarks

| Techniques | Sequential Time | Parallel Time | Speedup | Efficiency |
| ---------- | --------------- | ------------- | ------- | ---------- |
| 2          | 217ms           | 131ms         | 1.66x   | 82.8%      |
| 3          | 466ms           | 267ms         | 1.75x   | 58.2%      |
| 4          | 681ms           | 261ms         | 2.61x   | 65.2%      |
| 5          | 841ms           | 263ms         | 3.20x   | 63.9%      |
| 6          | 962ms           | 258ms         | 3.72x   | 62.1%      |

### Best Practices

1. **Choose independent techniques**: Techniques that don't depend on each other work best in parallel
2. **Set reasonable timeframes**: Use "quick" for rapid ideation, "thorough" for detailed analysis
3. **Handle failures gracefully**: Use Promise.allSettled() to allow partial success
4. **Monitor metrics**: Use execution metrics to identify bottlenecks
5. **Use appropriate convergence strategies**: Choose based on your synthesis needs

### Example Usage

See the [examples directory](examples/parallel-execution/) for complete working examples:

- [Basic parallel execution](examples/parallel-execution/basic.ts)
- [Advanced convergence strategies](examples/parallel-execution/convergence.ts)
- [Progress monitoring](examples/parallel-execution/monitoring.ts)
- [Error handling](examples/parallel-execution/error-handling.ts)

## Error Handling

### Error Code Ranges

| Range     | Category      | Description                               |
| --------- | ------------- | ----------------------------------------- |
| E100-E199 | Validation    | Input validation and parameter errors     |
| E200-E299 | Workflow      | Workflow sequence and process errors      |
| E300-E399 | State         | Session and state management errors       |
| E400-E499 | System        | System-level and infrastructure errors    |
| E500-E599 | Permission    | Access control and rate limiting          |
| E600-E699 | Configuration | Configuration and setup errors            |
| E700-E799 | Technique     | Technique execution errors                |
| E800-E899 | Convergence   | Parallel execution and convergence errors |
| E999      | Unknown       | Unhandled or unexpected errors            |

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

On push to main branch:

1. Analyze commits since last release
2. Determine version bump
3. Update CHANGELOG.md
4. Create GitHub release
5. Update package.json version

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
