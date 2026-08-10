/**
 * Tests for NeuroComputationalHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NeuroComputationalHandler,
  CONVERGENCE_RATING,
} from '../../techniques/NeuroComputationalHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('NeuroComputationalHandler', () => {
  let handler: NeuroComputationalHandler;

  beforeEach(() => {
    handler = new NeuroComputationalHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Neuro-Computational Synthesis');
      expect(info.emoji).toBe('⚛️');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toBe(
        'Generate solutions using ARTIFICIAL neural network algorithms and computational models (NOT human cognition)'
      );
      expect(info.focus).toBe(
        'Apply machine learning and AI-inspired computational methods to creative problem-solving'
      );
      expect(info.enhancedFocus).toContain('parallel distributed processing');
      expect(info.enhancedFocus).toContain('interference analysis');
      expect(info.enhancedFocus).toContain('iterative optimization');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.parallelSteps?.description).toBe(
        'Steps build sequentially from neural mapping to convergence'
      );
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for step 1 - Neural Mapping', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Neural Mapping');
      expect(step1.focus).toBe('Map problem to neural representations');
      expect(step1.emoji).toBe('🧠');
      expect(step1.type).toBe('thinking');
    });

    it('should return correct info for step 2 - Pattern Generation', () => {
      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Pattern Generation');
      expect(step2.focus).toBe('Generate diverse solution patterns and analyze how they interact');
      expect(step2.emoji).toBe('🌊');
      expect(step2.type).toBe('thinking');
    });

    it('should cover Interference Analysis inside step 2 rather than as its own step', () => {
      // Interference Analysis was merged into Pattern Generation; step 2 now owns
      // the pattern-interaction question, and no standalone step remains.
      const step2 = handler.getStepInfo(2);
      expect(step2.focus).toContain('analyze how they interact');

      const stepNames = [1, 2, 3, 4, 5].map(step => handler.getStepInfo(step).name);
      expect(stepNames).toEqual([
        'Neural Mapping',
        'Pattern Generation',
        'Computational Synthesis',
        'Optimization Cycles',
        'Convergence',
      ]);
      expect(stepNames).not.toContain('Interference Analysis');
    });

    it('should return correct info for step 3 - Computational Synthesis', () => {
      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Computational Synthesis');
      expect(step3.focus).toBe('Synthesize patterns computationally');
      expect(step3.emoji).toBe('🔬');
      expect(step3.type).toBe('action');
      expect(step3.reflexiveEffects).toBeDefined();
    });

    it('should return correct info for step 4 - Optimization Cycles', () => {
      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Optimization Cycles');
      expect(step4.focus).toBe('Iterate and refine solutions');
      expect(step4.emoji).toBe('🔄');
      expect(step4.type).toBe('action');
      expect(step4.reflexiveEffects).toBeDefined();
    });

    it('should return correct info for step 5 - Convergence', () => {
      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Convergence');
      expect(step5.focus).toBe('Converge to optimal solution');
      expect(step5.emoji).toBe('🎯');
      expect(step5.type).toBe('action');
      expect(step5.reflexiveEffects).toBeDefined();
    });

    it('should throw error for invalid step numbers', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(6)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(-1)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(100)).toThrow(ValidationError);

      try {
        handler.getStepInfo(6);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Invalid step 6');
        expect((error as ValidationError).message).toContain('Valid steps are 1-5');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'How to optimize creative workflow';

    it('should provide guidance for step 1 - Neural Mapping', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Map "' + problem + '" to a network representation');
      // Not 'cognitive components: perception, memory, attention, executive
      // control'. This technique's description shouts NOT human cognition, and
      // step 1 was asking for human-cognition constructs anyway.
      expect(guidance).not.toContain('perception, memory, attention, executive control');
      expect(guidance).toContain('which hold state');
      expect(guidance).toContain('which route it');
      expect(guidance).toContain('what activates each one and at what threshold');
      expect(guidance).toContain('architecture best represents this problem space');
    });

    it('should provide guidance for step 2 - Pattern Generation', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Generate diverse solution patterns');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('multiple neural pathways');
      expect(guidance).toContain('random initialization');
      expect(guidance).toContain('5-10 distinct patterns');
      expect(guidance).toContain('creative emergence');
    });

    it('should fold the interference analysis prompts into step 2 guidance', () => {
      // Was "step 3 - Interference Analysis"; the same prompts now live in step 2.
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('analyze how they interact');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('constructive interference');
      expect(guidance).toContain('destructive interference');
      expect(guidance).toContain('which reinforce each other');
      expect(guidance).toContain('which cancel out');
      expect(guidance).toContain('creative emergence');
    });

    it('should provide guidance for step 3 - Computational Synthesis', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Synthesize patterns computationally');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('neural networks, genetic algorithms');
      expect(guidance).toContain('evolutionary computation, swarm intelligence');
      expect(guidance).toContain('hybrid models');
      expect(guidance).toContain('computational synthesis');
    });

    it('should provide guidance for step 4 - Optimization Cycles', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Run optimization cycles');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('feedforward passes');
      expect(guidance).toContain('backpropagation');
      expect(guidance).toContain('Rate convergence');
      expect(guidance).toContain('coherence');
      expect(guidance).toContain('novelty');
      expect(guidance).toContain('utility');
      expect(guidance).toContain('say what the rating is based on');
    });

    it('should provide guidance for step 5 - Convergence', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Converge to optimal creative solution');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('Synthesize all neural-computational processes');
      expect(guidance).toContain('Preserve key insights');
      expect(guidance).toContain('cognitive plausibility');
      expect(guidance).toContain('computational efficiency');
      expect(guidance).toContain('creative novelty');
      expect(guidance).toContain('practical applicability');
    });

    it('should provide default guidance for invalid steps', () => {
      const guidance = handler.getStepGuidance(10, problem);
      expect(guidance).toContain('Complete the Neuro-Computational Synthesis process');
      expect(guidance).toContain(problem);
    });
  });

  describe('validateStep', () => {
    it('should validate step 1 data correctly', () => {
      const validData = {
        neuralMappings: ['Component A', 'Component B'],
        output: 'Neural mapping complete',
      };

      expect(handler.validateStep(1, validData)).toBe(true);

      // Test missing neuralMappings
      const missingMappings = {
        output: 'Missing neural mappings',
      };
      expect(() => handler.validateStep(1, missingMappings)).toThrow(ValidationError);

      try {
        handler.validateStep(1, missingMappings);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect((error as ValidationError).message).toContain('neural mappings');
      }
    });

    it('should validate step 2 data correctly', () => {
      const validData = {
        patternGenerations: ['Pattern 1', 'Pattern 2', 'Pattern 3'],
        interferenceAnalysis: {
          constructive: ['Synergy 1', 'Synergy 2'],
          destructive: ['Conflict 1', 'Conflict 2'],
        },
        output: 'Patterns generated',
      };

      expect(handler.validateStep(2, validData)).toBe(true);

      // Test missing patternGenerations
      const missingPatterns = {
        interferenceAnalysis: {
          constructive: ['Synergy 1'],
          destructive: ['Conflict 1'],
        },
        output: 'Missing patterns',
      };
      expect(() => handler.validateStep(2, missingPatterns)).toThrow(ValidationError);
    });

    it('should require interference analysis as part of step 2', () => {
      // Was "should validate step 3 data correctly" for the standalone
      // Interference Analysis step; the merged step 2 now enforces it.
      const validData = {
        patternGenerations: ['Pattern 1', 'Pattern 2'],
        interferenceAnalysis: {
          constructive: ['Synergy 1', 'Synergy 2'],
          destructive: ['Conflict 1', 'Conflict 2'],
        },
        output: 'Interference analyzed',
      };

      expect(handler.validateStep(2, validData)).toBe(true);

      // Test missing interferenceAnalysis
      const missingAnalysis = {
        patternGenerations: ['Pattern 1'],
        output: 'Missing analysis',
      };
      expect(() => handler.validateStep(2, missingAnalysis)).toThrow(ValidationError);

      try {
        handler.validateStep(2, missingAnalysis);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
        expect((error as ValidationError).message).toContain('Step 2 (Pattern Generation)');
        expect((error as ValidationError).message).toContain(
          'BOTH constructive AND destructive arrays'
        );
      }

      // Test missing constructive field
      const missingConstructive = {
        patternGenerations: ['Pattern 1'],
        interferenceAnalysis: {
          destructive: ['Conflict 1'],
        },
        output: 'Missing constructive',
      };
      expect(() => handler.validateStep(2, missingConstructive)).toThrow(ValidationError);

      // Test missing destructive field
      const missingDestructive = {
        patternGenerations: ['Pattern 1'],
        interferenceAnalysis: {
          constructive: ['Synergy 1'],
        },
        output: 'Missing destructive',
      };
      expect(() => handler.validateStep(2, missingDestructive)).toThrow(ValidationError);

      try {
        handler.validateStep(2, missingDestructive);
      } catch (error) {
        expect((error as ValidationError).message).toContain(
          'BOTH constructive AND destructive interference patterns'
        );
      }
    });

    it('should validate step 3 data correctly', () => {
      const validData = {
        computationalModels: ['Neural network model', 'Genetic algorithm'],
        output: 'Models synthesized',
      };

      expect(handler.validateStep(3, validData)).toBe(true);

      // Test missing computationalModels
      const missingModels = {
        output: 'Missing models',
      };
      expect(() => handler.validateStep(3, missingModels)).toThrow(ValidationError);
    });

    it('should validate step 4 data correctly', () => {
      const validData = {
        optimizationCycles: 10,
        convergenceMetrics: {
          coherence: CONVERGENCE_RATING.STRONG,
          novelty: CONVERGENCE_RATING.MODERATE,
          utility: CONVERGENCE_RATING.STRONG,
        },
        output: 'Optimization complete',
      };

      expect(handler.validateStep(4, validData)).toBe(true);

      // Test missing optimizationCycles
      const missingCycles = {
        convergenceMetrics: {
          coherence: CONVERGENCE_RATING.STRONG,
          novelty: CONVERGENCE_RATING.MODERATE,
          utility: CONVERGENCE_RATING.STRONG,
        },
        output: 'Missing cycles',
      };
      expect(() => handler.validateStep(4, missingCycles)).toThrow(ValidationError);

      // Test missing convergenceMetrics
      const missingMetrics = {
        optimizationCycles: 10,
        output: 'Missing metrics',
      };
      expect(() => handler.validateStep(4, missingMetrics)).toThrow(ValidationError);
    });

    it('should point step 4 at the named convergence ratings', () => {
      try {
        handler.validateStep(4, { output: 'Missing metrics' });
        expect.unreachable('validateStep should have thrown for missing optimization fields');
      } catch (error) {
        const message = (error as ValidationError).message;
        expect(message).toContain('Step 4 (Optimization)');
        expect(message).toContain('strong (0.9), moderate (0.7) or weak (0.5)');
        expect(message).toContain('say in "output" what the rating is based on');
      }
    });

    it('should validate step 5 data correctly', () => {
      const validData = {
        finalSynthesis: 'Optimal solution synthesized',
        convergenceMetrics: {
          coherence: CONVERGENCE_RATING.STRONG,
          novelty: CONVERGENCE_RATING.MODERATE,
          utility: CONVERGENCE_RATING.STRONG,
        },
        output: 'Convergence achieved',
      };

      expect(handler.validateStep(5, validData)).toBe(true);

      // Test missing finalSynthesis
      const missingSynthesis = {
        convergenceMetrics: {
          coherence: CONVERGENCE_RATING.STRONG,
          novelty: CONVERGENCE_RATING.MODERATE,
          utility: CONVERGENCE_RATING.STRONG,
        },
        output: 'Missing synthesis',
      };
      expect(() => handler.validateStep(5, missingSynthesis)).toThrow(ValidationError);

      // Test missing convergenceMetrics
      const missingMetrics = {
        finalSynthesis: 'Solution synthesized',
        output: 'Missing metrics',
      };
      expect(() => handler.validateStep(5, missingMetrics)).toThrow(ValidationError);
    });

    it('should point step 5 at the named convergence ratings', () => {
      try {
        handler.validateStep(5, { output: 'Missing metrics' });
        expect.unreachable('validateStep should have thrown for missing convergence fields');
      } catch (error) {
        const message = (error as ValidationError).message;
        expect(message).toContain('Step 5 (Convergence)');
        expect(message).toContain('strong (0.9), moderate (0.7) or weak (0.5)');
        expect(message).toContain('say in "output" what the rating is based on');
      }
    });

    it('should expose the named convergence ratings the error messages quote', () => {
      expect(CONVERGENCE_RATING.STRONG).toBe(0.9);
      expect(CONVERGENCE_RATING.MODERATE).toBe(0.7);
      expect(CONVERGENCE_RATING.WEAK).toBe(0.5);
    });

    it('should reject invalid step numbers', () => {
      const data = { output: 'test' };
      expect(handler.validateStep(0, data)).toBe(false);
      expect(handler.validateStep(6, data)).toBe(false);
      expect(handler.validateStep(-1, data)).toBe(false);
    });

    it('should handle output as string', () => {
      expect(handler.validateStep(1, 'Applied neural mapping')).toBe(true);
      expect(handler.validateStep(2, 'Generated patterns and analyzed interference')).toBe(true);
      expect(handler.validateStep(5, 'Converged to optimal solution')).toBe(true);
    });

    it('should handle null and undefined data', () => {
      expect(handler.validateStep(1, null)).toBe(true); // null is treated as valid by base validator
      expect(handler.validateStep(1, undefined)).toBe(true); // undefined is also treated as valid by base validator
    });
  });

  describe('extractInsights', () => {
    it('reports every required field under its own step name', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'The queue is the only stateful node.',
          neuralMappings: ['queue holds state', 'router gates by tenant'],
        },
        {
          currentStep: 2,
          patternGenerations: ['batch-then-fan-out', 'fan-out-then-batch'],
          interferenceAnalysis: {
            constructive: ['batching amplifies tenant isolation'],
            destructive: ['fan-out first defeats batching'],
          },
        },
        { currentStep: 3, computationalModels: ['genetic algorithm', 'swarm optimization'] },
        {
          currentStep: 4,
          optimizationCycles: 12,
          convergenceMetrics: { coherence: 0.9, novelty: 0.7, utility: 0.5 },
        },
        {
          currentStep: 5,
          finalSynthesis: 'Batch inside the tenant boundary, fan out across it',
          convergenceMetrics: { coherence: 0.9, novelty: 0.9, utility: 0.9 },
        },
      ]);

      expect(insights).toContain('Neural Mapping: queue holds state, router gates by tenant');
      expect(insights).toContain('Pattern Generation: batch-then-fan-out, fan-out-then-batch');
      expect(insights).toContain(
        'Pattern Generation: patterns that reinforce — batching amplifies tenant isolation'
      );
      expect(insights).toContain(
        'Pattern Generation: patterns that cancel — fan-out first defeats batching'
      );
      expect(insights).toContain('Computational Synthesis: genetic algorithm, swarm optimization');
      expect(insights).toContain('Optimization Cycles: 12 optimization cycles run');
      expect(insights).toContain(
        'Convergence: Batch inside the tenant boundary, fan out across it'
      );
      // No banner: reaching step 5 is not itself a finding.
      expect(insights.some(i => /optimal solution converged|synthesis complete/i.test(i))).toBe(
        false
      );
    });

    it('names the convergence ratings the caller was offered', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 4,
          optimizationCycles: 3,
          convergenceMetrics: { coherence: 0.9, novelty: 0.7, utility: 0.5 },
        },
      ]);

      expect(insights).toContain(
        'Optimization Cycles: rated coherence strong, novelty moderate, utility weak'
      );
      // The bare decimals are what made every caller invent their own.
      expect(insights.some(i => i.includes('0.9'))).toBe(false);
    });

    it('passes an off-scale rating through as its number rather than bucketing it', () => {
      const insights = handler.extractInsights([
        { currentStep: 4, optimizationCycles: 1, convergenceMetrics: { coherence: 0.83 } },
      ]);

      expect(insights).toContain('Optimization Cycles: rated coherence 0.83');
      expect(insights.some(i => /strong|moderate|weak/.test(i))).toBe(false);
    });

    it('reports a weak final rating rather than only the strong ones', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 5,
          finalSynthesis: 'Converged on the incumbent design',
          convergenceMetrics: { coherence: 0.9, novelty: 0.5, utility: 0.7 },
        },
      ]);

      expect(insights).toContain(
        'Convergence: rated coherence strong, novelty weak, utility moderate'
      );
    });

    it('lets a revision supersede the step it revises', () => {
      const insights = handler.extractInsights([
        { currentStep: 1, neuralMappings: ['the first reading'] },
        { currentStep: 3, computationalModels: ['a later step'] },
        { currentStep: 1, neuralMappings: ['the corrected reading'] },
      ]);

      expect(insights).toContain('Neural Mapping: the corrected reading');
      expect(insights).not.toContain('Neural Mapping: the first reading');
      expect(insights).toContain('Computational Synthesis: a later step');
      expect(insights.some(i => i.startsWith('Pattern Generation'))).toBe(false);
    });

    it('reports nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 1, output: '   ' }])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 3, computationalModels: [] }])).toEqual([]);
    });

    it('does not cut the output summary at an abbreviation', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Depth is 3 layers vs. 12 before. The router is what collapsed.',
        },
      ]);

      expect(insights[0]).toContain('vs. 12 before.');
    });
  });

  describe('getPromptContext', () => {
    it('should return correct context for step 1', () => {
      const context = handler.getPromptContext(1);
      expect(context.technique).toBe('neuro_computational');
      expect(context.step).toBe(1);
      expect(context.stepName).toBe('Neural Mapping');
      expect(context.focus).toBe('Map problem to neural representations');
      expect(context.emoji).toBe('🧠');
      expect(context.capabilities).toBeDefined();
      expect(context.capabilities).toHaveProperty('neuralMapping');
    });

    it('should surface the interference analysis capability on step 2', () => {
      // Was asserted against the standalone step 3; step 2 now carries it.
      const context = handler.getPromptContext(2);
      expect(context.step).toBe(2);
      expect(context.stepName).toBe('Pattern Generation');
      expect(context.capabilities).toHaveProperty('interferenceAnalysis');
    });

    it('should return correct context for step 3', () => {
      const context = handler.getPromptContext(3);
      expect(context.step).toBe(3);
      expect(context.stepName).toBe('Computational Synthesis');
      expect(context.capabilities).toHaveProperty('computationalSynthesis');
    });

    it('should return correct context for step 5', () => {
      const context = handler.getPromptContext(5);
      expect(context.step).toBe(5);
      expect(context.stepName).toBe('Convergence');
      expect(context.capabilities).toHaveProperty('convergence');
    });

    it('should include all required capabilities', () => {
      const context = handler.getPromptContext(1);
      const capabilities = context.capabilities as Record<string, string>;

      expect(capabilities.neuralMapping).toBe(
        'Transform problems into neural network representations'
      );
      expect(capabilities.patternGeneration).toBe(
        'Generate diverse solutions through parallel processing'
      );
      expect(capabilities.interferenceAnalysis).toBe(
        'Analyze constructive and destructive pattern interactions'
      );
      expect(capabilities.computationalSynthesis).toBe(
        'Synthesize patterns using computational models'
      );
      expect(capabilities.optimizationCycles).toBe(
        'Iteratively refine for coherence, novelty, and utility'
      );
      expect(capabilities.convergence).toBe('Converge to optimal creative solutions');
    });
  });
});
