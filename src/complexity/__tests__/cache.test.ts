import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComplexityCache } from '../cache.js';
import { CACHE_CONFIG } from '../constants.js';

describe('ComplexityCache', () => {
  let cache: ComplexityCache;

  beforeEach(() => {
    cache = new ComplexityCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve assessments', () => {
      const assessment = {
        level: 'high' as const,
        factors: ['Factor 1', 'Factor 2'],
        suggestion: 'Test suggestion',
      };

      cache.set('test problem', assessment, 'local-nlp');
      const retrieved = cache.get('test problem');

      expect(retrieved).toEqual(assessment);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should hash text consistently', () => {
      const assessment = { level: 'low' as const, factors: [] };
      
      // Same text with different casing and whitespace
      cache.set('  Test Problem  ', assessment, 'local-nlp');
      const result = cache.get('test problem');
      
      expect(result).toEqual(assessment);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict oldest entries when cache is full', () => {
      const assessment = { level: 'low' as const, factors: [] };
      
      // Fill cache to max size
      for (let i = 0; i < CACHE_CONFIG.MAX_SIZE; i++) {
        cache.set(`problem ${i}`, assessment, 'local-nlp');
      }
      
      // Add one more - should evict problem 0
      cache.set('new problem', assessment, 'local-nlp');
      
      expect(cache.get('problem 0')).toBeUndefined();
      expect(cache.get('new problem')).toEqual(assessment);
      expect(cache.getStats().size).toBe(CACHE_CONFIG.MAX_SIZE);
    });

    it('should update access order on get', () => {
      const assessment = { level: 'low' as const, factors: [] };
      
      // Add 3 items
      cache.set('problem 1', assessment, 'local-nlp');
      cache.set('problem 2', assessment, 'local-nlp');
      cache.set('problem 3', assessment, 'local-nlp');
      
      // Access problem 1 to move it to end
      cache.get('problem 1');
      
      // Fill cache
      for (let i = 4; i <= CACHE_CONFIG.MAX_SIZE; i++) {
        cache.set(`problem ${i}`, assessment, 'local-nlp');
      }
      
      // Add one more - should evict problem 2 (oldest unaccessed)
      cache.set('new problem', assessment, 'local-nlp');
      
      expect(cache.get('problem 1')).toEqual(assessment); // Still exists
      expect(cache.get('problem 2')).toBeUndefined(); // Evicted
      expect(cache.get('problem 3')).toEqual(assessment); // Still exists
    });
  });

  describe('TTL Expiration', () => {
    it('should expire entries after TTL', () => {
      const assessment = { level: 'high' as const, factors: ['Test'] };
      
      cache.set('test problem', assessment, 'local-nlp');
      
      // Advance time past TTL
      vi.advanceTimersByTime(CACHE_CONFIG.TTL_MS + 1000);
      
      const result = cache.get('test problem');
      expect(result).toBeUndefined();
    });

    it('should not expire entries before TTL', () => {
      const assessment = { level: 'high' as const, factors: ['Test'] };
      
      cache.set('test problem', assessment, 'local-nlp');
      
      // Advance time but not past TTL
      vi.advanceTimersByTime(CACHE_CONFIG.TTL_MS - 1000);
      
      const result = cache.get('test problem');
      expect(result).toEqual(assessment);
    });
  });

  describe('Statistics', () => {
    it('should track method distribution', () => {
      const assessment = { level: 'low' as const, factors: [] };
      
      cache.set('problem 1', assessment, 'local-nlp');
      cache.set('problem 2', assessment, 'mcp-sampling');
      cache.set('problem 3', assessment, 'fallback');
      cache.set('problem 4', assessment, 'local-nlp');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(4);
      expect(stats.methodDistribution['local-nlp']).toBe(2);
      expect(stats.methodDistribution['mcp-sampling']).toBe(1);
      expect(stats.methodDistribution['fallback']).toBe(1);
    });
  });

  describe('Clear Operation', () => {
    it('should clear all entries', () => {
      const assessment = { level: 'high' as const, factors: ['Test'] };
      
      cache.set('problem 1', assessment, 'local-nlp');
      cache.set('problem 2', assessment, 'local-nlp');
      
      cache.clear();
      
      expect(cache.get('problem 1')).toBeUndefined();
      expect(cache.get('problem 2')).toBeUndefined();
      expect(cache.getStats().size).toBe(0);
    });
  });
});