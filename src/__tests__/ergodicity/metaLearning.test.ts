/**
 * Tests for Meta-Learning System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetaLearningSystem } from '../../ergodicity/metaLearning.js';
import type { RiskDiscovery } from '../../core/RuinRiskDiscovery.js';

describe('MetaLearningSystem', () => {
  let metaLearning: MetaLearningSystem;

  beforeEach(() => {
    metaLearning = new MetaLearningSystem();
  });

  describe('recordSession', () => {
    it('should record a discovery session', () => {
      const discovery: RiskDiscovery = {
        domain: 'financial',
        identifiedRisks: [
          {
            risk: 'Portfolio wipeout',
            reversibility: 'irreversible',
            impactMagnitude: 'catastrophic',
          },
          { risk: 'Margin call cascade', reversibility: 'difficult', impactMagnitude: 'severe' },
        ],
        domainSpecificSafetyPractices: ['Never use leverage', 'Max 10% position size'],
        maxAcceptableLoss: '20%',
      };

      metaLearning.recordSession('session-1', 'financial', discovery);

      // Should be recorded (verified through other methods)
      const patterns = metaLearning.exportPatterns();
      expect(patterns.domainSummary.financial).toBeDefined();
      expect(patterns.domainSummary.financial.sessionCount).toBe(1);
    });

    it('should track outcomes when provided', () => {
      const discovery: RiskDiscovery = {
        domain: 'career',
        identifiedRisks: [
          { risk: 'Reputation damage', reversibility: 'difficult', impactMagnitude: 'severe' },
          { risk: 'Network loss', reversibility: 'irreversible', impactMagnitude: 'moderate' },
        ],
        domainSpecificSafetyPractices: ['Always leave on good terms'],
        maxAcceptableLoss: 'One bad reference',
      };

      metaLearning.recordSession('session-1', 'career', discovery, {
        risksRealized: ['Reputation damage'],
        risksMissed: ['Legal complications'],
      });

      const patterns = metaLearning.exportPatterns();
      expect(patterns.patterns.some(p => p.pattern === 'Reputation damage')).toBe(true);
    });
  });

  describe('getEnhancedPrompts', () => {
    it('should enhance prompts based on patterns', () => {
      // Record some sessions to build patterns
      const discovery1: RiskDiscovery = {
        domain: 'financial',
        identifiedRisks: [
          {
            risk: 'Leverage spiral',
            reversibility: 'irreversible',
            impactMagnitude: 'catastrophic',
          },
        ],
        domainSpecificSafetyPractices: ['No margin trading'],
      };

      const discovery2: RiskDiscovery = {
        domain: 'financial',
        identifiedRisks: [
          {
            risk: 'Leverage spiral',
            reversibility: 'irreversible',
            impactMagnitude: 'catastrophic',
          },
          { risk: 'Correlation risk', reversibility: 'difficult', impactMagnitude: 'severe' },
        ],
        domainSpecificSafetyPractices: ['Diversify holdings'],
      };

      metaLearning.recordSession('session-1', 'financial', discovery1);
      metaLearning.recordSession('session-2', 'financial', discovery2);

      const basePrompt = 'What are the risks?';
      const enhanced = metaLearning.getEnhancedPrompts(basePrompt, 'financial', {
        problem: 'Investment decision',
      });

      expect(enhanced.length).toBeGreaterThan(1);
      expect(enhanced[0]).toBe(basePrompt);
      // Enhanced versions should mention discovered patterns
      expect(enhanced.some(p => p.includes('Based on patterns'))).toBe(true);
    });

    it('should include cross-domain insights', () => {
      // Record patterns in different domains
      const healthDiscovery: RiskDiscovery = {
        domain: 'health',
        identifiedRisks: [
          {
            risk: 'Permanent disability',
            reversibility: 'irreversible',
            impactMagnitude: 'catastrophic',
          },
        ],
        domainSpecificSafetyPractices: ['Get second opinion'],
      };

      const careerDiscovery: RiskDiscovery = {
        domain: 'career',
        identifiedRisks: [
          {
            risk: 'Permanent reputation damage',
            reversibility: 'irreversible',
            impactMagnitude: 'severe',
          },
        ],
        domainSpecificSafetyPractices: ['Document everything'],
      };

      metaLearning.recordSession('session-1', 'health', healthDiscovery);
      metaLearning.recordSession('session-2', 'career', careerDiscovery);

      const enhanced = metaLearning.getEnhancedPrompts('Consider risks', 'financial', {
        problem: 'Decision with permanent consequences',
      });

      // Should find cross-domain patterns about permanence
      expect(enhanced.some(p => p.includes('other domains'))).toBe(true);
    });
  });

  describe('suggestDiscoveryQuestions', () => {
    it('should suggest questions for gaps in discovery', () => {
      // Build patterns
      const completeDiscovery: RiskDiscovery = {
        domain: 'financial',
        identifiedRisks: [
          { risk: 'Market crash', reversibility: 'difficult', impactMagnitude: 'severe' },
          { risk: 'Liquidity crisis', reversibility: 'reversible', impactMagnitude: 'moderate' },
          {
            risk: 'Counterparty default',
            reversibility: 'irreversible',
            impactMagnitude: 'severe',
          },
        ],
        domainSpecificSafetyPractices: ['Stress test portfolio', 'Maintain cash reserves'],
      };

      metaLearning.recordSession('session-1', 'financial', completeDiscovery);

      // Now check incomplete discovery
      const incompleteDiscovery: Partial<RiskDiscovery> = {
        identifiedRisks: [
          { risk: 'Market volatility', reversibility: 'reversible', impactMagnitude: 'moderate' },
        ],
      };

      const suggestions = metaLearning.suggestDiscoveryQuestions('financial', incompleteDiscovery);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(q => q.includes('considered'))).toBe(true);
    });
  });

  describe('assessDiscoveryCompleteness', () => {
    it('should assess completeness based on patterns', () => {
      // Build comprehensive pattern library
      const discoveries = [
        {
          risks: ['Liquidity risk', 'Market risk', 'Credit risk', 'Operational risk'],
          practices: ['VAR limits', 'Stress testing', 'Diversification'],
        },
        {
          risks: ['Systemic risk', 'Model risk', 'Concentration risk'],
          practices: ['Scenario analysis', 'Independent validation'],
        },
      ];

      discoveries.forEach((d, i) => {
        const discovery: RiskDiscovery = {
          domain: 'financial',
          identifiedRisks: d.risks.map(risk => ({
            risk,
            reversibility: 'difficult' as const,
            impactMagnitude: 'severe' as const,
          })),
          domainSpecificSafetyPractices: d.practices,
        };
        metaLearning.recordSession(`session-${i}`, 'financial', discovery);
      });

      // Test incomplete discovery
      const testDiscovery: RiskDiscovery = {
        domain: 'financial',
        identifiedRisks: [
          { risk: 'Market risk', reversibility: 'difficult', impactMagnitude: 'severe' },
        ],
        domainSpecificSafetyPractices: ['Basic diversification'],
      };

      const assessment = metaLearning.assessDiscoveryCompleteness('financial', testDiscovery);

      expect(assessment.completeness).toBeLessThan(0.5);
      expect(assessment.missingAreas.length).toBeGreaterThan(0);
      expect(assessment.confidence).toBeGreaterThan(0);
    });

    it('should handle new domains with low confidence', () => {
      const discovery: RiskDiscovery = {
        domain: 'space-exploration',
        identifiedRisks: [
          {
            risk: 'Equipment failure',
            reversibility: 'irreversible',
            impactMagnitude: 'catastrophic',
          },
        ],
        domainSpecificSafetyPractices: ['Triple redundancy'],
      };

      const assessment = metaLearning.assessDiscoveryCompleteness('space-exploration', discovery);

      expect(assessment.completeness).toBe(0.5); // Default for unknown domain
      expect(assessment.confidence).toBe(0); // No prior sessions
    });
  });

  describe('exportPatterns', () => {
    it('should export discovered patterns with statistics', () => {
      // Build pattern library
      const domains = ['financial', 'health', 'career'];
      domains.forEach(domain => {
        for (let i = 0; i < 3; i++) {
          const discovery: RiskDiscovery = {
            domain,
            identifiedRisks: [
              {
                risk: `${domain} risk ${i}`,
                reversibility: 'irreversible',
                impactMagnitude: 'severe',
              },
            ],
            domainSpecificSafetyPractices: [`${domain} practice ${i}`],
          };
          metaLearning.recordSession(`${domain}-${i}`, domain, discovery);
        }
      });

      const exported = metaLearning.exportPatterns();

      expect(exported.patterns.length).toBeGreaterThan(0);
      expect(exported.domainSummary).toBeDefined();
      expect(Object.keys(exported.domainSummary)).toHaveLength(3);

      Object.values(exported.domainSummary).forEach(summary => {
        expect(summary.patternCount).toBeGreaterThan(0);
        expect(summary.avgEffectiveness).toBeDefined();
        expect(summary.sessionCount).toBe(3);
      });
    });
  });

  describe('prunePatterns', () => {
    it('should remove old patterns', () => {
      const oldDiscovery: RiskDiscovery = {
        domain: 'financial',
        identifiedRisks: [
          { risk: 'Old risk pattern', reversibility: 'irreversible', impactMagnitude: 'severe' },
        ],
        domainSpecificSafetyPractices: [],
      };

      metaLearning.recordSession('old-session', 'financial', oldDiscovery);

      // Manually set pattern date to be old
      const patterns = metaLearning.exportPatterns();
      expect(patterns.patterns.length).toBe(1);

      // Prune with very short max age
      const pruned = metaLearning.prunePatterns({ maxAge: 0 });
      expect(pruned).toBe(1);

      const afterPrune = metaLearning.exportPatterns();
      expect(afterPrune.patterns.length).toBe(0);
    });

    it('should remove low effectiveness patterns', () => {
      // Create pattern with low effectiveness
      const discovery: RiskDiscovery = {
        domain: 'test',
        identifiedRisks: [
          { risk: 'Low value risk', reversibility: 'reversible', impactMagnitude: 'minor' },
        ],
        domainSpecificSafetyPractices: [],
      };

      metaLearning.recordSession('test-session', 'test', discovery);

      // Prune with high effectiveness threshold
      const pruned = metaLearning.prunePatterns({ minEffectiveness: 0.9 });
      expect(pruned).toBeGreaterThan(0);
    });

    it('should remove low frequency patterns', () => {
      const discovery: RiskDiscovery = {
        domain: 'rare',
        identifiedRisks: [
          { risk: 'Rare risk', reversibility: 'irreversible', impactMagnitude: 'moderate' },
        ],
        domainSpecificSafetyPractices: [],
      };

      metaLearning.recordSession('rare-session', 'rare', discovery);

      // Prune requiring minimum frequency
      const pruned = metaLearning.prunePatterns({ minFrequency: 5 });
      expect(pruned).toBe(1);
    });
  });
});
