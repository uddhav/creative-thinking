/**
 * Neuro-Computational Synthesis for Enhanced Creativity technique handler with reflexivity
 *
 * Combines neuroscience-inspired cognitive processes with computational creativity methods
 * to generate enhanced creative solutions through hybrid neural-computational approaches.
 *
 * Different from existing techniques:
 * - neural_state: Focuses on DMN/ECN balance, not computational synthesis
 * - meta_learning: Learns from patterns, doesn't create new computational models
 * - neuro_computational: Creates novel solutions through neural-computational hybrid models
 *
 * This technique implements neural network-inspired creativity generation with
 * explicit computational models for enhanced creative problem solving.
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class NeuroComputationalHandler extends BaseTechniqueHandler {
  private readonly steps: StepInfo[] = [
    {
      name: 'Neural Mapping',
      focus: 'Map problem to neural representations',
      emoji: '🧠',
      type: 'thinking',
    },
    {
      name: 'Pattern Generation',
      focus: 'Generate diverse solution patterns',
      emoji: '🌊',
      type: 'thinking',
    },
    {
      name: 'Interference Analysis',
      focus: 'Analyze pattern interactions',
      emoji: '⚡',
      type: 'thinking',
    },
    {
      name: 'Computational Synthesis',
      focus: 'Synthesize patterns computationally',
      emoji: '🔬',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Creating computational models',
          'Synthesizing neural patterns',
          'Building hybrid solutions',
        ],
        realityChanges: [
          'Computational models created',
          'Neural patterns synthesized',
          'Hybrid architecture established',
        ],
        futureConstraints: [
          'Must work within computational model',
          'Neural architecture constraints',
          'Synthesis patterns locked in',
        ],
        reversibility: 'low',
      },
    },
    {
      name: 'Optimization Cycles',
      focus: 'Iterate and refine solutions',
      emoji: '🔄',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Running optimization cycles',
          'Refining solution parameters',
          'Iterating toward convergence',
        ],
        realityChanges: [
          'Solution optimized',
          'Parameters refined',
          'Convergence path established',
        ],
        futureConstraints: [
          'Optimization creates local minima',
          'Parameter space constrained',
          'Must continue on optimization path',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Convergence',
      focus: 'Converge to optimal solution',
      emoji: '🎯',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Converging to solution',
          'Finalizing neural-computational synthesis',
          'Locking in optimal configuration',
        ],
        realityChanges: [
          'Solution converged',
          'Optimal configuration established',
          'Neural-computational model finalized',
        ],
        futureConstraints: [
          'Solution locked at convergence point',
          'Model architecture fixed',
          'Further optimization limited',
        ],
        reversibility: 'low',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Neuro-Computational Synthesis',
      emoji: '⚛️',
      totalSteps: 6,
      description:
        'Generate solutions using ARTIFICIAL neural network algorithms and computational models (NOT human cognition)',
      focus:
        'Apply machine learning and AI-inspired computational methods to creative problem-solving',
      enhancedFocus:
        'Implements parallel distributed processing, interference analysis, and iterative optimization to generate novel solutions through computational synthesis of neural patterns',
      parallelSteps: {
        canParallelize: false,
        description: 'Steps build sequentially from neural mapping to convergence',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const stepInfo = this.steps[step - 1];
    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Neuro-Computational Synthesis. Valid steps are 1-${this.steps.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.steps.length}` }
      );
    }
    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    const guidanceMap: Record<number, string> = {
      1: `Map "${problem}" to neural representations. Identify cognitive components: perception, memory, attention, executive control. Map connections between components. Define activation patterns and thresholds. Consider both serial and parallel processing pathways. What neural architectures best represent this problem space?`,
      2: `Generate diverse solution patterns for: "${problem}". Activate multiple neural pathways simultaneously. Create variations through: random initialization, different connection weights, varied activation functions, alternative architectures. Generate at least 5-10 distinct patterns. Allow emergent properties to arise from interactions.`,
      3: `Analyze interference between solution patterns for: "${problem}". Identify constructive interference (patterns that reinforce each other) and destructive interference (patterns that cancel out). Map synergies and conflicts. Calculate interference coefficients. Which combinations produce the most creative emergence?`,
      4: `Synthesize patterns computationally for: "${problem}". Apply computational models: neural networks, genetic algorithms, evolutionary computation, swarm intelligence. Combine biological inspiration with computational efficiency. Create hybrid models that leverage both approaches. Generate novel combinations through computational synthesis.`,
      5: `Run optimization cycles for: "${problem}". Iterate through: feedforward passes, backpropagation, weight adjustment, architecture evolution. Measure convergence metrics: coherence (internal consistency), novelty (creative distance from existing solutions), utility (practical value). Refine for optimal balance between exploration and exploitation.`,
      6: `Converge to optimal creative solution for: "${problem}". Synthesize all neural-computational processes. Preserve key insights from each pattern. Ensure solution maintains: cognitive plausibility, computational efficiency, creative novelty, practical applicability. Document the emergence path for future learning.`,
    };

    return guidanceMap[step] || `Continue neuro-computational synthesis for: "${problem}"`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Add specific validation for neuro-computational fields
    if (typeof data === 'object' && data !== null) {
      const stepData = data as Record<string, unknown>;

      switch (step) {
        case 1:
          // Validate neural mapping
          if (!stepData.neuralMappings) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 1 requires neural mappings of problem components',
              'neuralMappings',
              { step, technique: 'neuro_computational' }
            );
          }
          break;
        case 2:
          // Validate pattern generation
          if (!stepData.patternGenerations) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 requires generated solution patterns',
              'patternGenerations',
              { step, technique: 'neuro_computational' }
            );
          }
          break;
        case 3: {
          // Validate interference analysis - require both constructive and destructive
          if (!stepData.interferenceAnalysis) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 (Interference Analysis) requires analyzing pattern interactions. ' +
                'Provide "interferenceAnalysis" object with BOTH constructive AND destructive arrays. ' +
                'Example: { "interferenceAnalysis": { "constructive": ["synergy 1", "reinforcement 2"], "destructive": ["conflict 1", "cancellation 2"] }, "output": "..." }',
              'interferenceAnalysis',
              {
                step,
                technique: 'neuro_computational',
                acceptedFields: ['interferenceAnalysis'],
                example: {
                  interferenceAnalysis: {
                    constructive: ['pattern reinforcement', 'synergistic interaction'],
                    destructive: ['pattern conflict', 'interference cancellation'],
                  },
                },
              }
            );
          }
          const analysis = stepData.interferenceAnalysis as Record<string, unknown>;
          if (!analysis.constructive || !analysis.destructive) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 (Interference Analysis) requires BOTH constructive AND destructive interference patterns. ' +
                'The interferenceAnalysis object must contain both "constructive" and "destructive" arrays. ' +
                'Example: { "interferenceAnalysis": { "constructive": ["synergy 1"], "destructive": ["conflict 1"] }, "output": "..." }',
              'interferenceAnalysis',
              {
                step,
                technique: 'neuro_computational',
                requiredFields: ['constructive', 'destructive'],
                example: {
                  interferenceAnalysis: {
                    constructive: ['positive reinforcement'],
                    destructive: ['negative interference'],
                  },
                },
              }
            );
          }
          break;
        }
        case 4:
          // Validate computational synthesis
          if (!stepData.computationalModels) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 4 (Computational Synthesis) requires synthesizing patterns using computational models. ' +
                'Provide "computationalModels" (array) describing the models used. ' +
                'Example: { "computationalModels": ["neural network", "genetic algorithm", "swarm optimization"], "output": "..." }',
              'computationalModels',
              {
                step,
                technique: 'neuro_computational',
                acceptedFields: ['computationalModels'],
                example: { computationalModels: ['model 1', 'model 2', 'model 3'] },
              }
            );
          }
          break;
        case 5:
          // Validate optimization cycles - require both cycles and metrics
          if (!stepData.optimizationCycles || !stepData.convergenceMetrics) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 5 (Optimization) requires iterating to improve solution quality with measured progress. ' +
                'Provide BOTH "optimizationCycles" (number) AND "convergenceMetrics" (object with coherence, novelty, utility). ' +
                'Example: { "optimizationCycles": 10, "convergenceMetrics": { "coherence": 0.85, "novelty": 0.7, "utility": 0.9 }, "output": "..." }',
              'optimizationCycles',
              {
                step,
                technique: 'neuro_computational',
                requiredFields: ['optimizationCycles', 'convergenceMetrics'],
                example: {
                  optimizationCycles: 10,
                  convergenceMetrics: { coherence: 0.85, novelty: 0.7, utility: 0.9 },
                },
              }
            );
          }
          break;
        case 6:
          // Validate convergence - require synthesis and final metrics
          if (!stepData.finalSynthesis || !stepData.convergenceMetrics) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 6 (Convergence) requires achieving optimal solution with final metrics. ' +
                'Provide BOTH "finalSynthesis" (string) AND "convergenceMetrics" (object with final scores). ' +
                'Example: { "finalSynthesis": "Optimized solution achieving target performance", "convergenceMetrics": { "coherence": 0.95, "novelty": 0.8, "utility": 0.92 }, "output": "..." }',
              'finalSynthesis',
              {
                step,
                technique: 'neuro_computational',
                requiredFields: ['finalSynthesis', 'convergenceMetrics'],
                example: {
                  finalSynthesis: 'Final optimized neural-computational solution',
                  convergenceMetrics: { coherence: 0.95, novelty: 0.8, utility: 0.92 },
                },
              }
            );
          }
          break;
      }
    }

    return true;
  }

  getPromptContext(step: number): Record<string, unknown> {
    const stepInfo = this.getStepInfo(step);
    return {
      technique: 'neuro_computational',
      step,
      stepName: stepInfo.name,
      focus: stepInfo.focus,
      emoji: stepInfo.emoji,
      capabilities: {
        neuralMapping: 'Transform problems into neural network representations',
        patternGeneration: 'Generate diverse solutions through parallel processing',
        interferenceAnalysis: 'Analyze constructive and destructive pattern interactions',
        computationalSynthesis: 'Synthesize patterns using computational models',
        optimizationCycles: 'Iteratively refine for coherence, novelty, and utility',
        convergence: 'Converge to optimal creative solutions',
      },
    };
  }
}
