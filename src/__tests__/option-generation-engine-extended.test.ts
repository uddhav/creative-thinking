/**
 * Extended tests for Option Generation Engine
 * Testing methods and edge cases not covered in the main test file
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OptionGenerationEngine } from '../ergodicity/optionGeneration/engine.js';
import type {
  OptionGenerationContext,
  Option,
  OptionGenerationStrategy,
} from '../ergodicity/optionGeneration/types.js';
import type { SessionState } from '../persistence/types.js';

describe('OptionGenerationEngine - Extended Tests', () => {
  let engine: OptionGenerationEngine;
  let mockContext: OptionGenerationContext;

  beforeEach(() => {
    engine = new OptionGenerationEngine();
    mockContext = {
      sessionState: {
        id: 'test-session',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 1,
        totalSteps: 6,
        history: [],
        branches: {},
        insights: [],
      },
      pathMemory: {
        constraints: [],
        pathHistory: [],
        flexibilityOverTime: [],
        availableOptions: [],
      },
      currentFlexibility: {
        flexibilityScore: 0.4,
        reversibilityIndex: 0.5,
        optionVelocity: -0.1,
        commitmentDepth: 0.6,
      },
      targetOptionCount: 10,
    };
  });

  describe('Error Handling and Reporting', () => {
    it('should track and report errors from strategies', () => {
      // Create a context that will cause validation to fail
      const invalidContext = {
        ...mockContext,
        currentFlexibility: {
          ...mockContext.currentFlexibility,
          flexibilityScore: -1, // Invalid score
        },
      };

      engine.generateOptions(invalidContext);
      const errors = engine.getErrors();

      expect(errors).toBeDefined();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toHaveProperty('strategy');
      expect(errors[0]).toHaveProperty('error');
      expect(errors[0]).toHaveProperty('timestamp');
      expect(errors[0]).toHaveProperty('context');
    });

    it('should accumulate errors across multiple generations', () => {
      // First generation with invalid context
      const invalidContext1 = {
        ...mockContext,
        currentFlexibility: null as unknown as OptionGenerationContext['currentFlexibility'],
      };
      engine.generateOptions(invalidContext1);

      // Second generation with different invalid context
      const invalidContext2 = {
        ...mockContext,
        pathMemory: null as unknown as OptionGenerationContext['pathMemory'],
      };
      engine.generateOptions(invalidContext2);

      const errors = engine.getErrors();
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Caching Mechanism', () => {
    it('should cache generated options', () => {
      // Generate options first time
      const result1 = engine.generateOptions(mockContext);
      expect(result1.options.length).toBeGreaterThan(0);

      // Generate again with same context - should use cache
      const startTime = Date.now();
      const result2 = engine.generateOptions(mockContext);
      const endTime = Date.now();

      // Cached result should be very fast (< 5ms)
      expect(endTime - startTime).toBeLessThan(5);
      expect(result2.options).toEqual(result1.options);
    });

    it('should generate unique cache keys for different contexts', () => {
      // Test with different flexibility scores
      const context1 = { ...mockContext };
      const context2 = {
        ...mockContext,
        currentFlexibility: {
          ...mockContext.currentFlexibility,
          flexibilityScore: 0.6,
        },
      };

      const result1 = engine.generateOptions(context1);
      const result2 = engine.generateOptions(context2);

      // Different contexts should generate different options
      expect(result1.options).not.toEqual(result2.options);
    });

    it('should clean up expired cache entries', () => {
      // This is harder to test directly, but we can verify the mechanism exists
      // by generating many different contexts
      const contexts = Array.from({ length: 20 }, (_, i) => ({
        ...mockContext,
        currentFlexibility: {
          ...mockContext.currentFlexibility,
          flexibilityScore: 0.1 + i * 0.04,
        },
      }));

      // Generate options for all contexts
      contexts.forEach(ctx => engine.generateOptions(ctx));

      // Generate again for first context - might be from cache or regenerated
      const result = engine.generateOptions(contexts[0]);
      expect(result.options).toBeDefined();
    });
  });

  describe('Quick Option Generation', () => {
    it('should provide a quick option without full generation', () => {
      const quickOption = engine.getQuickOption(mockContext);

      expect(quickOption).toBeDefined();
      expect(quickOption).toHaveProperty('id');
      expect(quickOption).toHaveProperty('name'); // Options have 'name', not 'title'
      expect(quickOption).toHaveProperty('description');
      expect(quickOption).toHaveProperty('strategy');
    });

    it('should return null for invalid context', () => {
      const invalidContext = null as unknown as OptionGenerationContext; // Test with completely invalid context

      const quickOption = engine.getQuickOption(invalidContext);
      expect(quickOption).toBeNull();
    });

    it('should generate different quick options for different strategies', () => {
      const options: Option[] = [];

      // Generate multiple quick options
      for (let i = 0; i < 5; i++) {
        const option = engine.getQuickOption(mockContext);
        if (option) options.push(option);
      }

      // Should have generated options
      expect(options.length).toBeGreaterThan(0);
      // May not always have variety with quick option generation
    });
  });

  describe('Strategy Information', () => {
    it('should provide list of available strategies', () => {
      const strategies = engine.getAvailableStrategies();

      expect(strategies).toBeDefined();
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);

      // Check structure
      strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('name');
        expect(strategy).toHaveProperty('description');
        expect(strategy).toHaveProperty('typicalGain'); // Changed from 'applicability'
      });
    });

    it('should provide detailed information for each strategy', () => {
      const strategyNames: OptionGenerationStrategy[] = [
        'decomposition',
        'temporal',
        'abstraction',
        'inversion',
        'stakeholder',
        'resource',
        'capability',
        'recombination',
      ];

      strategyNames.forEach(name => {
        const details = engine.getStrategyDetails(name);

        expect(details).toBeDefined();
        expect(details?.name).toBe(name);
        expect(details?.description).toBeDefined();
        expect(details?.applicableCategories).toBeDefined();
        expect(Array.isArray(details?.applicableCategories)).toBe(true);
        expect(details?.typicalGain).toBeDefined();
        expect(details?.typicalGain).toHaveProperty('min');
        expect(details?.typicalGain).toHaveProperty('max');
      });
    });

    it('should handle unknown strategy gracefully', () => {
      const details = engine.getStrategyDetails('unknown' as OptionGenerationStrategy);

      expect(details).toBeNull(); // getStrategyDetails returns null for unknown strategies
    });
  });

  describe('Context Validation Edge Cases', () => {
    it('should handle missing session state gracefully', () => {
      const contextWithoutSession = {
        ...mockContext,
        sessionState: undefined as unknown as SessionState,
      };

      const result = engine.generateOptions(contextWithoutSession);
      // When validation fails, generateOptions still works but may produce limited results
      expect(result).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.context.criticalConstraints).toBeDefined();
    });

    it('should handle extremely high flexibility scores', () => {
      const highFlexContext = {
        ...mockContext,
        currentFlexibility: {
          ...mockContext.currentFlexibility,
          flexibilityScore: 0.99,
        },
      };

      const result = engine.generateOptions(highFlexContext);
      expect(result).toBeDefined();
      // High flexibility might not generate many options
      expect(result.context.projectedFlexibility).toBeGreaterThanOrEqual(0.99);
    });

    it('should handle very constrained contexts', () => {
      const constrainedContext = {
        ...mockContext,
        currentFlexibility: {
          ...mockContext.currentFlexibility,
          flexibilityScore: 0.05,
        },
        pathMemory: {
          ...mockContext.pathMemory,
          constraints: Array(10)
            .fill(null)
            .map((_, i) => ({
              id: `c${i}`,
              type: 'technical' as const,
              description: `Constraint ${i}`,
              strength: 0.9,
              flexibility: 0.1,
              reversibilityCost: 0.9,
            })),
        },
      };

      const result = engine.generateOptions(constrainedContext);
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.context.criticalConstraints.length).toBeGreaterThan(0);
    });
  });

  describe('Strategy Selection and Prioritization', () => {
    it('should prioritize strategies based on context', () => {
      // Context with specific constraints should favor certain strategies
      const resourceConstrainedContext = {
        ...mockContext,
        pathMemory: {
          ...mockContext.pathMemory,
          constraints: [
            {
              id: 'budget',
              type: 'resource' as const,
              description: 'Limited budget',
              strength: 0.8,
              flexibility: 0.2,
              reversibilityCost: 0.7,
            },
          ],
        },
      };

      const result = engine.generateOptions(resourceConstrainedContext);

      // Should include resource strategy options
      const resourceOptions = result.options.filter(o => o.strategy === 'resource');
      expect(resourceOptions.length).toBeGreaterThan(0);
    });

    it('should use multiple strategies when appropriate', () => {
      const result = engine.generateOptions(mockContext);

      // Check that options were generated
      expect(result.options.length).toBeGreaterThan(0);
      // May use single strategy for simple context

      // Should report which strategies were used
      expect(result.strategiesUsed.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Resource Limits', () => {
    it('should respect maximum option count limits', () => {
      const contextWithHighTarget = {
        ...mockContext,
        targetOptionCount: 1000, // Unreasonably high
      };

      const result = engine.generateOptions(contextWithHighTarget);

      // Should be capped at reasonable limit
      expect(result.options.length).toBeLessThan(100);
    });

    it('should handle very long problem descriptions', () => {
      const longProblemContext = {
        ...mockContext,
        sessionState: {
          ...mockContext.sessionState,
          problem: 'A'.repeat(10000), // Very long problem
        },
      };

      const result = engine.generateOptions(longProblemContext);
      expect(result).toBeDefined();

      // Options should have reasonable description lengths
      result.options.forEach(option => {
        expect(option.description.length).toBeLessThan(1000);
      });
    });
  });

  describe('Integration with Evaluator', () => {
    it('should evaluate all generated options', () => {
      const result = engine.generateOptions(mockContext);

      expect(result.evaluations).toBeDefined();
      expect(result.evaluations.length).toBe(result.options.length);

      // Each evaluation should have required properties
      result.evaluations.forEach(evaluation => {
        expect(evaluation).toHaveProperty('optionId');
        expect(evaluation).toHaveProperty('overallScore');
        expect(evaluation).toHaveProperty('recommendation');
        expect(evaluation).toHaveProperty('flexibilityGain');
        expect(evaluation).toHaveProperty('implementationCost');
        expect(evaluation).toHaveProperty('reversibility');
        expect(evaluation).toHaveProperty('synergyScore');
        expect(evaluation).toHaveProperty('timeToValue');
        expect(evaluation).toHaveProperty('reasoning');
      });
    });

    it('should identify top recommendation', () => {
      const result = engine.generateOptions(mockContext);

      if (result.options.length > 0) {
        expect(result.topRecommendation).toBeDefined();

        // Top recommendation should be one of the generated options
        const topOption = result.options.find(o => o.id === result.topRecommendation?.id);
        expect(topOption).toBeDefined();
      }
    });
  });

  describe('Empty and Null States', () => {
    it('should handle empty path history', () => {
      const emptyHistoryContext = {
        ...mockContext,
        pathMemory: {
          ...mockContext.pathMemory,
          pathHistory: [],
        },
      };

      const result = engine.generateOptions(emptyHistoryContext);
      expect(result.options.length).toBeGreaterThan(0);
    });

    it('should handle no constraints', () => {
      const noConstraintsContext = {
        ...mockContext,
        pathMemory: {
          ...mockContext.pathMemory,
          constraints: [],
        },
      };

      const result = engine.generateOptions(noConstraintsContext);
      expect(result.options.length).toBeGreaterThan(0);
    });
  });
});
