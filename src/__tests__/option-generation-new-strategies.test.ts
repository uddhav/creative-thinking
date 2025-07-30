import { describe, it, expect, beforeEach } from 'vitest';
import { NeuralOptimizationStrategy } from '../ergodicity/optionGeneration/strategies/neuralOptimization.js';
import { TemporalShiftingStrategy } from '../ergodicity/optionGeneration/strategies/temporalShifting.js';
import { CulturalBridgingStrategy } from '../ergodicity/optionGeneration/strategies/culturalBridging.js';
import { CollectiveDivergenceStrategy } from '../ergodicity/optionGeneration/strategies/collectiveDivergence.js';
import type {
  OptionGenerationContext,
  OptionGenerationStrategy,
} from '../ergodicity/optionGeneration/types.js';
import type { SessionState } from '../persistence/types.js';

describe('New Option Generation Strategies', () => {
  let mockContext: OptionGenerationContext;
  let mockSessionState: SessionState;

  beforeEach(() => {
    mockSessionState = {
      id: 'test-session',
      problem: 'Test problem requiring creative solutions',
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 6,
      history: [],
      insights: [],
      branches: {},
      metadata: {},
    };

    mockContext = {
      currentFlexibility: {
        flexibilityScore: 0.3,
        constraints: [],
        reversibility: 0.5,
        dependencies: [],
        riskLevel: 'high',
      },
      pathMemory: {
        pathHistory: [
          {
            technique: 'six_hats',
            decision: 'Initial approach with rigid thinking',
            timestamp: new Date(Date.now() - 10000).toISOString(),
            flexibilityBefore: 0.6,
            flexibilityAfter: 0.3,
            optionsOpened: [],
            optionsClosed: ['option1', 'option2'],
            commitmentLevel: 0.8,
            reversibilityCost: 0.7,
          },
        ],
        constraints: [
          {
            id: 'c1',
            type: 'cognitive',
            description: 'Stuck in rigid thinking patterns',
            strength: 0.8,
            flexibility: 0.2,
            reversibilityCost: 0.6,
            affectedOptions: ['creative-approach'],
            createdAt: new Date(Date.now() - 20000).toISOString(),
            createdBy: {
              technique: 'six_hats',
              decision: 'Fixed mindset',
              timestamp: new Date(Date.now() - 20000).toISOString(),
              flexibilityBefore: 0.6,
              flexibilityAfter: 0.3,
              optionsOpened: [],
              optionsClosed: ['creative-approach'],
              commitmentLevel: 0.8,
              reversibilityCost: 0.6,
            },
          },
        ],
        barrierProximity: [],
        flexibilityOverTime: [
          { step: 0, score: 0.6, timestamp: Date.now() - 30000 },
          { step: 1, score: 0.5, timestamp: Date.now() - 20000 },
          { step: 2, score: 0.3, timestamp: Date.now() - 10000 },
        ],
      },
      sessionState: mockSessionState,
      sessionData: {
        sessionId: 'test-session',
        startTime: Date.now(),
        problemStatement: 'Test problem',
        techniquesUsed: ['six_hats'],
        totalSteps: 10,
        insights: [],
        pathDependencyMetrics: {
          optionSpaceSize: 50,
          pathDivergence: 0.1,
          commitmentDepth: 0.8,
          reversibilityIndex: 0.2,
        },
      },
      constraints: [], // Add constraints field for isCategoryAllowed check
    };
  });

  describe('NeuralOptimizationStrategy', () => {
    let strategy: NeuralOptimizationStrategy;

    beforeEach(() => {
      strategy = new NeuralOptimizationStrategy();
    });

    it('should have correct metadata', () => {
      expect(strategy.strategyName).toBe('neural_optimization');
      expect(strategy.typicalFlexibilityGain.min).toBe(0.15);
      expect(strategy.typicalFlexibilityGain.max).toBe(0.35);
    });

    it('should be applicable when rigid patterns exist', () => {
      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate DMN activation option when needed', () => {
      // Add more constraints to trigger DMN need
      mockContext.pathMemory.constraints.push(
        {
          id: 'c2',
          type: 'focus',
          description: 'Narrow focus on single solution',
          strength: 0.8,
          flexibility: 0.2,
          reversibilityCost: 0.5,
          affectedOptions: [],
          createdAt: new Date().toISOString(),
          createdBy: mockContext.pathMemory.pathHistory[0],
        },
        {
          id: 'c3',
          type: 'focus',
          description: 'Limited perspective',
          strength: 0.9,
          flexibility: 0.1,
          reversibilityCost: 0.6,
          affectedOptions: [],
          createdAt: new Date().toISOString(),
          createdBy: mockContext.pathMemory.pathHistory[0],
        }
      );

      const options = strategy.generate(mockContext);
      const dmnOption = options.find(o => o.name.includes('Default Mode Network'));
      expect(dmnOption).toBeDefined();
      expect(dmnOption?.category).toBe('process');
    });

    it('should generate switching rhythm option for extended sessions', () => {
      // Add more history to trigger switching need
      for (let i = 0; i < 12; i++) {
        mockContext.pathMemory.pathHistory.push({
          technique: 'six_hats',
          decision: `Step ${i}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          flexibilityBefore: 0.5,
          flexibilityAfter: 0.4,
          optionsOpened: [],
          optionsClosed: [],
          commitmentLevel: 0.3,
          reversibilityCost: 0.2,
        });
      }

      const options = strategy.generate(mockContext);
      const switchOption = options.find(o => o.name.includes('Switching Rhythm'));
      expect(switchOption).toBeDefined();
      expect(switchOption?.category).toBe('capability');
    });

    it('should estimate effort correctly', () => {
      const options = strategy.generate(mockContext);
      options.forEach(option => {
        const effort = strategy.estimateEffort(option);
        expect(['low', 'medium', 'high']).toContain(effort);
      });
    });
  });

  describe('TemporalShiftingStrategy', () => {
    let strategy: TemporalShiftingStrategy;

    beforeEach(() => {
      strategy = new TemporalShiftingStrategy();
    });

    it('should have correct metadata', () => {
      expect(strategy.strategyName).toBe('temporal_shifting');
      expect(strategy.typicalFlexibilityGain.min).toBe(0.2);
      expect(strategy.typicalFlexibilityGain.max).toBe(0.4);
    });

    it('should be applicable with time pressure', () => {
      mockContext.pathMemory.constraints.push({
        id: 'time1',
        type: 'temporal',
        description: 'Urgent deadline approaching',
        strength: 0.9,
        flexibility: 0.1,
        reversibilityCost: 0.9,
        affectedOptions: ['delay'],
        createdAt: new Date().toISOString(),
        createdBy: mockContext.pathMemory.pathHistory[0],
      });

      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate time horizon expansion option', () => {
      const options = strategy.generate(mockContext);
      const expansionOption = options.find(o => o.name.includes('Expand Time Horizon'));
      expect(expansionOption).toBeDefined();
      expect(expansionOption?.category).toBe('temporal');
    });

    it('should generate temporal buffer option', () => {
      const options = strategy.generate(mockContext);
      const bufferOption = options.find(o => o.name.includes('Temporal Buffers'));
      expect(bufferOption).toBeDefined();
      expect(bufferOption?.actions.length).toBeGreaterThan(0);
    });

    it('should detect rigid rhythm patterns', () => {
      // Create regular intervals
      mockContext.pathMemory.flexibilityOverTime = [];
      const baseTime = Date.now();
      for (let i = 0; i < 10; i++) {
        mockContext.pathMemory.flexibilityOverTime.push({
          step: i,
          score: 0.4 + i * 0.01,
          timestamp: baseTime + i * 60000, // Exactly 1 minute intervals
        });
      }

      const options = strategy.generate(mockContext);
      const rhythmOption = options.find(o => o.name.includes('Break Temporal Rhythm'));
      expect(rhythmOption).toBeDefined();
    });
  });

  describe('CulturalBridgingStrategy', () => {
    let strategy: CulturalBridgingStrategy;

    beforeEach(() => {
      strategy = new CulturalBridgingStrategy();
    });

    it('should have correct metadata', () => {
      expect(strategy.strategyName).toBe('cultural_bridging');
      expect(strategy.typicalFlexibilityGain.min).toBe(0.25);
      expect(strategy.typicalFlexibilityGain.max).toBe(0.45);
    });

    it('should be applicable with framework conflicts', () => {
      mockContext.pathMemory.constraints.push({
        id: 'conflict1',
        type: 'cultural',
        description: 'Conflicting approaches between teams',
        strength: 0.8,
        flexibility: 0.2,
        reversibilityCost: 0.7,
        affectedOptions: ['unified-approach'],
        createdAt: new Date().toISOString(),
        createdBy: mockContext.pathMemory.pathHistory[0],
      });

      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate synthesis framework option', () => {
      const options = strategy.generate(mockContext);
      const synthesisOption = options.find(o => o.name.includes('Synthesis Framework'));
      expect(synthesisOption).toBeDefined();
      expect(synthesisOption?.category).toBe('conceptual');
    });

    it('should generate translation interface option', () => {
      const options = strategy.generate(mockContext);
      const translationOption = options.find(o => o.name.includes('Translation Interfaces'));
      expect(translationOption).toBeDefined();
      expect(translationOption?.category).toBe('relational');
    });

    it('should detect multiple valid approaches', () => {
      mockContext.pathMemory.pathHistory.push(
        {
          technique: 'design_thinking',
          decision: 'user-centered approach preferred',
          timestamp: new Date().toISOString(),
          flexibilityBefore: 0.5,
          flexibilityAfter: 0.4,
          optionsOpened: [],
          optionsClosed: [],
          commitmentLevel: 0.4,
          reversibilityCost: 0.3,
        },
        {
          technique: 'triz',
          decision: 'engineering approach suggested',
          timestamp: new Date().toISOString(),
          flexibilityBefore: 0.4,
          flexibilityAfter: 0.35,
          optionsOpened: [],
          optionsClosed: [],
          commitmentLevel: 0.4,
          reversibilityCost: 0.3,
        }
      );

      const options = strategy.generate(mockContext);
      const parallelOption = options.find(o => o.name.includes('Parallel Cultural Paths'));
      expect(parallelOption).toBeDefined();
    });
  });

  describe('CollectiveDivergenceStrategy', () => {
    let strategy: CollectiveDivergenceStrategy;

    beforeEach(() => {
      strategy = new CollectiveDivergenceStrategy();
    });

    it('should have correct metadata', () => {
      expect(strategy.strategyName).toBe('collective_divergence');
      expect(strategy.typicalFlexibilityGain.min).toBe(0.3);
      expect(strategy.typicalFlexibilityGain.max).toBe(0.5);
    });

    it('should be applicable with individual limitations', () => {
      mockContext.pathMemory.constraints.push({
        id: 'limit1',
        type: 'knowledge',
        description: 'Limited perspective on problem space',
        strength: 0.7,
        flexibility: 0.3,
        reversibilityCost: 0.5,
        affectedOptions: ['comprehensive-solution'],
        createdAt: new Date().toISOString(),
        createdBy: mockContext.pathMemory.pathHistory[0],
      });

      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate divergent brainstorming option', () => {
      const options = strategy.generate(mockContext);
      const brainstormOption = options.find(o => o.name.includes('Divergent Brainstorming'));
      expect(brainstormOption).toBeDefined();
      expect(brainstormOption?.category).toBe('process');
    });

    it('should generate perspective multiplication option', () => {
      const options = strategy.generate(mockContext);
      const perspectiveOption = options.find(o => o.name.includes('Perspective Multiplication'));
      expect(perspectiveOption).toBeDefined();
      expect(perspectiveOption?.actions).toContain(
        'Identify "unusual suspects" - those typically not consulted'
      );
    });

    it('should detect need for collective sensing', () => {
      mockContext.pathMemory.constraints.push({
        id: 'uncertain1',
        type: 'environmental',
        description: 'Uncertain market conditions emerging',
        strength: 0.6,
        flexibility: 0.4,
        reversibilityCost: 0.4,
        affectedOptions: [],
        createdAt: new Date().toISOString(),
        createdBy: mockContext.pathMemory.pathHistory[0],
      });

      const options = strategy.generate(mockContext);
      const sensingOption = options.find(o => o.name.includes('Collective Sensing'));
      expect(sensingOption).toBeDefined();
    });

    it('should estimate effort appropriately', () => {
      const options = strategy.generate(mockContext);
      options.forEach(option => {
        const effort = strategy.estimateEffort(option);
        if (option.name.includes('Brainstorming')) {
          expect(effort).toBe('medium');
        } else if (option.name.includes('Multiplication')) {
          expect(effort).toBe('low');
        } else if (option.name.includes('Sensing') || option.name.includes('Aggregation')) {
          expect(effort).toBe('high');
        }
      });
    });
  });

  describe('Integration with Option Generation Engine', () => {
    it('all new strategies should be registered in engine', async () => {
      const { OptionGenerationEngine } = await import('../ergodicity/optionGeneration/engine.js');
      const engine = new OptionGenerationEngine();

      // Test that engine can generate options using new strategies
      const result = engine.generateOptions(mockContext);

      // Check if new strategies are being used
      const strategiesUsed = result.strategiesUsed;
      const newStrategies = [
        'neural_optimization',
        'temporal_shifting',
        'cultural_bridging',
        'collective_divergence',
      ];

      // At least one new strategy should be applicable given our context
      const hasNewStrategy = newStrategies.some(s =>
        strategiesUsed.includes(s as OptionGenerationStrategy)
      );
      expect(hasNewStrategy).toBe(true);
    });
  });
});
