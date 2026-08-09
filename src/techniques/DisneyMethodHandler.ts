/**
 * Disney Method technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import type { DisneyRole } from '../types/index.js';

export class DisneyMethodHandler extends BaseTechniqueHandler {
  private readonly steps: StepInfo[] = [
    {
      name: 'Dreamer',
      focus: 'What if anything were possible?',
      emoji: '🌟',
      type: 'thinking', // Pure imagination
    },
    {
      name: 'Realist',
      focus: 'How could we actually do this?',
      emoji: '🔨',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Creating implementation plan', 'Defining resources', 'Setting timelines'],
        realityChanges: [
          'Implementation plan created',
          'Resources allocated',
          'Timeline established',
        ],
        futureConstraints: [
          'Must follow implementation plan',
          'Resources committed',
          'Timeline expectations set',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Critic',
      focus: 'What could go wrong?',
      emoji: '🔍',
      type: 'thinking', // Analysis and evaluation
    },
  ];

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

  getStepInfo(step: number): StepInfo {
    const stepInfo = this.steps[step - 1];

    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Disney Method. Valid steps are 1-${this.steps.length}`,
        'step',
        { providedStep: step, validRange: [1, this.steps.length] }
      );
    }

    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 3) {
      return `Complete the Disney Method process for: "${problem}"`;
    }

    switch (step) {
      case 1:
        return `🌟 DREAMER: Imagine the ideal solution to "${problem}" with no constraints. What would be amazing? Dream big!`;
      case 2:
        return `🔨 REALIST: Now be practical about "${problem}". How could we implement the dream? What resources, steps, and timeline would we need?`;
      case 3:
        return `🔍 CRITIC: Constructively evaluate the plan for "${problem}". What could go wrong? What risks need mitigation? How can we strengthen the solution?`;
      default:
        return `Complete the Disney Method process for: "${problem}"`;
    }
  }

  /**
   * Report what each step actually recorded, labelled by the step.
   *
   * Keyed on `entry.currentStep`, not on position in the array. Position looks
   * equivalent and is not: `execute` appends a history entry for every call
   * including revisions, so one revision shifts every later entry and the last
   * step falls off the end — a session reporting `completed: true` silently
   * loses its final output. Keying on the step also means a revision supersedes
   * the entry it revises rather than reporting twice.
   */
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
    const totalSteps = this.getTechniqueInfo().totalSteps;
    const latestByStep = new Map<number, (typeof history)[number]>();

    history.forEach((entry, index) => {
      // Fall back to position only when the caller sent no step number.
      const step = entry.currentStep ?? index + 1;
      if (step >= 1 && step <= totalSteps) {
        latestByStep.set(step, entry);
      }
    });

    const insights: string[] = [];

    for (let step = 1; step <= totalSteps; step++) {
      const entry = latestByStep.get(step);
      if (!entry) {
        continue;
      }
      const stepName = this.steps[step - 1].name;

      const output = entry.output?.trim();
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      // Each field belongs to one role.
      const structured =
        step === 1
          ? entry.dreamerVision
          : step === 2
            ? entry.realistPlan
            : step === 3
              ? entry.criticRisks
              : undefined;
      if (structured && structured.length > 0) {
        insights.push(`${stepName} recorded: ${structured.join(', ')}`);
      }
    }

    return insights;
  }
}
