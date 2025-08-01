/**
 * PO (Provocative Operation) technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class POHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'PO - Provocative Operation',
      emoji: '💭',
      totalSteps: 4,
      description: 'Challenge assumptions through deliberate provocations',
      focus: 'Break thinking patterns with provocative statements',
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    const steps = [
      {
        name: 'Create Provocation',
        focus: 'Generate a deliberately unreasonable statement',
        emoji: '💥',
      },
      {
        name: 'Movement',
        focus: 'Extract useful ideas from the provocation',
        emoji: '➡️',
      },
      {
        name: 'Develop Concepts',
        focus: 'Transform extracted ideas into workable concepts',
        emoji: '🔨',
      },
      {
        name: 'Practical Solutions',
        focus: 'Convert concepts into implementable solutions',
        emoji: '✅',
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
      return `Complete the PO - Provocative Operation process for "${problem}"`;
    }

    switch (step) {
      case 1:
        return `💥 Create a provocative statement about "${problem}" - start with "Po:" followed by something deliberately unreasonable or impossible`;
      case 2:
        return `➡️ Movement: From your provocation, extract interesting aspects. What could this lead to? Don't judge - just explore`;
      case 3:
        return `🔨 Develop concepts from the movement ideas. How could these translate into practical approaches?`;
      case 4:
        return `✅ Shape your concepts into practical solutions for "${problem}". What's actually implementable?`;
      default:
        return `Apply PO step ${step} to "${problem}"`;
    }
  }

  extractInsights(
    history: Array<{
      currentStep?: number;
      provocation?: string;
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];

    history.forEach(entry => {
      if (entry.currentStep === 1 && entry.provocation) {
        insights.push(`Provocation explored: ${entry.provocation}`);
      }
      if (entry.currentStep === 2 && entry.output && entry.output.includes('could')) {
        insights.push(`Movement insight: ${entry.output.slice(0, 100)}...`);
      }
      if (entry.currentStep === 4 && entry.output) {
        const solutions = entry.output.split(/[.!?]+/).filter(s => s.trim());
        if (solutions.length > 0) {
          insights.push(`Practical solution: ${solutions[0].trim()}`);
        }
      }
    });

    return insights;
  }
}
