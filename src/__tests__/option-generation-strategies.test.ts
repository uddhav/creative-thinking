import { describe, it, expect, beforeEach } from 'vitest';
import { DecompositionStrategy } from '../ergodicity/optionGeneration/strategies/decomposition.js';
import { TemporalStrategy } from '../ergodicity/optionGeneration/strategies/temporal.js';
import { AbstractionStrategy } from '../ergodicity/optionGeneration/strategies/abstraction.js';
import { InversionStrategy } from '../ergodicity/optionGeneration/strategies/inversion.js';
import { StakeholderStrategy } from '../ergodicity/optionGeneration/strategies/stakeholder.js';
import { ResourceStrategy } from '../ergodicity/optionGeneration/strategies/resource.js';
import { CapabilityStrategy } from '../ergodicity/optionGeneration/strategies/capability.js';
import { RecombinationStrategy } from '../ergodicity/optionGeneration/strategies/recombination.js';
import type { OptionGenerationContext } from '../ergodicity/optionGeneration/types.js';
import type { SessionState } from '../persistence/types.js';

describe('Option Generation Strategies', () => {
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
        flexibilityScore: 0.4,
        constraints: [],
        reversibility: 0.8,
        dependencies: [],
        riskLevel: 'medium',
      },
      pathMemory: {
        pathHistory: [
          {
            technique: 'six_hats',
            decision: 'Initial approach with strong commitment',
            timestamp: Date.now() - 10000,
            flexibilityBefore: 0.8,
            flexibilityAfter: 0.4,
            optionsOpened: ['option1'],
            optionsClosed: ['option2', 'option3'],
            commitmentLevel: 0.7,
            reversibilityCost: 0.6,
          },
        ],
        constraints: [
          {
            id: 'c1',
            type: 'technical',
            description: 'Must use existing infrastructure',
            strength: 0.7,
            flexibility: 0.3,
            reversibilityCost: 0.8,
            affectedOptions: ['cloud-migration', 'new-framework'],
            createdAt: new Date(Date.now() - 20000).toISOString(),
            createdBy: {
              technique: 'six_hats',
              decision: 'Committed to existing infra',
              timestamp: Date.now() - 20000,
              flexibilityBefore: 0.8,
              flexibilityAfter: 0.4,
              optionsOpened: [],
              optionsClosed: ['cloud-migration', 'new-framework'],
              commitmentLevel: 0.7,
              reversibilityCost: 0.8,
            },
          },
        ],
        barrierProximity: [],
        flexibilityOverTime: [{ step: 0, score: 0.4, timestamp: Date.now() }],
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
          optionSpaceSize: 100,
          pathDivergence: 0.1,
          commitmentDepth: 0.7,
          reversibilityIndex: 0.3,
        },
      },
    };
  });

  describe('DecompositionStrategy', () => {
    let strategy: DecompositionStrategy;

    beforeEach(() => {
      strategy = new DecompositionStrategy();
    });

    it('should identify as decomposition strategy', () => {
      expect(strategy.strategyName).toBe('decomposition');
    });

    it('should be applicable when high commitment decisions exist', () => {
      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should not be applicable without high commitment decisions', () => {
      mockContext.pathMemory.pathHistory[0].commitmentLevel = 0.2;
      mockContext.pathMemory.constraints[0].strength = 0.5; // Also lower constraint strength
      expect(strategy.isApplicable(mockContext)).toBe(false);
    });

    it('should generate decomposition options', () => {
      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);
      expect(options[0].strategy).toBe('decomposition');
      expect(options[0].category).toBe('structural');
    });

    it('should identify modularizable commitments', () => {
      const options = strategy.generate(mockContext);
      const modularOption = options.find(o => o.name.includes('Modularize'));

      expect(modularOption).toBeDefined();
      expect(modularOption?.actions.length).toBeGreaterThan(0);
    });

    it('should estimate effort correctly', () => {
      const options = strategy.generate(mockContext);
      options.forEach(option => {
        const effort = strategy.estimateEffort(option);
        expect(['low', 'medium', 'high']).toContain(effort);
      });
    });
  });

  describe('TemporalStrategy', () => {
    let strategy: TemporalStrategy;

    beforeEach(() => {
      strategy = new TemporalStrategy();
    });

    it('should be applicable when commitments exist', () => {
      // Add time constraint to make it applicable
      mockContext.pathMemory.constraints[0].description = 'Must meet project deadline';
      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate temporal shifting options', () => {
      // Ensure we have time constraint to make it applicable
      mockContext.pathMemory.constraints[0].description = 'Project deadline in 2 weeks';

      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);
      expect(options[0].strategy).toBe('temporal');

      // Check for either Defer or Delay in the name
      const deferOption = options.find(o => o.name.includes('Defer') || o.name.includes('Delay'));
      expect(deferOption).toBeDefined();
    });

    it('should identify opportunities for acceleration', () => {
      // Add time constraint
      mockContext.pathMemory.constraints[0].description = 'Project deadline approaching';

      // Add available options that might expire
      mockContext.pathMemory.availableOptions = [
        'Quick implementation now',
        'Time-sensitive opportunity',
      ];

      mockContext.pathMemory.pathHistory.push({
        technique: 'po',
        decision: 'Quick win opportunity identified',
        timestamp: Date.now() - 5000,
        flexibilityBefore: 0.5,
        flexibilityAfter: 0.4,
        optionsOpened: ['fastTrack'],
        optionsClosed: [],
        commitmentLevel: 0.3,
        reversibilityCost: 0.2,
      });

      const options = strategy.generate(mockContext);
      const accelerateOption = options.find(o => o.name.includes('Accelerate'));

      expect(accelerateOption).toBeDefined();
    });

    it('should create phasing options for complex problems', () => {
      // Add time constraint
      mockContext.pathMemory.constraints[0].description = 'Project deadline approaching';

      // Ensure we have enough history for sequential processing
      mockContext.sessionState.currentStep = 5;

      const options = strategy.generate(mockContext);

      // Check for various temporal options (Phase, Reorder, Parallel, etc.)
      const temporalOption = options.find(
        o =>
          o.name.includes('Phase') ||
          o.name.includes('Reorder') ||
          o.name.includes('Parallel') ||
          o.category === 'temporal'
      );

      expect(temporalOption).toBeDefined();
      expect(temporalOption?.strategy).toBe('temporal');
    });
  });

  describe('AbstractionStrategy', () => {
    let strategy: AbstractionStrategy;

    beforeEach(() => {
      strategy = new AbstractionStrategy();
    });

    it('should be applicable when stuck in details', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.35;
      mockContext.pathMemory.constraints.push({
        id: 'c2',
        type: 'technical',
        description: 'Complex implementation details',
        strength: 0.6,
        flexibility: 0.4,
        reversibilityCost: 0.5,
        affectedOptions: ['simple-solution'],
        createdAt: new Date(Date.now() - 15000).toISOString(),
        createdBy: mockContext.pathMemory.pathHistory[0],
      });

      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate abstraction level options', () => {
      // Ensure abstraction strategy is applicable
      mockContext.currentFlexibility.flexibilityScore = 0.35;
      mockContext.pathMemory.constraints.push({
        id: 'c2',
        type: 'technical',
        description:
          'Complex implementation details requiring specific framework knowledge and intricate configuration',
        strength: 0.6,
        flexibility: 0.4,
        reversibilityCost: 0.5,
        affectedOptions: ['simple-solution'],
        createdAt: new Date(Date.now() - 15000).toISOString(),
        createdBy: mockContext.pathMemory.pathHistory[0],
      });

      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);

      // Check for pattern abstraction or principle extraction options
      const abstractionOption = options.find(
        o =>
          o.name.includes('Pattern') || o.name.includes('Principle') || o.name.includes('Transfer')
      );

      expect(abstractionOption).toBeDefined();
    });
  });

  describe('InversionStrategy', () => {
    let strategy: InversionStrategy;

    beforeEach(() => {
      strategy = new InversionStrategy();
    });

    it('should be applicable with strong assumptions', () => {
      mockContext.pathMemory.pathHistory[0].decision =
        'We must always maintain backwards compatibility';
      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate assumption inversion options', () => {
      mockContext.pathMemory.constraints[0].description = 'Must always be synchronous';

      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);

      const inversionOption = options.find(o => o.name.includes('Invert'));
      expect(inversionOption).toBeDefined();
      expect(inversionOption?.description).toContain('assumption');
    });

    it('should adapt risk tolerance based on flexibility', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.3; // Low flexibility

      const options = strategy.generate(mockContext);
      const inversionOption = options[0];

      expect(inversionOption.prerequisites.some(p => p.includes('rollback'))).toBe(true);
    });
  });

  describe('StakeholderStrategy', () => {
    let strategy: StakeholderStrategy;

    beforeEach(() => {
      strategy = new StakeholderStrategy();
    });

    it('should be applicable with stakeholder constraints', () => {
      mockContext.pathMemory.constraints[0].type = 'relational';
      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should identify stakeholders from context', () => {
      mockContext.pathMemory.constraints[0].description = 'Customer requirements must be met';
      mockContext.pathMemory.pathHistory[0].decision = 'Team agreed to approach';

      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);

      const perspectiveOption = options.find(o => o.name.includes('Perspective'));
      expect(perspectiveOption).toBeDefined();
    });

    it('should adapt engagement based on urgency', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.3; // Urgent

      const options = strategy.generate(mockContext);
      const perspectiveOption = options.find(o => o.name.includes('Perspective'));

      expect(perspectiveOption?.actions.some(a => a.includes('Quick'))).toBe(true);
    });
  });

  describe('ResourceStrategy', () => {
    let strategy: ResourceStrategy;

    beforeEach(() => {
      strategy = new ResourceStrategy();
    });

    it('should be applicable with resource constraints', () => {
      mockContext.pathMemory.constraints[0].type = 'resource';
      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate resource reallocation options', () => {
      mockContext.pathMemory.constraints[0].description = 'Limited budget available';

      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);

      const reallocationOption = options.find(
        o => o.name.includes('Reallocate') || o.name.includes('Optimize')
      );
      expect(reallocationOption).toBeDefined();
    });

    it('should identify resource multiplication opportunities', () => {
      const options = strategy.generate(mockContext);

      const multiplyOption = options.find(o => o.name.includes('Multiply'));
      expect(multiplyOption).toBeDefined();
      expect(multiplyOption?.description).toContain('reusable');
    });
  });

  describe('CapabilityStrategy', () => {
    let strategy: CapabilityStrategy;

    beforeEach(() => {
      strategy = new CapabilityStrategy();
    });

    it('should be applicable with capability constraints', () => {
      mockContext.pathMemory.constraints[0].description = 'Lack of expertise in area';
      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate skill development options', () => {
      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);

      const skillOption = options.find(
        o => o.name.includes('Develop') && o.name.includes('Capability')
      );
      expect(skillOption).toBeDefined();
    });

    it('should adapt learning approach based on urgency', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.25; // Very urgent

      const options = strategy.generate(mockContext);
      const skillOption = options.find(o => o.name.includes('Develop'));

      expect(skillOption?.actions.some(a => a.includes('rapid'))).toBe(true);
    });
  });

  describe('RecombinationStrategy', () => {
    let strategy: RecombinationStrategy;

    beforeEach(() => {
      strategy = new RecombinationStrategy();
    });

    it('should be applicable with multiple past decisions', () => {
      // Add more history
      for (let i = 0; i < 5; i++) {
        mockContext.pathMemory.pathHistory.push({
          technique: ['po', 'scamper', 'yes_and'][i % 3] as 'po' | 'scamper' | 'yes_and',
          decision: `Decision ${i}`,
          timestamp: Date.now() - i * 1000,
          flexibilityBefore: 0.5,
          flexibilityAfter: 0.4,
          optionsOpened: [],
          optionsClosed: [],
          commitmentLevel: 0.3,
          reversibilityCost: 0.2,
        });
      }

      expect(strategy.isApplicable(mockContext)).toBe(true);
    });

    it('should generate recombination options', () => {
      mockContext.pathMemory.pathHistory.push({
        technique: 'scamper',
        decision: 'Modified approach',
        timestamp: Date.now() - 5000,
        flexibilityBefore: 0.5,
        flexibilityAfter: 0.4,
        optionsOpened: [],
        optionsClosed: [],
        commitmentLevel: 0.3,
        reversibilityCost: 0.2,
      });

      const options = strategy.generate(mockContext);

      expect(options.length).toBeGreaterThan(0);

      const hybridOption = options.find(o => o.name.includes('Hybrid'));
      expect(hybridOption).toBeDefined();
    });

    it('should identify complementary techniques', () => {
      mockContext.pathMemory.pathHistory.push({
        technique: 'po',
        decision: 'Creative approach',
        timestamp: Date.now() - 5000,
        flexibilityBefore: 0.5,
        flexibilityAfter: 0.4,
        optionsOpened: [],
        optionsClosed: [],
        commitmentLevel: 0.3,
        reversibilityCost: 0.2,
      });

      const options = strategy.generate(mockContext);
      const crossPollinateOption = options.find(o => o.name.includes('Cross-Pollinate'));

      expect(crossPollinateOption).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context gracefully', () => {
      const emptyContext: OptionGenerationContext = {
        ...mockContext,
        pathMemory: {
          pathHistory: [],
          constraints: [],
          barrierProximity: [],
          flexibilityOverTime: [],
        },
      };

      const strategies = [
        new DecompositionStrategy(),
        new TemporalStrategy(),
        new AbstractionStrategy(),
        new InversionStrategy(),
        new StakeholderStrategy(),
        new ResourceStrategy(),
        new CapabilityStrategy(),
        new RecombinationStrategy(),
      ];

      strategies.forEach(strategy => {
        expect(() => strategy.generate(emptyContext)).not.toThrow();
      });
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(1000);
      mockContext.pathMemory.constraints[0].description = longDescription;

      const strategy = new InversionStrategy();
      const options = strategy.generate(mockContext);

      options.forEach(option => {
        expect(option.description.length).toBeLessThan(1000);
        expect(option.name.length).toBeLessThan(200);
      });
    });
  });
});
