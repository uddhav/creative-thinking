/**
 * Yes, And... technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class YesAndHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Yes, And...',
      emoji: '➕',
      totalSteps: 4,
      description: 'Build on ideas through positive addition',
      focus: 'Collaborative idea development without criticism',
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    const steps = [
      {
        name: 'Accept Initial Idea',
        focus: 'Start with any idea without judgment',
        emoji: '✅',
      },
      {
        name: 'Add and Build',
        focus: 'Add new elements to enhance the idea',
        emoji: '➕',
      },
      {
        name: 'Evaluate Combinations',
        focus: 'Assess the enhanced ideas constructively',
        emoji: '⚖️',
      },
      {
        name: 'Synthesize',
        focus: 'Integrate the best additions into a solution',
        emoji: '🔀',
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Yes, And... technique. Valid steps are 1-${steps.length}`,
        'step',
        { providedStep: step, validRange: [1, steps.length] }
      );
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    switch (step) {
      case 1:
        return `✅ Start with an initial idea for "${problem}" - any idea, even imperfect. Accept it fully without criticism`;
      case 2:
        return `➕ Say "Yes, and..." then add something to build on the idea. Keep adding constructive elements`;
      case 3:
        return `⚖️ Evaluate the enhanced ideas positively. What combinations work best? Focus on strengths`;
      case 4:
        return `🔀 Synthesize the additions into a coherent solution for "${problem}". Integrate the best elements`;
      default:
        return `Apply Yes, And... step ${step} to "${problem}"`;
    }
  }

  extractInsights(
    history: Array<{
      currentStep?: number;
      initialIdea?: string;
      additions?: string[];
      evaluations?: string[];
      synthesis?: string;
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];

    history.forEach(entry => {
      if (entry.currentStep === 1 && entry.initialIdea) {
        insights.push(`Initial idea: ${entry.initialIdea}`);
      }
      if (entry.currentStep === 2 && entry.additions && entry.additions.length > 0) {
        insights.push(`Key addition: ${entry.additions[0]}`);
      }
      if (entry.currentStep === 3 && entry.evaluations && entry.evaluations.length > 0) {
        const positive = entry.evaluations.filter(
          e => e.toLowerCase().includes('good') || e.toLowerCase().includes('strong')
        );
        if (positive.length > 0) {
          insights.push(`Positive aspect: ${positive[0]}`);
        }
      }
      if (entry.currentStep === 4 && entry.synthesis) {
        insights.push(`Synthesis achieved: ${entry.synthesis.slice(0, 100)}...`);
      }
    });

    return insights;
  }
}
