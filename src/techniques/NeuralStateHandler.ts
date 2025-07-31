/**
 * Neural State Optimization technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';

export class NeuralStateHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Neural State Optimization',
      emoji: '🧠',
      totalSteps: 4,
      description: 'Optimize thinking by managing neural network states',
      focus: 'Balance Default Mode Network (DMN) and Executive Control Network (ECN)',
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    const steps = [
      {
        name: 'Assess Current State',
        focus: 'Identify dominant neural network (DMN vs ECN)',
        emoji: '🔍',
      },
      {
        name: 'Identify Suppression',
        focus: 'Find which network is being suppressed',
        emoji: '🚫',
      },
      {
        name: 'Develop Switching',
        focus: 'Create rhythm between networks',
        emoji: '🔄',
      },
      {
        name: 'Integrate Insights',
        focus: 'Combine outputs from both networks',
        emoji: '🔀',
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new Error(`Invalid step ${step} for Neural State`);
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 4) {
      return `Complete the Neural State Optimization process for "${problem}"`;
    }

    switch (step) {
      case 1:
        return `🔍 Assess your current neural state for "${problem}". Are you in focused analysis (ECN) or free association (DMN)?`;
      case 2:
        return `🚫 Which network is suppressed? If highly focused, DMN is suppressed. If wandering, ECN is suppressed`;
      case 3:
        return `🔄 Develop a switching rhythm. Alternate between focused analysis and free exploration of "${problem}"`;
      case 4:
        return `🔀 Integrate insights from both states. What emerges when analytical and creative insights combine?`;
      default:
        return `Apply Neural State step ${step} to "${problem}"`;
    }
  }

  extractInsights(history: any[]): string[] {
    const insights: string[] = [];

    history.forEach(entry => {
      if (entry.currentStep === 1 && entry.dominantNetwork) {
        insights.push(`Dominant network: ${entry.dominantNetwork.toUpperCase()}`);
      }
      if (entry.currentStep === 2 && entry.suppressionDepth !== undefined) {
        insights.push(`Suppression depth: ${entry.suppressionDepth}/10`);
      }
      if (entry.currentStep === 3 && entry.switchingRhythm && entry.switchingRhythm.length > 0) {
        insights.push(`Switching pattern: ${entry.switchingRhythm[0]}`);
      }
      if (
        entry.currentStep === 4 &&
        entry.integrationInsights &&
        entry.integrationInsights.length > 0
      ) {
        insights.push(`Integration: ${entry.integrationInsights[0]}`);
      }
    });

    // Check if neural state optimization is complete
    const hasCompleteSession = history.some(
      entry => entry.currentStep === 4 && !entry.nextStepNeeded
    );
    if (hasCompleteSession) {
      insights.push('Neural State Optimization completed for enhanced cognitive flexibility');
    }

    return insights;
  }
}
