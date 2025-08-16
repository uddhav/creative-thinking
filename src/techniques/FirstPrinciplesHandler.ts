/**
 * First Principles Thinking technique handler
 * Break down to fundamental truths and rebuild from the ground up
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface FirstPrinciplesStep {
  name: string;
  focus: string;
  emoji: string;
  description?: string;
}

export class FirstPrinciplesHandler extends BaseTechniqueHandler {
  private readonly steps: FirstPrinciplesStep[] = [
    {
      name: 'Deconstruction',
      focus: 'Break down into fundamental components',
      emoji: '🔨',
      description:
        'Systematically break down the problem into its most basic components and identify all constituent parts',
    },
    {
      name: 'Foundation Identification',
      focus: 'Identify fundamental truths',
      emoji: '🏛️',
      description:
        'Identify the fundamental truths that cannot be reduced further - the bedrock principles that must be true',
    },
    {
      name: 'Assumption Challenging',
      focus: 'Question and eliminate assumptions',
      emoji: '❓',
      description:
        'Challenge every assumption and convention, keeping only what can be proven from fundamental truths',
    },
    {
      name: 'Reconstruction',
      focus: 'Build up from first principles',
      emoji: '🏗️',
      description:
        'Reconstruct the solution from the ground up using only fundamental truths and logical reasoning',
    },
    {
      name: 'Solution Synthesis',
      focus: 'Create novel solution',
      emoji: '💡',
      description:
        'Synthesize a novel solution that emerges naturally from first principles, often radically different from conventional approaches',
    },
  ];

  private readonly stepsWithReflexivity: StepInfo[] = [
    {
      name: 'Deconstruction',
      focus: 'Break down into fundamental components',
      emoji: '🔨',
      type: 'thinking',
    },
    {
      name: 'Foundation Identification',
      focus: 'Identify fundamental truths',
      emoji: '🏛️',
      type: 'thinking',
    },
    {
      name: 'Assumption Challenging',
      focus: 'Question and eliminate assumptions',
      emoji: '❓',
      type: 'thinking',
    },
    {
      name: 'Reconstruction',
      focus: 'Build up from first principles',
      emoji: '🏗️',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Building new solution architecture',
          'Creating structural commitments',
          'Establishing new foundations',
        ],
        realityChanges: [
          'New architecture established',
          'Solution structure defined',
          'Design decisions materialized',
        ],
        futureConstraints: [
          'Must work within new architecture',
          'Solution locked to first principles design',
          'Future iterations constrained by reconstruction',
        ],
        reversibility: 'low',
      },
    },
    {
      name: 'Solution Synthesis',
      focus: 'Create novel solution',
      emoji: '💡',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Synthesizing final solution',
          'Creating novel approach',
          'Establishing new paradigm',
        ],
        realityChanges: [
          'Novel solution created',
          'New paradigm established',
          'Breakthrough approach materialized',
        ],
        futureConstraints: [
          'Must maintain paradigm consistency',
          'Solution defines new constraints',
          'Future development follows new principles',
        ],
        reversibility: 'low',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'First Principles Thinking',
      emoji: '🔬',
      totalSteps: 5,
      description: 'Break down to fundamental truths and rebuild from the ground up',
      focus: 'Fundamental reasoning without assumptions',
      enhancedFocus:
        'Strips away all assumptions and conventions to rebuild understanding from bedrock truths, enabling breakthrough innovations',
      parallelSteps: {
        canParallelize: false,
        description: 'Steps build sequentially from deconstruction to synthesis',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const stepInfo = this.stepsWithReflexivity[step - 1];
    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for First Principles Thinking. Valid steps are 1-${this.stepsWithReflexivity.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.stepsWithReflexivity.length}` }
      );
    }
    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    const guidanceMap: Record<number, string> = {
      1: `Deconstruct: "${problem}". Break this down into its smallest, most fundamental components. What are the basic elements? What are the core functions? What are the essential parts that cannot be broken down further? List every component, no matter how obvious. Consider: physical components, logical components, process steps, stakeholder needs, resource requirements.`,
      2: `Identify foundations for: "${problem}". What fundamental truths exist here? What laws of physics, mathematics, or logic apply? What biological or chemical principles are involved? What economic fundamentals? What human needs or behaviors are universal? These should be truths that are self-evident or scientifically proven, not opinions or conventions.`,
      3: `Challenge assumptions about: "${problem}". List every assumption you're making. Why do things work this way currently? What if the opposite were true? What constraints are real vs. imagined? What "rules" are actually just conventions? Question everything: "Why must it be this way?" "What if we didn't have this constraint?" "Is this really necessary?"`,
      4: `Reconstruct solution for: "${problem}". Using ONLY the fundamental truths identified, build a solution from scratch. How would you solve this if you were the first person ever encountering it? What's the simplest possible solution that satisfies the fundamental requirements? Don't reference existing solutions - create from pure logic and fundamentals.`,
      5: `Synthesize breakthrough for: "${problem}". Combine your reconstructed solution with practical constraints. How does your first-principles solution differ from conventional approaches? What new possibilities emerge? What radical simplifications are possible? Create a solution that's both grounded in fundamental truth and practically revolutionary.`,
    };

    return guidanceMap[step] || `Continue first principles analysis for: "${problem}"`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Add specific validation for first principles fields
    if (typeof data === 'object' && data !== null) {
      const stepData = data as Record<string, unknown>;

      switch (step) {
        case 1:
          // Validate deconstruction
          if (!stepData.components && !stepData.breakdown) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 1 (Deconstruction) requires breaking down the problem into fundamental components. ' +
                'Provide either "components" (array of component names) or "breakdown" (structured decomposition). ' +
                'Example: { "components": ["database layer", "API layer", "UI layer"], "output": "..." }',
              'components',
              {
                step,
                technique: 'first_principles',
                acceptedFields: ['components', 'breakdown'],
                example: { components: ['core element 1', 'core element 2', 'core element 3'] },
              }
            );
          }
          break;
        case 2:
          // Validate foundation identification
          if (!stepData.fundamentalTruths && !stepData.foundations && !stepData.principles) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 (Foundation Identification) requires identifying fundamental truths that cannot be reduced further. ' +
                'Provide "fundamentalTruths" (array), "foundations" (array), or "principles" (array). ' +
                'Example: { "fundamentalTruths": ["Energy cannot be created or destroyed", "Users seek convenience"], "output": "..." }',
              'fundamentalTruths',
              {
                step,
                technique: 'first_principles',
                acceptedFields: ['fundamentalTruths', 'foundations', 'principles'],
                example: {
                  fundamentalTruths: ['physical law', 'mathematical truth', 'universal human need'],
                },
              }
            );
          }
          break;
        case 3:
          // Validate assumption challenging
          if (!stepData.assumptions && !stepData.challenges) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 (Assumption Challenging) requires listing assumptions to be questioned. ' +
                'Provide either "assumptions" (array of assumptions) or "challenges" (array of challenged conventions). ' +
                'Example: { "assumptions": ["This must be done manually", "Users need all features"], "output": "..." }',
              'assumptions',
              {
                step,
                technique: 'first_principles',
                acceptedFields: ['assumptions', 'challenges'],
                example: {
                  assumptions: [
                    'current limitation 1',
                    'accepted convention 2',
                    'unchallenged rule 3',
                  ],
                },
              }
            );
          }
          break;
        case 4:
          // Validate reconstruction
          if (!stepData.reconstruction && !stepData.rebuilding) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 4 (Reconstruction) requires building a solution from fundamental truths only. ' +
                'Provide either "reconstruction" (string) or "rebuilding" (string) describing the ground-up solution. ' +
                'Example: { "reconstruction": "Based on fundamentals alone, we can achieve this by...", "output": "..." }',
              'reconstruction',
              {
                step,
                technique: 'first_principles',
                acceptedFields: ['reconstruction', 'rebuilding'],
                example: {
                  reconstruction:
                    'Solution built from first principles without conventional constraints',
                },
              }
            );
          }
          break;
        case 5:
          // Validate solution synthesis
          if (!stepData.solution && !stepData.synthesis) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 5 (Solution Synthesis) requires combining the reconstruction with practical constraints. ' +
                'Provide either "solution" (string) or "synthesis" (string) describing the final breakthrough solution. ' +
                'Example: { "solution": "The revolutionary approach that emerges is...", "output": "..." }',
              'solution',
              {
                step,
                technique: 'first_principles',
                acceptedFields: ['solution', 'synthesis'],
                example: { solution: 'Final synthesized breakthrough solution' },
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
      technique: 'first_principles',
      step,
      stepName: stepInfo.name,
      focus: stepInfo.focus,
      emoji: stepInfo.emoji,
      capabilities: {
        deconstruction: 'Break down into fundamental components',
        foundationIdentification: 'Identify irreducible truths',
        assumptionChallenging: 'Question all conventions and assumptions',
        reconstruction: 'Build from fundamental truths only',
        solutionSynthesis: 'Create breakthrough innovations',
      },
    };
  }
}
