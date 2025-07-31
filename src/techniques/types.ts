/**
 * Common types and interfaces for technique handlers
 */

import type { LateralTechnique } from '../types/index.js';

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
  validateStep(step: number, data: any): boolean;
  extractInsights(history: any[]): string[];
}

export abstract class BaseTechniqueHandler implements TechniqueHandler {
  abstract getTechniqueInfo(): TechniqueInfo;
  abstract getStepInfo(step: number): { name: string; focus: string; emoji: string };
  abstract getStepGuidance(step: number, problem: string): string;

  validateStep(step: number, data: any): boolean {
    const info = this.getTechniqueInfo();
    return step >= 1 && step <= info.totalSteps;
  }

  extractInsights(history: any[]): string[] {
    const insights: string[] = [];

    // Generic insight extraction - can be overridden by specific handlers
    history.forEach(entry => {
      if (entry.output && entry.output.length > 50) {
        // Extract key phrases or patterns
        const sentences = entry.output.split(/[.!?]+/);
        if (sentences.length > 0) {
          insights.push(sentences[0].trim());
        }
      }
    });

    return insights;
  }
}
