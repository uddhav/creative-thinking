#!/usr/bin/env node

/**
 * Custom Vitest reporter for performance tests
 * Outputs structured benchmark data that can be consumed by CI
 */

class PerformanceReporter {
  constructor() {
    this.benchmarks = [];
  }

  onTestFinished(test) {
    if (test.result?.state !== 'pass') return;

    // Extract performance metrics from test
    const metrics = this.extractMetrics(test);
    if (metrics) {
      this.benchmarks.push(metrics);
    }
  }

  extractMetrics(test) {
    const { name, result } = test;
    const duration = result.duration || 0;

    // Pattern matching for different test types
    const patterns = [
      {
        regex: /should handle (\d+) concurrent discovery requests/,
        type: 'concurrent_discovery',
        extract: match => ({
          name: `Concurrent Discovery (${match[1]} requests)`,
          value: duration,
          unit: 'ms',
          extra: { count: parseInt(match[1]), type: 'discovery' },
        }),
      },
      {
        regex: /should handle (\d+) concurrent planning sessions/,
        type: 'concurrent_planning',
        extract: match => ({
          name: `Concurrent Planning (${match[1]} sessions)`,
          value: duration,
          unit: 'ms',
          extra: { count: parseInt(match[1]), type: 'planning' },
        }),
      },
      {
        regex: /should handle (\d+) concurrent step executions/,
        type: 'concurrent_execution',
        extract: match => ({
          name: `Concurrent Execution (${match[1]} steps)`,
          value: duration,
          unit: 'ms',
          extra: { count: parseInt(match[1]), type: 'execution' },
        }),
      },
      {
        regex: /should handle session with (\d+) steps efficiently/,
        type: 'large_session',
        extract: match => ({
          name: `Large Session (${match[1]} steps)`,
          value: duration,
          unit: 'ms',
          extra: { steps: parseInt(match[1]), type: 'session' },
        }),
      },
      {
        regex: /should handle deep revision chains efficiently/,
        type: 'revision_chains',
        extract: () => ({
          name: 'Deep Revision Chains',
          value: duration,
          unit: 'ms',
          extra: { type: 'revisions' },
        }),
      },
      {
        regex: /should handle memory efficiently with many sessions/,
        type: 'memory_efficiency',
        extract: () => ({
          name: 'Memory Efficiency Test',
          value: duration,
          unit: 'ms',
          extra: { type: 'memory' },
        }),
      },
    ];

    for (const pattern of patterns) {
      const match = name.match(pattern.regex);
      if (match) {
        return pattern.extract(match);
      }
    }

    return null;
  }

  onFinished(files) {
    // Output benchmark results
    console.log('\n=== PERFORMANCE BENCHMARKS ===');
    console.log(JSON.stringify(this.benchmarks, null, 2));
    console.log('=== END BENCHMARKS ===\n');

    // Write to file for CI
    const fs = require('fs');
    fs.writeFileSync('performance-benchmarks.json', JSON.stringify(this.benchmarks, null, 2));
  }
}

module.exports = PerformanceReporter;
