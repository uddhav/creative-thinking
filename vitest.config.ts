import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DISABLE_THOUGHT_LOGGING: 'true',
    },
    // Increase test timeout for NLP-heavy tests
    testTimeout: 10000,
    // Hook timeout for setup/teardown
    hookTimeout: 10000,
    // Auto-retry transient failures: a handful of integration / stress
    // tests are sensitive to worker-pool contention and intermittently
    // exceed testTimeout under load. Retry twice before reporting fail.
    retry: 2,
    // Prevent worker timeout issues
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/__tests__/**',
      ],
    },
  },
});
