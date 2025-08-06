# Parallel Execution Examples

This directory contains example code demonstrating various aspects of the parallel execution feature
in the Creative Thinking MCP Server.

## Examples

### 1. Basic Parallel Execution (`basic.ts`)

Demonstrates the fundamentals of running multiple thinking techniques in parallel.

**Key concepts:**

- Creating a parallel execution plan
- Running techniques simultaneously
- Measuring performance improvements
- Comparing with sequential execution

**Run:**

```bash
npm run build
node dist/examples/parallel-execution/basic.js
```

### 2. Advanced Convergence Strategies (`convergence.ts`)

Shows how to use different convergence strategies to synthesize results from parallel sessions.

**Key concepts:**

- Merge strategy: Combining all insights
- Select strategy: Choosing best insights
- Hierarchical strategy: Organizing by importance
- Convergence metadata and quality metrics

**Run:**

```bash
npm run build
node dist/examples/parallel-execution/convergence.js
```

### 3. Progress Monitoring (`monitoring.ts`)

Demonstrates real-time monitoring of parallel execution progress.

**Key concepts:**

- Real-time progress updates
- Session-level metrics
- Group-level statistics
- Performance analytics
- Metrics export for analysis

**Run:**

```bash
npm run build
node dist/examples/parallel-execution/monitoring.js
```

### 4. Error Handling (`error-handling.ts`)

Shows best practices for handling errors in parallel execution scenarios.

**Key concepts:**

- Timeout handling
- Invalid step recovery
- Dependency failures
- Partial success scenarios
- Using Promise.allSettled()
- Error context and debugging

**Run:**

```bash
npm run build
node dist/examples/parallel-execution/error-handling.js
```

## Common Patterns

### Setting Up Dependencies

All examples start by initializing the required dependencies:

```typescript
const sessionManager = new SessionManager();
const techniqueRegistry = new TechniqueRegistry();
const visualFormatter = new VisualFormatter();
const metricsCollector = new MetricsCollector();
const complexityAnalyzer = new HybridComplexityAnalyzer();
const ergodicityManager = new ErgodicityManager();
```

### Creating Parallel Plans

Enable parallel execution by setting the execution mode:

```typescript
const planInput: PlanThinkingSessionInput = {
  problem: 'Your problem statement',
  techniques: ['six_hats', 'scamper', 'po'],
  executionMode: 'parallel',
  timeframe: 'thorough',
};

const plan = await planThinkingSession(planInput, sessionManager, techniqueRegistry);
```

### Executing in Parallel

Use Promise.all() or Promise.allSettled() for parallel execution:

```typescript
const results = await Promise.all(
  techniques.map(technique => executeThinkingStep(input /* dependencies */))
);
```

### Monitoring Progress

Access the parallel execution context for monitoring:

```typescript
const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
const progressCoordinator = parallelContext.getProgressCoordinator();
const progress = await progressCoordinator.getGroupProgress(groupId);
```

## Performance Tips

1. **Choose independent techniques**: Techniques that don't depend on each other work best in
   parallel
2. **Use appropriate timeframes**: "quick" for rapid ideation, "thorough" for detailed analysis
3. **Monitor metrics**: Use execution metrics to identify bottlenecks
4. **Handle errors gracefully**: Use Promise.allSettled() to allow partial success
5. **Leverage convergence**: Synthesize results effectively with the right strategy

## Further Reading

- [Parallel Execution Documentation](../../docs/parallel-execution.md)
- [Architecture Overview](../../docs/architecture.md)
- [API Reference](../../docs/api-reference.md)
