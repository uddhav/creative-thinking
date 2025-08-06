/**
 * Nine Windows (System Operator) technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import type { NineWindowsCell } from '../types/index.js';

export class NineWindowsHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Nine Windows',
      emoji: '🪟',
      totalSteps: 9,
      description: 'Explore problems across time and system levels',
      focus: 'Systematic analysis through space-time matrix',
      parallelSteps: {
        canParallelize: true,
        description:
          'All nine windows can be viewed simultaneously for holistic system understanding',
      },
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    const cells = [
      // Row 1: Past
      { name: 'Past Sub-system', focus: 'Component history', emoji: '🔧' },
      { name: 'Past System', focus: 'System evolution', emoji: '⚙️' },
      { name: 'Past Super-system', focus: 'Environmental history', emoji: '🌍' },
      // Row 2: Present
      { name: 'Present Sub-system', focus: 'Current components', emoji: '🔩' },
      { name: 'Present System', focus: 'Current state', emoji: '🎯' },
      { name: 'Present Super-system', focus: 'Current environment', emoji: '🏞️' },
      // Row 3: Future
      { name: 'Future Sub-system', focus: 'Component evolution', emoji: '🚀' },
      { name: 'Future System', focus: 'System possibilities', emoji: '🎪' },
      { name: 'Future Super-system', focus: 'Environmental changes', emoji: '🌅' },
    ];

    if (step < 1 || step > cells.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Nine Windows. Valid steps are 1-${cells.length}`,
        'step',
        { providedStep: step, validRange: [1, cells.length] }
      );
    }

    return cells[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 9) {
      return `Complete the Nine Windows analysis for "${problem}"`;
    }

    const guidanceMap: { [key: number]: string } = {
      // Past
      1: `🔧 Past Sub-system: What component decisions and developments led to the current "${problem}"?`,
      2: `⚙️ Past System: How did the overall system evolve to create this situation?`,
      3: `🌍 Past Super-system: What environmental/contextual factors shaped the development?`,
      // Present
      4: `🔩 Present Sub-system: What are the current components and their states?`,
      5: `🎯 Present System: What is the current system state regarding "${problem}"?`,
      6: `🏞️ Present Super-system: What is the current environment and context?`,
      // Future
      7: `🚀 Future Sub-system: How might components evolve? What path dependencies exist?`,
      8: `🎪 Future System: What system futures are possible? Which paths are irreversible?`,
      9: `🌅 Future Super-system: How might the environment change? What constraints will emerge?`,
    };

    return guidanceMap[step] || `Apply Nine Windows step ${step} to "${problem}"`;
  }

  extractInsights(
    history: Array<{
      currentStep?: number;
      nineWindowsMatrix?: NineWindowsCell[];
      currentCell?: {
        timeFrame: 'past' | 'present' | 'future';
        systemLevel: 'sub-system' | 'system' | 'super-system';
      };
      interdependencies?: string[];
      nextStepNeeded?: boolean;
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];

    history.forEach(entry => {
      // Extract key insights from specific cells
      if (entry.currentStep === 2 && entry.output) {
        // Past System evolution
        insights.push(`Historical pattern: ${entry.output.split('.')[0]}`);
      }
      if (entry.currentStep === 5 && entry.output) {
        // Present System state
        insights.push(`Current reality: ${entry.output.split('.')[0]}`);
      }
      if (entry.currentStep === 8 && entry.output) {
        // Future System possibilities
        insights.push(`Future possibility: ${entry.output.split('.')[0]}`);
      }

      // Extract interdependencies if found
      if (entry.interdependencies && entry.interdependencies.length > 0) {
        insights.push(`Key dependency: ${entry.interdependencies[0]}`);
      }
    });

    // Check if Nine Windows is complete
    const hasCompleteSession = history.some(
      entry => entry.currentStep === 9 && !entry.nextStepNeeded
    );
    if (hasCompleteSession) {
      insights.push(
        'Nine Windows completed - systemic understanding achieved across time and scale'
      );
    }

    return insights;
  }

  /**
   * Helper method to get cell info by coordinates
   */
  getCellByCoordinates(
    timeFrame: 'past' | 'present' | 'future',
    systemLevel: 'sub-system' | 'system' | 'super-system'
  ): number {
    const timeIndex = { past: 0, present: 1, future: 2 }[timeFrame];
    const levelIndex = { 'sub-system': 0, system: 1, 'super-system': 2 }[systemLevel];
    return timeIndex * 3 + levelIndex + 1;
  }
}
