/**
 * PO (Provocative Operation) technique handler with reflexivity
 */

import { BaseTechniqueHandler, firstSentence, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class POHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'PO - Provocative Operation',
      emoji: '💭',
      totalSteps: 4,
      description: 'Challenge assumptions through deliberate provocations',
      focus: 'Break thinking patterns with provocative statements',
      parallelSteps: {
        canParallelize: false,
        dependencies: [
          [1, 2],
          [2, 3],
          [3, 4],
        ], // Provocation → Movement → Development → Implementation
        description:
          'Must be executed sequentially: movement requires provocation, development requires movement insights',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const steps: StepInfo[] = [
      {
        name: 'Create Provocation',
        focus: 'Generate a deliberately unreasonable statement',
        emoji: '💥',
        type: 'thinking',
        reversibility: 'high',
      },
      {
        name: 'Movement',
        focus: 'Extract useful ideas from the provocation',
        emoji: '➡️',
        type: 'thinking',
        reversibility: 'high',
      },
      {
        name: 'Develop Concepts',
        focus: 'Transform extracted ideas into workable concepts',
        emoji: '🔨',
        type: 'action',
        reflexiveEffects: {
          triggers: [
            'Developing workable concepts',
            'Transforming provocations into solutions',
            'Creating practical approaches',
          ],
          realityChanges: [
            'Concepts developed from provocation',
            'New approaches created',
            'Unconventional solutions formed',
          ],
          futureConstraints: [
            'Must work within developed concepts',
            'Provocative origins shape solution',
            'Unconventional approach committed',
          ],
          reversibility: 'high',
        },
      },
      {
        name: 'Practical Solutions',
        focus: 'Convert concepts into implementable solutions',
        emoji: '✅',
        type: 'action',
        reflexiveEffects: {
          triggers: [
            'Converting to implementable solutions',
            'Finalizing practical approach',
            'Committing to solution path',
          ],
          realityChanges: [
            'Solution implemented',
            'Practical approach established',
            'Provocative concept realized',
          ],
          futureConstraints: [
            'Must follow implemented solution',
            'Practical constraints established',
            'Solution path locked in',
          ],
          reversibility: 'medium',
        },
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for PO technique. Valid steps are 1-${steps.length}`,
        'step',
        { providedStep: step, validRange: `1-${steps.length}` }
      );
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 4) {
      return `Complete the PO - Provocative Operation process for: "${problem}"`;
    }

    switch (step) {
      case 1:
        return `💥 Create a provocative statement about "${problem}" - start with "Po:" followed by something deliberately unreasonable or impossible`;
      case 2:
        return `➡️ Movement: From your provocation, extract aspects that say something about "${problem}". What could this lead to? Don't judge - just explore`;
      case 3:
        return `🔨 Develop concepts from the movement ideas. How could these translate into practical approaches to "${problem}"?`;
      case 4:
        return `✅ Shape your concepts into practical solutions for "${problem}". What's actually implementable?`;
      default:
        return `Complete the PO - Provocative Operation process for: "${problem}"`;
    }
  }

  /**
   * Report what each step actually recorded, labelled by the step.
   *
   * Keyed on `entry.currentStep`, not on position in the array: `execute`
   * appends a history entry for every call including revisions, so one revision
   * shifts every later entry. Keying on the step also means a revision
   * supersedes the entry it revises rather than reporting twice.
   *
   * Every step reports. Step 2 used to be gated on the output containing the
   * word "could", and step 3 had no branch at all, so a movement phrased
   * without that word and every concept developed in step 3 vanished.
   */
  extractInsights(
    history: Array<{
      currentStep?: number;
      provocation?: string;
      principles?: string[];
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
      const stepName = this.getStepInfo(step).name;

      const output = entry.output?.trim();
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      // The provocation is step 1's own field; report it there as an addition.
      if (step === 1) {
        const provocation = entry.provocation?.trim();
        if (provocation) {
          insights.push(`Provocation explored: ${provocation}`);
        }
      }

      // Step 2's own field. It was schema-declared and echoed back, but the
      // only thing that read it said "Provocation successfully challenged N
      // core assumptions" — the count, never which ones.
      if (step === 2 && entry.principles?.length) {
        insights.push(`Principles extracted: ${entry.principles.join(', ')}`);
      }
    }

    return insights;
  }
}
