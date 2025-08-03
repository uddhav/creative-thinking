#!/usr/bin/env node
/* eslint-env node */

/**
 * Extract benchmark results from vitest performance test output
 * This script parses the test results and console output to extract timing metrics
 */

const fs = require('fs');
const { benchmarkPatterns } = require('./benchmark-patterns.cjs');

// Read test results
const resultsPath = process.argv[2] || 'performance-results.json';
const outputPath = process.argv[3] || 'benchmark-results.json';

if (!fs.existsSync(resultsPath)) {
  console.error(`[extract-benchmarks] ERROR: Results file not found: ${resultsPath}`);
  console.error(`[extract-benchmarks] Current directory: ${process.cwd()}`);
  console.error(`[extract-benchmarks] Directory contents: ${fs.readdirSync('.').join(', ')}`);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const benchmarks = [];

// Validate parsed data structure
if (!results || typeof results !== 'object') {
  console.error('[extract-benchmarks] ERROR: Invalid benchmark data structure');
  console.error('[extract-benchmarks] Expected object with testResults property');
  process.exit(1);
}

// Helper to validate individual benchmark results
function validateBenchmarkResult(benchmark) {
  if (!benchmark.name || typeof benchmark.name !== 'string') {
    console.warn('[extract-benchmarks] Invalid benchmark: missing or invalid name');
    return false;
  }
  if (typeof benchmark.value !== 'number' || benchmark.value < 0) {
    console.warn(`[extract-benchmarks] Invalid benchmark value for ${benchmark.name}: ${benchmark.value}`);
    return false;
  }
  if (!benchmark.unit || typeof benchmark.unit !== 'string') {
    console.warn(`[extract-benchmarks] Invalid benchmark unit for ${benchmark.name}: ${benchmark.unit}`);
    return false;
  }
  return true;
}

// Helper to extract metrics from test names and durations
function extractBenchmarks(testResults) {
  if (!testResults || !testResults.testResults) {
    console.error('[extract-benchmarks] WARNING: No test results found in input');
    return;
  }

  testResults.testResults.forEach(suite => {
    if (!suite.assertionResults) {
      console.error('[extract-benchmarks] WARNING: No assertion results in test suite');
      return;
    }

    suite.assertionResults.forEach(test => {
      if (test.status !== 'passed') {
        console.error(`[extract-benchmarks] Skipping failed test: ${test.title}`);
        return;
      }

      // Use shared patterns
      for (const pattern of benchmarkPatterns) {
        const match = test.title.match(pattern.regex);
        if (match) {
          const data = pattern.extract(match);
          const label = data.count ? `${pattern.name} (${data.count})` : pattern.name;
          
          const benchmark = {
            name: label,
            unit: 'ms',
            value: test.duration || 0,
            extra: {
              ...data,
              fullTitle: test.fullTitle,
            },
          };
          
          // Validate benchmark before adding
          if (validateBenchmarkResult(benchmark)) {
            benchmarks.push(benchmark);
          } else {
            console.error(`[extract-benchmarks] Skipping invalid benchmark: ${test.title}`);
          }
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
