/**
 * Six Thinking Hats technique handler
 */

import type { SixHatsColor } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface HatInfo {
  name: string;
  focus: string;
  emoji: string;
  enhancedFocus: string;
}

export class SixHatsHandler extends BaseTechniqueHandler {
  private readonly hats: Record<SixHatsColor, HatInfo> = {
    blue: {
      name: 'Blue Hat',
      focus: 'Process control and thinking about thinking',
      emoji: '🔵',
      enhancedFocus:
        'Meta-cognition: Define objectives, set agenda, monitor progress, identify decision points',
    },
    white: {
      name: 'White Hat',
      focus: 'Facts, information, and data',
      emoji: '⚪',
      enhancedFocus:
        'Data gathering: What do we know? What do we need to know? How do we get the information?',
    },
    red: {
      name: 'Red Hat',
      focus: 'Emotions, feelings, and intuition',
      emoji: '🔴',
      enhancedFocus: 'Emotional intelligence: Gut feelings, fears, excitement, resistance patterns',
    },
    yellow: {
      name: 'Yellow Hat',
      focus: 'Optimism and positive thinking',
      emoji: '🟡',
      enhancedFocus:
        'Value sensitivity: Benefits, advantages, why it might work, best-case scenarios',
    },
    black: {
      name: 'Black Hat',
      focus: 'Critical thinking and caution',
      emoji: '⚫',
      enhancedFocus:
        'Risk awareness: Problems, dangers, difficulties, worst-case scenarios, Black Swans',
    },
    green: {
      name: 'Green Hat',
      focus: 'Creativity and new ideas',
      emoji: '🟢',
      enhancedFocus:
        'Creative exploration: Alternatives, possibilities, innovations, lateral moves',
    },
    purple: {
      name: 'Purple Hat',
      focus: 'Path dependency, ergodicity, and ruin risk analysis',
      emoji: '🟣',
      enhancedFocus:
        'Ruin risk analysis: Identify non-ergodic domains, survival constraints, irreversible decisions, and escape routes',
    },
  };

  private readonly hatOrder: SixHatsColor[] = [
    'blue',
    'white',
    'red',
    'yellow',
    'black',
    'green',
    'purple',
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Six Thinking Hats',
      emoji: '🎩',
      totalSteps: 7,
      description: 'Systematic exploration through different thinking modes',
      focus: 'Parallel thinking to explore all aspects',
      enhancedFocus: 'Now includes Purple Hat for path dependency analysis',
      parallelSteps: {
        canParallelize: true,
        description:
          'All hats can be worn simultaneously by different thinkers or explored in parallel',
      },
    };
  }

  getStepInfo(step: number): HatInfo {
    const hatColor = this.hatOrder[step - 1];
    if (!hatColor) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Six Hats technique. Valid steps are 1-${this.hatOrder.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.hatOrder.length}` }
      );
    }
    return this.hats[hatColor];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > this.hatOrder.length) {
      return `Complete the Six Thinking Hats process for "${problem}"`;
    }

    const hat = this.getStepInfo(step);
    const hatColor = this.hatOrder[step - 1];

    switch (hatColor) {
      case 'blue':
        return `${hat.emoji} Blue Hat: Define the thinking process for "${problem}". What are we trying to achieve? What's our approach?`;

      case 'white':
        return `⚪ White Hat: What facts and data do we have about "${problem}"? What information is missing?`;

      case 'red':
        return `🔴 Red Hat: What are your gut feelings about "${problem}"? Don't justify - just express emotions and intuitions.`;

      case 'yellow':
        return `🟡 Yellow Hat: What are the benefits and positive aspects of addressing "${problem}"? What's the best that could happen?`;

      case 'black':
        return `⚫ Black Hat: What could go wrong with "${problem}"? What are the risks, obstacles, and potential Black Swan events?`;

      case 'green':
        return `🟢 Green Hat: Generate creative solutions for "${problem}". Think laterally - what are unconventional approaches?`;

      case 'purple':
        return `🟣 Purple Hat: Analyze path dependencies and ruin risks in "${problem}". 
• Which decisions would be irreversible? 
• What are the ruin risks (financial bankruptcy, health damage, career destruction, reputation loss)?
• Is this domain ergodic (can recover from failures) or non-ergodic (one failure = permanent ruin)?
• How can we preserve optionality and build escape routes?`;

      default:
        return `Apply ${hat.name} thinking to "${problem}"`;
    }
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Validate hat color if provided
    const hatData = data as { hatColor?: string };
    if (hatData.hatColor) {
      const expectedColor = this.hatOrder[step - 1];
      return hatData.hatColor === expectedColor;
    }

    return true;
  }

  extractInsights(
    history: Array<{
      hatColor?: string;
      risks?: string[];
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];

    // Extract insights based on hat colors
    history.forEach(entry => {
      if (!entry.hatColor || !entry.output) return;

      switch (entry.hatColor) {
        case 'white':
          if (entry.output.includes('missing') || entry.output.includes('need to know')) {
            insights.push(`Information gap identified: ${entry.output.slice(0, 100)}...`);
          }
          break;

        case 'red':
          if (entry.output.includes('concern') || entry.output.includes('worry')) {
            insights.push(`Emotional concern: ${entry.output.slice(0, 100)}...`);
          }
          break;

        case 'black':
          if (entry.risks && entry.risks.length > 0) {
            insights.push(`Critical risks identified: ${entry.risks.join(', ')}`);
          }
          break;

        case 'green':
          if (entry.output.includes('could') || entry.output.includes('might')) {
            insights.push(`Creative possibility: ${entry.output.slice(0, 100)}...`);
          }
          break;

        case 'purple':
          if (entry.output.includes('irreversible') || entry.output.includes('lock')) {
            insights.push(`Path dependency warning: ${entry.output.slice(0, 100)}...`);
          }
          break;
      }
    });

    return insights;
  }

  getHatColor(step: number): SixHatsColor {
    return this.hatOrder[step - 1];
  }

  getAllHats(): Record<SixHatsColor, HatInfo> {
    return { ...this.hats };
  }
}
