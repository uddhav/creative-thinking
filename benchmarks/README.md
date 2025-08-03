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

## Thresholds

- **Regression Alert**: Performance degradation > 10%
- **Warning**: Performance degradation > 5%
- **Improvement**: Performance improvement > 5%

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

## Troubleshooting

If performance tests fail:

1. Check if timeouts need adjustment for CI environment
2. Verify no resource leaks in new code
3. Review session cleanup and memory management
4. Check for unnecessary blocking operations
