#!/usr/bin/env node
/* eslint-env node */

/**
 * Extract benchmark results from vitest performance test output
 * This script parses the test results and console output to extract timing metrics
 */

const fs = require('fs');

// Read test results
const resultsPath = process.argv[2] || 'performance-results.json';
const outputPath = process.argv[3] || 'benchmark-results.json';

if (!fs.existsSync(resultsPath)) {
  console.error(`Results file not found: ${resultsPath}`);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const benchmarks = [];

// Helper to extract metrics from test names and durations
function extractBenchmarks(testResults) {
  if (!testResults || !testResults.testResults) return;

  testResults.testResults.forEach(suite => {
    if (!suite.assertionResults) return;

    suite.assertionResults.forEach(test => {
      if (test.status !== 'passed') return;

      // Extract metrics based on test patterns
      const patterns = [
        {
          regex: /should handle (\d+) concurrent discovery requests/,
          name: 'Concurrent Discovery Requests',
          extract: match => ({ count: parseInt(match[1]) }),
        },
        {
          regex: /should handle (\d+) concurrent planning sessions/,
          name: 'Concurrent Planning Sessions',
          extract: match => ({ count: parseInt(match[1]) }),
        },
        {
          regex: /should handle (\d+) concurrent step executions/,
          name: 'Concurrent Step Executions',
          extract: match => ({ count: parseInt(match[1]) }),
        },
        {
          regex: /should handle session with (\d+) steps efficiently/,
          name: 'Large Session Steps',
          extract: match => ({ count: parseInt(match[1]) }),
        },
        {
          regex: /should handle (\d+) concurrent sessions without degradation/,
          name: 'Concurrent Sessions',
          extract: match => ({ count: parseInt(match[1]) }),
        },
      ];

      for (const pattern of patterns) {
        const match = test.title.match(pattern.regex);
        if (match) {
          const data = pattern.extract(match);
          benchmarks.push({
            name: `${pattern.name} (${data.count})`,
            unit: 'ms',
            value: test.duration || 0,
            extra: {
              ...data,
              fullTitle: test.fullTitle,
            },
          });
          break;
        }
      }
    });
  });
}

// Extract benchmarks from test results
extractBenchmarks(results);

// Sort benchmarks by name for consistency
benchmarks.sort((a, b) => a.name.localeCompare(b.name));

// Calculate aggregate metrics
const summary = {
  totalTests: benchmarks.length,
  totalDuration: benchmarks.reduce((sum, b) => sum + b.value, 0),
  averageDuration:
    benchmarks.length > 0 ? benchmarks.reduce((sum, b) => sum + b.value, 0) / benchmarks.length : 0,
  maxDuration: benchmarks.length > 0 ? Math.max(...benchmarks.map(b => b.value)) : 0,
  minDuration: benchmarks.length > 0 ? Math.min(...benchmarks.map(b => b.value)) : 0,
};

console.log('Performance Benchmark Summary:');
console.log(`- Total tests: ${summary.totalTests}`);
console.log(`- Total duration: ${summary.totalDuration.toFixed(2)}ms`);
console.log(`- Average duration: ${summary.averageDuration.toFixed(2)}ms`);
console.log(`- Max duration: ${summary.maxDuration.toFixed(2)}ms`);
console.log(`- Min duration: ${summary.minDuration.toFixed(2)}ms`);

// Write benchmark results
fs.writeFileSync(outputPath, JSON.stringify(benchmarks, null, 2));
console.log(`\nBenchmark results written to: ${outputPath}`);

// Also write summary for easy access
fs.writeFileSync('benchmark-summary.json', JSON.stringify(summary, null, 2));
