/**
 * Tests for NeuroComputationalHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NeuroComputationalHandler } from '../../techniques/NeuroComputationalHandler.js';
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
      expect(info.totalSteps).toBe(6);
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
      expect(step1.description).toContain(
        'Transform problem space into neural network representations'
      );
    });

    it('should return correct info for step 2 - Pattern Generation', () => {
      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Pattern Generation');
      expect(step2.focus).toBe('Generate diverse solution patterns');
      expect(step2.emoji).toBe('🌊');
      expect(step2.description).toContain('parallel distributed processing');
    });

    it('should return correct info for step 3 - Interference Analysis', () => {
      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Interference Analysis');
      expect(step3.focus).toBe('Analyze pattern interactions');
      expect(step3.emoji).toBe('⚡');
      expect(step3.description).toContain('constructive and destructive interference');
    });

    it('should return correct info for step 4 - Computational Synthesis', () => {
      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Computational Synthesis');
      expect(step4.focus).toBe('Synthesize patterns computationally');
      expect(step4.emoji).toBe('🔬');
      expect(step4.description).toContain('computational models to synthesize neural patterns');
    });

    it('should return correct info for step 5 - Optimization Cycles', () => {
      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Optimization Cycles');
      expect(step5.focus).toBe('Iterate and refine solutions');
      expect(step5.emoji).toBe('🔄');
      expect(step5.description).toContain('iterative optimization cycles');
    });

    it('should return correct info for step 6 - Convergence', () => {
      const step6 = handler.getStepInfo(6);
      expect(step6.name).toBe('Convergence');
      expect(step6.focus).toBe('Converge to optimal solution');
      expect(step6.emoji).toBe('🎯');
      expect(step6.description).toContain('optimal creative solution with preserved insights');
    });

    it('should throw error for invalid step numbers', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(7)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(-1)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(100)).toThrow(ValidationError);

      try {
        handler.getStepInfo(7);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Invalid step 7');
        expect((error as ValidationError).message).toContain('Valid steps are 1-6');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'How to optimize creative workflow';

    it('should provide guidance for step 1 - Neural Mapping', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Map "' + problem + '" to neural representations');
      expect(guidance).toContain('cognitive components');
      expect(guidance).toContain('perception, memory, attention, executive control');
      expect(guidance).toContain('activation patterns');
      expect(guidance).toContain('neural architectures');
    });

    it('should provide guidance for step 2 - Pattern Generation', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Generate diverse solution patterns');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('multiple neural pathways');
      expect(guidance).toContain('random initialization');
      expect(guidance).toContain('5-10 distinct patterns');
      expect(guidance).toContain('emergent properties');
    });

    it('should provide guidance for step 3 - Interference Analysis', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Analyze interference between solution patterns');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('constructive interference');
      expect(guidance).toContain('destructive interference');
      expect(guidance).toContain('interference coefficients');
      expect(guidance).toContain('creative emergence');
    });

    it('should provide guidance for step 4 - Computational Synthesis', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Synthesize patterns computationally');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('neural networks, genetic algorithms');
      expect(guidance).toContain('evolutionary computation, swarm intelligence');
      expect(guidance).toContain('hybrid models');
      expect(guidance).toContain('computational synthesis');
    });

    it('should provide guidance for step 5 - Optimization Cycles', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Run optimization cycles');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('feedforward passes');
      expect(guidance).toContain('backpropagation');
      expect(guidance).toContain('convergence metrics');
      expect(guidance).toContain('coherence');
      expect(guidance).toContain('novelty');
      expect(guidance).toContain('utility');
    });

    it('should provide guidance for step 6 - Convergence', () => {
      const guidance = handler.getStepGuidance(6, problem);
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
      expect(guidance).toContain('Continue neuro-computational synthesis');
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
        output: 'Patterns generated',
      };

      expect(handler.validateStep(2, validData)).toBe(true);

      // Test missing patternGenerations
      const missingPatterns = {
        output: 'Missing patterns',
      };
      expect(() => handler.validateStep(2, missingPatterns)).toThrow(ValidationError);
    });

    it('should validate step 3 data correctly', () => {
      const validData = {
        interferenceAnalysis: {
          constructive: ['Synergy 1', 'Synergy 2'],
          destructive: ['Conflict 1', 'Conflict 2'],
        },
        output: 'Interference analyzed',
      };

      expect(handler.validateStep(3, validData)).toBe(true);

      // Test missing interferenceAnalysis
      const missingAnalysis = {
        output: 'Missing analysis',
      };
      expect(() => handler.validateStep(3, missingAnalysis)).toThrow(ValidationError);

      // Test missing constructive field
      const missingConstructive = {
        interferenceAnalysis: {
          destructive: ['Conflict 1'],
        },
        output: 'Missing constructive',
      };
      expect(() => handler.validateStep(3, missingConstructive)).toThrow(ValidationError);

      // Test missing destructive field
      const missingDestructive = {
        interferenceAnalysis: {
          constructive: ['Synergy 1'],
        },
        output: 'Missing destructive',
      };
      expect(() => handler.validateStep(3, missingDestructive)).toThrow(ValidationError);
    });

    it('should validate step 4 data correctly', () => {
      const validData = {
        computationalModels: ['Neural network model', 'Genetic algorithm'],
        output: 'Models synthesized',
      };

      expect(handler.validateStep(4, validData)).toBe(true);

      // Test missing computationalModels
      const missingModels = {
        output: 'Missing models',
      };
      expect(() => handler.validateStep(4, missingModels)).toThrow(ValidationError);
    });

    it('should validate step 5 data correctly', () => {
      const validData = {
        optimizationCycles: 10,
        convergenceMetrics: {
          coherence: 0.8,
          novelty: 0.7,
          utility: 0.9,
        },
        output: 'Optimization complete',
      };

      expect(handler.validateStep(5, validData)).toBe(true);

      // Test missing optimizationCycles
      const missingCycles = {
        convergenceMetrics: { coherence: 0.8, novelty: 0.7, utility: 0.9 },
        output: 'Missing cycles',
      };
      expect(() => handler.validateStep(5, missingCycles)).toThrow(ValidationError);

      // Test missing convergenceMetrics
      const missingMetrics = {
        optimizationCycles: 10,
        output: 'Missing metrics',
      };
      expect(() => handler.validateStep(5, missingMetrics)).toThrow(ValidationError);
    });

    it('should validate step 6 data correctly', () => {
      const validData = {
        finalSynthesis: 'Optimal solution synthesized',
        convergenceMetrics: {
          coherence: 0.9,
          novelty: 0.8,
          utility: 0.95,
        },
        output: 'Convergence achieved',
      };

      expect(handler.validateStep(6, validData)).toBe(true);

      // Test missing finalSynthesis
      const missingSynthesis = {
        convergenceMetrics: { coherence: 0.9, novelty: 0.8, utility: 0.95 },
        output: 'Missing synthesis',
      };
      expect(() => handler.validateStep(6, missingSynthesis)).toThrow(ValidationError);

      // Test missing convergenceMetrics
      const missingMetrics = {
        finalSynthesis: 'Solution synthesized',
        output: 'Missing metrics',
      };
      expect(() => handler.validateStep(6, missingMetrics)).toThrow(ValidationError);
    });

    it('should reject invalid step numbers', () => {
      const data = { output: 'test' };
      expect(handler.validateStep(0, data)).toBe(false);
      expect(handler.validateStep(7, data)).toBe(false);
      expect(handler.validateStep(-1, data)).toBe(false);
    });

    it('should handle output as string', () => {
      expect(handler.validateStep(1, 'Applied neural mapping')).toBe(true);
      expect(handler.validateStep(3, 'Analyzed interference patterns')).toBe(true);
      expect(handler.validateStep(6, 'Converged to optimal solution')).toBe(true);
    });

    it('should handle null and undefined data', () => {
      expect(handler.validateStep(1, null)).toBe(true); // null is treated as valid by base validator
      expect(handler.validateStep(1, undefined)).toBe(true); // undefined is also treated as valid by base validator
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

    it('should return correct context for step 3', () => {
      const context = handler.getPromptContext(3);
      expect(context.step).toBe(3);
      expect(context.stepName).toBe('Interference Analysis');
      expect(context.capabilities).toHaveProperty('interferenceAnalysis');
    });

    it('should return correct context for step 6', () => {
      const context = handler.getPromptContext(6);
      expect(context.step).toBe(6);
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
