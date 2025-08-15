/**
 * Insight generation strategies for different thinking techniques
 */
export class SixHatsInsightStrategy {
    technique = 'six_hats';
    generateInsight(input) {
        if (input.hatColor === 'black' && input.risks && input.risks.length > 0) {
            return `Critical thinking revealed ${input.risks.length} risk factors that require mitigation`;
        }
        if (input.hatColor === 'green' && input.currentStep === 6) {
            return 'Creative solutions generated after systematic analysis';
        }
        return undefined;
    }
}
export class POInsightStrategy {
    technique = 'po';
    generateInsight(input) {
        if (input.currentStep === 2 && input.principles) {
            return `Provocation successfully challenged ${input.principles.length} core assumptions`;
        }
        return undefined;
    }
}
export class DesignThinkingInsightStrategy {
    technique = 'design_thinking';
    generateInsight(input) {
        if (input.currentStep === 1 && input.empathyInsights && input.empathyInsights.length > 0) {
            return `User research uncovered ${input.empathyInsights.length} key pain points`;
        }
        if (input.currentStep === 5 && input.userFeedback) {
            return 'Testing validated solution assumptions with real users';
        }
        return undefined;
    }
}
export class TRIZInsightStrategy {
    technique = 'triz';
    generateInsight(input) {
        if (input.contradiction) {
            return 'Technical contradiction identified, opening path to breakthrough';
        }
        return undefined;
    }
}
export class SCAMPERInsightStrategy {
    technique = 'scamper';
    generateInsight(input) {
        if (input.pathImpact && input.pathImpact.flexibilityRetention < 0.3) {
            return 'High-commitment modification: consider generating alternatives';
        }
        return undefined;
    }
}
export class YesAndInsightStrategy {
    technique = 'yes_and';
    generateInsight(input) {
        if (input.currentStep === 3 && input.additions && input.additions.length > 3) {
            return 'Collaborative momentum achieved with multiple building iterations';
        }
        return undefined;
    }
}
export class NeuralStateInsightStrategy {
    technique = 'neural_state';
    generateInsight(input) {
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
export class CollectiveIntelInsightStrategy {
    technique = 'collective_intel';
    generateInsight(input) {
        if (input.currentStep === 1 && input.wisdomSources && input.wisdomSources.length > 0) {
            return `${input.wisdomSources.length} wisdom sources identified`;
        }
        if (input.currentStep === 3 && input.emergentPatterns && input.emergentPatterns.length > 0) {
            return `${input.emergentPatterns.length} emergent patterns discovered`;
        }
        if (input.currentStep === 4 &&
            input.synergyCombinations &&
            input.synergyCombinations.length > 0) {
            return `${input.synergyCombinations.length} synergistic combinations created`;
        }
        return undefined;
    }
}
export class CrossCulturalInsightStrategy {
    technique = 'cultural_integration';
    generateInsight(input) {
        if (input.currentStep === 1 &&
            input.culturalFrameworks &&
            input.culturalFrameworks.length > 0) {
            return `${input.culturalFrameworks.length} cultural perspectives identified`;
        }
        if (input.currentStep === 2 && input.bridgeBuilding && input.bridgeBuilding.length > 0) {
            return `${input.bridgeBuilding.length} cultural bridges discovered`;
        }
        if (input.currentStep === 3 &&
            input.respectfulSynthesis &&
            input.respectfulSynthesis.length > 0) {
            return `Creating inclusive solution from ${input.respectfulSynthesis.length} synthesized approaches`;
        }
        if (input.currentStep === 4 && input.parallelPaths && input.parallelPaths.length > 0) {
            return `${input.parallelPaths.length} parallel paths designed`;
        }
        return undefined;
    }
}
export class TemporalWorkInsightStrategy {
    technique = 'temporal_work';
    generateInsight(input) {
        if (input.currentStep === 1 && input.temporalLandscape) {
            const fixed = input.temporalLandscape.fixedDeadlines?.length || 0;
            const kairos = input.temporalLandscape.kairosOpportunities?.length || 0;
            if (fixed > 0 || kairos > 0) {
                return `${fixed} fixed constraints, ${kairos} kairos opportunities`;
            }
        }
        if (input.currentStep === 3 &&
            input.pressureTransformation &&
            input.pressureTransformation.length > 0) {
            return `${input.pressureTransformation.length} catalytic techniques applied`;
        }
        if (input.temporalLandscape?.kairosOpportunities &&
            input.temporalLandscape.kairosOpportunities.length > 0) {
            return 'Kairos moments identified - optimal timing windows available';
        }
        return undefined;
    }
}
/**
 * Registry of all insight strategies
 */
export class InsightStrategyRegistry {
    static instance;
    strategies;
    strategyCache = new Map();
    constructor() {
        this.strategies = new Map();
        this.registerDefaultStrategies();
    }
    static getInstance() {
        if (!InsightStrategyRegistry.instance) {
            InsightStrategyRegistry.instance = new InsightStrategyRegistry();
        }
        return InsightStrategyRegistry.instance;
    }
    registerDefaultStrategies() {
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
    getStrategy(technique) {
        // Check cache first
        if (this.strategyCache.has(technique)) {
            return this.strategyCache.get(technique);
        }
        // Look up and cache result
        const strategy = this.strategies.get(technique);
        this.strategyCache.set(technique, strategy);
        return strategy;
    }
    registerStrategy(strategy) {
        this.strategies.set(strategy.technique, strategy);
        // Clear cache entry for this technique
        this.strategyCache.delete(strategy.technique);
    }
}
export class ProblemCategorizationEngine {
    static instance;
    strategies = [
        { keywords: ['optimize', 'improve'], category: 'optimization' },
        { keywords: ['create', 'design'], category: 'creation' },
        { keywords: ['solve', 'fix'], category: 'problem-solving' },
        { keywords: ['understand', 'analyze'], category: 'analysis' },
    ];
    categoryCache = new Map();
    constructor() { }
    static getInstance() {
        if (!ProblemCategorizationEngine.instance) {
            ProblemCategorizationEngine.instance = new ProblemCategorizationEngine();
        }
        return ProblemCategorizationEngine.instance;
    }
    categorize(problem) {
        // Check cache first
        if (this.categoryCache.has(problem)) {
            const cachedCategory = this.categoryCache.get(problem);
            if (cachedCategory !== undefined) {
                return cachedCategory;
            }
        }
        const lowerProblem = problem.toLowerCase();
        let category = 'exploration';
        for (const strategy of this.strategies) {
            if (strategy.keywords.some(keyword => lowerProblem.includes(keyword))) {
                category = strategy.category;
                break;
            }
        }
        // Cache result
        this.categoryCache.set(problem, category);
        return category;
    }
}
export class SolutionPatternIdentifier {
    static instance;
    strategies = [
        {
            identifier: techniques => new Set(techniques).size > 1,
            pattern: 'multi-technique synthesis',
        },
        {
            identifier: techniques => new Set(techniques).size === 1 && techniques[0] === 'six_hats' && techniques.length > 1,
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
            identifier: (_, history) => history.some(h => h.antifragileProperties && h.antifragileProperties.length > 0),
            pattern: 'antifragile-design',
        },
    ];
    patternCache = new Map();
    constructor() { }
    static getInstance() {
        if (!SolutionPatternIdentifier.instance) {
            SolutionPatternIdentifier.instance = new SolutionPatternIdentifier();
        }
        return SolutionPatternIdentifier.instance;
    }
    identify(techniques, history) {
        // Create cache key from techniques
        const cacheKey = techniques.join('|');
        // Check cache first (note: history changes may affect result, so cache is technique-based only)
        if (this.patternCache.has(cacheKey) && !this.hasAntifragileProperties(history)) {
            const cachedPattern = this.patternCache.get(cacheKey);
            if (cachedPattern !== undefined) {
                return cachedPattern;
            }
        }
        let pattern = 'creative-exploration';
        for (const strategy of this.strategies) {
            if (strategy.identifier(techniques, history)) {
                pattern = strategy.pattern;
                break;
            }
        }
        // Cache result if no antifragile properties (which depend on history)
        if (!this.hasAntifragileProperties(history)) {
            this.patternCache.set(cacheKey, pattern);
        }
        return pattern;
    }
    hasAntifragileProperties(history) {
        return history.some(h => h.antifragileProperties && h.antifragileProperties.length > 0);
    }
}
//# sourceMappingURL=insightStrategies.js.map