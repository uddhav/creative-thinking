import { describe, it, expect, beforeEach } from 'vitest';
import { OptionGenerationEngine } from '../ergodicity/optionGeneration/engine.js';
import type {
  OptionGenerationContext,
  SessionData,
  OptionGenerationStrategy,
} from '../ergodicity/optionGeneration/types.js';
import type { SessionState } from '../persistence/types.js';

describe('OptionGenerationEngine', () => {
  let engine: OptionGenerationEngine;
  let mockContext: OptionGenerationContext;
  let mockSessionState: SessionState;
  let mockSessionData: SessionData;

  beforeEach(() => {
    engine = new OptionGenerationEngine();

    mockSessionState = {
      id: 'test-session',
      problem: 'Test problem',
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 6,
      history: [],
      insights: [],
      branches: {},
      metadata: {},
    };

    mockSessionData = {
      sessionId: 'test-session',
      startTime: Date.now(),
      endTime: undefined,
      problemStatement: 'Test problem',
      techniquesUsed: ['six_hats'],
      totalSteps: 10,
      insights: [],
      pathDependencyMetrics: {
        optionSpaceSize: 100,
        pathDivergence: 0.1,
        commitmentDepth: 0.3,
        reversibilityIndex: 0.8,
      },
    };

    mockContext = {
      currentFlexibility: {
        flexibilityScore: 0.4,
        constraints: [],
        reversibility: 0.8,
        dependencies: [],
        riskLevel: 'medium',
      },
      pathMemory: {
        pathHistory: [],
        constraints: [],
        barrierProximity: [],
        flexibilityOverTime: [{ step: 0, score: 0.4, timestamp: Date.now() }],
      },
      sessionState: mockSessionState,
      sessionData: mockSessionData,
    };
  });

  describe('shouldGenerateOptions', () => {
    it('should return true when flexibility < 0.5', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.4;
      expect(engine.shouldGenerateOptions(mockContext)).toBe(true);
    });

    it('should return true when flexibility < 0.4 (critical)', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.3;
      expect(engine.shouldGenerateOptions(mockContext)).toBe(true);
    });

    it('should return false when flexibility >= 0.5', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.6;
      expect(engine.shouldGenerateOptions(mockContext)).toBe(false);
    });

    it('should return true when close to barrier regardless of flexibility', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.6;
      mockContext.pathMemory.barrierProximity = [
        {
          barrier: 'perfectionism',
          distance: 0.2,
          approachRate: 0.1,
          estimatedStepsToBarrier: 2,
        },
      ];
      expect(engine.shouldGenerateOptions(mockContext)).toBe(true);
    });
  });

  describe('generateOptions', () => {
    it('should generate options successfully', () => {
      const result = engine.generateOptions(mockContext);

      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('evaluations');
      expect(result).toHaveProperty('topRecommendation');
      expect(result).toHaveProperty('strategiesUsed');
      expect(result).toHaveProperty('generationTime');
      expect(result).toHaveProperty('context');

      expect(Array.isArray(result.options)).toBe(true);
      expect(Array.isArray(result.evaluations)).toBe(true);
      expect(Array.isArray(result.strategiesUsed)).toBe(true);
    });

    it('should handle malformed context gracefully', () => {
      const malformedContext = {
        ...mockContext,
        currentFlexibility: {
          ...mockContext.currentFlexibility,
          flexibilityScore: -1, // Invalid score
        },
      };

      // Should not throw, but handle gracefully
      const result = engine.generateOptions(malformedContext);
      expect(result.options).toEqual([]);
    });

    it('should handle empty path history', () => {
      mockContext.pathMemory.pathHistory = [];
      mockContext.pathMemory.constraints = [];

      const result = engine.generateOptions(mockContext);
      expect(result).toBeDefined();
      expect(Array.isArray(result.options)).toBe(true);
    });

    it('should respect targetCount parameter', () => {
      const targetCount = 5;
      const result = engine.generateOptions(mockContext, targetCount);

      // May generate fewer if not enough applicable strategies
      expect(result.options.length).toBeLessThanOrEqual(targetCount * 2);
    });

    it('should track generation time', () => {
      // Add some data to trigger strategy generation
      mockContext.pathMemory.pathHistory = [
        {
          technique: 'six_hats',
          decision: 'Initial decision',
          timestamp: Date.now() - 10000,
          flexibilityBefore: 0.8,
          flexibilityAfter: 0.4,
          optionsOpened: [],
          optionsClosed: [],
          commitmentLevel: 0.7,
          reversibilityCost: 0.4,
        },
      ];

      const result = engine.generateOptions(mockContext);

      expect(result.generationTime).toBeGreaterThanOrEqual(0);
      expect(result.generationTime).toBeLessThan(1000); // Should be fast
    });

    it('should identify critical constraints', () => {
      mockContext.pathMemory.constraints = [
        {
          id: 'c1',
          type: 'technical',
          description: 'Strong constraint',
          strength: 0.8,
          flexibility: 0.2,
          reversibilityCost: 0.7,
        },
      ];

      const result = engine.generateOptions(mockContext);
      expect(result.context.criticalConstraints.length).toBeGreaterThan(0);
    });

    it('should calculate projected flexibility', () => {
      const initialFlexibility = mockContext.currentFlexibility.flexibilityScore;
      const result = engine.generateOptions(mockContext);

      expect(result.context.projectedFlexibility).toBeDefined();
      expect(result.context.projectedFlexibility).toBeGreaterThanOrEqual(initialFlexibility);
    });
  });

  describe('generateOptionsWithStrategies', () => {
    it('should use only specified strategies', () => {
      const strategies: OptionGenerationStrategy[] = ['decomposition', 'temporal'];
      const result = engine.generateOptionsWithStrategies(mockContext, strategies, 10);

      // Check that only specified strategies were used
      result.strategiesUsed.forEach(strategy => {
        expect(strategies).toContain(strategy);
      });
    });

    it('should handle unknown strategy names gracefully', () => {
      const strategies = ['unknown_strategy' as OptionGenerationStrategy];
      const result = engine.generateOptionsWithStrategies(mockContext, strategies, 10);

      expect(result.options).toEqual([]);
      expect(result.strategiesUsed).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should continue if one strategy fails', () => {
      // Mock a strategy to throw an error
      const decompositionStrategy = engine['strategies'].get('decomposition');
      let originalGenerate: typeof decompositionStrategy.generate | undefined;

      if (decompositionStrategy) {
        originalGenerate = decompositionStrategy.generate.bind(decompositionStrategy);
        decompositionStrategy.generate = () => {
          throw new Error('Strategy failed');
        };
      }

      const result = engine.generateOptions(mockContext);

      // Should still generate options from other strategies
      expect(result.options.length).toBeGreaterThanOrEqual(0);
      expect(result.strategiesUsed).not.toContain('decomposition');

      // Restore original generate method
      if (decompositionStrategy && originalGenerate) {
        decompositionStrategy.generate = originalGenerate;
      }
    });
  });

  describe('Performance', () => {
    it('should complete generation within reasonable time', () => {
      const start = Date.now();
      const result = engine.generateOptions(mockContext, 20);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be very fast
      expect(result.generationTime).toBeLessThan(100);
    });

    it('should handle complex contexts efficiently', () => {
      // Add many constraints and history items
      for (let i = 0; i < 50; i++) {
        mockContext.pathMemory.pathHistory.push({
          technique: 'six_hats',
          decision: `Decision ${i}`,
          timestamp: Date.now() - i * 1000,
          flexibilityBefore: 0.5,
          flexibilityAfter: 0.4,
          optionsOpened: [`option${i}`],
          optionsClosed: [],
          commitmentLevel: 0.3,
          reversibilityCost: 0.2,
        });
      }

      const start = Date.now();
      engine.generateOptions(mockContext);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200); // Still fast with complex context
    });
  });
});
