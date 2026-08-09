/**
 * Collective Intelligence technique handler with reflexivity tracking
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class CollectiveIntelHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Collective Intelligence Synthesis',
      emoji: '🧬',
      totalSteps: 5,
      description: 'Harness collective wisdom from multiple sources',
      focus: 'Synthesize insights from diverse intelligence sources',
      parallelSteps: {
        canParallelize: false,
        description: 'Collective insights emerge from sequential synthesis of sources',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const steps: StepInfo[] = [
      {
        name: 'Identify Sources',
        focus: 'Map diverse knowledge sources',
        emoji: '📚',
        type: 'thinking',
      },
      {
        name: 'Gather Wisdom',
        focus: 'Collect insights from each source',
        emoji: '🎯',
        type: 'thinking',
      },
      {
        name: 'Find Patterns',
        focus: 'Identify emergent patterns',
        emoji: '🔍',
        type: 'thinking',
      },
      {
        name: 'Create Synergy',
        focus: 'Combine for amplified value',
        emoji: '✨',
        type: 'action',
        reflexiveEffects: {
          triggers: [
            'Combining insights',
            'Creating synergistic solutions',
            'Amplifying collective wisdom',
          ],
          realityChanges: [
            'New hybrid solutions created',
            'Collective decision formed',
            'Synergistic value generated',
          ],
          futureConstraints: [
            'Must honor collective synthesis',
            'Combined approach locks in direction',
            'Stakeholder expectations aligned to synthesis',
          ],
          reversibility: 'medium',
        },
      },
      {
        name: 'Synthesize Insight',
        focus: 'Form unified understanding',
        emoji: '💫',
        type: 'action',
        reflexiveEffects: {
          triggers: [
            'Forming unified understanding',
            'Committing to collective decision',
            'Creating consensus reality',
          ],
          realityChanges: [
            'Collective intelligence crystallized',
            'Unified direction established',
            'Shared understanding created',
          ],
          futureConstraints: [
            'Must work within collective consensus',
            'Individual perspectives subordinated',
            'Group commitment created',
          ],
          reversibility: 'low',
        },
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Collective Intelligence technique. Valid steps are 1-${steps.length}`,
        'step',
        { providedStep: step, validRange: [1, steps.length] }
      );
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 5) {
      return `Complete the Collective Intelligence Synthesis process for: "${problem}"`;
    }

    switch (step) {
      case 1:
        return `📚 Identify wisdom sources for "${problem}": experts, crowds, databases, cultural knowledge`;
      case 2:
        return `🎯 Gather each source's specific insight on "${problem}". What does that perspective contribute?`;
      case 3:
        return `🔍 Find patterns across the sources on "${problem}". Look for convergence, divergence, and emergence`;
      case 4:
        return `✨ Create synergistic combinations for "${problem}". How do different insights amplify each other?`;
      case 5:
        return `💫 Synthesize collective intelligence into unified, actionable insights for "${problem}"`;
      default:
        return `Complete the Collective Intelligence Synthesis process for: "${problem}"`;
    }
  }

  /**
   * Report what each step actually recorded, labelled by the step.
   *
   * This reads `entry.output`. Reading only the structured fields meant a full
   * five-step session returned nothing but a completion banner, because the CLI
   * flag path never populates them — and the step indices were off by one
   * against the step names, so a "Find Patterns" output was labelled Synergy.
   * The structured fields still report when a caller supplies them.
   */
  extractInsights(
    history: Array<{
      currentStep?: number;
      wisdomSources?: string[];
      emergentPatterns?: string[];
      synergyCombinations?: string[];
      collectiveInsights?: string[];
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];
    const totalSteps = this.getTechniqueInfo().totalSteps;

    history.forEach((entry, index) => {
      if (index >= totalSteps) {
        return;
      }
      const stepName = this.getStepInfo(index + 1).name;

      const output = entry.output?.trim();
      if (output) {
        const [firstSentence] = output.split(/(?<=[.!?])\s+/);
        const summary = (firstSentence ?? output).trim();
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      const structured =
        entry.wisdomSources ??
        entry.emergentPatterns ??
        entry.synergyCombinations ??
        entry.collectiveInsights;
      if (structured && structured.length > 0) {
        insights.push(`${stepName} recorded: ${structured.join(', ')}`);
      }
    });

    return insights;
  }
}
