/**
 * Meta-Learning from Path Integration technique handler with reflexivity
 * Improves integration capabilities by learning from path patterns across all techniques
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class MetaLearningHandler extends BaseTechniqueHandler {
  private readonly steps: StepInfo[] = [
    {
      name: 'Pattern Recognition',
      focus: 'Identify successful path patterns across techniques',
      emoji: '🔍',
      type: 'thinking',
    },
    {
      name: 'Learning Accumulation',
      focus: 'Store effective combinations and context mappings',
      emoji: '📊',
      type: 'thinking',
    },
    {
      name: 'Strategy Evolution',
      focus: 'Adapt technique selection and execution sequences',
      emoji: '🔄',
      type: 'thinking',
    },
    {
      name: 'Feedback Integration',
      focus: 'Incorporate telemetry data and user choices',
      emoji: '📈',
      type: 'thinking',
    },
    {
      name: 'Meta-Synthesis',
      focus: 'Generate improved integration strategies',
      emoji: '🧠',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Creating new integration strategies',
          'Synthesizing meta-learning insights',
          'Establishing learning frameworks',
        ],
        realityChanges: [
          'New strategies created',
          'Learning patterns established',
          'Integration approach evolved',
        ],
        futureConstraints: [
          'Must follow synthesized strategies',
          'Learning patterns guide future decisions',
          'Meta-framework shapes technique selection',
        ],
        reversibility: 'medium',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Meta-Learning from Path Integration',
      emoji: '🧠',
      totalSteps: 5,
      description: 'Learn from path patterns across techniques to improve integration capabilities',
      focus: 'Self-improving integration through pattern recognition and adaptive strategies',
      enhancedFocus:
        'System learns how to learn from paths, recognizing successful patterns and evolving strategies based on accumulated knowledge',
      parallelSteps: {
        canParallelize: false,
        description: 'Steps build sequentially from pattern recognition to meta-synthesis',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const stepInfo = this.steps[step - 1];
    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Meta-Learning. Valid steps are 1-${this.steps.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.steps.length}` }
      );
    }
    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    const guidanceMap: Record<number, string> = {
      1: `Analyze patterns across all techniques used for: "${problem}". What successful path patterns emerge? Which techniques work well together? Identify failure modes and their causes. Look for cross-technique synergies and emergent strategies. What patterns predict success or failure?`,
      2: `Accumulate learnings from identified patterns. Store effective technique combinations and their contexts. Build an affinity matrix showing which techniques complement each other. Track context-success mappings. Create a learning history that can inform future decisions.`,
      3: `Evolve your strategy based on accumulated learnings. How should technique selection adapt to this problem type? What execution sequences prove most effective? How can convergence methods be improved? What option generation strategies work best? Design adaptive selection criteria.`,
      4: `Integrate feedback from all available sources. What do telemetry patterns reveal about technique effectiveness? How do user choices inform better recommendations? What domain-specific patterns emerge? How should visual indicators evolve to better guide the process?`,
      5: `Synthesize meta-learning insights into improved integration strategies. Generate recommendations for: optimal technique combinations, execution sequences, context adaptations, and failure prevention. Create a self-improving framework that gets better with each use.`,
    };

    return guidanceMap[step] || `Continue meta-learning analysis for: "${problem}"`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Add specific validation for meta-learning fields
    if (typeof data === 'object' && data !== null) {
      const stepData = data as Record<string, unknown>;

      switch (step) {
        case 1:
          // Validate pattern recognition
          if (!stepData.patternRecognition && !stepData.patterns) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 1 (Pattern Recognition) requires identifying successful patterns across techniques. ' +
                'Provide "patternRecognition" (array) or "patterns" (array) describing recognized patterns. ' +
                'Example: { "patternRecognition": ["Divergent thinking works best early", "Constraints improve creativity"], "output": "..." }',
              'patternRecognition',
              {
                step,
                technique: 'meta_learning',
                acceptedFields: ['patternRecognition', 'patterns'],
                example: {
                  patternRecognition: [
                    'successful pattern 1',
                    'effective strategy 2',
                    'recurring theme 3',
                  ],
                },
              }
            );
          }
          break;
        case 2:
          // Validate learning accumulation
          if (!stepData.learningHistory && !stepData.accumulatedLearning) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 (Learning Accumulation) requires building on previous learning experiences. ' +
                'Provide "learningHistory" (array) or "accumulatedLearning" (array) describing accumulated insights. ' +
                'Example: { "learningHistory": ["Technique A works for divergent problems", "Technique B excels at convergent thinking"], "output": "..." }',
              'learningHistory',
              {
                step,
                technique: 'meta_learning',
                acceptedFields: ['learningHistory', 'accumulatedLearning'],
                example: {
                  learningHistory: [
                    'past learning 1',
                    'accumulated insight 2',
                    'knowledge built 3',
                  ],
                },
              }
            );
          }
          break;
        case 3:
          // Validate strategy evolution
          if (!stepData.strategyAdaptations && !stepData.strategyEvolution) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 (Strategy Evolution) requires adapting and improving technique selection. ' +
                'Provide "strategyAdaptations" (array) or "strategyEvolution" (string) describing evolved strategies. ' +
                'Example: { "strategyAdaptations": ["Use visual techniques for spatial problems", "Apply systematic methods for complex systems"], "output": "..." }',
              'strategyAdaptations',
              {
                step,
                technique: 'meta_learning',
                acceptedFields: ['strategyAdaptations', 'strategyEvolution'],
                example: {
                  strategyAdaptations: [
                    'adapted strategy 1',
                    'evolved approach 2',
                    'improved method 3',
                  ],
                },
              }
            );
          }
          break;
        case 4:
          // Validate feedback integration
          if (!stepData.feedbackInsights && !stepData.lessonIntegration) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 4 (Feedback Integration) requires incorporating telemetry and user choices. ' +
                'Provide "feedbackInsights" (array) or "lessonIntegration" (array) describing integrated feedback. ' +
                'Example: { "feedbackInsights": ["Users prefer visual approaches", "Time constraints favor rapid techniques"], "output": "..." }',
              'feedbackInsights',
              {
                step,
                technique: 'meta_learning',
                acceptedFields: ['feedbackInsights', 'lessonIntegration'],
                example: {
                  feedbackInsights: [
                    'feedback insight 1',
                    'user preference 2',
                    'telemetry finding 3',
                  ],
                },
              }
            );
          }
          break;
        case 5:
          // Validate meta-synthesis
          if (!stepData.metaSynthesis && !stepData.synthesisStrategy) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 5 (Meta-Synthesis) requires generating self-improving integration strategies. ' +
                'Provide "metaSynthesis" (string) or "synthesisStrategy" (string) describing the meta-level synthesis. ' +
                'Example: { "metaSynthesis": "Combine divergent exploration with convergent refinement based on problem complexity", "output": "..." }',
              'metaSynthesis',
              {
                step,
                technique: 'meta_learning',
                acceptedFields: ['metaSynthesis', 'synthesisStrategy'],
                example: {
                  metaSynthesis:
                    'Self-improving strategy that adapts based on accumulated learning',
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
      technique: 'meta_learning',
      step,
      stepName: stepInfo.name,
      focus: stepInfo.focus,
      emoji: stepInfo.emoji,
      capabilities: {
        patternRecognition: 'Identifies successful patterns across techniques',
        learningAccumulation: 'Stores and builds on effective combinations',
        strategyEvolution: 'Adapts and improves technique selection',
        feedbackIntegration: 'Incorporates telemetry and user choices',
        metaSynthesis: 'Generates self-improving integration strategies',
      },
    };
  }
}
