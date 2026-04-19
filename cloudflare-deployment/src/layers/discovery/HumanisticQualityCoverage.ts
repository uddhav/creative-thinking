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
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import type { TechniqueRecommendation } from '../../types/planning.js';

export type HumanisticQuality = 'intelligence' | 'courage' | 'tenacity' | 'curiosity' | 'justice';

export const ALL_HUMANISTIC_QUALITIES: readonly HumanisticQuality[] = [
  'intelligence',
  'courage',
  'tenacity',
  'curiosity',
  'justice',
] as const;

export interface QualityScore {
  score: number;
  covered: boolean;
  topContributor: string;
}

export interface QualityCoverageResult {
  qualities: Record<HumanisticQuality, QualityScore>;
  allCovered: boolean;
  gaps: HumanisticQuality[];
  gapSuggestions: Array<{ quality: HumanisticQuality; suggestedTechniques: LateralTechnique[] }>;
}

export interface FillCoverageResult {
  recommendations: TechniqueRecommendation[];
  coverage: QualityCoverageResult;
  adjusted: boolean;
}

const COVERAGE_THRESHOLD = 0.7;

/**
 * Quality profiles for all 28 techniques.
 * Each score (0-1) represents how strongly a technique embodies that quality.
 *
 * Intelligence: analytical rigor, systematic reasoning, evidence-based thinking
 * Courage: willingness to challenge assumptions, take bold positions, provoke
 * Tenacity: persistence through complexity, thoroughness, iterative refinement
 * Curiosity: exploration, novel connections, openness to unexpected paths
 * Justice: fairness, inclusivity, multiple perspectives, equity considerations
 */
const TECHNIQUE_QUALITY_PROFILES: Record<LateralTechnique, Record<HumanisticQuality, number>> = {
  six_hats: { intelligence: 0.8, courage: 0.5, tenacity: 0.7, curiosity: 0.6, justice: 0.8 },
  po: { intelligence: 0.4, courage: 0.9, tenacity: 0.3, curiosity: 0.8, justice: 0.3 },
  random_entry: { intelligence: 0.3, courage: 0.5, tenacity: 0.2, curiosity: 0.9, justice: 0.3 },
  scamper: { intelligence: 0.7, courage: 0.6, tenacity: 0.8, curiosity: 0.7, justice: 0.3 },
  concept_extraction: {
    intelligence: 0.8,
    courage: 0.3,
    tenacity: 0.6,
    curiosity: 0.7,
    justice: 0.3,
  },
  yes_and: { intelligence: 0.4, courage: 0.5, tenacity: 0.5, curiosity: 0.7, justice: 0.7 },
  design_thinking: { intelligence: 0.6, courage: 0.5, tenacity: 0.8, curiosity: 0.6, justice: 0.7 },
  triz: { intelligence: 0.9, courage: 0.6, tenacity: 0.8, curiosity: 0.5, justice: 0.3 },
  neural_state: { intelligence: 0.7, courage: 0.4, tenacity: 0.6, curiosity: 0.6, justice: 0.2 },
  temporal_work: { intelligence: 0.6, courage: 0.4, tenacity: 0.7, curiosity: 0.4, justice: 0.3 },
  collective_intel: {
    intelligence: 0.7,
    courage: 0.4,
    tenacity: 0.5,
    curiosity: 0.6,
    justice: 0.8,
  },
  disney_method: { intelligence: 0.6, courage: 0.7, tenacity: 0.6, curiosity: 0.7, justice: 0.4 },
  nine_windows: { intelligence: 0.8, courage: 0.3, tenacity: 0.7, curiosity: 0.6, justice: 0.4 },
  quantum_superposition: {
    intelligence: 0.7,
    courage: 0.8,
    tenacity: 0.5,
    curiosity: 0.9,
    justice: 0.3,
  },
  temporal_creativity: {
    intelligence: 0.7,
    courage: 0.5,
    tenacity: 0.7,
    curiosity: 0.6,
    justice: 0.4,
  },
  paradoxical_problem: {
    intelligence: 0.8,
    courage: 0.8,
    tenacity: 0.7,
    curiosity: 0.7,
    justice: 0.5,
  },
  meta_learning: { intelligence: 0.8, courage: 0.4, tenacity: 0.8, curiosity: 0.7, justice: 0.3 },
  biomimetic_path: {
    intelligence: 0.6,
    courage: 0.5,
    tenacity: 0.7,
    curiosity: 0.8,
    justice: 0.4,
  },
  first_principles: {
    intelligence: 0.9,
    courage: 0.9,
    tenacity: 0.6,
    curiosity: 0.6,
    justice: 0.3,
  },
  cultural_integration: {
    intelligence: 0.5,
    courage: 0.5,
    tenacity: 0.5,
    curiosity: 0.5,
    justice: 0.9,
  },
  neuro_computational: {
    intelligence: 0.9,
    courage: 0.4,
    tenacity: 0.7,
    curiosity: 0.5,
    justice: 0.2,
  },
  criteria_based_analysis: {
    intelligence: 0.9,
    courage: 0.5,
    tenacity: 0.8,
    curiosity: 0.3,
    justice: 0.7,
  },
  linguistic_forensics: {
    intelligence: 0.8,
    courage: 0.6,
    tenacity: 0.7,
    curiosity: 0.5,
    justice: 0.6,
  },
  competing_hypotheses: {
    intelligence: 0.9,
    courage: 0.8,
    tenacity: 0.7,
    curiosity: 0.4,
    justice: 0.5,
  },
  reverse_benchmarking: {
    intelligence: 0.7,
    courage: 0.7,
    tenacity: 0.6,
    curiosity: 0.6,
    justice: 0.4,
  },
  context_reframing: {
    intelligence: 0.6,
    courage: 0.6,
    tenacity: 0.5,
    curiosity: 0.7,
    justice: 0.6,
  },
  perception_optimization: {
    intelligence: 0.7,
    courage: 0.5,
    tenacity: 0.5,
    curiosity: 0.6,
    justice: 0.5,
  },
  anecdotal_signal: {
    intelligence: 0.5,
    courage: 0.6,
    tenacity: 0.6,
    curiosity: 0.8,
    justice: 0.5,
  },
};

