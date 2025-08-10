/**
 * Tests for TechniqueRecommender
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TechniqueRecommender } from '../../sampling/features/TechniqueRecommender.js';
import { SamplingManager } from '../../sampling/SamplingManager.js';
import type { SessionState } from '../../sampling/features/TechniqueRecommender.js';

describe('TechniqueRecommender', () => {
  let recommender: TechniqueRecommender;
  let mockSamplingManager: SamplingManager;

  beforeEach(() => {
    mockSamplingManager = new SamplingManager();
    recommender = new TechniqueRecommender(mockSamplingManager);
  });

  describe('recommendNextTechnique', () => {
    it('should provide AI-powered recommendations when sampling is available', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      vi.spyOn(mockSamplingManager, 'requestSampling').mockResolvedValue({
        content: `Based on your current progress, I recommend:

TECHNIQUE: design_thinking
SCORE: 0.92

REASONING:
Given that you've already explored creative perspectives with six_hats, 
design_thinking would complement nicely by adding user-centric focus.
The empathy phase will ground your ideas in real user needs.

WHY NOW:
- You have sufficient ideas to prototype
- Time to validate with users
- Natural progression from ideation to testing`,
        requestId: 'req_rec_123',
      });

      const state: SessionState = {
        problem: 'Improve user onboarding',
        techniquesUsed: ['six_hats'],
        ideasGenerated: 15,
        flexibilityScore: 0.6,
        duration: 30,
        currentMomentum: 'high',
        userPreference: 'systematic',
        domain: 'product',
      };

      const recommendation = await recommender.recommendNextTechnique(state);

      expect(recommendation.technique).toBe('design_thinking');
      expect(recommendation.score).toBeGreaterThan(0.9);
      expect(recommendation.reasoning).toContain('user-centric');
    });

    it('should use fallback recommendation when AI is unavailable', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const state: SessionState = {
        problem: 'Generate innovative ideas',
        techniquesUsed: [],
        ideasGenerated: 0,
        duration: 5,
        currentMomentum: 'low',
      };

      const recommendation = await recommender.recommendNextTechnique(state);

      expect(recommendation.technique).toBeDefined();
      expect(recommendation.score).toBeGreaterThanOrEqual(0);
      expect(recommendation.score).toBeLessThanOrEqual(1);
      expect(recommendation.reasoning).toBeTruthy();
    });

    it('should handle malformed AI responses', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      vi.spyOn(mockSamplingManager, 'requestSampling').mockResolvedValue({
        content: 'Not the expected format',
        requestId: 'req_bad',
      });

      const state: SessionState = {
        problem: 'Test problem',
        techniquesUsed: ['po'],
        ideasGenerated: 5,
        duration: 15,
      };

      const recommendation = await recommender.recommendNextTechnique(state);

      // Should fall back to heuristic recommendation
      expect(recommendation.technique).toBeDefined();
      expect(recommendation.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle AI service errors gracefully', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      vi.spyOn(mockSamplingManager, 'requestSampling').mockRejectedValue(
        new Error('AI service unavailable')
      );

      const state: SessionState = {
        problem: 'Crisis management',
        techniquesUsed: ['six_hats', 'scamper'],
        ideasGenerated: 20,
        flexibilityScore: 0.3,
        duration: 45,
      };

      const recommendation = await recommender.recommendNextTechnique(state);

      // Should provide fallback recommendation
      expect(recommendation.technique).toBeDefined();
      expect(recommendation.reasoning).toBeTruthy();
    });
  });

  describe('recommendMultipleTechniques', () => {
    it('should recommend multiple techniques for a workflow', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      vi.spyOn(mockSamplingManager, 'requestSampling').mockResolvedValue({
        content: `Recommended workflow:

1. SCAMPER (Score: 0.95)
   - Systematic transformation approach
   - Good starting point for product improvement

2. DESIGN_THINKING (Score: 0.88)
   - User validation after ideation
   - Prototype the transformed ideas

3. SIX_HATS (Score: 0.82)
   - Final evaluation from all perspectives
   - Risk assessment with Black Hat`,
        requestId: 'req_multi',
      });

      const recommendations = await recommender.recommendMultipleTechniques(
        'Improve product features',
        3,
        'systematic'
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].technique).toBe('scamper');
      expect(recommendations[0].score).toBeGreaterThan(0.9);
      expect(recommendations[1].technique).toBe('design_thinking');
      expect(recommendations[2].technique).toBe('six_hats');
    });

    it('should provide heuristic recommendations without AI', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const recommendations = await recommender.recommendMultipleTechniques(
        'Solve complex problem',
        5,
        'analytical'
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      recommendations.forEach(rec => {
        expect(rec.technique).toBeDefined();
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(1);
        expect(rec.reasoning).toBeTruthy();
      });
    });

    it('should handle empty problem gracefully', async () => {
      const recommendations = await recommender.recommendMultipleTechniques('', 3);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should respect maximum count parameter', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const recommendations2 = await recommender.recommendMultipleTechniques(
        'Test problem',
        2,
        'creative'
      );
      expect(recommendations2.length).toBeLessThanOrEqual(2);

      const recommendations10 = await recommender.recommendMultipleTechniques(
        'Test problem',
        10,
        'creative'
      );
      expect(recommendations10.length).toBeLessThanOrEqual(10);
    });
  });

  describe('edge cases', () => {
    it('should handle session with many techniques already used', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const state: SessionState = {
        problem: 'Over-analyzed problem',
        techniquesUsed: ['six_hats', 'scamper', 'triz', 'design_thinking', 'po', 'random_entry'],
        ideasGenerated: 100,
        flexibilityScore: 0.1,
        duration: 180,
        currentMomentum: 'low',
      };

      const recommendation = await recommender.recommendNextTechnique(state);

      // Should still provide a recommendation, possibly suggesting to stop or synthesize
      expect(recommendation.technique).toBeDefined();
      expect(recommendation.reasoning).toBeDefined();
    });

    it('should handle very long problem descriptions', async () => {
      const longProblem = 'x'.repeat(5000);

      const state: SessionState = {
        problem: longProblem,
        techniquesUsed: [],
        ideasGenerated: 0,
        duration: 0,
      };

      const recommendation = await recommender.recommendNextTechnique(state);

      expect(recommendation).toBeDefined();
      expect(recommendation.technique).toBeDefined();
    });

    it('should adapt to different user preferences', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const preferences: Array<SessionState['userPreference']> = [
        'creative',
        'analytical',
        'systematic',
        'rapid',
      ];

      for (const pref of preferences) {
        const state: SessionState = {
          problem: 'Test problem',
          techniquesUsed: [],
          ideasGenerated: 5,
          duration: 10,
          userPreference: pref,
        };

        const recommendation = await recommender.recommendNextTechnique(state);

        expect(recommendation.technique).toBeDefined();
        expect(recommendation.reasoning).toBeDefined();
      }
    });

    it('should consider domain context', async () => {
      const domains = ['technology', 'healthcare', 'finance', 'education'];

      for (const domain of domains) {
        const state: SessionState = {
          problem: `Problem in ${domain}`,
          techniquesUsed: [],
          ideasGenerated: 0,
          duration: 5,
          domain,
        };

        const recommendation = await recommender.recommendNextTechnique(state);

        expect(recommendation.technique).toBeDefined();
        expect(recommendation.score).toBeGreaterThan(0);
      }
    });
  });
});
