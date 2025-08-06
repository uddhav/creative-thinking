/**
 * Disney Method technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import type { DisneyRole } from '../types/index.js';

export class DisneyMethodHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Disney Method',
      emoji: '🎬',
      totalSteps: 3,
      description: 'Transform ideas through Dreamer, Realist, and Critic perspectives',
      focus: 'Sequential implementation-focused creativity',
      parallelSteps: {
        canParallelize: false,
        dependencies: [
          [1, 2],
          [2, 3],
        ], // Dreamer → Realist → Critic
        description:
          'Must be executed sequentially: dreams inform reality checks, which inform critique',
      },
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    const steps = [
      {
        name: 'Dreamer',
        focus: 'What if anything were possible?',
        emoji: '🌟',
      },
      {
        name: 'Realist',
        focus: 'How could we actually do this?',
        emoji: '🔨',
      },
      {
        name: 'Critic',
        focus: 'What could go wrong?',
        emoji: '🔍',
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Disney Method. Valid steps are 1-${steps.length}`,
        'step',
        { providedStep: step, validRange: [1, steps.length] }
      );
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 3) {
      return `Complete the Disney Method process for "${problem}"`;
    }

    switch (step) {
      case 1:
        return `🌟 DREAMER: Imagine the ideal solution to "${problem}" with no constraints. What would be amazing? Dream big!`;
      case 2:
        return `🔨 REALIST: Now be practical. How could we implement the dream? What resources, steps, and timeline would we need?`;
      case 3:
        return `🔍 CRITIC: Constructively evaluate the plan. What could go wrong? What risks need mitigation? How can we strengthen the solution?`;
      default:
        return `Apply Disney Method step ${step} to "${problem}"`;
    }
  }

  extractInsights(
    history: Array<{
      currentStep?: number;
      disneyRole?: DisneyRole;
      dreamerVision?: string[];
      realistPlan?: string[];
      criticRisks?: string[];
      nextStepNeeded?: boolean;
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];

    history.forEach(entry => {
      if (entry.currentStep === 1 && entry.dreamerVision && entry.dreamerVision.length > 0) {
        insights.push(`Vision: ${entry.dreamerVision[0]}`);
      }
      if (entry.currentStep === 2 && entry.realistPlan && entry.realistPlan.length > 0) {
        insights.push(`Key action: ${entry.realistPlan[0]}`);
      }
      if (entry.currentStep === 3 && entry.criticRisks && entry.criticRisks.length > 0) {
        insights.push(`Critical risk: ${entry.criticRisks[0]}`);
      }
    });

    // Check if Disney Method is complete
    const hasCompleteSession = history.some(
      entry => entry.currentStep === 3 && !entry.nextStepNeeded
    );
    if (hasCompleteSession) {
      insights.push('Disney Method completed - vision transformed into actionable plan');
    }

    return insights;
  }
}
