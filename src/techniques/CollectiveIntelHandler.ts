/**
 * Collective Intelligence technique handler
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';

export class CollectiveIntelHandler extends BaseTechniqueHandler {
  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Collective Intelligence Synthesis',
      emoji: '🧬',
      totalSteps: 5,
      description: 'Harness collective wisdom from multiple sources',
      focus: 'Synthesize insights from diverse intelligence sources',
    };
  }

  getStepInfo(step: number): { name: string; focus: string; emoji: string } {
    const steps = [
      {
        name: 'Identify Sources',
        focus: 'Map diverse knowledge sources',
        emoji: '📚',
      },
      {
        name: 'Gather Wisdom',
        focus: 'Collect insights from each source',
        emoji: '🎯',
      },
      {
        name: 'Find Patterns',
        focus: 'Identify emergent patterns',
        emoji: '🔍',
      },
      {
        name: 'Create Synergy',
        focus: 'Combine for amplified value',
        emoji: '✨',
      },
      {
        name: 'Synthesize Insight',
        focus: 'Form unified understanding',
        emoji: '💫',
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new Error(`Invalid step ${step} for Collective Intelligence`);
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 5) {
      return `Complete the Collective Intelligence Synthesis process for "${problem}"`;
    }

    switch (step) {
      case 1:
        return `📚 Identify wisdom sources for "${problem}": experts, crowds, databases, cultural knowledge`;
      case 2:
        return `🎯 Gather specific insights from each source. What does each perspective contribute?`;
      case 3:
        return `🔍 Find patterns across sources. Look for convergence, divergence, and emergence`;
      case 4:
        return `✨ Create synergistic combinations. How do different insights amplify each other?`;
      case 5:
        return `💫 Synthesize collective intelligence into unified, actionable insights for "${problem}"`;
      default:
        return `Apply Collective Intelligence step ${step} to "${problem}"`;
    }
  }

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

    history.forEach(entry => {
      if (entry.currentStep === 1 && entry.wisdomSources && entry.wisdomSources.length > 0) {
        insights.push(`Wisdom source: ${entry.wisdomSources[0]}`);
      }
      if (entry.currentStep === 2 && entry.emergentPatterns && entry.emergentPatterns.length > 0) {
        insights.push(`Pattern found: ${entry.emergentPatterns[0]}`);
      }
      if (
        entry.currentStep === 3 &&
        entry.synergyCombinations &&
        entry.synergyCombinations.length > 0
      ) {
        insights.push(`Synergy: ${entry.synergyCombinations[0]}`);
      }
      if (
        entry.currentStep === 4 &&
        entry.collectiveInsights &&
        entry.collectiveInsights.length > 0
      ) {
        insights.push(`Collective insight: ${entry.collectiveInsights[0]}`);
      }
    });

    // Check if collective intelligence synthesis is complete
    const hasCompleteSession = history.some(
      entry => entry.currentStep === 5 && 'nextStepNeeded' in entry && !entry.nextStepNeeded
    );
    if (hasCompleteSession) {
      insights.push('Collective Intelligence synthesis completed - wisdom of many integrated');
    }

    return insights;
  }
}
