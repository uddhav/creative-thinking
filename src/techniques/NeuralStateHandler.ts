/**
 * Neural State Optimization technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class NeuralStateHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Neural State Optimization',
      emoji: '🧠',
      totalSteps: 3,
      description:
        "Optimize YOUR BRAIN's cognitive states for creative thinking by managing biological neural networks",
      focus:
        'Balance human Default Mode Network (DMN) and Executive Control Network (ECN) for peak creativity',
      parallelSteps: {
        canParallelize: false,
        description: 'Neural states transition sequentially through assessment and optimization',
      },
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    // Assessment and suppression are one step, not two: naming the dominant
    // network fixes the answer to which one is suppressed — grinding means DMN,
    // wandering means ECN — so the second step had no question left to ask.
    const steps = [
      {
        name: 'Assess Current State',
        focus: 'Identify the dominant neural network (DMN vs ECN) and the one it suppresses',
        emoji: '🔍',
      },
      {
        name: 'Develop Switching',
        focus: 'Create rhythm between networks',
        emoji: '🔄',
      },
      {
        name: 'Integrate Insights',
        focus: 'Combine outputs from both networks',
        emoji: '🔀',
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Neural State technique. Valid steps are 1-${steps.length}`,
        'step',
        { providedStep: step, validRange: [1, steps.length] }
      );
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 3) {
      return `Complete the Neural State Optimization process for: "${problem}"`;
    }

    switch (step) {
      case 1:
        return `🔍 Assess your current neural state for "${problem}". Are you in focused analysis (ECN) or free association (DMN)? Whichever is running, the other is the one being suppressed — name it, and say how deeply.`;
      case 2:
        return `🔄 Develop a switching rhythm. Alternate between focused analysis and free exploration of "${problem}"`;
      case 3:
        return `🔀 Integrate insights from both states. What emerges for "${problem}" when analytical and creative insights combine?`;
      default:
        return `Complete the Neural State Optimization process for: "${problem}"`;
    }
  }

  extractInsights(
    history: Array<{
      currentStep?: number;
      dominantNetwork?: string;
      suppressionDepth?: number;
      switchingRhythm?: string[];
      integrationInsights?: string[];
      nextStepNeeded?: boolean;
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];

    history.forEach(entry => {
      // Step 1 now carries both halves of the assessment.
      if (entry.currentStep === 1 && entry.dominantNetwork) {
        insights.push(`Dominant network: ${entry.dominantNetwork.toUpperCase()}`);
      }
      if (entry.currentStep === 1 && entry.suppressionDepth !== undefined) {
        insights.push(`Suppression depth: ${entry.suppressionDepth}/10`);
      }
      if (entry.currentStep === 2 && entry.switchingRhythm && entry.switchingRhythm.length > 0) {
        insights.push(`Switching pattern: ${entry.switchingRhythm[0]}`);
      }
      if (
        entry.currentStep === 3 &&
        entry.integrationInsights &&
        entry.integrationInsights.length > 0
      ) {
        insights.push(`Integration: ${entry.integrationInsights[0]}`);
      }
    });

    // No completion banner here. Pushing a fixed string because the last step
    // ran reports an insight the session never produced, which is what
    // CONTRIBUTING.md rules out; reaching the end is already visible from the
    // step count.

    return insights;
  }
}
