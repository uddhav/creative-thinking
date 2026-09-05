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
    // Prevent worker timeout issues. Vitest 4 removed `poolOptions`: its
    // per-pool settings are top-level now. `isolate: true` carries over as-is;
    // the old `singleThread: false` was the default and maps to nothing.
    pool: 'threads',
    isolate: true,
    coverage: {
      provider: 'v8',
      // Vitest 4 removed `coverage.all`: without an explicit include, the
      // report covers only files loaded during the run, so a never-imported
      // source file silently drops out of the denominator and the percentage
      // moves for reasons that have nothing to do with tests. Pin the
      // denominator to the whole source tree so the number is comparable from
      // run to run; nothing external gates it.
      include: ['src/**/*.ts'],
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
