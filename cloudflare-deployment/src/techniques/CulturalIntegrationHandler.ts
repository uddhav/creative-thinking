/**
 * Cultural Integration technique handler
 *
 * Consolidates CrossCultural and CulturalCreativity techniques into a unified approach
 * that combines bridge-building with creative synthesis for culturally-aware solutions.
 *
 * This technique merges:
 * - CrossCultural: Integration of diverse cultural perspectives
 * - CulturalCreativity: Multi-cultural synthesis without appropriation
 *
 * The unified approach provides comprehensive cultural integration through:
 * 1. Mapping cultural landscapes and power dynamics
 * 2. Identifying authentic connection points
 * 3. Building respectful bridges between cultures
 * 4. Weaving perspectives creatively
 * 5. Synthesizing solutions that honor all sources
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';

export class CulturalIntegrationHandler extends BaseTechniqueHandler {
  private readonly steps: StepInfo[] = [
    {
      name: 'Cultural Landscape Mapping',
      focus: 'Map cultural contexts, frameworks, and power dynamics',
      emoji: '🗺️',
      type: 'thinking',
    },
    {
      name: 'Touchpoint Discovery',
      focus: 'Find authentic connection opportunities',
      emoji: '🔍',
      type: 'thinking',
    },
    {
      name: 'Bridge Building',
      focus: 'Create respectful bidirectional connections',
      emoji: '🌉',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Building cultural bridges', 'Establishing connections'],
        realityChanges: [
          'New relationships formed between cultural groups',
          'Shared expectations and understanding created',
          'Cultural boundaries become more permeable',
          'Trust networks established',
        ],
        futureConstraints: [
          'Must maintain established bridges',
          'Cannot ignore connected communities',
          'Bridge commitments require ongoing maintenance',
          'Trust must be preserved through actions',
        ],
        reversibility: 'low',
      },
    },
    {
      name: 'Perspective Weaving',
      focus: 'Integrate diverse viewpoints creatively',
      emoji: '🎨',
      type: 'thinking',
    },
    {
      name: 'Respectful Synthesis',
      focus: 'Create culturally-aware adaptive solutions',
      emoji: '🤝',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Implementing synthesis', 'Deploying solutions'],
        realityChanges: [
          'New cultural combinations become reality',
          'Attribution patterns established',
          'Cultural creative landscape changed',
          'Stakeholder expectations shift',
        ],
        futureConstraints: [
          'Must honor attribution commitments',
          'Solutions create precedents',
          'Cultural groups expect continued respect',
          'Innovation changes perception permanently',
        ],
        reversibility: 'medium',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Cultural Integration',
      emoji: '🌍',
      totalSteps: 5,
      description:
        'Integrate diverse cultural perspectives through bridge-building and creative synthesis',
      focus: 'Create culturally-aware solutions that honor all sources',
      parallelSteps: {
        canParallelize: false,
        description: 'Cultural integration requires sequential respect to avoid appropriation',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'relationship',
        overallReversibility: 'medium',
        riskLevel: 'medium',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    return (
      this.steps[step - 1] || {
        name: 'Unknown Step',
        focus: 'Continue with Cultural Integration',
        emoji: '🌍',
      }
    );
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out-of-bounds steps as per test expectations
    if (step < 1 || step > this.steps.length) {
      return `Complete the Cultural Integration analysis for: "${problem}"`;
    }

    const guidanceMap: Record<number, string> = {
      1: `For "${problem}": What cultural frameworks are at play? What historical contexts matter? What power dynamics exist? What constraints or taboos should be respected?`,
      2: `For "${problem}": Where do cultures naturally connect? What shared experiences exist? What complementary strengths can be leveraged? Where might friction occur?`,
      3: `For "${problem}": How can you create authentic bridges? What translation is needed? How can trust be established? Remember: This step creates lasting relationships.`,
      4: `For "${problem}": How can perspectives combine creatively? How do you ensure proper attribution? What novel combinations honor all sources?`,
      5: `For "${problem}": How can insights become solutions? How do you maintain authenticity? How can solutions adapt to different contexts? Remember: This creates precedents.`,
    };
    return (
      guidanceMap[step] || `Continue exploring "${problem}" with cultural integration mindfully.`
    );
  }

  validateStep(step: number, data: unknown): boolean {
    if (step < 1 || step > this.steps.length) {
      return false;
    }

    // Check for required output field
    if (typeof data === 'object' && data !== null) {
      const stepData = data as Record<string, unknown>;
      return stepData.output !== undefined && stepData.output !== null && stepData.output !== '';
    }

    return false;
  }
}
