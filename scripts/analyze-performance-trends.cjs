#!/usr/bin/env node
/* eslint-env node */

/**
 * Analyzes performance benchmark trends from historical data
 * Usage: node scripts/analyze-performance-trends.cjs [benchmark-file.json]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TREND_WINDOW = 10; // Number of recent results to analyze
const DEGRADATION_THRESHOLD = 0.1; // 10% degradation threshold
const IMPROVEMENT_THRESHOLD = 0.1; // 10% improvement threshold

/**
 * Load benchmark data from file or directory
 */
function loadBenchmarkData(inputPath) {
  if (!inputPath) {
    console.error('Usage: node analyze-performance-trends.cjs <benchmark-file.json|directory>');
    process.exit(1);
  }

  const stats = fs.statSync(inputPath);

  if (stats.isDirectory()) {
    // Load all JSON files from directory
    const files = fs
      .readdirSync(inputPath)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(inputPath, f));

    const allData = [];
    files.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        allData.push({ file, data: Array.isArray(data) ? data : [data] });
      } catch (e) {
        console.warn(`Failed to parse ${file}: ${e.message}`);
      }
    });

    return allData;
  } else {
    // Load single file - handle potential race condition
    try {
      const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      return [{ file: inputPath, data: Array.isArray(data) ? data : [data] }];
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(`File not found: ${inputPath}`);
        return [];
      }
      throw error;
    }
  }
}

/**
 * Analyze trends in benchmark data
 */
function analyzeTrends(benchmarkSets) {
  const trends = new Map();

  // Group by benchmark name
  benchmarkSets.forEach(({ file, data }) => {
    data.forEach(benchmark => {
      const name = benchmark.name;
      if (!trends.has(name)) {
        trends.set(name, []);
      }
      trends.get(name).push({
        value: benchmark.value,
        unit: benchmark.unit,
        timestamp:
          benchmark.timestamp ||
          (() => {
            try {
              return new Date(fs.statSync(file).mtime).toISOString();
            } catch {
              return new Date().toISOString();
            }
          })(),
        file,
        metadata: benchmark.extra || benchmark.metadata,
      });
    });
  });

  // Analyze each benchmark
  const analysis = [];
  trends.forEach((results, name) => {
    // Sort by timestamp
    results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Get recent results
    const recent = results.slice(-TREND_WINDOW);
    const values = recent.map(r => r.value);

    // Calculate statistics
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    const oldest = values[0];

    // Calculate trend
    const trend = (latest - oldest) / oldest;
    const trendPercent = (trend * 100).toFixed(1);

    // Determine status
    let status = 'stable';
    if (trend > DEGRADATION_THRESHOLD) {
      status = 'degrading';
    } else if (trend < -IMPROVEMENT_THRESHOLD) {
      status = 'improving';
    }

    // Calculate variance
    const variance =
      values.reduce((sum, val) => {
        return sum + Math.pow(val - avg, 2);
      }, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const variancePercent = ((stdDev / avg) * 100).toFixed(1);

    analysis.push({
      name,
      status,
      trend: trendPercent,
      latest: latest.toFixed(2),
      average: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      variance: variancePercent,
      samples: recent.length,
      unit: recent[0].unit,
    });
  });

  return analysis;
}

/**
 * Generate trend report
 */
function generateReport(analysis) {
  console.log('\n📊 Performance Trend Analysis Report');
  console.log('=====================================\n');

  // Group by status
  const degrading = analysis.filter(a => a.status === 'degrading');
  const improving = analysis.filter(a => a.status === 'improving');
  const stable = analysis.filter(a => a.status === 'stable');

  // Show degrading benchmarks first
  if (degrading.length > 0) {
    console.log('⚠️  Performance Degradations:');
    console.log('----------------------------');
    degrading.forEach(b => {
      console.log(`  ${b.name}:`);
      console.log(`    Trend: +${b.trend}% ↗️ (degrading)`);
      console.log(`    Latest: ${b.latest}${b.unit} (avg: ${b.average}${b.unit})`);
      console.log(`    Range: ${b.min}-${b.max}${b.unit} (variance: ${b.variance}%)`);
      console.log('');
    });
  }

  // Show improvements
  if (improving.length > 0) {
    console.log('\n✅ Performance Improvements:');
    console.log('----------------------------');
    improving.forEach(b => {
      console.log(`  ${b.name}:`);
      console.log(`    Trend: ${b.trend}% ↘️ (improving)`);
      console.log(`    Latest: ${b.latest}${b.unit} (avg: ${b.average}${b.unit})`);
      console.log(`    Range: ${b.min}-${b.max}${b.unit} (variance: ${b.variance}%)`);
      console.log('');
    });
  }

  // Show stable benchmarks
  if (stable.length > 0) {
    console.log('\n📈 Stable Performance:');
    console.log('---------------------');
    stable.forEach(b => {
      console.log(`  ${b.name}: ${b.latest}${b.unit} (±${b.variance}%)`);
    });
  }

  // Summary
  console.log('\n📋 Summary:');
  console.log('-----------');
  console.log(`  Total benchmarks: ${analysis.length}`);
  console.log(`  Degrading: ${degrading.length}`);
  console.log(`  Improving: ${improving.length}`);
  console.log(`  Stable: ${stable.length}`);

  // Recommendations
  if (degrading.length > 0) {
    console.log('\n💡 Recommendations:');
    console.log('------------------');
    console.log('  1. Investigate recent changes that may have caused degradations');
    console.log('  2. Profile the degraded operations to identify bottlenecks');
    console.log('  3. Consider reverting recent changes if degradation is severe');
    console.log('  4. Update performance baselines if degradation is acceptable');
  }

  // Export data
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: analysis.length,
      degrading: degrading.length,
      improving: improving.length,
      stable: stable.length,
    },
    benchmarks: analysis,
  };

  const outputFile = 'performance-trend-report.json';
  fs.writeFileSync(outputFile, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Full report saved to: ${outputFile}`);
}

// Main execution
const inputPath = process.argv[2];
try {
  const benchmarkSets = loadBenchmarkData(inputPath);
  const analysis = analyzeTrends(benchmarkSets);
  generateReport(analysis);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
