/**
 * Common types and interfaces for technique handlers
 */

// Removed unused import

export interface TechniqueInfo {
  name: string;
  emoji: string;
  totalSteps: number;
  description: string;
  focus?: string;
  enhancedFocus?: string;
}

export interface TechniqueHandler {
  getTechniqueInfo(): TechniqueInfo;
  getStepInfo(step: number): { name: string; focus: string; emoji: string };
  getStepGuidance(step: number, problem: string): string;
  validateStep(step: number, data: unknown): boolean;
  extractInsights(history: Array<{ output?: string }>): string[];
}

export abstract class BaseTechniqueHandler implements TechniqueHandler {
  abstract getTechniqueInfo(): TechniqueInfo;
  abstract getStepInfo(step: number): { name: string; focus: string; emoji: string };
  abstract getStepGuidance(step: number, problem: string): string;

  validateStep(step: number, _data: unknown): boolean {
    const info = this.getTechniqueInfo();
    return step >= 1 && step <= info.totalSteps;
  }

  extractInsights(history: Array<{ output?: string }>): string[] {
    const insights: string[] = [];

    // Generic insight extraction - can be overridden by specific handlers
    history.forEach(entry => {
      if (entry.output && entry.output.length > 50) {
        // Extract key phrases or patterns
        const sentences = entry.output.split(/[.!?]+/);
        if (sentences.length > 0) {
          const firstSentence = sentences[0]?.trim();
          if (firstSentence) {
            insights.push(firstSentence);
          }
        }
      }
    });

    return insights;
  }
}
