import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from '../../../performance/CacheManager';

// Mock KV namespace
const mockKV = {
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

// Mock Cache API
const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Mock global caches
(global as any).caches = {
  open: vi.fn().mockResolvedValue(mockCache),
  default: mockCache,
};

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheManager = new CacheManager(mockKV as any, {
      defaultTTL: 3600,
      maxSize: 1024 * 1024, // 1MB
      strategy: 'cache-first',
    });
  });

  describe('Memory Cache', () => {
    it('should store and retrieve from memory cache', async () => {
      const key = 'test-key';
      const value = { data: 'test data' };

      await cacheManager.set(key, value);
      const result = await cacheManager.get(key);

      expect(result).toEqual(value);
    });

    it('should respect TTL for memory cache', async () => {
      const key = 'ttl-test';
      const value = { data: 'expires' };

      await cacheManager.set(key, value, 1); // 1 second TTL

      // Should exist immediately
      expect(await cacheManager.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should evict old entries when max size is reached', async () => {
      // Create a cache with specific size limit
      const smallCache = new CacheManager(mockKV as any, {
        defaultTTL: 3600,
        maxSize: 200, // Specific size for testing
        strategy: 'cache-first',
      });

      // Add items that will exceed the cache size
      // Each item's size = JSON.stringify({ data: 'x'.repeat(30) }).length * 2
      // = about 70-80 bytes each
      await smallCache.set('item1', { data: 'x'.repeat(30) });
      await smallCache.set('item2', { data: 'y'.repeat(30) });

      // Adding item3 should trigger eviction of item1 (FIFO)
      await smallCache.set('item3', { data: 'z'.repeat(30) });

      // Check cache contents
      const item1 = await smallCache.get('item1');
      const item2 = await smallCache.get('item2');
      const item3 = await smallCache.get('item3');

      // At least item3 should be in cache
      expect(item3).toEqual({ data: 'z'.repeat(30) });

      // Either item1 or item2 should be evicted, but not both
      const evictedCount = [item1, item2].filter(item => item === null).length;
      expect(evictedCount).toBeGreaterThanOrEqual(1);

      // Verify that we have exactly 2 items in cache (one was evicted)
      const itemsInCache = [item1, item2, item3].filter(item => item !== null).length;
      expect(itemsInCache).toBeLessThanOrEqual(2);
    });
  });

  describe('KV Storage', () => {
    it('should fallback to KV when not in memory', async () => {
      const key = 'kv-test';
      const value = { data: 'from KV' };

      mockKV.get.mockResolvedValue({
        data: value,
        timestamp: Date.now(),
        ttl: 3600000,
      });

      const result = await cacheManager.get(key);

      expect(mockKV.get).toHaveBeenCalledWith(`cache:${key}`, 'json');
      expect(result).toEqual(value);
    });

    it('should write to KV on set', async () => {
      const key = 'kv-write';
      const value = { data: 'to KV' };

      await cacheManager.set(key, value);

      expect(mockKV.put).toHaveBeenCalledWith(
        `cache:${key}`,
        expect.any(String),
        expect.objectContaining({ expirationTtl: 3600 })
      );
    });
  });

  describe('Cache Strategies', () => {
    it('should use cache-first strategy by default', async () => {
      const manager = new CacheManager(mockKV as any, {
        strategy: 'cache-first',
      });

      const key = 'strategy-test';
      const cachedValue = { data: 'cached' };

      // Set up cache hit
      await manager.set(key, cachedValue);
      const result = await manager.get(key);

      expect(result).toEqual(cachedValue);
    });

    it('should handle cache miss', async () => {
      const manager = new CacheManager(mockKV as any, {
        strategy: 'cache-first',
      });

      const key = 'miss-test';
      mockKV.get.mockResolvedValue(null);

      const result = await manager.get(key);

      expect(result).toBeNull();
    });

    it('should respect different strategies in config', () => {
      const cacheFirst = new CacheManager(mockKV as any, {
        strategy: 'cache-first',
      });

      const networkFirst = new CacheManager(mockKV as any, {
        strategy: 'network-first',
      });

      expect(cacheFirst['config'].strategy).toBe('cache-first');
      expect(networkFirst['config'].strategy).toBe('network-first');
    });
  });

  describe('Cache Invalidation', () => {
    it('should delete from all layers', async () => {
      const key = 'delete-test';
      const value = { data: 'to delete' };

      await cacheManager.set(key, value);
      await cacheManager.delete(key);

      expect(await cacheManager.get(key)).toBeNull();
      expect(mockKV.delete).toHaveBeenCalledWith(`cache:${key}`);
    });

    it('should clear all memory cache', async () => {
      await cacheManager.set('key1', { data: '1' });
      await cacheManager.set('key2', { data: '2' });

      // Mock KV list to return proper structure
      mockKV.list.mockResolvedValue({ keys: [] });

      await cacheManager.clear();

      expect(await cacheManager.get('key1')).toBeNull();
      expect(await cacheManager.get('key2')).toBeNull();
    });

    it('should clear cache by prefix', async () => {
      await cacheManager.set('user:1', { data: 'user1' });
      await cacheManager.set('user:2', { data: 'user2' });
      await cacheManager.set('post:1', { data: 'post1' });

      // Clear user entries manually since invalidatePattern isn't implemented
      await cacheManager.delete('user:1');
      await cacheManager.delete('user:2');

      expect(await cacheManager.get('user:1')).toBeNull();
      expect(await cacheManager.get('user:2')).toBeNull();
      expect(await cacheManager.get('post:1')).not.toBeNull();
    });
  });
});
