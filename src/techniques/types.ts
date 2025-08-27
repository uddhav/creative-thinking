/**
 * Common types and interfaces for technique handlers
 */

// Removed unused import

/**
 * Step types for reflexivity tracking
 */
export type StepType = 'thinking' | 'action';

/**
 * Reflexive effects that occur after action steps
 */
export interface ReflexiveEffects {
  triggers: string[]; // What actions trigger reflexivity
  realityChanges: string[]; // How reality changes post-action
  futureConstraints: string[]; // What must be considered going forward
  reversibility: 'high' | 'medium' | 'low' | 'very_low'; // How easily can this be undone
}

/**
 * Enhanced step information with reflexivity awareness
 */
export interface StepInfo {
  name: string;
  focus: string;
  emoji: string;
  type?: StepType; // Whether this is thinking or action step
  reflexiveEffects?: ReflexiveEffects; // Effects if this is an action step
}

export interface TechniqueInfo {
  name: string;
  emoji: string;
  totalSteps: number;
  description: string;
  focus?: string;
  enhancedFocus?: string;
  parallelSteps?: {
    canParallelize: boolean;
    dependencies?: Array<[number, number]>; // [from, to] step dependencies
    description?: string; // Explanation of parallelization capability
  };
  reflexivityProfile?: {
    // Overall reflexivity characteristics of the technique
    primaryCommitmentType:
      | 'relationship'
      | 'path'
      | 'structural'
      | 'behavioral'
      | 'technical'
      | 'strategic'
      | 'environmental'
      | 'perceptual'
      | 'exploratory'
      | 'observational';
    overallReversibility: 'high' | 'medium' | 'low' | 'very_low';
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface TechniqueHandler {
  getTechniqueInfo(): TechniqueInfo;
  getStepInfo(step: number): StepInfo;
  getStepGuidance(step: number, problem: string): string;
  validateStep(step: number, data: unknown): boolean;
  extractInsights(history: Array<{ output?: string }>): string[];
}

export abstract class BaseTechniqueHandler implements TechniqueHandler {
  abstract getTechniqueInfo(): TechniqueInfo;
  abstract getStepInfo(step: number): StepInfo;
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
