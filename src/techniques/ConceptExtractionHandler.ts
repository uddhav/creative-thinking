/**
 * Concept Extraction technique handler with reflexivity
 */

import { BaseTechniqueHandler, firstSentence, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class ConceptExtractionHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Concept Extraction',
      emoji: '🔍',
      totalSteps: 4,
      description: 'Extract underlying principles from successful examples',
      focus: 'Learn from success patterns to create new solutions',
      parallelSteps: {
        canParallelize: false,
        description: 'Concepts must be extracted before abstraction and application',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const steps: StepInfo[] = [
      {
        name: 'Identify Success',
        focus: 'Find successful examples in any domain',
        emoji: '🏆',
        type: 'thinking',
      },
      {
        name: 'Extract Concepts',
        focus: 'Identify the underlying principles',
        emoji: '🔍',
        type: 'thinking',
      },
      {
        name: 'Abstract Patterns',
        focus: 'Generalize concepts to broader patterns',
        emoji: '🔄',
        type: 'thinking',
      },
      {
        name: 'Apply to Problem',
        focus: 'Transfer patterns to your specific context',
        emoji: '🎯',
        type: 'action',
        reflexiveEffects: {
          triggers: [
            'Applying extracted patterns',
            'Implementing abstracted concepts',
            'Transferring principles to context',
          ],
          realityChanges: [
            'Patterns implemented in new context',
            'Solution approach committed',
            'Principles embedded in solution',
          ],
          futureConstraints: [
            'Must work within applied patterns',
            'Solution constrained by extracted principles',
            'Context adapted to transferred concepts',
          ],
          reversibility: 'medium',
        },
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Concept Extraction technique. Valid steps are 1-${steps.length}`,
        'step',
        { providedStep: step, validRange: [1, steps.length] }
      );
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 4) {
      return `Complete the Concept Extraction process for: "${problem}"`;
    }

    switch (step) {
      case 1:
        return `🏆 Identify a successful example from any domain - what works brilliantly? (doesn't need to relate to "${problem}" yet)`;
      case 2:
        return `🔍 Extract the key concepts that make this example successful. What are the underlying principles - stated so they could travel to "${problem}"?`;
      case 3:
        return `🔄 Abstract these concepts into general patterns. Remove domain-specific details so nothing ties them to their origin rather than to "${problem}"`;
      case 4:
        return `🎯 Apply these abstracted patterns to "${problem}". How can these principles solve your challenge?`;
      default:
        return `Complete the Concept Extraction process for: "${problem}"`;
    }
  }

  /**
   * Report what each step recorded, keyed on `entry.currentStep`.
   *
   * Each of the three arrays was reduced to its first element — the caller was
   * asked for the concepts, plural, and got one back — and `entry.output` was
   * declared on the parameter and read by nothing, so a step that recorded only
   * prose reported nothing.
   */
  extractInsights(
    history: Array<{
      currentStep?: number;
      successExample?: string;
      extractedConcepts?: string[];
      abstractedPatterns?: string[];
      applications?: string[];
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
    const pushEach = (prefix: string, values: string[] | undefined): void => {
      if (!Array.isArray(values)) {
        return;
      }
      values.forEach(value => {
        if (typeof value === 'string' && value.trim().length > 0) {
          insights.push(`${prefix}: ${value.trim()}`);
        }
      });
    };

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

      switch (step) {
        case 1:
          if (entry.successExample?.trim()) {
            insights.push(`Success example analyzed: ${entry.successExample.trim()}`);
          }
          break;
        case 2:
          pushEach('Key concept', entry.extractedConcepts);
          break;
        case 3:
          pushEach('Pattern identified', entry.abstractedPatterns);
          break;
        case 4:
          pushEach('Application', entry.applications);
          break;
      }
    }

    return insights;
  }
}
