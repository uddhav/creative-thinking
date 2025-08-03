# Performance Benchmarks

This directory contains performance benchmark baselines and results for the Creative Thinking MCP
Server.

## Overview

Performance benchmarks are automatically run:

- On every pull request to detect regressions
- Nightly to track performance trends
- On pushes to main to update baselines

## Metrics Tracked

### Concurrent Operations

- **Discovery Requests**: Time to handle 50 concurrent discovery operations
- **Planning Sessions**: Time to create 100 concurrent planning sessions
- **Step Executions**: Time to execute 100 concurrent thinking steps

### Large Session Handling

- **100 Steps Session**: Time and memory usage for a session with 100 steps
- **Memory Growth**: Track memory usage patterns during long sessions

### System Limits

- **Concurrent Sessions**: Maximum concurrent sessions without degradation
- **Response Times**: Average, P95, and P99 response times

## Performance Thresholds

- **Regression Alert**: Performance degradation > 10%
  - **Rationale**: 10% allows for normal variance while catching real regressions
  - Accounts for CI environment overhead and measurement noise
  - Prevents false positives from minor fluctuations
- **Warning**: Performance degradation > 5%
  - Early indicator of potential issues
  - Triggers closer monitoring but doesn't block
- **Improvement**: Performance improvement > 5%
  - Celebrates optimization wins
  - May trigger baseline updates

### Expected Performance Ranges

See [PERFORMANCE_BASELINES.md](./PERFORMANCE_BASELINES.md) for detailed performance expectations for
each operation type.

## Running Locally

```bash
# Run performance tests
npm run test:performance

# Run with custom timeout multiplier
PERF_TIMEOUT_MULTIPLIER=2 npm run test:performance

# Run with GC exposed for memory metrics
node --expose-gc ./node_modules/.bin/vitest run src/__tests__/integration/performance.test.ts
```

## Baseline Management

Baselines are stored as JSON files and versioned with the code. They are automatically updated when:

- A new release is created
- Manual update via workflow dispatch
- Significant performance improvements are merged

## Interpreting Results

- **Duration**: Lower is better (measured in milliseconds)
- **Memory Usage**: Lower is better (measured in MB)
- **Throughput**: Higher is better (operations per second)

## CI Setup Guide

To enable performance benchmarking in your repository:

1. **Enable GitHub Actions**: Ensure Actions are enabled in your repository settings
2. **Set up cache permissions**: The workflow uses actions/cache for baseline storage
3. **Configure branch protection**: Add performance checks to your PR requirements
4. **Set environment variables** (optional):
   - `PERF_TIMEOUT_MULTIPLIER`: Adjust timeouts for slower environments (default: 1)
   - `DISABLE_PERFORMANCE_TESTS`: Skip performance tests entirely

### Workflow Triggers

- **Pull Requests**: Runs on every PR to `main` branch
- **Push to main**: Updates baselines
- **Scheduled**: Nightly runs at 2 AM UTC
- **Manual**: Use workflow_dispatch for on-demand runs

## Historical Trending

Performance trends can be analyzed by:

1. **Viewing workflow history**: Check Actions tab for historical runs
2. **Downloading artifacts**: Each run uploads benchmark results
3. **Using analysis script**: `npm run analyze:performance` (if available)
4. **Baseline comparison**: Compare current vs historical baselines

### Trend Analysis

Look for:

- Gradual performance degradation over time
- Sudden spikes after specific commits
- Patterns related to code size growth
- Memory usage trends

## Environment Differences

Performance varies between environments:

| Environment       | Expected Variance   | Key Factors                   |
| ----------------- | ------------------- | ----------------------------- |
| Local Development | -20% to baseline    | Better CPU, more memory       |
| GitHub Actions    | +20-30% to baseline | Shared resources, network I/O |
| Docker            | +10-15% to baseline | Virtualization overhead       |

Adjust expectations accordingly when comparing results.

## Troubleshooting

If performance tests fail:

1. **Check environment factors**:
   - CI runners may be under heavy load
   - Use `PERF_TIMEOUT_MULTIPLIER=2` for slower environments
2. **Verify no resource leaks**:
   - Check memory growth patterns
   - Look for unclosed resources
   - Review session cleanup

3. **Review recent changes**:
   - Profile new code paths
   - Check for blocking operations
   - Analyze algorithm complexity

4. **Debug with detailed logs**:
   - Enable verbose logging
   - Check memory snapshots
   - Use performance profiler
