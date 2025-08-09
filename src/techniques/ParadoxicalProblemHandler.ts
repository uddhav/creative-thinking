/**
 * Paradoxical Problem Solving technique handler
 * Transcends contradictions by recognizing the path-dependent nature of seemingly incompatible requirements
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface ParadoxicalStep {
  name: string;
  focus: string;
  emoji: string;
}

export class ParadoxicalProblemHandler extends BaseTechniqueHandler {
  private readonly steps: ParadoxicalStep[] = [
    {
      name: 'Paradox Identification',
      focus: 'Surface contradictions and trace their path origins',
      emoji: '⚖️',
    },
    {
      name: 'Parallel Path Development',
      focus: 'Develop conflicting solutions independently on their own paths',
      emoji: '🔀',
    },
    {
      name: 'Transcendent Synthesis',
      focus: 'Find meta-path encompassing both solutions',
      emoji: '🌉',
    },
    {
      name: 'Non-Ergodic Validation',
      focus: 'Test resolution across multiple path contexts',
      emoji: '✨',
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Paradoxical Problem Solving',
      emoji: '⚖️',
      totalSteps: 4,
      description:
        'Transcend contradictions by recognizing path-dependent nature of incompatible requirements',
      focus: 'Resolution of paradoxes through non-ergodic path analysis',
      enhancedFocus:
        'Recognizes that paradoxes often arise from assuming ergodic conditions where path-dependency actually exists',
      parallelSteps: {
        canParallelize: false,
        description: 'Steps build sequentially from paradox identification to validation',
      },
    };
  }

  getStepInfo(step: number): ParadoxicalStep {
    const stepInfo = this.steps[step - 1];
    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Paradoxical Problem Solving. Valid steps are 1-${this.steps.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.steps.length}` }
      );
    }
    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    const guidanceMap: Record<number, string> = {
      1: `Identify the core paradox in: "${problem}". What contradictory requirements seem impossible to reconcile? Trace each requirement to its origin - what paths led to these conflicting needs? Map stakeholder journeys that created these tensions. Identify time dependencies and ergodic fallacies.`,
      2: `Develop Solution A fully on its own path, optimizing for its requirements without compromise. Then develop Solution B independently on its path. Allow each to reach natural completion without forcing premature integration. What does each path look like when pursued to its logical conclusion?`,
      3: `Find the transcendent synthesis - a meta-path that encompasses both solutions. Create bridges between the endpoints. Design path-switching mechanisms that allow dynamic selection based on context. Build the logic for contextual adaptation.`,
      4: `Validate the resolution across multiple path contexts. Test with different starting conditions and path histories. Verify the paradox is truly resolved, not just hidden. Check for new paradox creation. Ensure all stakeholder paths remain viable.`,
    };

    return guidanceMap[step] || `Continue paradoxical problem solving for: "${problem}"`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Add specific validation for paradoxical problem solving fields
    if (typeof data === 'object' && data !== null) {
      const stepData = data as Record<string, unknown>;

      switch (step) {
        case 1:
          // Validate paradox identification
          if (!stepData.paradox && !stepData.contradictions) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 1 requires identifying the paradox or contradictions',
              'paradox',
              { step, technique: 'paradoxical_problem' }
            );
          }
          break;

        case 2:
          // Validate parallel path development
          if (!stepData.solutionA && !stepData.solutionB && !stepData.parallelPaths) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 requires developing parallel solution paths',
              'parallelPaths',
              { step, technique: 'paradoxical_problem' }
            );
          }
          break;

        case 3:
          // Validate transcendent synthesis
          if (!stepData.synthesis && !stepData.metaPath && !stepData.bridge) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 requires creating a transcendent synthesis',
              'synthesis',
              { step, technique: 'paradoxical_problem' }
            );
          }
          break;

        case 4:
          // Validate non-ergodic validation
          if (!stepData.validation && !stepData.pathContexts && !stepData.resolutionVerified) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 4 requires validating the resolution across path contexts',
              'validation',
              { step, technique: 'paradoxical_problem' }
            );
          }
          break;
      }
    }

    return true;
  }

  getStepPrompt(step: number, problem: string): string {
    const stepInfo = this.getStepInfo(step);
    const guidance = this.getStepGuidance(step, problem);

    return `${stepInfo.emoji} **${stepInfo.name}**\n\nFocus: ${stepInfo.focus}\n\n${guidance}`;
  }

  getRiskAssessmentPrompt(step: number): string {
    const riskPrompts: Record<number, string> = {
      1: 'What if the paradox is fundamental and cannot be resolved? Are we missing deeper contradictions?',
      2: 'Could developing solutions in isolation create incompatible architectures? What dependencies might we miss?',
      3: 'Is the synthesis truly transcendent or just a compromise? Does it create new paradoxes?',
      4: 'Have we tested enough path contexts? Could edge cases break the resolution?',
    };

    return (
      riskPrompts[step] ||
      'What risks exist in this paradoxical resolution approach? What could go wrong?'
    );
  }

  getPathDependencyPrompt(step: number): string {
    const pathPrompts: Record<number, string> = {
      1: 'How did different historical paths create this paradox? What decisions led here?',
      2: 'What path commitments does each solution make? What futures do they enable or foreclose?',
      3: 'Does the synthesis preserve path flexibility or lock in certain trajectories?',
      4: 'How sensitive is the resolution to different path histories?',
    };

    return (
      pathPrompts[step] ||
      'What path dependencies exist in this step? How do past decisions affect current options?'
    );
  }
}
