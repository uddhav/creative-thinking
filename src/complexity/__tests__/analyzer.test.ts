import { describe, it, expect, beforeEach } from 'vitest';
import { HybridComplexityAnalyzer } from '../analyzer.js';
import { COMPLEXITY_THRESHOLDS } from '../constants.js';

describe('HybridComplexityAnalyzer', () => {
  let analyzer: HybridComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new HybridComplexityAnalyzer();
    // Clear cache before each test
    analyzer.clearCache();
  });

  describe('Basic Functionality', () => {
    it('should analyze simple problems as low complexity', async () => {
      const result = await analyzer.analyze('How do I print hello world in Python?');
      
      expect(result.level).toBe('low');
      expect(result.factors.length).toBeLessThan(COMPLEXITY_THRESHOLDS.DISCOVERY.MEDIUM);
      expect(result.suggestion).toBeUndefined();
    });

    it('should analyze complex problems with multiple interacting elements', async () => {
      const complexProblem = `
        We have multiple teams working on interconnected systems that depend on each other.
        The stakeholders have conflicting requirements and the timeline is very tight.
        The system architecture is complex with many moving parts that interact dynamically.
      `;
      
      const result = await analyzer.analyze(complexProblem);
      
      expect(result.level).toBe('high');
      expect(result.factors.length).toBeGreaterThanOrEqual(COMPLEXITY_THRESHOLDS.DISCOVERY.HIGH);
      expect(result.suggestion).toContain('high complexity');
    });

    it('should detect conflicting requirements', async () => {
      const problem = 'The design needs to be both minimalist and feature-rich, which creates conflicting goals';
      
      const result = await analyzer.analyze(problem);
      
      expect(result.factors.some(f => f.includes('Conflicting'))).toBe(true);
    });

    it('should detect uncertainty', async () => {
      const problem = 'The market is uncertain and requirements keep changing dynamically';
      
      const result = await analyzer.analyze(problem);
      
      expect(result.factors.some(f => f.includes('uncertainty'))).toBe(true);
    });

    it('should detect multiple stakeholders', async () => {
      const problem = 'Multiple diverse stakeholders have different needs and expectations';
      
      const result = await analyzer.analyze(problem);
      
      expect(result.factors.some(f => f.includes('stakeholder'))).toBe(true);
    });

    it('should detect time pressure', async () => {
      const problem = 'We have an urgent deadline and are under significant time pressure';
      
      const result = await analyzer.analyze(problem);
      
      expect(result.factors.some(f => f.includes('Time pressure'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const result = await analyzer.analyze('');
      
      expect(result.level).toBe('low');
      expect(result.factors).toEqual([]);
    });

    it('should handle very short input', async () => {
      const result = await analyzer.analyze('Fix bug');
      
      expect(result.level).toBe('low');
    });

    it('should handle very long input by truncating', async () => {
      const veryLongText = 'complex problem '.repeat(1000);
      
      // Should complete without throwing
      const result = await analyzer.analyze(veryLongText);
      
      expect(result).toBeDefined();
      expect(result.level).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache results for identical inputs', async () => {
      const problem = 'This is a test problem with multiple interacting systems';
      
      // First call
      const result1 = await analyzer.analyze(problem);
      
      // Second call should be cached
      const result2 = await analyzer.analyze(problem);
      
      expect(result1).toEqual(result2);
      
      // Check cache stats
      const stats = analyzer.getCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should not cache when useCache is false', async () => {
      const problem = 'Test problem';
      
      await analyzer.analyze(problem, false);
      
      const stats = analyzer.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('NLP Pattern Detection', () => {
    it('should use word boundaries for pattern matching', async () => {
      // 'multiples' should not match 'multiple'
      const result1 = await analyzer.analyze('We have multiples of the same item');
      expect(result1.factors.some(f => f.includes('Multiple interacting'))).toBe(false);
      
      // 'multiple' should match
      const result2 = await analyzer.analyze('We have multiple systems that interact');
      expect(result2.factors.some(f => f.includes('Multiple interacting'))).toBe(true);
    });

    it('should detect complex sentence structures', async () => {
      const complexSentence = 'Given that the system architecture involves multiple interconnected ' +
        'microservices, each with their own database and caching layer, and considering the ' +
        'need for real-time synchronization across geographically distributed data centers, ' +
        'we must carefully design the communication protocols.';
      
      const result = await analyzer.analyze(complexSentence);
      
      expect(result.factors.some(f => f.includes('Complex problem structure'))).toBe(true);
    });
  });

  describe('Confidence Scoring', () => {
    it('should have lower confidence for very short text', async () => {
      // We can't directly access confidence, but short text should result in simpler analysis
      const shortResult = await analyzer.analyze('Fix');
      const longResult = await analyzer.analyze('We need to fix the complex system architecture issues');
      
      // Short text should have fewer detected patterns
      expect(shortResult.factors.length).toBeLessThan(longResult.factors.length);
    });
  });
});