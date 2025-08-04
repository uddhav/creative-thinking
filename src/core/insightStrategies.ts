/**
 * Insight generation strategies for different thinking techniques
 */

import type { ThinkingOperationData, SessionData } from '../types/index.js';

export interface InsightStrategy {
  technique: string;
  generateInsight(input: ThinkingOperationData, session: SessionData): string | undefined;
}

export class SixHatsInsightStrategy implements InsightStrategy {
  technique = 'six_hats';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.hatColor === 'black' && input.risks && input.risks.length > 0) {
      return `Critical thinking revealed ${input.risks.length} risk factors that require mitigation`;
    }
    if (input.hatColor === 'green' && input.currentStep === 6) {
      return 'Creative solutions generated after systematic analysis';
    }
    return undefined;
  }
}

export class POInsightStrategy implements InsightStrategy {
  technique = 'po';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.currentStep === 2 && input.principles) {
      return `Provocation successfully challenged ${input.principles.length} core assumptions`;
    }
    return undefined;
  }
}

export class DesignThinkingInsightStrategy implements InsightStrategy {
  technique = 'design_thinking';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.currentStep === 1 && input.empathyInsights && input.empathyInsights.length > 0) {
      return `User research uncovered ${input.empathyInsights.length} key pain points`;
    }
    if (input.currentStep === 5 && input.userFeedback) {
      return 'Testing validated solution assumptions with real users';
    }
    return undefined;
  }
}

export class TRIZInsightStrategy implements InsightStrategy {
  technique = 'triz';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.contradiction) {
      return 'Technical contradiction identified, opening path to breakthrough';
    }
    return undefined;
  }
}

export class SCAMPERInsightStrategy implements InsightStrategy {
  technique = 'scamper';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.pathImpact && input.pathImpact.flexibilityRetention < 0.3) {
      return 'High-commitment modification: consider generating alternatives';
    }
    return undefined;
  }
}

export class YesAndInsightStrategy implements InsightStrategy {
  technique = 'yes_and';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.currentStep === 3 && input.additions && input.additions.length > 3) {
      return 'Collaborative momentum achieved with multiple building iterations';
    }
    return undefined;
  }
}

export class NeuralStateInsightStrategy implements InsightStrategy {
  technique = 'neural_state';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.currentStep === 1 && input.dominantNetwork === 'ecn') {
      return 'Executive Control Network dominance detected';
    }
    if (input.currentStep === 1 && input.dominantNetwork === 'dmn') {
      return 'Default Mode Network dominance detected';
    }
    if (input.currentStep === 2 && input.suppressionDepth !== undefined) {
      if (input.suppressionDepth >= 8) {
        return `Network suppression depth: ${input.suppressionDepth}/10 - High rigidity detected`;
      }
      return `Network suppression depth: ${input.suppressionDepth}/10`;
    }
    if (input.dominantNetwork && input.suppressionDepth && input.suppressionDepth > 7) {
      return 'Deep neural state manipulation achieved - breakthrough potential high';
    }
    return undefined;
  }
}

export class CollectiveIntelInsightStrategy implements InsightStrategy {
  technique = 'collective_intel';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.currentStep === 1 && input.wisdomSources && input.wisdomSources.length > 0) {
      return `${input.wisdomSources.length} wisdom sources identified`;
    }
    if (input.currentStep === 3 && input.emergentPatterns && input.emergentPatterns.length > 0) {
      return `${input.emergentPatterns.length} emergent patterns discovered`;
    }
    if (
      input.currentStep === 4 &&
      input.synergyCombinations &&
      input.synergyCombinations.length > 0
    ) {
      return `${input.synergyCombinations.length} synergistic combinations created`;
    }
    return undefined;
  }
}

export class CrossCulturalInsightStrategy implements InsightStrategy {
  technique = 'cross_cultural';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (
      input.currentStep === 1 &&
      input.culturalFrameworks &&
      input.culturalFrameworks.length > 0
    ) {
      return `${input.culturalFrameworks.length} cultural perspectives identified`;
    }
    if (input.currentStep === 2 && input.bridgeBuilding && input.bridgeBuilding.length > 0) {
      return `${input.bridgeBuilding.length} cultural bridges discovered`;
    }
    if (
      input.currentStep === 3 &&
      input.respectfulSynthesis &&
      input.respectfulSynthesis.length > 0
    ) {
      return `Creating inclusive solution from ${input.respectfulSynthesis.length} synthesized approaches`;
    }
    if (input.currentStep === 4 && input.parallelPaths && input.parallelPaths.length > 0) {
      return `${input.parallelPaths.length} parallel paths designed`;
    }
    return undefined;
  }
}

