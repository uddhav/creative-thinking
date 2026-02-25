/**
 * Tests for HumanisticQualityCoverage
 */

import { describe, it, expect } from 'vitest';
import {
  HumanisticQualityCoverage,
  ALL_HUMANISTIC_QUALITIES,
} from '../../../layers/discovery/HumanisticQualityCoverage.js';
import { ALL_LATERAL_TECHNIQUES } from '../../../types/index.js';
import type { LateralTechnique } from '../../../types/index.js';
import type { TechniqueRecommendation } from '../../../types/planning.js';

describe('HumanisticQualityCoverage', () => {
  describe('Quality Profiles', () => {
    it('should have a valid profile for every technique', () => {
      for (const technique of ALL_LATERAL_TECHNIQUES) {
        const profile = HumanisticQualityCoverage.getQualityProfile(technique);
        expect(profile, `Missing profile for ${technique}`).toBeDefined();

        if (!profile) throw new Error(`Missing profile for ${technique}`);
        for (const quality of ALL_HUMANISTIC_QUALITIES) {
          const score = profile[quality];
          expect(score, `${technique}.${quality} is undefined`).toBeDefined();
          expect(
            score,
            `${technique}.${quality} = ${score} is out of range`
          ).toBeGreaterThanOrEqual(0);
          expect(score, `${technique}.${quality} = ${score} is out of range`).toBeLessThanOrEqual(
            1
          );
        }
      }
    });

    it('should expose profiles via getQualityProfile', () => {
      const profile = HumanisticQualityCoverage.getQualityProfile('first_principles');
      if (!profile) throw new Error('Expected profile to be defined');
      expect(profile.intelligence).toBe(0.9);
      expect(profile.courage).toBe(0.9);
    });
  });

  describe('analyzeCoverage', () => {
    it('should detect full coverage with a diverse technique set', () => {
      // first_principles: intelligence=0.9, courage=0.9
      // design_thinking: tenacity=0.8, justice=0.7
      // random_entry: curiosity=0.9
      // cultural_integration: justice=0.9
      // competing_hypotheses: intelligence=0.9, courage=0.8, tenacity=0.7
      const techniques: LateralTechnique[] = [
        'first_principles',
        'design_thinking',
        'random_entry',
        'cultural_integration',
        'competing_hypotheses',
      ];

      const result = HumanisticQualityCoverage.analyzeCoverage(techniques);

      expect(result.allCovered).toBe(true);
      expect(result.gaps).toHaveLength(0);

      for (const quality of ALL_HUMANISTIC_QUALITIES) {
        expect(result.qualities[quality].covered).toBe(true);
        expect(result.qualities[quality].score).toBeGreaterThanOrEqual(0.7);
        expect(result.qualities[quality].topContributor).toBeTruthy();
      }
    });

    it('should detect gaps with a biased analytical set', () => {
      // Three highly analytical techniques — likely missing curiosity and justice
      const techniques: LateralTechnique[] = [
        'triz',
        'neuro_computational',
        'criteria_based_analysis',
      ];

      const result = HumanisticQualityCoverage.analyzeCoverage(techniques);

      expect(result.allCovered).toBe(false);
      expect(result.gaps.length).toBeGreaterThan(0);

      // These three are all high intelligence — should be covered
      expect(result.qualities.intelligence.covered).toBe(true);

      // Justice is low across all three (0.3, 0.2, 0.7) — criteria_based_analysis just barely covers it
      // Curiosity is low across all three (0.5, 0.5, 0.3)
      expect(result.gaps).toContain('curiosity');
    });

    it('should identify top contributor per quality', () => {
      const techniques: LateralTechnique[] = ['first_principles', 'random_entry'];

      const result = HumanisticQualityCoverage.analyzeCoverage(techniques);

      expect(result.qualities.intelligence.topContributor).toBe('first_principles');
      expect(result.qualities.curiosity.topContributor).toBe('random_entry');
    });

    it('should provide gap suggestions with valid techniques', () => {
      const techniques: LateralTechnique[] = ['triz', 'neuro_computational'];

      const result = HumanisticQualityCoverage.analyzeCoverage(techniques);

      for (const suggestion of result.gapSuggestions) {
        expect(ALL_HUMANISTIC_QUALITIES).toContain(suggestion.quality);
        expect(suggestion.suggestedTechniques.length).toBeGreaterThan(0);

        // Suggested techniques should not already be in the set
        for (const tech of suggestion.suggestedTechniques) {
          expect(techniques).not.toContain(tech);
        }

        // Suggested techniques should actually score well for the gap quality
        for (const tech of suggestion.suggestedTechniques) {
          const profile = HumanisticQualityCoverage.getQualityProfile(tech);
          if (!profile) throw new Error(`Expected profile for ${tech}`);
          expect(profile[suggestion.quality]).toBeGreaterThanOrEqual(0.7);
        }
      }
    });

    it('should handle empty technique set', () => {
      const result = HumanisticQualityCoverage.analyzeCoverage([]);

      expect(result.allCovered).toBe(false);
      expect(result.gaps).toHaveLength(5);
      for (const quality of ALL_HUMANISTIC_QUALITIES) {
        expect(result.qualities[quality].score).toBe(0);
        expect(result.qualities[quality].covered).toBe(false);
      }
    });

    it('should handle single technique', () => {
      const result = HumanisticQualityCoverage.analyzeCoverage(['first_principles']);

      expect(result.qualities.intelligence.covered).toBe(true);
      expect(result.qualities.courage.covered).toBe(true);
      // tenacity=0.6, curiosity=0.6, justice=0.3 — all below threshold
      expect(result.gaps).toContain('justice');
    });
  });

  describe('fillCoverageGaps', () => {
    function makeRec(technique: LateralTechnique, effectiveness: number): TechniqueRecommendation {
      return {
        technique,
        reasoning: `Test recommendation for ${technique}`,
        effectiveness,
      };
    }

    it('should not modify sets with fewer than 3 techniques', () => {
      const recs = [makeRec('triz', 0.9), makeRec('neuro_computational', 0.85)];

      const result = HumanisticQualityCoverage.fillCoverageGaps(recs);

      expect(result.adjusted).toBe(false);
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].technique).toBe('triz');
      expect(result.recommendations[1].technique).toBe('neuro_computational');
    });

    it('should not modify already-covered sets', () => {
      const recs = [
        makeRec('first_principles', 0.9), // intelligence, courage
        makeRec('design_thinking', 0.85), // tenacity, justice
        makeRec('random_entry', 0.8), // curiosity
        makeRec('cultural_integration', 0.75), // justice
      ];

      const result = HumanisticQualityCoverage.fillCoverageGaps(recs);

      expect(result.adjusted).toBe(false);
      expect(result.coverage.allCovered).toBe(true);
    });

    it('should fill gaps by appending techniques', () => {
      // Analytical-heavy set missing curiosity
      const recs = [
        makeRec('triz', 0.9),
        makeRec('neuro_computational', 0.85),
        makeRec('criteria_based_analysis', 0.8),
      ];

      const result = HumanisticQualityCoverage.fillCoverageGaps(recs);

      expect(result.adjusted).toBe(true);

      // Should have added/swapped to fill gaps
      const techniques = result.recommendations.map(r => r.technique);
      const newCoverage = HumanisticQualityCoverage.analyzeCoverage(techniques);

      // Should have improved coverage
      const originalCoverage = HumanisticQualityCoverage.analyzeCoverage(
        recs.map(r => r.technique)
      );
      expect(newCoverage.gaps.length).toBeLessThan(originalCoverage.gaps.length);
    });

    it('should add at most 2 filler techniques', () => {
      // Very narrow set — all similar
      const recs = [
        makeRec('triz', 0.9),
        makeRec('neuro_computational', 0.85),
        makeRec('nine_windows', 0.8),
      ];

      const result = HumanisticQualityCoverage.fillCoverageGaps(recs);

      const fillers = result.recommendations.filter(r => r.isQualityFiller);
      expect(fillers.length).toBeLessThanOrEqual(2);
    });

    it('should set isQualityFiller flag on filler recommendations', () => {
      const recs = [
        makeRec('triz', 0.9),
        makeRec('neuro_computational', 0.85),
        makeRec('criteria_based_analysis', 0.8),
      ];

      const result = HumanisticQualityCoverage.fillCoverageGaps(recs);

      if (result.adjusted) {
        const fillers = result.recommendations.filter(r => r.isQualityFiller);
        expect(fillers.length).toBeGreaterThan(0);

        for (const filler of fillers) {
          expect(filler.isQualityFiller).toBe(true);
          expect(filler.reasoning).toContain('coverage');
        }
      }
    });

    it('should not create new gaps when appending fillers', () => {
      const recs = [
        makeRec('six_hats', 0.9), // broad coverage
        makeRec('triz', 0.85),
        makeRec('neuro_computational', 0.8),
      ];

      const originalCoverage = HumanisticQualityCoverage.analyzeCoverage(
        recs.map(r => r.technique)
      );

      const result = HumanisticQualityCoverage.fillCoverageGaps(recs);

      if (result.adjusted) {
        // Appending should only improve coverage (fewer gaps or equal)
        expect(result.coverage.gaps.length).toBeLessThanOrEqual(originalCoverage.gaps.length);
      }
    });

    it('should preserve all original recommendations', () => {
      const recs = [
        makeRec('first_principles', 0.95),
        makeRec('triz', 0.9),
        makeRec('neuro_computational', 0.85),
      ];

      const result = HumanisticQualityCoverage.fillCoverageGaps(recs);

      // All original techniques should still be present (append-only)
      for (const original of recs) {
        const found = result.recommendations.find(r => r.technique === original.technique);
        expect(found).toBeDefined();
      }
    });
  });
});
