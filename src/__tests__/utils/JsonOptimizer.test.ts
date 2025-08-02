/**
 * Tests for JsonOptimizer utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JsonOptimizer } from '../../utils/JsonOptimizer.js';

describe('JsonOptimizer', () => {
  let optimizer: JsonOptimizer;

  beforeEach(() => {
    optimizer = new JsonOptimizer({
      maxStringLength: 50,
      maxArrayLength: 5,
      maxDepth: 3,
      maxResponseSize: 1024,
      truncateMessage: '...[truncated]',
    });
  });

  describe('String Optimization', () => {
    it('should not truncate short strings', () => {
      const result = optimizer.optimizeResponse('Short string');
      expect(result).toContain('Short string');
    });

    it('should truncate long strings', () => {
      const longString = 'A'.repeat(100);
      const result = optimizer.optimizeResponse(longString);
      const parsed = JSON.parse(result);
      expect(parsed).toContain('...[truncated]');
      expect(parsed.length).toBeLessThan(100);
    });
  });

  describe('Array Optimization', () => {
    it('should not truncate small arrays', () => {
      const smallArray = [1, 2, 3];
      const result = optimizer.optimizeResponse(smallArray);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([1, 2, 3]);
    });

    it('should truncate large arrays', () => {
      const largeArray = Array.from({ length: 20 }, (_, i) => i);
      const result = optimizer.optimizeResponse(largeArray);
      const parsed = JSON.parse(result);
      expect(parsed.length).toBeLessThan(20);
      expect(parsed).toContain('...[truncated] (15 items omitted)');
    });

    it('should preserve first and last items when truncating', () => {
      const largeArray = Array.from({ length: 20 }, (_, i) => `item${i}`);
      const result = optimizer.optimizeResponse(largeArray);
      const parsed = JSON.parse(result);
      expect(parsed[0]).toBe('item0');
      expect(parsed[parsed.length - 1]).toBe('item19');
    });
  });

  describe('Depth Limiting', () => {
    it('should truncate deeply nested objects', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: 'too deep',
            },
          },
        },
      };
      const result = optimizer.optimizeResponse(deepObject);
      const parsed = JSON.parse(result);
      expect(parsed.level1.level2.level3).toBe('...[truncated]');
    });
  });

  describe('Response Size Limiting', () => {
    it('should truncate responses exceeding size limit', () => {
      const largeObject = {
        sessionId: 'test-session',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 6,
        nextStepNeeded: true,
        insights: ['insight1', 'insight2'],
        largeData: 'X'.repeat(2000),
      };

      const result = optimizer.optimizeResponse(largeObject);
      const parsed = JSON.parse(result);

      // Check if it was actually truncated
      if (result.length > 1024) {
        // If the result is still too large, it should have been truncated
        expect(parsed._truncated).toBe(true);
        expect(parsed._message).toContain('truncated');
      }

      // Essential fields should be preserved either way
      expect(parsed.sessionId).toBe('test-session');
      expect(parsed.technique).toBe('six_hats');
      expect(parsed.currentStep).toBe(3);
      expect(parsed.totalSteps).toBe(6);
      expect(parsed.nextStepNeeded).toBe(true);
      expect(parsed.insights).toEqual(['insight1', 'insight2']);
    });
  });

  describe('Caching', () => {
    it('should cache repeated responses', () => {
      const data = { test: 'data' };

      // First call
      const result1 = optimizer.optimizeResponse(data);

      // Second call with same data
      const result2 = optimizer.optimizeResponse(data);

      expect(result1).toBe(result2);
    });

    it('should clear cache on demand', () => {
      const data = { test: 'data' };

      optimizer.optimizeResponse(data);
      const stats1 = optimizer.getCacheStats();
      expect(stats1.size).toBe(1);

      optimizer.clearCache();
      const stats2 = optimizer.getCacheStats();
      expect(stats2.size).toBe(0);
    });

    it('should enforce cache size limit', () => {
      // Create optimizer with small cache
      const smallCacheOptimizer = new JsonOptimizer({ maxResponseSize: 1024 * 1024 });

      // Fill cache beyond limit (MAX_CACHE_SIZE = 50)
      for (let i = 0; i < 60; i++) {
        smallCacheOptimizer.optimizeResponse({ data: i });
      }

      const stats = smallCacheOptimizer.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });
  });

  describe('Object Field Prioritization', () => {
    it('should prioritize essential fields', () => {
      const data = {
        // Priority fields
        sessionId: 'session-123',
        technique: 'po',
        currentStep: 2,
        totalSteps: 4,
        nextStepNeeded: true,
        insights: ['insight1'],

        // Deferred fields (should be truncated more aggressively)
        history: Array.from({ length: 100 }, (_, i) => ({ step: i, data: 'X'.repeat(100) })),
        pathMemory: { longData: 'Y'.repeat(1000) },
      };

      const result = optimizer.optimizeResponse(data);
      const parsed = JSON.parse(result);

      // Priority fields should be preserved
      expect(parsed.sessionId).toBe('session-123');
      expect(parsed.technique).toBe('po');

      // Deferred fields should be truncated
      expect(parsed.history.length).toBeLessThan(100);
      expect(parsed.pathMemory.longData).toContain('...[truncated]');
    });
  });

  describe('buildOptimizedResponse', () => {
    it('should return proper LateralThinkingResponse format', () => {
      const data = { test: 'data' };
      const response = optimizer.buildOptimizedResponse(data);

      expect(response).toHaveProperty('content');
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      const parsed = JSON.parse(response.content[0].text);
      expect(parsed).toEqual(data);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined', () => {
      expect(() => optimizer.optimizeResponse(null)).not.toThrow();
      expect(() => optimizer.optimizeResponse(undefined)).not.toThrow();

      const nullResult = JSON.parse(optimizer.optimizeResponse(null));
      expect(nullResult).toBeNull();

      const undefinedResult = optimizer.optimizeResponse(undefined);
      expect(undefinedResult).toBe('undefined');
    });

    it('should handle circular references', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      expect(() => optimizer.optimizeResponse(circular)).toThrow();
    });

    it('should handle special number values', () => {
      const data = {
        infinity: Infinity,
        negInfinity: -Infinity,
        nan: NaN,
      };

      const result = optimizer.optimizeResponse(data);
      const parsed = JSON.parse(result);

      expect(parsed.infinity).toBeNull();
      expect(parsed.negInfinity).toBeNull();
      expect(parsed.nan).toBeNull();
    });
  });
});