export class TemporalWorkInsightStrategy implements InsightStrategy {
  technique = 'temporal_work';

  generateInsight(input: ThinkingOperationData): string | undefined {
    if (input.currentStep === 1 && input.temporalLandscape) {
      const fixed = input.temporalLandscape.fixedDeadlines?.length || 0;
      const kairos = input.temporalLandscape.kairosOpportunities?.length || 0;
      if (fixed > 0 || kairos > 0) {
        return `${fixed} fixed constraints, ${kairos} kairos opportunities`;
      }
    }
    if (
      input.currentStep === 3 &&
      input.pressureTransformation &&
      input.pressureTransformation.length > 0
    ) {
      return `${input.pressureTransformation.length} catalytic techniques applied`;
    }
    if (
      input.temporalLandscape?.kairosOpportunities &&
      input.temporalLandscape.kairosOpportunities.length > 0
    ) {
      return 'Kairos moments identified - optimal timing windows available';
    }
    return undefined;
  }
}

/**
 * Registry of all insight strategies
 */
export class InsightStrategyRegistry {
  private strategies: Map<string, InsightStrategy>;

  constructor() {
    this.strategies = new Map();
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    const strategies = [
      new SixHatsInsightStrategy(),
      new POInsightStrategy(),
      new DesignThinkingInsightStrategy(),
      new TRIZInsightStrategy(),
      new SCAMPERInsightStrategy(),
      new YesAndInsightStrategy(),
      new NeuralStateInsightStrategy(),
      new CollectiveIntelInsightStrategy(),
      new CrossCulturalInsightStrategy(),
      new TemporalWorkInsightStrategy(),
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.technique, strategy);
    });
  }

  getStrategy(technique: string): InsightStrategy | undefined {
    return this.strategies.get(technique);
  }

  registerStrategy(strategy: InsightStrategy): void {
    this.strategies.set(strategy.technique, strategy);
  }
}

/**
 * Problem categorization strategies
 */
export interface ProblemCategoryStrategy {
  keywords: string[];
  category: string;
}

export class ProblemCategorizationEngine {
  private strategies: ProblemCategoryStrategy[] = [
    { keywords: ['optimize', 'improve'], category: 'optimization' },
    { keywords: ['create', 'design'], category: 'creation' },
    { keywords: ['solve', 'fix'], category: 'problem-solving' },
    { keywords: ['understand', 'analyze'], category: 'analysis' },
  ];

  categorize(problem: string): string {
    const lowerProblem = problem.toLowerCase();

    for (const strategy of this.strategies) {
      if (strategy.keywords.some(keyword => lowerProblem.includes(keyword))) {
        return strategy.category;
      }
    }

    return 'exploration';
  }
}

/**
 * Solution pattern identification strategies
 */
export interface SolutionPatternStrategy {
  identifier: (
    techniques: string[],
    history: Array<{ antifragileProperties?: string[] }>
  ) => boolean;
  pattern: string;
}

export class SolutionPatternIdentifier {
  private strategies: SolutionPatternStrategy[] = [
    {
      identifier: techniques => new Set(techniques).size > 1,
      pattern: 'multi-technique synthesis',
    },
    {
      identifier: techniques =>
        new Set(techniques).size === 1 && techniques[0] === 'six_hats' && techniques.length > 1,
      pattern: 'multi-perspective synthesis',
    },
    {
      identifier: techniques => techniques.includes('triz'),
      pattern: 'contradiction-resolution',
    },
    {
      identifier: techniques => techniques.includes('design_thinking'),
      pattern: 'user-centered',
    },
    {
      identifier: techniques => techniques.includes('random_entry'),
      pattern: 'linear progression',
    },
    {
      identifier: techniques => techniques.includes('six_hats'),
      pattern: 'multi-perspective synthesis',
    },
    {
      identifier: (_, history) =>
        history.some(h => h.antifragileProperties && h.antifragileProperties.length > 0),
      pattern: 'antifragile-design',
    },
  ];

  identify(techniques: string[], history: Array<{ antifragileProperties?: string[] }>): string {
    for (const strategy of this.strategies) {
      if (strategy.identifier(techniques, history)) {
        return strategy.pattern;
      }
    }

    return 'creative-exploration';
  }
}
