import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    reporters: ['json', './scripts/performance-reporter.cjs'],
    outputFile: {
      json: './performance-results.json',
    },
    // Increase timeout for performance tests
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests sequentially to get accurate timing
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
