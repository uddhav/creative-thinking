/**
 * Humanistic Quality Coverage
 *
 * Ensures technique sets collectively embody five humanistic qualities:
 * intelligence, courage, tenacity, curiosity, and justice.
 *
 * "To be a real Human, one needs intelligence, courage, tenacity,
 * curiosity, and a strong sense of justice."
 */
import type { LateralTechnique } from '../../types/index.js';
import type { TechniqueRecommendation } from '../../types/planning.js';
export type HumanisticQuality = 'intelligence' | 'courage' | 'tenacity' | 'curiosity' | 'justice';
export declare const ALL_HUMANISTIC_QUALITIES: readonly HumanisticQuality[];
export interface QualityScore {
    score: number;
    covered: boolean;
    topContributor: string;
}
export interface QualityCoverageResult {
    qualities: Record<HumanisticQuality, QualityScore>;
    allCovered: boolean;
    gaps: HumanisticQuality[];
    gapSuggestions: Array<{
        quality: HumanisticQuality;
        suggestedTechniques: LateralTechnique[];
    }>;
}
export interface FillCoverageResult {
    recommendations: TechniqueRecommendation[];
    coverage: QualityCoverageResult;
    adjusted: boolean;
}
export declare class HumanisticQualityCoverage {
    /**
     * Get the quality profile for a single technique.
     */
    static getQualityProfile(technique: LateralTechnique): Record<HumanisticQuality, number> | undefined;
    /**
     * Analyze whether a set of techniques collectively covers all five qualities.
     * Uses max score per quality across the set (>= threshold = covered).
     */
    static analyzeCoverage(techniques: LateralTechnique[]): QualityCoverageResult;
    /**
     * Fill coverage gaps in a recommendation set.
     * Only modifies sets with 3+ techniques. Max 2 fillers.
     * Swaps lowest-ranked technique or appends to fill gaps.
     */
    static fillCoverageGaps(recommendations: TechniqueRecommendation[]): FillCoverageResult;
    /**
     * Find techniques that score highly for a given quality,
     * excluding techniques already in the set.
     */
    private static findTechniquesForQuality;
}
//# sourceMappingURL=HumanisticQualityCoverage.d.ts.map