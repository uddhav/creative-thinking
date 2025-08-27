/**
 * Tests for TechniqueScorer multi-factor scoring system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TechniqueScorer } from '../../../layers/discovery/TechniqueScorer.js';
import type { ProblemContext, ScoringWeights } from '../../../layers/discovery/TechniqueScorer.js';

describe('TechniqueScorer', () => {
  let scorer: TechniqueScorer;

  beforeEach(() => {
    scorer = new TechniqueScorer();
  });

  describe('Score Calculation', () => {
    it('should calculate balanced score with default weights', () => {
      const context: ProblemContext = {
        category: 'creative',
        complexity: 'medium',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
        preferredOutcome: 'innovative',
      };

      // Random entry is perfect for innovative creative problems
      const score = scorer.calculateScore('random_entry', context, 0.9);
      expect(score).toBeGreaterThan(0.7); // Should score well

      // Competing hypotheses is not great for creative innovation
      const analyticalScore = scorer.calculateScore('competing_hypotheses', context, 0.2);
      expect(analyticalScore).toBeLessThan(0.5); // Should score poorly
    });

    it('should penalize complexity mismatch', () => {
      const simpleContext: ProblemContext = {
        category: 'general',
        complexity: 'low',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
      };

      const complexContext: ProblemContext = {
        category: 'general',
        complexity: 'high',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
      };

      // Design thinking (high complexity) for simple problem
      const overEngineered = scorer.calculateScore('design_thinking', simpleContext, 0.5);

      // Design thinking (high complexity) for complex problem
      const wellMatched = scorer.calculateScore('design_thinking', complexContext, 0.5);

      expect(wellMatched).toBeGreaterThan(overEngineered);
    });

    it('should penalize constraint incompatibility', () => {
      const constrainedContext: ProblemContext = {
        category: 'general',
        complexity: 'medium',
        hasTimeConstraints: true,
        hasResourceConstraints: true,
        needsCollaboration: true,
      };

      // Six hats handles all constraints well
      const sixHatsScore = scorer.calculateScore('six_hats', constrainedContext, 0.5);

      // Quantum superposition doesn't handle time or collaboration
      const quantumScore = scorer.calculateScore('quantum_superposition', constrainedContext, 0.5);

      expect(sixHatsScore).toBeGreaterThan(quantumScore);
    });

    it('should boost techniques aligned with preferred outcome', () => {
      const systematicContext: ProblemContext = {
        category: 'general',
        complexity: 'medium',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
        preferredOutcome: 'systematic',
      };

      // TRIZ is perfect for systematic approaches
      const trizScore = scorer.calculateScore('triz', systematicContext, 0.5);

      // Random entry is not systematic
      const randomScore = scorer.calculateScore('random_entry', systematicContext, 0.5);

      expect(trizScore).toBeGreaterThan(randomScore);
    });

    it('should handle collaboration needs appropriately', () => {
      const collaborativeContext: ProblemContext = {
        category: 'organizational',
        complexity: 'medium',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: true,
        preferredOutcome: 'collaborative',
      };

      // Yes, And is perfect for collaboration
      const yesAndScore = scorer.calculateScore('yes_and', collaborativeContext, 0.7);

      // Neural state is individual-focused
      const neuralScore = scorer.calculateScore('neural_state', collaborativeContext, 0.7);

      expect(yesAndScore).toBeGreaterThan(neuralScore);
    });
  });

  describe('Score Breakdown', () => {
    it('should provide detailed scoring breakdown', () => {
      const context: ProblemContext = {
        category: 'analytical',
        complexity: 'high',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
        preferredOutcome: 'analytical',
      };

      const breakdown = scorer.getScoreBreakdown('first_principles', context, 0.8);

      expect(breakdown).toHaveProperty('categoryFit');
      expect(breakdown).toHaveProperty('complexityMatch');
      expect(breakdown).toHaveProperty('constraintCompatibility');
      expect(breakdown).toHaveProperty('outcomeAlignment');
      expect(breakdown).toHaveProperty('final');

      // First principles should score well for analytical high-complexity problems
      expect(breakdown.categoryFit).toBeCloseTo(0.8, 1);
      expect(breakdown.complexityMatch).toBe(1.0); // Perfect match
      expect(breakdown.outcomeAlignment).toBe(1.0); // Perfect for analytical
      expect(breakdown.final).toBeGreaterThan(0.8);
    });
  });

  describe('Custom Weights', () => {
    it('should accept custom weights', () => {
      const customWeights: ScoringWeights = {
        categoryFit: 0.1,
        complexityMatch: 0.1,
        constraintCompatibility: 0.1,
        outcomeAlignment: 0.7, // Heavy emphasis on outcome
      };

      const customScorer = new TechniqueScorer(customWeights);

      const context: ProblemContext = {
        category: 'general',
        complexity: 'low',
        hasTimeConstraints: true,
        hasResourceConstraints: true,
        needsCollaboration: true,
        preferredOutcome: 'innovative',
      };

      // Random entry scores perfect on innovation
      const score = customScorer.calculateScore('random_entry', context, 0.3);
      expect(score).toBeGreaterThan(0.7); // Should be high due to outcome weight
    });

    it('should auto-normalize weights if they dont sum to 1', () => {
      const unnormalizedWeights: ScoringWeights = {
        categoryFit: 2,
        complexityMatch: 1,
        constraintCompatibility: 1,
        outcomeAlignment: 1, // Sum = 5, not 1
      };

      const customScorer = new TechniqueScorer(unnormalizedWeights);
      const context: ProblemContext = {
        category: 'general',
        complexity: 'medium',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
      };

      const score = customScorer.calculateScore('six_hats', context, 0.5);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Execution Time Estimation', () => {
    it('should estimate quick execution for simple techniques', () => {
      expect(scorer.estimateExecutionTime('random_entry')).toBe('quick'); // 3 steps, low complexity
      expect(scorer.estimateExecutionTime('yes_and')).toBe('quick'); // 4 steps, low complexity
    });

    it('should estimate moderate execution for medium techniques', () => {
      expect(scorer.estimateExecutionTime('six_hats')).toBe('moderate'); // 7 steps, medium complexity
      expect(scorer.estimateExecutionTime('scamper')).toBe('moderate'); // 8 steps, medium complexity
    });

    it('should estimate extensive execution for complex techniques', () => {
      expect(scorer.estimateExecutionTime('competing_hypotheses')).toBe('extensive'); // 8 steps, high complexity (3+3=6)
      expect(scorer.estimateExecutionTime('nine_windows')).toBe('moderate'); // 9 steps but medium complexity (2+3=5)
      // Note: A technique needs both high complexity AND many steps to be extensive (total > 5)
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing metadata gracefully', () => {
      const context: ProblemContext = {
        category: 'general',
        complexity: 'medium',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
      };

      // Test with a fake technique that doesn't exist
      const score = scorer.calculateScore('fake_technique' as any, context, 0.5);
      expect(score).toBe(0.5); // Should fallback to category score
    });

    it('should handle no preferred outcome', () => {
      const context: ProblemContext = {
        category: 'general',
        complexity: 'medium',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
        // No preferredOutcome
      };

      const score = scorer.calculateScore('six_hats', context, 0.5);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle no constraints gracefully', () => {
      const context: ProblemContext = {
        category: 'general',
        complexity: 'medium',
        hasTimeConstraints: false,
        hasResourceConstraints: false,
        needsCollaboration: false,
      };

      const score = scorer.calculateScore('design_thinking', context, 0.5);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance', () => {
    it('should calculate scores quickly', () => {
      const context: ProblemContext = {
        category: 'general',
        complexity: 'medium',
        hasTimeConstraints: true,
        hasResourceConstraints: true,
        needsCollaboration: true,
        preferredOutcome: 'systematic',
      };

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        scorer.calculateScore('six_hats', context, 0.5);
      }
      const endTime = Date.now();

      const avgTime = (endTime - startTime) / 1000;
      expect(avgTime).toBeLessThan(0.1); // Should be well under 0.1ms per calculation
    });
  });
});
