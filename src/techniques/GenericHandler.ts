/**
 * Generic Technique Handler
 * Provides fallback handling for unknown techniques
 */

import type { TechniqueInfo, TechniqueHandler } from './types.js';

export class GenericHandler implements TechniqueHandler {
  private techniqueName: string;

  constructor(techniqueName: string) {
    this.techniqueName = techniqueName;
  }

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: this.techniqueName,
      emoji: '🔍',
      totalSteps: 5, // Default to 5 steps as per test expectation
      description: `Generic handler for ${this.techniqueName}`,
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    return {
      name: `Step ${step}`,
      focus: `Apply ${this.techniqueName} thinking`,
      emoji: '📝',
    };
  }

  getStepGuidance(step: number, problem: string): string {
    return `Apply ${this.techniqueName} step ${step} to "${problem}"`;
  }

  validateStep(step: number, _data: unknown): boolean {
    return step >= 1 && step <= 5;
  }

  extractInsights(history: Array<{ output?: string }>): string[] {
    return history
      .filter(entry => entry.output && entry.output.length > 50)
      .map(
        entry => `Insight from ${this.techniqueName}: ${entry.output?.substring(0, 100) || ''}...`
      );
  }
}
