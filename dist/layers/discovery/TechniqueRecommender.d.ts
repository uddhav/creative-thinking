/**
 * TechniqueRecommender - Handles technique recommendation logic
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with multi-factor scoring system for intelligent recommendations
 */
import type { LateralTechnique } from '../../types/index.js';
import type { TechniqueRecommendation } from '../../types/planning.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
/**
 * How well a technique fits the problem category recommending it.
 *
 * ORDINAL levels, not measurements. Nothing benchmarks whether `triz` beats
 * `scamper` on technical problems; this is one practitioner's judgement about
 * which tool to reach for first.
 *
 * The scale exists because these were hand-written decimals spanning SIXTEEN
 * distinct values — 0.82, 0.83, 0.84, 0.85, 0.86, 0.88, 0.92, 0.98 among them.
 * There is no basis on which 0.83 differs from 0.84, and a dead
 * EFFECTIVENESS_SCORES table sat in this class unused while every call site
 * wrote its own decimal, which is how they accumulated.
 *
 * Six tiers, chosen to sit ON the clusters the author actually used so that
 * naming them preserves the intended ordering rather than flattening it. An
 * earlier four-tier version moved values by up to 0.08 and changed the top
 * recommendation in 46 of 396 scenarios — collapsing further destroys real
 * signal, notably the category-defining entries.
 *
 * Change a technique's standing by moving it a TIER, never by inventing a
 * decimal; `ordinalScale.test.ts` fails the build otherwise.
 */
export declare const TECHNIQUE_FIT: {
    /** The technique this problem category exists for */
    readonly DEFINING: 0.95;
    /** A leading choice for this category */
    readonly PRIMARY: 0.9;
    /** Strongly applicable */
    readonly STRONG: 0.85;
    /** Clearly applicable, not a headline choice */
    readonly SOLID: 0.8;
    /** A useful secondary angle */
    readonly MODERATE: 0.75;
    /** Occasionally relevant; included for breadth */
    readonly WEAK: 0.7;
};
export declare class TechniqueRecommender {
    private readonly WILDCARD_PROBABILITY;
    private readonly RECOMMENDATION_LIMITS;
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
    recommendTechniques(problemCategory: string, preferredOutcome: string | undefined, constraints: string[] | undefined, complexity: 'low' | 'medium' | 'high', techniqueRegistry: TechniqueRegistry, techniqueBias?: Partial<Record<LateralTechnique, number>>, cruxBias?: Partial<Record<LateralTechnique, number>>): TechniqueRecommendation[];
    /**
     * FNV-1a hash of a string, folded to a unit interval [0, 1). The wildcard
     * path needs repeatable draws, not cryptographic ones.
     */
    private seededUnit;
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