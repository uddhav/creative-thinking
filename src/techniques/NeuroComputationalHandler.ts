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

import {
  BaseTechniqueHandler,
  describeStructuredField,
  firstSentence,
  type TechniqueInfo,
  type StepInfo,
} from './types.js';
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
      reversibility: 'high',
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
      reversibility: 'high',
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
      focus: 'Report what the search found, and where it stopped looking',
      emoji: '🎯',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Declaring the search finished',
          'Reporting a result as converged rather than merely current',
        ],
        realityChanges: [
          'The search stops, so the unexplored regions stay unexplored',
          'The reported result becomes the one others build on',
        ],
        futureConstraints: [
          'Resuming the search costs the setup again, and a plateau reported as a convergence is not revisited',
          'A local optimum reported without that caveat is inherited as a global one',
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
      2: `Generate diverse solution patterns for: "${problem}". Activate multiple neural pathways simultaneously. Create variations through: random initialization, different connection weights, varied activation functions, alternative architectures. Generate at least 5-10 distinct patterns, and allow emergent properties to arise from their interactions. Then analyze how they interact: which reinforce each other (constructive interference), which cancel out (destructive interference), and which combinations produce the most creative emergence?`,
      3: `Synthesize patterns computationally for: "${problem}". Apply computational models: neural networks, genetic algorithms, evolutionary computation, swarm intelligence. Combine biological inspiration with computational efficiency. Create hybrid models that leverage both approaches. Generate novel combinations through computational synthesis.`,
      4: `Run optimization cycles for: "${problem}". Iterate through: feedforward passes, backpropagation, weight adjustment, architecture evolution. Rate convergence on each of coherence (internal consistency), novelty (creative distance from existing solutions) and utility (practical value), and say what the rating is based on. Refine for optimal balance between exploration and exploitation.`,
      5: `Report what the search actually found for: "${problem}". Did it converge, or did it plateau — is this the best solution or the last one it could still improve on? Is it a local optimum, and what would tell you either way? Which regions went unexplored, and were they ruled out or merely never reached? Trace the emergence path: which pattern produced the result, and which contributed nothing. Then hold the result against this technique's own bar: cognitive plausibility, computational efficiency, creative novelty, practical applicability.`,
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

  /**
   * A convergence rating as the caller was asked to give it.
   *
   * `getStepGuidance` and the step-4/5 validation errors offer exactly three
   * ratings — strong, moderate, weak — so a value that is one of them is
   * reported by its name, which is what the caller chose. Anything else is
   * reported as the bare number: the handler defines no scale between the
   * tiers, so bucketing 0.83 into "moderate" would invent a judgement the
   * session never made, which is the same fault the named tiers exist to
   * prevent.
   */
  private renderConvergenceMetrics(value: unknown): string {
    if (typeof value !== 'object' || value === null) {
      return describeStructuredField(value);
    }
    const names = new Map<number, string>([
      [CONVERGENCE_RATING.STRONG, 'strong'],
      [CONVERGENCE_RATING.MODERATE, 'moderate'],
      [CONVERGENCE_RATING.WEAK, 'weak'],
    ]);
    return Object.entries(value)
      .map(([metric, rating]) => {
        if (typeof rating === 'number') {
          return `${metric} ${names.get(rating) ?? String(rating)}`;
        }
        const rendered = describeStructuredField(rating);
        return rendered.length > 0 ? `${metric} ${rendered}` : '';
      })
      .filter(part => part.length > 0)
      .join(', ');
  }

  /**
   * Report what each step actually recorded, labelled by the step.
   *
   * Keyed on `entry.currentStep`, not on position in the array: `execute`
   * appends a history entry for every call including revisions, so one revision
   * shifts every later entry. Keying on the step also means a revision
   * supersedes the entry it revises rather than reporting twice.
   *
   * `validateStep` rejects a step that omits its field, so a session that got
   * this far named its mappings, its patterns, which of them reinforce and
   * which cancel, its models and its ratings; reporting none of them was the
   * defect this fixes.
   */
  extractInsights(history: unknown[]): string[] {
    const totalSteps = this.steps.length;
    const latestByStep = new Map<number, Record<string, unknown>>();

    history.forEach((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        return;
      }
      const entryObj = entry as Record<string, unknown>;
      // Fall back to position only when the caller sent no step number.
      const step = typeof entryObj.currentStep === 'number' ? entryObj.currentStep : index + 1;
      if (step >= 1 && step <= totalSteps) {
        latestByStep.set(step, entryObj);
      }
    });

    const insights: string[] = [];

    for (let step = 1; step <= totalSteps; step++) {
      const entryObj = latestByStep.get(step);
      if (!entryObj) {
        continue;
      }
      const stepName = this.steps[step - 1]?.name;
      if (!stepName) {
        continue;
      }

      const output = typeof entryObj.output === 'string' ? entryObj.output.trim() : '';
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      if (step === 1) {
        const mappings = describeStructuredField(entryObj.neuralMappings);
        if (mappings.length > 0) {
          insights.push(`${stepName}: ${mappings}`);
        }
      }

      if (step === 2) {
        const patterns = describeStructuredField(entryObj.patternGenerations);
        if (patterns.length > 0) {
          insights.push(`${stepName}: ${patterns}`);
        }
        // interferenceAnalysis has known keys, so name what each one means
        // rather than emitting "constructive: a, b; destructive: c".
        const analysis = entryObj.interferenceAnalysis;
        if (typeof analysis === 'object' && analysis !== null) {
          const { constructive, destructive } = analysis as Record<string, unknown>;
          const reinforcing = describeStructuredField(constructive);
          const cancelling = describeStructuredField(destructive);
          if (reinforcing.length > 0) {
            insights.push(`${stepName}: patterns that reinforce — ${reinforcing}`);
          }
          if (cancelling.length > 0) {
            insights.push(`${stepName}: patterns that cancel — ${cancelling}`);
          }
        }
      }

      if (step === 3) {
        const models = describeStructuredField(entryObj.computationalModels);
        if (models.length > 0) {
          insights.push(`${stepName}: ${models}`);
        }
      }

      if (step === 4 && typeof entryObj.optimizationCycles === 'number') {
        insights.push(`${stepName}: ${entryObj.optimizationCycles} optimization cycles run`);
      }

      if (step === 5) {
        const synthesis = describeStructuredField(entryObj.finalSynthesis);
        if (synthesis.length > 0) {
          insights.push(`${stepName}: ${synthesis}`);
        }
      }

      // Steps 4 and 5 both require convergenceMetrics; report it on whichever
      // one carried it rather than only at the end, so a step-4 rating that a
      // later step revised downward is still visible.
      if (step === 4 || step === 5) {
        const metrics = this.renderConvergenceMetrics(entryObj.convergenceMetrics);
        if (metrics.length > 0) {
          insights.push(`${stepName}: rated ${metrics}`);
        }
      }
    }

    // No completion banner. Reaching step 5 is already visible from the step
    // count, and a fixed "optimal solution converged" asserts a finding the
    // session never made — the convergence ratings above are the finding, and
    // they can say weak.

    return insights;
  }
}
