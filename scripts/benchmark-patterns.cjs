/**
 * Shared benchmark patterns for consistent test result parsing
 * Used by both extract-benchmarks.cjs and performance-reporter.cjs
 */

const benchmarkPatterns = [
  {
    regex: /should handle (\d+) concurrent discovery requests/,
    name: 'Concurrent Discovery Requests',
    type: 'concurrent_discovery',
    extract: match => ({ count: parseInt(match[1]), type: 'discovery' }),
  },
  {
    regex: /should handle (\d+) concurrent planning sessions/,
    name: 'Concurrent Planning Sessions',
    type: 'concurrent_planning',
    extract: match => ({ count: parseInt(match[1]), type: 'planning' }),
  },
  {
    regex: /should handle (\d+) concurrent step executions/,
    name: 'Concurrent Step Executions',
    type: 'concurrent_execution',
    extract: match => ({ count: parseInt(match[1]), type: 'execution' }),
  },
  {
    regex: /should handle session with (\d+) steps efficiently/,
    name: 'Large Session Steps',
    type: 'large_session',
    extract: match => ({ count: parseInt(match[1]), type: 'session' }),
  },
  {
    regex: /should handle (\d+) concurrent sessions without degradation/,
    name: 'Concurrent Sessions',
    type: 'concurrent_sessions',
    extract: match => ({ count: parseInt(match[1]), type: 'sessions' }),
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

module.exports = { benchmarkPatterns };