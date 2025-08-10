/**
 * Tests for wildcard technique selection feature
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TechniqueRecommender } from '../../../layers/discovery/TechniqueRecommender.js';
import { TechniqueRegistry } from '../../../techniques/TechniqueRegistry.js';

describe('Wildcard Technique Selection', () => {
  let recommender: TechniqueRecommender;
  let registry: TechniqueRegistry;

  beforeEach(() => {
    recommender = new TechniqueRecommender();
    registry = TechniqueRegistry.getInstance();
  });

  it('should sometimes include a wildcard technique', () => {
    // Run multiple times to check for wildcard inclusion
    let wildcardCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const recommendations = recommender.recommendTechniques(
        'creative',
        undefined,
        undefined,
        'medium',
        registry
      );

      // Check if any recommendation is marked as wildcard
      if (recommendations.some(r => r.isWildcard === true)) {
        wildcardCount++;
      }
    }

    // With 17.5% probability, we expect around 15-20 wildcards in 100 iterations
    // Allow for some variance (10-30)
    expect(wildcardCount).toBeGreaterThan(10);
    expect(wildcardCount).toBeLessThan(30);
  });

  it('should not include wildcard technique in already recommended techniques', () => {
    // Force wildcard inclusion by mocking Math.random
    const originalRandom = Math.random;
    let callCount = 0;

    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      // First call is for wildcard probability check - return low value to trigger wildcard
      if (callCount === 1) {
        return 0.1; // Less than 0.175 (17.5% threshold)
      }
      // Subsequent calls for selecting the wildcard
      return originalRandom();
    });

    const recommendations = recommender.recommendTechniques(
      'creative',
      undefined,
      undefined,
      'medium',
      registry
    );

    // Find the wildcard recommendation
    const wildcard = recommendations.find(r => r.isWildcard === true);

    if (wildcard) {
      // Non-wildcard recommendations
      const regularRecommendations = recommendations.filter(r => !r.isWildcard);
      const regularTechniques = regularRecommendations.map(r => r.technique);

      // Wildcard should not be in regular recommendations
      expect(regularTechniques).not.toContain(wildcard.technique);
    }

    vi.restoreAllMocks();
  });

  it('should have appropriate reasoning for wildcard techniques', () => {
    let callCount = 0;

    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      // Force wildcard inclusion
      if (callCount === 1) {
        return 0.1;
      }
      return 0; // Select first available technique
    });

    const recommendations = recommender.recommendTechniques(
      'technical',
      undefined,
      undefined,
      'medium',
      registry
    );

    const wildcard = recommendations.find(r => r.isWildcard === true);

    if (wildcard) {
      // Check wildcard has appropriate reasoning
      expect(wildcard.reasoning).toMatch(
        /alternative|wildcard|unexpected|complementary|unconventional/i
      );
      expect(wildcard.reasoning).toContain('steps)'); // Should include step count
      expect(wildcard.effectiveness).toBe(0.65); // Moderate effectiveness
    }

    vi.restoreAllMocks();
  });

  it('should respect WILDCARD_PROBABILITY environment variable', () => {
    // Save original env value
    const originalEnv = process.env.WILDCARD_PROBABILITY;

    // Set to 100% probability
    process.env.WILDCARD_PROBABILITY = '1.0';

    // Create new recommender to pick up env variable
    const alwaysWildcardRecommender = new TechniqueRecommender();

    // Should always include wildcard
    let wildcardCount = 0;
    for (let i = 0; i < 10; i++) {
      const recommendations = alwaysWildcardRecommender.recommendTechniques(
        'process',
        undefined,
        undefined,
        'low',
        registry
      );

      if (recommendations.some(r => r.isWildcard === true)) {
        wildcardCount++;
      }
    }

    expect(wildcardCount).toBe(10);

    // Set to 0% probability
    process.env.WILDCARD_PROBABILITY = '0.0';
    const neverWildcardRecommender = new TechniqueRecommender();

    // Should never include wildcard
    wildcardCount = 0;
    for (let i = 0; i < 10; i++) {
      const recommendations = neverWildcardRecommender.recommendTechniques(
        'organizational',
        undefined,
        undefined,
        'high',
        registry
      );

      if (recommendations.some(r => r.isWildcard === true)) {
        wildcardCount++;
      }
    }

    expect(wildcardCount).toBe(0);

    // Restore original env value
    if (originalEnv !== undefined) {
      process.env.WILDCARD_PROBABILITY = originalEnv;
    } else {
      delete process.env.WILDCARD_PROBABILITY;
    }
  });

  it('should return dynamic recommendations based on complexity', () => {
    // Force wildcard inclusion
    vi.spyOn(Math, 'random').mockImplementation(() => 0.1);

    // High complexity should allow more recommendations
    const highComplexityRecs = recommender.recommendTechniques(
      'strategic',
      'systematic',
      ['time constraint'],
      'high',
      registry
    );

    // Should have 5-9 recommendations for high complexity (5-7 base + up to 2 wildcards)
    expect(highComplexityRecs.length).toBeGreaterThanOrEqual(5);
    expect(highComplexityRecs.length).toBeLessThanOrEqual(9);

    // Count wildcards - should be up to 2 for high complexity
    const highWildcardCount = highComplexityRecs.filter(r => r.isWildcard === true).length;
    expect(highWildcardCount).toBeLessThanOrEqual(2);

    // Low complexity should have fewer recommendations
    const lowComplexityRecs = recommender.recommendTechniques(
      'strategic',
      'systematic',
      [],
      'low',
      registry
    );

    // Should have 2-4 recommendations for low complexity (2-3 base + up to 1 wildcard)
    expect(lowComplexityRecs.length).toBeLessThanOrEqual(4);

    vi.restoreAllMocks();
  });
});
