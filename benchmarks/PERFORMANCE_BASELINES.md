# Performance Baselines

This document defines the expected performance ranges for different operation types in the Creative
Thinking MCP Server. These baselines help identify performance regressions and guide optimization
efforts.

**Last Updated**: January 2025 (v0.6.0 with NLP support and 28 techniques)

## Expected Performance Ranges

### Concurrent Operations

#### Discovery Requests

- **Baseline**: 300-350ms for 50 concurrent requests (with NLP categorization)
- **Acceptable Range**: 250-400ms
- **CI Environment**: +20% overhead expected (300-480ms)
- **Memory Impact**: ~50MB heap growth

#### Planning Sessions

- **Baseline**: 12-15ms for 100 concurrent sessions
- **Acceptable Range**: 10-20ms
- **CI Environment**: +20% overhead expected (12-24ms)
- **Memory Impact**: ~100MB heap growth

#### Step Executions

- **Baseline**: 400-450ms for 100 concurrent steps
- **Acceptable Range**: 350-500ms
- **CI Environment**: +20% overhead expected (420-600ms)
- **Memory Impact**: ~150MB heap growth

### Large Session Handling

#### 100 Steps Session

- **Baseline**: 380-420ms total execution time
- **Acceptable Range**: 350-450ms
- **CI Environment**: +30% overhead expected (455-585ms)
- **Memory Impact**: ~200MB heap growth
- **Per-Step Average**: 3.8-4.2ms

#### Deep Revision Chains (50 revisions)

- **Baseline**: 180-220ms
- **Acceptable Range**: 150-250ms
- **CI Environment**: +25% overhead expected (188-313ms)
- **Memory Impact**: ~100MB heap growth

### Memory Usage

#### Heap Memory

- **Idle State**: 50-100MB
- **Active Sessions**: +2MB per session
- **Warning Threshold**: 500MB
- **Critical Threshold**: 1000MB

#### RSS Memory

- **Idle State**: 100-150MB
- **Active Sessions**: +3MB per session
- **Critical Threshold**: 1500MB

### Response Time Percentiles

#### Discovery Operations

- **P50 (Median)**: 10ms
- **P95**: 25ms
- **P99**: 40ms

#### Planning Operations

- **P50 (Median)**: 15ms
- **P95**: 35ms
- **P99**: 50ms

#### Execution Steps

- **P50 (Median)**: 12ms
- **P95**: 30ms
- **P99**: 45ms

## Environment Variance

### Local Development

- **CPU**: Typically faster (modern development machines)
- **Memory**: More available, less GC pressure
- **I/O**: Faster disk access
- **Expected Variance**: -20% to baseline

### GitHub Actions CI

- **CPU**: Shared resources, variable performance
- **Memory**: Limited to 7GB
- **I/O**: Network-attached storage, slower
- **Expected Variance**: +20-30% to baseline

### Docker Containers

- **CPU**: Virtualization overhead
- **Memory**: Container limits apply
- **I/O**: Volume mount overhead
- **Expected Variance**: +10-15% to baseline

## Performance Factors

### Factors Affecting Performance

1. **Session Complexity**
   - Number of steps in history
   - Branching and revision depth
   - Technique-specific data size

2. **System Load**
   - Concurrent session count
   - Memory pressure
   - GC frequency

3. **Operation Type**
   - Discovery: CPU-bound (NLP analysis + technique matching)
   - Planning: Memory-bound (session creation)
   - Execution: Mixed (state management + computation)

4. **NLP Processing** (Added in v0.5.0)
   - Problem categorization adds ~200-250ms to discovery
   - Compromise.js NLP analysis for better technique selection
   - Trade-off: Better technique matching vs. increased latency

### Optimization Targets

When performance falls outside acceptable ranges:

1. **CPU Optimization**
   - Profile hot paths
   - Optimize algorithms
   - Reduce unnecessary computations

2. **Memory Optimization**
   - Reduce object allocation
   - Implement object pooling
   - Optimize data structures

3. **I/O Optimization**
   - Batch operations
   - Async processing
   - Caching strategies

## Monitoring Guidelines

### When to Investigate

- Any metric exceeds acceptable range by >20%
- Memory usage shows unexpected growth patterns
- P99 latency degrades consistently
- CI performance diverges >50% from baseline

### Investigation Steps

1. Check recent code changes
2. Review memory allocation patterns
3. Profile CPU usage
4. Analyze GC logs
5. Compare with historical trends

## Baseline Updates

Baselines should be updated when:

- Significant optimizations are implemented
- New features change expected performance
- Infrastructure changes affect all metrics
- Quarterly review shows consistent deviation

Update process:

1. Run comprehensive benchmarks
2. Analyze results across environments
3. Document changes and rationale
4. Update this document
5. Notify team of new baselines