export class HumanisticQualityCoverage {
  /**
   * Get the quality profile for a single technique.
   */
  static getQualityProfile(
    technique: LateralTechnique
  ): Record<HumanisticQuality, number> | undefined {
    return TECHNIQUE_QUALITY_PROFILES[technique];
  }

  /**
   * Analyze whether a set of techniques collectively covers all five qualities.
   * Uses max score per quality across the set (>= threshold = covered).
   */
  static analyzeCoverage(techniques: LateralTechnique[]): QualityCoverageResult {
    const qualities: Record<HumanisticQuality, QualityScore> = {
      intelligence: { score: 0, covered: false, topContributor: '' },
      courage: { score: 0, covered: false, topContributor: '' },
      tenacity: { score: 0, covered: false, topContributor: '' },
      curiosity: { score: 0, covered: false, topContributor: '' },
      justice: { score: 0, covered: false, topContributor: '' },
    };

    for (const technique of techniques) {
      const profile = TECHNIQUE_QUALITY_PROFILES[technique];
      if (!profile) continue;

      for (const quality of ALL_HUMANISTIC_QUALITIES) {
        if (profile[quality] > qualities[quality].score) {
          qualities[quality].score = profile[quality];
          qualities[quality].topContributor = technique;
        }
      }
    }

    // Determine coverage
    const gaps: HumanisticQuality[] = [];
    for (const quality of ALL_HUMANISTIC_QUALITIES) {
      qualities[quality].covered = qualities[quality].score >= COVERAGE_THRESHOLD;
      if (!qualities[quality].covered) {
        gaps.push(quality);
      }
    }

    // Build gap suggestions
    const gapSuggestions = gaps.map(quality => ({
      quality,
      suggestedTechniques: HumanisticQualityCoverage.findTechniquesForQuality(quality, techniques),
    }));

    return {
      qualities,
      allCovered: gaps.length === 0,
      gaps,
      gapSuggestions,
    };
  }

  /**
   * Fill coverage gaps in a recommendation set.
   * Only modifies sets with 3+ techniques. Max 2 fillers.
   * Swaps lowest-ranked technique or appends to fill gaps.
   */
  static fillCoverageGaps(recommendations: TechniqueRecommendation[]): FillCoverageResult {
    // Don't modify small sets — not enough room to swap without losing value
    if (recommendations.length < 3) {
      const coverage = HumanisticQualityCoverage.analyzeCoverage(
        recommendations.map(r => r.technique)
      );
      return { recommendations, coverage, adjusted: false };
    }

    const coverage = HumanisticQualityCoverage.analyzeCoverage(
      recommendations.map(r => r.technique)
    );

    // Already fully covered
    if (coverage.allCovered) {
      return { recommendations, coverage, adjusted: false };
    }

    let adjusted = false;
    const currentRecs = [...recommendations];
    let fillersAdded = 0;
    const MAX_FILLERS = 2;

    // Append-only strategy: never displace existing recommendations,
    // add filler techniques to the end to cover humanistic quality gaps
    for (const gap of coverage.gaps) {
      if (fillersAdded >= MAX_FILLERS) break;

      const candidates = HumanisticQualityCoverage.findTechniquesForQuality(
        gap,
        currentRecs.map(r => r.technique)
      );
      if (candidates.length === 0) continue;

      const fillerTechnique = candidates[0];
      const fillerProfile = TECHNIQUE_QUALITY_PROFILES[fillerTechnique];

      currentRecs.push({
        technique: fillerTechnique,
        reasoning: `Added to strengthen ${gap} coverage in the technique set`,
        effectiveness: fillerProfile[gap],
        isQualityFiller: true,
      });
      adjusted = true;
      fillersAdded++;
    }

    const finalCoverage = HumanisticQualityCoverage.analyzeCoverage(
      currentRecs.map(r => r.technique)
    );

    return {
      recommendations: currentRecs,
      coverage: finalCoverage,
      adjusted,
    };
  }

  /**
   * Find techniques that score highly for a given quality,
   * excluding techniques already in the set.
   */
  private static findTechniquesForQuality(
    quality: HumanisticQuality,
    excludeTechniques: LateralTechnique[]
  ): LateralTechnique[] {
    const excludeSet = new Set(excludeTechniques);

    return ALL_LATERAL_TECHNIQUES.filter(t => !excludeSet.has(t))
      .map(t => ({ technique: t, score: TECHNIQUE_QUALITY_PROFILES[t][quality] }))
      .filter(entry => entry.score >= COVERAGE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.technique);
  }
}
