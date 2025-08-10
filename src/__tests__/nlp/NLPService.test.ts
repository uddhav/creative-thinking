/**
 * Tests for the centralized NLP Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NLPService } from '../../nlp/NLPService.js';

describe('NLPService', () => {
  let nlpService: NLPService;

  beforeEach(() => {
    nlpService = NLPService.getInstance();
    nlpService.clearCache();
  });

  describe('analyzeText', () => {
    it('should extract entities correctly', () => {
      const text =
        'John Smith from Microsoft is working with Sarah Johnson from Google on a new project';
      const analysis = nlpService.analyzeText(text);

      expect(analysis.people).toContain('John Smith');
      expect(analysis.people).toContain('Sarah Johnson');
      expect(analysis.organizations).toContain('Microsoft');
      expect(analysis.organizations).toContain('Google');
    });

    it('should detect negations', () => {
      const text = 'We should not implement this feature. It cannot work with the current system.';
      const analysis = nlpService.analyzeText(text);

      expect(analysis.negations).toHaveLength(2);
      expect(analysis.negations[0].phrase).toBe('not');
      expect(analysis.negations[1].phrase).toBe('cannot');
    });

    it('should extract conditionals', () => {
      const text = 'If we increase the budget, then we can hire more developers.';
      const analysis = nlpService.analyzeText(text);

      expect(analysis.conditionals).toHaveLength(1);
      expect(analysis.conditionals[0].condition).toContain('increase the budget');
      expect(analysis.conditionals[0].consequence).toContain('hire more developers');
    });

    it('should detect temporal expressions', () => {
      const text = 'The deadline is tomorrow. We need to finish this urgent task soon.';
      const analysis = nlpService.analyzeText(text);

      expect(analysis.temporalExpressions).toContain('deadline');
      expect(analysis.temporalExpressions).toContain('tomorrow');
      expect(analysis.temporalExpressions).toContain('urgent');
      expect(analysis.temporalExpressions).toContain('soon');
    });

    it('should analyze sentiment', () => {
      const positiveText = 'This is a great solution that will achieve excellent results.';
      const negativeText = 'This is a poor approach that will fail and cause problems.';
      const mixedText = 'This has good potential but also significant issues.';

      expect(nlpService.analyzeText(positiveText).sentiment).toBe('positive');
      expect(nlpService.analyzeText(negativeText).sentiment).toBe('negative');
      expect(nlpService.analyzeText(mixedText).sentiment).toBe('mixed');
    });
  });

  describe('detectParadox', () => {
    it('should detect explicit paradoxes', () => {
      const text = 'We need to create a paradox where we both expand and contract simultaneously.';
      const result = nlpService.detectParadox(text);

      expect(result.hasParadox).toBe(true);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          type: 'opposition',
          pattern: 'paradox',
          confidence: 0.9,
        })
      );
    });

    it('should detect contradictory requirements', () => {
      const text = 'The system must be both completely open and fully secure.';
      const result = nlpService.detectParadox(text);

      expect(result.hasParadox).toBe(true);
      expect(result.patterns.length).toBeGreaterThan(0);
    });

    it('should detect antonym conflicts', () => {
      const text = 'We need to increase efficiency while we decrease productivity.';
      const result = nlpService.detectParadox(text);

      expect(result.hasParadox).toBe(true);
      // Should detect the increase/decrease antonym pair
      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          type: 'antonym',
          pattern: 'increase vs decrease',
        })
      );
    });

    it('should detect conditional contradictions', () => {
      const text =
        'If we reduce costs, then profits increase. If we do not reduce costs, then profits also increase.';
      const result = nlpService.detectParadox(text);

      expect(result.hasParadox).toBe(true);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          type: 'conditional',
          pattern: 'contradictory conditions with same outcome',
        })
      );
    });

    it('should not detect false paradoxes in time conflicts', () => {
      const text = 'We have conflicting deadlines for the project.';
      const result = nlpService.detectParadox(text);

      // This should not be considered a true paradox
      expect(result.hasParadox).toBe(false);
    });
  });

  describe('detectComplexity', () => {
    it('should detect simple problems', () => {
      const text = 'Fix the typo in the header.';
      const result = nlpService.detectComplexity(text);

      expect(result.isComplex).toBe(false);
      expect(result.score).toBeLessThan(0.3);
    });

    it('should detect complex problems with multiple factors', () => {
      const text = `
        We need to redesign the entire system architecture to handle multiple stakeholders
        including customers, vendors, and partners. If we change the database, then we must
        update all APIs. However, if we don't change it, performance will degrade. The team
        is uncertain about the best approach given the tight deadline and budget constraints.
      `;
      const result = nlpService.detectComplexity(text);

      expect(result.isComplex).toBe(true);
      expect(result.factors).toContain('multiple interacting elements');
      expect(result.factors).toContain('multiple conditions');
      expect(result.score).toBeGreaterThan(0.3);
    });

    it('should detect complexity from relationships', () => {
      const text = `
        The frontend depends on the API which connects to the database that syncs with
        the cache which updates the CDN that serves the users who interact with the frontend.
      `;
      const result = nlpService.detectComplexity(text);

      expect(result.isComplex).toBe(true);
      expect(result.factors).toContain('multiple relationships');
    });

    it('should detect uncertainty as complexity', () => {
      const text =
        'How should we approach this? What are the risks? When will we know if it works?';
      const result = nlpService.detectComplexity(text);

      expect(result.factors).toContain('uncertainty/questions');
    });
  });

  describe('caching', () => {
    it('should cache results', () => {
      const text = 'This is a test sentence for caching.';

      // First call
      const result1 = nlpService.analyzeText(text);

      // Second call should return cached result
      const result2 = nlpService.analyzeText(text);

      expect(result1).toEqual(result2);
    });

    it('should respect cache option', () => {
      const text = 'This text should not be cached.';

      const result1 = nlpService.analyzeText(text, { cacheResults: false });
      const result2 = nlpService.analyzeText(text, { cacheResults: false });

      // Results should be equivalent but not the same object
      expect(result1).toEqual(result2);
    });
  });

  describe('input validation', () => {
    it('should handle empty text', () => {
      expect(() => nlpService.analyzeText('')).toThrow('Empty text after cleaning');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(15000);
      const analysis = nlpService.analyzeText(longText);

      // Should truncate to max length
      expect(analysis.wordCount).toBeLessThan(15000);
    });

    it('should handle special characters', () => {
      const text = 'This <script>alert("test")</script> should be cleaned.';
      const analysis = nlpService.analyzeText(text);

      // Should handle gracefully
      expect(analysis.wordCount).toBeGreaterThan(0);
    });
  });
});
