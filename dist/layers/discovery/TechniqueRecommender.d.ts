/**
 * TechniqueRecommender - Handles technique recommendation logic
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with multi-factor scoring system for intelligent recommendations
 */
import type { LateralTechnique } from '../../types/index.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
export declare class TechniqueRecommender {
    private readonly WILDCARD_PROBABILITY;
    private readonly RECOMMENDATION_LIMITS;
    private readonly EFFECTIVENESS_SCORES;
    private techniqueInfoCache;
    private scorer;
    constructor();
    /**
     * Recommend techniques based on problem category and other factors
     * Now enhanced with multi-factor scoring
     */
    /**
     * Weighting used when a persona is active. The 70/30 split lets a persona's
     * preferences influence ranking without letting them dominate problem fit.
     *
     * The bias is applied during scoring, BEFORE sorting and truncation. Applying
     * it afterwards would only reorder the survivors, so a technique the persona
     * most favours could be truncated away and never recovered — which is exactly
     * what happened when preferredOutcome boosted competing techniques past it.
     */
    private readonly PERSONA_BASE_WEIGHT;
    private readonly PERSONA_BIAS_WEIGHT;
    recommendTechniques(problemCategory: string, preferredOutcome: string | undefined, constraints: string[] | undefined, complexity: 'low' | 'medium' | 'high', techniqueRegistry: TechniqueRegistry, techniqueBias?: Partial<Record<LateralTechnique, number>>): Array<{
        technique: LateralTechnique;
        reasoning: string;
        effectiveness: number;
        isWildcard?: boolean;
    }>;
    /**
     * Adjust recommendations based on preferred outcome
     */
    private adjustForPreferredOutcome;
    /**
     * Select a wildcard technique to prevent algorithmic pigeonholing
     */
    private selectWildcardTechnique;
}
//# sourceMappingURL=TechniqueRecommender.d.ts.map