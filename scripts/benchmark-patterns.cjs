/**
 * Shared benchmark patterns for consistent test result parsing
 * Used by both extract-benchmarks.cjs and performance-reporter.cjs
 */

// Helper function to safely parse and validate numeric values
function safeParseCount(value) {
  const count = parseInt(value);
  if (isNaN(count) || count <= 0) {
    console.warn(`[benchmark-patterns] Invalid count value: ${value}`);
    return { count: 0, error: 'invalid_count' };
  }
  return { count };
}

const benchmarkPatterns = [
  {
    regex: /should handle (\d+) concurrent discovery requests/,
    name: 'Concurrent Discovery Requests',
    type: 'concurrent_discovery',
    extract: match => ({ ...safeParseCount(match[1]), type: 'discovery' }),
  },
  {
    regex: /should handle (\d+) concurrent planning sessions/,
    name: 'Concurrent Planning Sessions',
    type: 'concurrent_planning',
    extract: match => ({ ...safeParseCount(match[1]), type: 'planning' }),
  },
  {
    regex: /should handle (\d+) concurrent step executions/,
    name: 'Concurrent Step Executions',
    type: 'concurrent_execution',
    extract: match => ({ ...safeParseCount(match[1]), type: 'execution' }),
  },
  {
    regex: /should handle session with (\d+) steps efficiently/,
    name: 'Large Session Steps',
    type: 'large_session',
    extract: match => ({ ...safeParseCount(match[1]), type: 'session' }),
  },
  {
    regex: /should handle (\d+) concurrent sessions without degradation/,
    name: 'Concurrent Sessions',
    type: 'concurrent_sessions',
    extract: match => ({ ...safeParseCount(match[1]), type: 'sessions' }),
  },
  {
    regex: /should handle deep revision chains efficiently/,
    name: 'Deep Revision Chains',
    type: 'revision_chains',
    extract: () => ({ type: 'revisions' }),
  },
  {
    regex: /should handle memory efficiently with many sessions/,
    name: 'Memory Efficiency Test',
    type: 'memory_efficiency',
    extract: () => ({ type: 'memory' }),
  },
  {
    regex: /should maintain consistent response times under load/,
    name: 'Response Time Consistency',
    type: 'response_consistency',
    extract: () => ({ type: 'response_times' }),
  },
  {
    regex: /should handle multi-technique workflow efficiently/,
    name: 'Multi-Technique Workflow',
    type: 'multi_technique',
    extract: () => ({ type: 'workflow' }),
  },
];

// Validate all patterns at startup
benchmarkPatterns.forEach((pattern, index) => {
  try {
    // Test the regex is valid
    new RegExp(pattern.regex);
    
    // Ensure required properties exist
    if (!pattern.name || !pattern.type || !pattern.extract) {
      throw new Error(`Pattern at index ${index} missing required properties`);
    }
    
    // Test the extract function with a sample match
    if (pattern.regex.source.includes('(\\d+)')) {
      const testMatch = ['full match', '50'];
      const result = pattern.extract(testMatch);
      if (!result || typeof result !== 'object') {
        throw new Error(`Pattern at index ${index} extract function returns invalid result`);
      }
    }
  } catch (e) {
    console.error(`[benchmark-patterns] Invalid pattern at index ${index}: ${e.message}`);
    process.exit(1);
  }
});

module.exports = { benchmarkPatterns };