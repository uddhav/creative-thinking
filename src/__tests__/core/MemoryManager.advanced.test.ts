/**
 * Advanced tests for MemoryManager
 * Focuses on uncovered functionality and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryManager } from '../../core/MemoryManager.js';

describe('MemoryManager - Advanced Tests', () => {
  let originalGc: any;

  beforeEach(() => {
    // Reset singleton instance before each test
    (MemoryManager as any).instance = undefined;

    // Store original gc function
    originalGc = (global as any).gc;
  });

  afterEach(() => {
    // Restore original gc function
    (global as any).gc = originalGc;

    // Clean up singleton
    (MemoryManager as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MemoryManager.getInstance();
      const instance2 = MemoryManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should use provided config on first instantiation', () => {
      const onGCTriggered = vi.fn();
      const manager = MemoryManager.getInstance({
        gcThreshold: 0.5,
        enableGC: false,
        onGCTriggered,
      });

      // Access private config to verify
      expect((manager as any).config.gcThreshold).toBe(0.5);
      expect((manager as any).config.enableGC).toBe(false);
      expect((manager as any).config.onGCTriggered).toBe(onGCTriggered);
    });

    it('should ignore config on subsequent calls', () => {
      const manager1 = MemoryManager.getInstance({ gcThreshold: 0.5 });
      const manager2 = MemoryManager.getInstance({ gcThreshold: 0.9 });

      // Both should have the same config (from first call)
      expect((manager1 as any).config.gcThreshold).toBe(0.5);
      expect((manager2 as any).config.gcThreshold).toBe(0.5);
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should return memory usage in bytes', () => {
      const manager = MemoryManager.getInstance();
      const usage = manager.getMemoryUsage();

      expect(usage).toHaveProperty('heapUsed');
      expect(usage).toHaveProperty('heapTotal');
      expect(usage).toHaveProperty('rss');
      expect(usage).toHaveProperty('external');
      expect(usage).toHaveProperty('arrayBuffers');

      expect(typeof usage.heapUsed).toBe('number');
      expect(typeof usage.heapTotal).toBe('number');
      expect(typeof usage.rss).toBe('number');
      expect(usage.heapUsed).toBeGreaterThan(0);
      expect(usage.heapTotal).toBeGreaterThan(0);
      expect(usage.rss).toBeGreaterThan(0);
    });

    it('should return memory usage in megabytes', () => {
      const manager = MemoryManager.getInstance();
      const usageMB = manager.getMemoryUsageMB();

      expect(usageMB).toHaveProperty('heapUsed');
      expect(usageMB).toHaveProperty('heapTotal');
      expect(usageMB).toHaveProperty('rss');

      // Should be smaller numbers than bytes
      const usageBytes = manager.getMemoryUsage();
      expect(usageMB.heapUsed).toBeLessThan(usageBytes.heapUsed);
      expect(usageMB.heapTotal).toBeLessThan(usageBytes.heapTotal);
      expect(usageMB.rss).toBeLessThan(usageBytes.rss);

      // Should be positive integers
      expect(Number.isInteger(usageMB.heapUsed)).toBe(true);
      expect(Number.isInteger(usageMB.heapTotal)).toBe(true);
      expect(Number.isInteger(usageMB.rss)).toBe(true);
    });
  });

  describe('Garbage Collection', () => {
    it('should detect when GC is not available', () => {
      (global as any).gc = undefined;
      const manager = MemoryManager.getInstance();

      expect(manager.isGCAvailable()).toBe(false);
    });

    it('should detect when GC is available', () => {
      (global as any).gc = vi.fn();
      const manager = MemoryManager.getInstance();

      expect(manager.isGCAvailable()).toBe(true);
    });

    it('should not trigger GC when disabled', () => {
      (global as any).gc = vi.fn();
      const manager = MemoryManager.getInstance({ enableGC: false });

      const result = manager.triggerGCIfNeeded(true);

      expect(result).toBe(false);
      expect((global as any).gc).not.toHaveBeenCalled();
    });

    it('should not trigger GC when not available', () => {
      (global as any).gc = undefined;
      const manager = MemoryManager.getInstance({ enableGC: true });

      const result = manager.triggerGCIfNeeded(true);

      expect(result).toBe(false);
    });

    it('should trigger GC when forced', () => {
      const gcMock = vi.fn();
      const onGCTriggeredMock = vi.fn();
      (global as any).gc = gcMock;

      const manager = MemoryManager.getInstance({
        enableGC: true,
        onGCTriggered: onGCTriggeredMock,
      });

      const result = manager.triggerGCIfNeeded(true);

      expect(result).toBe(true);
      expect(gcMock).toHaveBeenCalledOnce();
      expect(onGCTriggeredMock).toHaveBeenCalledOnce();
    });

    it('should trigger GC when heap usage exceeds threshold', () => {
      const gcMock = vi.fn();
      (global as any).gc = gcMock;

      const manager = MemoryManager.getInstance({
        enableGC: true,
        gcThreshold: 0.1, // Very low threshold to ensure it triggers
      });

      const result = manager.triggerGCIfNeeded();

      expect(result).toBe(true);
      expect(gcMock).toHaveBeenCalledOnce();
    });

    it('should not trigger GC when heap usage is below threshold', () => {
      const gcMock = vi.fn();
      (global as any).gc = gcMock;

      const manager = MemoryManager.getInstance({
        enableGC: true,
        gcThreshold: 0.99, // Very high threshold
      });

      const result = manager.triggerGCIfNeeded();

      expect(result).toBe(false);
      expect(gcMock).not.toHaveBeenCalled();
    });

    it('should handle GC errors gracefully', () => {
      const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global as any).gc = vi.fn().mockImplementation(() => {
        throw new Error('GC failed');
      });

      const manager = MemoryManager.getInstance({ enableGC: true });

      const result = manager.triggerGCIfNeeded(true);

      expect(result).toBe(false);
      expect(errorMock).toHaveBeenCalledWith(
        '[MemoryManager] Failed to trigger GC:',
        expect.any(Error)
      );

      errorMock.mockRestore();
    });

    it('should handle when gc is not a function', () => {
      (global as any).gc = 'not-a-function';

      const manager = MemoryManager.getInstance({ enableGC: true });

      const result = manager.triggerGCIfNeeded(true);

      expect(result).toBe(false);
    });
  });

  describe('Object Size Estimation', () => {
    it('should estimate size of null', () => {
      const manager = MemoryManager.getInstance();
      expect(manager.estimateObjectSize(null)).toBe(4);
    });

    it('should estimate size of primitives', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.estimateObjectSize(true)).toBe(4);
      expect(manager.estimateObjectSize(false)).toBe(4);
      expect(manager.estimateObjectSize(42)).toBe(8);
      expect(manager.estimateObjectSize(3.14)).toBe(8);
      expect(manager.estimateObjectSize(undefined)).toBe(0);
    });

    it('should estimate size of strings', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.estimateObjectSize('')).toBe(0);
      expect(manager.estimateObjectSize('a')).toBe(2); // UTF-16
      expect(manager.estimateObjectSize('hello')).toBe(10); // 5 * 2
      expect(manager.estimateObjectSize('🎉')).toBe(4); // Emoji takes 2 chars
    });

    it('should estimate size of symbols and functions', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.estimateObjectSize(Symbol('test'))).toBe(0);
      expect(manager.estimateObjectSize(() => {})).toBe(0);
      expect(manager.estimateObjectSize(function test() {})).toBe(0);
    });

    it('should estimate size of arrays', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.estimateObjectSize([])).toBe(8); // Array overhead
      expect(manager.estimateObjectSize([1, 2, 3])).toBe(8 + 3 * 8); // overhead + 3 numbers
      expect(manager.estimateObjectSize(['a', 'bc'])).toBe(8 + 2 + 4); // overhead + strings
    });

    it('should estimate size of objects', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.estimateObjectSize({})).toBe(8); // Object overhead
      expect(manager.estimateObjectSize({ a: 1 })).toBe(8 + 2 + 8); // overhead + key + value
      expect(manager.estimateObjectSize({ name: 'test', age: 30 })).toBe(
        8 + // object overhead
          8 +
          8 + // 'name' key + 'test' value
          6 +
          8 // 'age' key + 30 value
      );
    });

    it('should handle Date objects', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.estimateObjectSize(new Date())).toBe(8);
    });

    it('should handle RegExp objects', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.estimateObjectSize(/test/)).toBe(8); // 'test' = 4 * 2
      expect(manager.estimateObjectSize(/hello world/gi)).toBe(22); // 'hello world' = 11 * 2
    });

    it('should handle circular references', () => {
      const manager = MemoryManager.getInstance();

      const obj: any = { a: 1 };
      obj.self = obj; // Circular reference

      // Should not throw and should handle circular reference
      const size = manager.estimateObjectSize(obj);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(100); // Should not infinitely recurse
    });

    it('should handle nested objects', () => {
      const manager = MemoryManager.getInstance();

      const nested = {
        level1: {
          level2: {
            level3: 'deep',
          },
        },
      };

      const size = manager.estimateObjectSize(nested);
      expect(size).toBeGreaterThan(30); // Multiple objects and strings
    });

    it('should handle objects with inherited properties', () => {
      const manager = MemoryManager.getInstance();

      class TestClass {
        inherited = 'value';
      }

      const obj = new TestClass();
      (obj as any).own = 'property';

      const size = manager.estimateObjectSize(obj);
      expect(size).toBeGreaterThan(8); // Should include both properties
    });

    it('should handle unknown types gracefully', () => {
      const manager = MemoryManager.getInstance();

      // Create an object with a weird type
      const weirdObj = Object.create(null);
      Object.defineProperty(weirdObj, Symbol.toStringTag, {
        get() {
          return 'WeirdType';
        },
      });

      // Should not throw
      const size = manager.estimateObjectSize(weirdObj);
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Byte Formatting', () => {
    it('should format zero bytes', () => {
      const manager = MemoryManager.getInstance();
      expect(manager.formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.formatBytes(1)).toBe('1 Bytes');
      expect(manager.formatBytes(500)).toBe('500 Bytes');
      expect(manager.formatBytes(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.formatBytes(1024)).toBe('1 KB');
      expect(manager.formatBytes(1536)).toBe('1.5 KB');
      expect(manager.formatBytes(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.formatBytes(1048576)).toBe('1 MB');
      expect(manager.formatBytes(1572864)).toBe('1.5 MB');
      expect(manager.formatBytes(5242880)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.formatBytes(1073741824)).toBe('1 GB');
      expect(manager.formatBytes(2147483648)).toBe('2 GB');
      expect(manager.formatBytes(5368709120)).toBe('5 GB');
    });

    it('should round to 2 decimal places', () => {
      const manager = MemoryManager.getInstance();

      expect(manager.formatBytes(1234)).toBe('1.21 KB');
      expect(manager.formatBytes(1234567)).toBe('1.18 MB');
      expect(manager.formatBytes(1234567890)).toBe('1.15 GB');
    });

    it('should handle negative values', () => {
      const manager = MemoryManager.getInstance();

      // The implementation doesn't explicitly handle negatives,
      // but Math.log of negative returns NaN
      const result = manager.formatBytes(-1024);
      expect(result).toMatch(/Bytes|NaN/); // Will either be "NaN Bytes" or handle it somehow
    });
  });

  describe('Integration Tests', () => {
    it('should work with real memory monitoring scenario', () => {
      const manager = MemoryManager.getInstance();

      // Allocate some memory
      const bigArray = new Array(1000000).fill('test');

      const usage1 = manager.getMemoryUsage();
      const usageMB1 = manager.getMemoryUsageMB();

      // Memory should be allocated
      expect(usage1.heapUsed).toBeGreaterThan(1000000);
      expect(usageMB1.heapUsed).toBeGreaterThan(1);

      // Estimate the array size
      const estimatedSize = manager.estimateObjectSize(bigArray);
      expect(estimatedSize).toBeGreaterThan(1000000);

      // Format the size
      const formattedSize = manager.formatBytes(estimatedSize);
      expect(formattedSize).toMatch(/MB/);
    });

    it('should trigger GC callback when threshold exceeded', () => {
      const gcMock = vi.fn();
      const callbackMock = vi.fn();
      (global as any).gc = gcMock;

      const manager = MemoryManager.getInstance({
        enableGC: true,
        gcThreshold: 0.01, // Very low threshold
        onGCTriggered: callbackMock,
      });

      // Allocate memory to ensure we're over threshold
      const bigData = new Array(1000000).fill({ data: 'test' });

      manager.triggerGCIfNeeded();

      expect(gcMock).toHaveBeenCalled();
      expect(callbackMock).toHaveBeenCalled();

      // Cleanup
      bigData.length = 0;
    });
  });
});
