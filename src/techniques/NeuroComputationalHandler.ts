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

/**
 * Named convergence ratings, so callers report a judgement instead of copying a
 * decimal out of an error message.
 *
 * Same problem the discovery layer's effectiveness scale had: the numbers were
 * invented, they looked measured, and worked examples carrying values like 0.85
 * taught every caller to invent their own to matching precision. Naming the
 * tiers keeps the wire format numeric while making it plain that only a few
 * levels are meaningful, and that the rating needs a stated basis.
 */
export const CONVERGENCE_RATING = {
  STRONG: 0.9,
  MODERATE: 0.7,
  WEAK: 0.5,
} as const;

export class NeuroComputationalHandler extends BaseTechniqueHandler {
  private readonly steps: StepInfo[] = [
    {
      name: 'Neural Mapping',
      focus: 'Map problem to neural representations',
      emoji: '🧠',
      type: 'thinking',
    },
    {
      // Generation and interference analysis are one step. Splitting them asked
      // the same question twice — which of these patterns reinforce and which
      // cancel — and the second half duplicated quantum_superposition's
      // interference step almost word for word.
      name: 'Pattern Generation',
      focus: 'Generate diverse solution patterns and analyze how they interact',
      emoji: '🌊',
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
      totalSteps: 5,
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
      1: `Map "${problem}" to a network representation. Identify the components by what they do: which hold state, which transform it, which route it, and which gate it. Map the connections between them, and define what activates each one and at what threshold. Consider both serial and parallel pathways. What architecture best represents this problem space?`,
      2: `Generate diverse solution patterns for: "${problem}". Activate multiple neural pathways simultaneously. Create variations through: random initialization, different connection weights, varied activation functions, alternative architectures. Generate at least 5-10 distinct patterns. Then analyze how they interact: which reinforce each other (constructive interference), which cancel out (destructive interference), and which combinations produce the most creative emergence?`,
      3: `Synthesize patterns computationally for: "${problem}". Apply computational models: neural networks, genetic algorithms, evolutionary computation, swarm intelligence. Combine biological inspiration with computational efficiency. Create hybrid models that leverage both approaches. Generate novel combinations through computational synthesis.`,
      4: `Run optimization cycles for: "${problem}". Iterate through: feedforward passes, backpropagation, weight adjustment, architecture evolution. Rate convergence on each of coherence (internal consistency), novelty (creative distance from existing solutions) and utility (practical value), and say what the rating is based on. Refine for optimal balance between exploration and exploitation.`,
      5: `Converge to optimal creative solution for: "${problem}". Synthesize all neural-computational processes. Preserve key insights from each pattern. Ensure solution maintains: cognitive plausibility, computational efficiency, creative novelty, practical applicability. Document the emergence path for future learning.`,
    };

    return (
      guidanceMap[step] || `Complete the Neuro-Computational Synthesis process for: "${problem}"`
    );
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
        case 2: {
          // Pattern generation now carries the interference analysis too.
          if (!stepData.patternGenerations) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 requires generated solution patterns',
              'patternGenerations',
              { step, technique: 'neuro_computational' }
            );
          }
          if (!stepData.interferenceAnalysis) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 (Pattern Generation) requires analyzing how the generated patterns interact. ' +
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
              'Step 2 (Pattern Generation) requires BOTH constructive AND destructive interference patterns. ' +
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
        case 3:
          // Validate computational synthesis
          if (!stepData.computationalModels) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 (Computational Synthesis) requires synthesizing patterns using computational models. ' +
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
        case 4:
          // Validate optimization cycles - require both cycles and metrics
          if (!stepData.optimizationCycles || !stepData.convergenceMetrics) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 4 (Optimization) requires iterating to improve solution quality with rated progress. ' +
                'Provide BOTH "optimizationCycles" (number) AND "convergenceMetrics" (object rating coherence, novelty and utility). ' +
                'Rate each as strong (0.9), moderate (0.7) or weak (0.5), and say in "output" what the rating is based on. ' +
                'Example: { "optimizationCycles": 10, "convergenceMetrics": { "coherence": 0.9, "novelty": 0.7, "utility": 0.9 }, "output": "..." }',
              'optimizationCycles',
              {
                step,
                technique: 'neuro_computational',
                requiredFields: ['optimizationCycles', 'convergenceMetrics'],
                example: {
                  optimizationCycles: 10,
                  convergenceMetrics: {
                    coherence: CONVERGENCE_RATING.STRONG,
                    novelty: CONVERGENCE_RATING.MODERATE,
                    utility: CONVERGENCE_RATING.STRONG,
                  },
                },
              }
            );
          }
          break;
        case 5:
          // Validate convergence - require synthesis and final metrics
          if (!stepData.finalSynthesis || !stepData.convergenceMetrics) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 5 (Convergence) requires achieving optimal solution with final ratings. ' +
                'Provide BOTH "finalSynthesis" (string) AND "convergenceMetrics" (object rating coherence, novelty and utility). ' +
                'Rate each as strong (0.9), moderate (0.7) or weak (0.5), and say in "output" what the rating is based on. ' +
                'Example: { "finalSynthesis": "Optimized solution achieving target performance", "convergenceMetrics": { "coherence": 0.9, "novelty": 0.7, "utility": 0.9 }, "output": "..." }',
              'finalSynthesis',
              {
                step,
                technique: 'neuro_computational',
                requiredFields: ['finalSynthesis', 'convergenceMetrics'],
                example: {
                  finalSynthesis: 'Final optimized neural-computational solution',
                  convergenceMetrics: {
                    coherence: CONVERGENCE_RATING.STRONG,
                    novelty: CONVERGENCE_RATING.MODERATE,
                    utility: CONVERGENCE_RATING.STRONG,
                  },
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
