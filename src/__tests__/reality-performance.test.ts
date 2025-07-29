/**
 * Performance and edge case tests for Reality Assessment Module
 */

import { describe, it, expect } from 'vitest';
import { RealityAssessor } from '../reality/index.js';
import { RealityIntegration } from '../reality/integration.js';

describe('Reality Assessment - Performance', () => {
  describe('Pattern Matching Performance', () => {
    it('should handle large text inputs efficiently', () => {
      const largeIdea = 'Create a system that '.repeat(100) + 'with perpetual motion';
      const largeContext = 'Technical requirements include '.repeat(100);
      
      const startTime = performance.now();
      const assessment = RealityAssessor.assess(largeIdea, largeContext, 'technology');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10); // Should complete in under 10ms
      expect(assessment.possibilityLevel).toBe('breakthrough-required');
      expect(assessment.impossibilityType).toBe('physical');
    });

    it('should handle 1000 assessments efficiently', () => {
      const ideas = [
        'Create perpetual motion machine',
        'Build faster than light travel',
        'Develop new software system',
        'Implement tax loss harvesting',
        'Create matter from nothing',
      ];
      
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        const idea = ideas[i % ideas.length];
        RealityAssessor.assess(idea, 'Innovation context', 'technology');
      }
      const endTime = performance.now();
      
      const avgTime = (endTime - startTime) / 1000;
      expect(avgTime).toBeLessThan(1); // Average under 1ms per assessment
    });
  });

  describe('Domain Detection Caching', () => {
    it('should cache domain detection results', () => {
      const problem = 'Implement advanced trading strategy';
      const context = 'Investment portfolio optimization';
      
      // First call - no cache
      const startTime1 = performance.now();
      const domain1 = RealityIntegration.detectDomain(problem, context);
      const endTime1 = performance.now();
      const firstCallTime = endTime1 - startTime1;
      
      // Second call - should hit cache
      const startTime2 = performance.now();
      const domain2 = RealityIntegration.detectDomain(problem, context);
      const endTime2 = performance.now();
      const secondCallTime = endTime2 - startTime2;
      
      expect(domain1).toBe('finance');
      expect(domain2).toBe('finance');
      expect(secondCallTime).toBeLessThan(firstCallTime * 0.5); // Cache should be at least 2x faster
    });

    it('should handle cache size limits', () => {
      // Generate 150 unique problem/context pairs (exceeds 100 cache limit)
      const domains: (string | undefined)[] = [];
      
      for (let i = 0; i < 150; i++) {
        const problem = `Problem ${i}: ${i % 3 === 0 ? 'medical' : i % 3 === 1 ? 'software' : 'investment'}`;
        const domain = RealityIntegration.detectDomain(problem);
        domains.push(domain);
      }
      
      // Cache should still work for recent entries
      const recentProblem = 'Problem 149: investment';
      const cachedDomain = RealityIntegration.detectDomain(recentProblem);
      expect(cachedDomain).toBe('finance');
    });
  });
});

