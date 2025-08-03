# Performance Monitoring Guide

This guide explains how to monitor, analyze, and troubleshoot performance issues in the Creative
Thinking MCP Server.

## Understanding Benchmark Results

### Reading the Output

Performance test output includes several key metrics:

```
[github-actions] 50 concurrent discoveries completed in 1234ms
[github-actions] Memory usage - Before: 85MB, After: 120MB, Increase: 35MB
```

Key components:

- **Environment**: `[github-actions]`, `[local]`, or `[docker]`
- **Duration**: Total time for the operation
- **Memory**: Heap usage before/after and delta

### Interpreting Results

#### Good Performance Indicators

- Durations within expected ranges (see PERFORMANCE_BASELINES.md)
- Linear memory growth with load
- Consistent results across runs
- Low variance between percentiles

#### Warning Signs

- Duration exceeding baseline by >10%
- Memory growth >2MB per session
- High variance between runs
- P99 significantly higher than P95

## Troubleshooting Performance Issues

### 1. Sudden Performance Degradation

**Symptoms**: Tests that previously passed now fail or show warnings

**Investigation Steps**:

1. Check recent commits for algorithmic changes
2. Review new dependencies added
3. Look for blocking operations
4. Profile the specific operation

**Common Causes**:

- Synchronous I/O operations
- Inefficient algorithms (O(n²) instead of O(n))
- Memory leaks preventing GC
- External service latency

### 2. Memory Growth Issues

**Symptoms**: Heap usage grows faster than expected

**Investigation Steps**:

1. Enable heap snapshots
2. Check for retained objects
3. Review session cleanup
4. Look for circular references

**Common Causes**:

- Sessions not being cleaned up
- Event listeners not removed
- Large objects in closures
- Caching without limits

### 3. CI-Specific Failures

**Symptoms**: Tests pass locally but fail in CI

**Investigation Steps**:

1. Check timeout multipliers
2. Review CI resource limits
3. Compare environments
4. Add detailed logging

**Common Causes**:

- Insufficient timeout buffer
- Memory limits in CI
- CPU throttling
- Network latency

## Performance Profiling

### Local Profiling

```bash
# Run with profiler
node --prof dist/index.js

# Generate flame graph
node --prof-process isolate-*.log > profile.txt

# Use Chrome DevTools
node --inspect dist/index.js
```

### Memory Profiling

```bash
# Heap snapshots
node --expose-gc --inspect dist/index.js

# In Chrome DevTools:
# 1. Take heap snapshot
# 2. Run operations
# 3. Take another snapshot
# 4. Compare snapshots
```

### CPU Profiling

```bash
# CPU profile
node --cpu-prof dist/index.js

# Analyze in Chrome DevTools
# 1. Load .cpuprofile file
# 2. Identify hot paths
# 3. Optimize bottlenecks
```

## Best Practices

### 1. Writing Performance Tests

- Use realistic data sizes
- Test edge cases
- Include memory checks
- Add environment context
- Clean up after tests

### 2. Optimizing Code

- Profile before optimizing
- Focus on hot paths
- Minimize allocations
- Use async operations
- Cache carefully

### 3. Monitoring Production

- Track key metrics
- Set up alerts
- Monitor trends
- Regular benchmarking
- Document baselines

## Integration with Monitoring Tools

### GitHub Actions Integration

The performance workflow automatically:

- Comments on PRs with results
- Stores historical data
- Alerts on regressions
- Uploads artifacts

### Custom Monitoring

Export metrics to monitoring systems:

```typescript
// Example: Export to Prometheus
const metrics = tracker.getAllMetrics();
metrics.forEach(metric => {
  prometheus.gauge(metric.name, metric.value, {
    environment: env.environmentName,
    unit: metric.unit,
  });
});
```

### Alerting

Set up alerts for:

- Performance regression >10%
- Memory usage >500MB
- P99 latency spikes
- Failed benchmarks

## Performance Optimization Checklist

### Before Optimization

- [ ] Profile to identify bottlenecks
- [ ] Establish baseline metrics
- [ ] Understand the root cause
- [ ] Consider trade-offs

### During Optimization

- [ ] Make one change at a time
- [ ] Measure impact of each change
- [ ] Document optimizations
- [ ] Update tests if needed

### After Optimization

- [ ] Verify improvements
- [ ] Update baselines
- [ ] Monitor for regressions
- [ ] Share learnings

## Common Performance Patterns

### 1. Batch Operations

```typescript
// Bad: Multiple individual operations
for (const item of items) {
  await processItem(item);
}

// Good: Batch processing
await Promise.all(items.map(processItem));
```

### 2. Lazy Loading

```typescript
// Bad: Load everything upfront
const allData = loadAllData();

// Good: Load on demand
const getData = lazy(() => loadData());
```

### 3. Object Pooling

```typescript
// Bad: Create new objects repeatedly
function process() {
  const buffer = new Buffer(1024);
  // use buffer
}

// Good: Reuse objects
const bufferPool = new ObjectPool(() => new Buffer(1024));
function process() {
  const buffer = bufferPool.acquire();
  // use buffer
  bufferPool.release(buffer);
}
```

## Reporting Performance Issues

When reporting performance issues, include:

1. **Environment Details**
   - OS and version
   - Node.js version
   - Hardware specs
   - Container/VM info

2. **Reproduction Steps**
   - Minimal code example
   - Data sizes used
   - Configuration

3. **Metrics**
   - Duration measurements
   - Memory usage
   - CPU usage
   - Comparison with baseline

4. **Analysis**
   - What you've tried
   - Profiling results
   - Suspected causes

## Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Chrome DevTools Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Performance Baselines](../benchmarks/PERFORMANCE_BASELINES.md)
- [CI Performance Workflow](.github/workflows/performance.yml)
