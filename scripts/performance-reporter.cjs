#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-unused-vars */

/**
 * Custom Vitest reporter for performance tests
 * Outputs structured benchmark data that can be consumed by CI
 */

const { benchmarkPatterns } = require('./benchmark-patterns.cjs');

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

    // Use shared patterns
    for (const pattern of benchmarkPatterns) {
      const match = name.match(pattern.regex);
      if (match) {
        const data = pattern.extract(match);
        const label = data.count ? `${pattern.name} (${data.count})` : pattern.name;
        
        return {
          name: label,
          value: duration,
          unit: 'ms',
          extra: data,
        };
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
