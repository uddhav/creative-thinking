/**
 * Cultural Path Navigation Strategies technique handler
 *
 * Navigates solution pathways through cultural and contextual landscapes,
 * focusing on path-dependent decision making in culturally complex environments.
 *
 * Different from cross_cultural technique:
 * - cross_cultural: Integrates diverse cultural perspectives respectfully into solutions
 * - cultural_path: Navigates through cultural contexts to find viable solution pathways
 *
 * This technique emphasizes the journey and navigation through cultural terrain,
 * rather than just the integration of different perspectives.
 */

import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface CulturalPathStep {
  name: string;
  focus: string;
  emoji: string;
  description?: string;
}

export class CulturalPathHandler extends BaseTechniqueHandler {
  private readonly steps: CulturalPathStep[] = [
    {
      name: 'Cultural Landscape Mapping',
      focus: 'Map cultural contexts and path dependencies',
      emoji: '🗺️',
      description:
        'Identify cultural contexts, values, traditions, and social dynamics that shape available solution paths',
    },
    {
      name: 'Context Sensitivity Analysis',
      focus: 'Assess cultural constraints and opportunities',
      emoji: '🎭',
      description:
        'Analyze how different cultural contexts enable or constrain certain paths and solutions',
    },
    {
      name: 'Cross-Cultural Bridge Building',
      focus: 'Create paths that connect diverse perspectives',
      emoji: '🌉',
      description:
        'Design solutions that bridge cultural differences while respecting unique values and practices',
    },
    {
      name: 'Adaptive Path Navigation',
      focus: 'Navigate flexibly through cultural terrain',
      emoji: '🧭',
      description:
        'Develop adaptive strategies that can shift based on cultural feedback and contextual changes',
    },
    {
      name: 'Cultural Synthesis',
      focus: 'Integrate diverse cultural wisdom',
      emoji: '🌍',
      description:
        'Synthesize insights from multiple cultural paths into innovative, culturally-aware solutions',
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Cultural Path Navigation',
      emoji: '🗺️',
      totalSteps: 5,
      description:
        'Navigate solution pathways through cultural contexts and social landscapes to find viable paths forward',
      focus: 'Path-dependent navigation through cultural complexity',
      enhancedFocus:
        'Maps and navigates the cultural terrain to identify viable pathways, avoiding cultural obstacles while leveraging cultural enablers to reach solutions',
      parallelSteps: {
        canParallelize: false,
        description: 'Steps build sequentially from mapping to synthesis',
      },
    };
  }

  getStepInfo(step: number): CulturalPathStep {
    const stepInfo = this.steps[step - 1];
    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Cultural Path Navigation. Valid steps are 1-${this.steps.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.steps.length}` }
      );
    }
    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    const guidanceMap: Record<number, string> = {
      1: `Map the cultural landscape for: "${problem}". Identify relevant cultural contexts, stakeholder values, social norms, traditions, power dynamics, and historical precedents. Consider: What cultural factors shape this problem? Which paths are culturally acceptable? What are the unwritten rules? Map both explicit and implicit cultural constraints and enablers.`,
      2: `Analyze context sensitivity for: "${problem}". Assess how different cultural contexts affect solution viability. Examine: taboos and sacred cows, cultural blindspots, contextual triggers, timing sensitivities, face-saving requirements, and hierarchy considerations. What works in one culture may fail in another - identify these variations.`,
      3: `Build cross-cultural bridges for: "${problem}". Design pathways that connect diverse cultural perspectives. Create: translation mechanisms, shared value identification, win-win frameworks, cultural adapters, respect protocols, and inclusive narratives. Find the universal human elements while honoring cultural specificity.`,
      4: `Navigate adaptively through: "${problem}". Develop flexible strategies that respond to cultural feedback. Implement: cultural sensing mechanisms, pivot protocols, feedback integration, course correction methods, and diplomatic alternatives. Design for graceful degradation when cultural resistance emerges.`,
      5: `Synthesize cultural insights for: "${problem}". Integrate wisdom from multiple cultural paths into a cohesive solution. Combine: indigenous knowledge, modern innovations, Eastern and Western approaches, formal and informal systems, and traditional and progressive values. Create culturally intelligent solutions that transcend single-culture limitations.`,
    };

    return guidanceMap[step] || `Continue cultural path analysis for: "${problem}"`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Add specific validation for cultural path fields
    if (typeof data === 'object' && data !== null) {
      const stepData = data as Record<string, unknown>;

      switch (step) {
        case 1:
          // Validate cultural landscape mapping - require both fields
          if (!stepData.culturalFactors || !stepData.pathConstraints) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 1 requires both cultural factors AND path constraints analysis',
              'culturalFactors',
              { step, technique: 'cultural_path' }
            );
          }
          break;
        case 2:
          // Validate context sensitivity - require both fields
          if (!stepData.contextAnalysis || !stepData.culturalVariations) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 requires both context analysis AND cultural variations',
              'contextAnalysis',
              { step, technique: 'cultural_path' }
            );
          }
          break;
        case 3:
          // Validate bridge building - require both fields
          if (!stepData.bridgeStrategies || !stepData.sharedValues) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 requires both bridge strategies AND shared values identification',
              'bridgeStrategies',
              { step, technique: 'cultural_path' }
            );
          }
          break;
        case 4:
          // Validate adaptive navigation - require both fields
          if (!stepData.adaptiveStrategies || !stepData.pivotProtocols) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 4 requires both adaptive strategies AND pivot protocols',
              'adaptiveStrategies',
              { step, technique: 'cultural_path' }
            );
          }
          break;
        case 5:
          // Validate cultural synthesis - require both fields
          if (!stepData.culturalSynthesis || !stepData.integratedSolution) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 5 requires both cultural synthesis AND integrated solution',
              'culturalSynthesis',
              { step, technique: 'cultural_path' }
            );
          }
          break;
      }
    }

    return true;
  }

  getPromptContext(step: number): Record<string, unknown> {
    const stepInfo = this.getStepInfo(step);
    return {
      technique: 'cultural_path',
      step,
      stepName: stepInfo.name,
      focus: stepInfo.focus,
      emoji: stepInfo.emoji,
      capabilities: {
        landscapeMapping: 'Cultural context and path dependency analysis',
        contextSensitivity: 'Cultural constraints and opportunities',
        bridgeBuilding: 'Cross-cultural connection strategies',
        adaptiveNavigation: 'Flexible cultural response mechanisms',
        culturalSynthesis: 'Integration of diverse cultural wisdom',
      },
    };
  }
}