describe('Reality Assessment - Edge Cases', () => {
  describe('Malformed Inputs', () => {
    it('should handle empty strings gracefully', () => {
      const assessment = RealityAssessor.assess('', '', undefined);
      expect(assessment.possibilityLevel).toBe('feasible');
      expect(assessment.confidenceLevel).toBeGreaterThan(0);
    });

    it('should handle very long strings without crashing', () => {
      const veryLongIdea = 'a'.repeat(10000);
      const assessment = RealityAssessor.assess(veryLongIdea, 'context');
      expect(assessment).toBeDefined();
      expect(assessment.possibilityLevel).toBeDefined();
    });

    it('should handle special characters and unicode', () => {
      const specialIdea = '🚀 Create perpetual motion with ñ€∑ƒ©';
      const assessment = RealityAssessor.assess(specialIdea, 'context');
      expect(assessment.possibilityLevel).toBe('breakthrough-required');
    });

    it('should handle null/undefined domain gracefully', () => {
      const assessment = RealityAssessor.assess(
        'tax loss harvesting strategy',
        'finance context',
        undefined
      );
      expect(assessment).toBeDefined();
      expect(assessment.possibilityLevel).toBe('feasible');
    });
  });

  describe('Session Reality Analysis Edge Cases', () => {
    it('should handle empty output arrays', () => {
      const analysis = RealityIntegration.analyzeSessionReality([]);
      expect(analysis.feasibilityTrend).toBe('stable');
      expect(analysis.breakthroughsNeeded.size).toBe(0);
      expect(analysis.commonBarriers.size).toBe(0);
    });

    it('should handle outputs without assessments', () => {
      const outputs = [
        { output: 'Solution 1' },
        { output: 'Solution 2' },
        { output: 'Solution 3' },
      ];
      const analysis = RealityIntegration.analyzeSessionReality(outputs);
      expect(analysis.feasibilityTrend).toBe('stable');
    });

    it('should handle single assessment correctly', () => {
      const outputs = [
        {
          output: 'Perpetual motion solution',
          assessment: {
            possibilityLevel: 'breakthrough-required' as const,
            impossibilityType: 'physical' as const,
            confidenceLevel: 0.9,
            breakthroughsRequired: ['New physics'],
          },
        },
      ];
      const analysis = RealityIntegration.analyzeSessionReality(outputs);
      expect(analysis.feasibilityTrend).toBe('stable');
      expect(analysis.breakthroughsNeeded.size).toBe(0); // Need at least 2 for trend
    });
  });

  describe('Complex Pattern Combinations', () => {
    it('should detect multiple impossibility types in one idea', () => {
      const complexIdea = 'Create perpetual motion machine to generate unlimited money without regulatory approval';
      const assessment = RealityAssessor.assess(complexIdea, 'Complex problem', 'finance');
      
      // Should detect physical law violation as primary issue
      expect(assessment.possibilityLevel).toBe('breakthrough-required');
      expect(assessment.impossibilityType).toBe('physical');
    });

    it('should handle contradictory requirements', () => {
      const contradictory = 'Build a system that is both completely open and completely closed';
      const assessment = RealityAssessor.assess(contradictory, 'System design');
      
      expect(assessment.possibilityLevel).toBe('impossible');
      expect(assessment.impossibilityType).toBe('logical');
    });

    it('should handle edge case patterns correctly', () => {
      // Test pattern with spaces
      const idea1 = 'Create    perpetual    motion    device';
      const assessment1 = RealityAssessor.assess(idea1, 'Engineering');
      expect(assessment1.impossibilityType).toBe('physical');
      
      // Test case sensitivity
      const idea2 = 'PERPETUAL MOTION MACHINE';
      const assessment2 = RealityAssessor.assess(idea2, 'Engineering');
      expect(assessment2.impossibilityType).toBe('physical');
      
      // Test partial matches - should match due to "perpetual motion" substring
      const idea3 = 'study of non-perpetual systems';
      const assessment3 = RealityAssessor.assess(idea3, 'Engineering');
      expect(assessment3.possibilityLevel).toBe('feasible'); // Should not match perpetual motion
    });
  });

  describe('Breakthrough Strategy Edge Cases', () => {
    it('should handle analysis with no barriers', () => {
      const analysis = {
        feasibilityTrend: 'stable' as const,
        breakthroughsNeeded: new Set<string>(),
        commonBarriers: new Map<string, number>(),
      };
      const strategy = RealityIntegration.generateBreakthroughStrategy(analysis);
      expect(strategy).toBeDefined();
      expect(strategy).not.toContain('undefined');
    });

    it('should handle analysis with many breakthroughs', () => {
      const breakthroughs = new Set<string>();
      for (let i = 0; i < 10; i++) {
        breakthroughs.add(`Breakthrough ${i}`);
      }
      
      const analysis = {
        feasibilityTrend: 'declining' as const,
        breakthroughsNeeded: breakthroughs,
        commonBarriers: new Map([['technical', 5]]),
      };
      
      const strategy = RealityIntegration.generateBreakthroughStrategy(analysis);
      expect(strategy).toContain('Key Breakthroughs Needed');
      // Should limit to top 5
      expect((strategy.match(/\d\./g) || []).length).toBeLessThanOrEqual(5);
    });
  });
});