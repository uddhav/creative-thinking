import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '../../../security/RateLimiter';

// Mock KV namespace
const mockKV = {
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    rateLimiter = new RateLimiter(mockKV as any, {
      maxRequests: 10,
      windowSeconds: 60,
      prefix: 'test',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Fixed Window Algorithm', () => {
    it('should allow requests within limit', async () => {
      const key = 'user:123';
      mockKV.get.mockResolvedValue(null); // No existing data

      const result = await rateLimiter.consume(key);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 1 (for this request)
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should deny requests when limit exceeded', async () => {
      const key = 'user:456';
      const now = Date.now();

      // Mock a full window
      mockKV.get.mockResolvedValue({
        count: 10,
        resetAt: now + 30000, // Still 30 seconds left in window
      });

      const result = await rateLimiter.consume(key);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0); // Math.max(0, remaining - 1) ensures it's never negative
      expect(result.retryAfter).toBe(30);
    });

    it('should reset window after expiry', async () => {
      const key = 'user:789';
      const now = Date.now();

      // Mock an expired window
      mockKV.get.mockResolvedValue({
        count: 10,
        resetAt: now - 1000, // Expired 1 second ago
      });

      const result = await rateLimiter.check(key);

      // Should allow requests in new window
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track count correctly', async () => {
      const key = 'user:count';
      const now = Date.now();

      // Mock a window with 3 requests
      mockKV.get.mockResolvedValue({
        count: 3,
        resetAt: now + 30000,
      });

      const result = await rateLimiter.check(key);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(6); // 10 - 3 - 1
    });
  });

  describe('Sliding Window', () => {
    it('should track requests in sliding window', async () => {
      const limiter = new RateLimiter(mockKV as any, {
        maxRequests: 5,
        windowSeconds: 10,
        slidingWindow: true,
      });

      const key = 'sliding:test';
      const now = Date.now();

      // Mock window with old and recent timestamps
      mockKV.get.mockResolvedValue({
        timestamps: [
          now - 15000, // Outside window
          now - 12000, // Outside window
          now - 8000, // Inside window
          now - 5000, // Inside window
          now - 2000, // Inside window
        ],
      });

      const result = await limiter.check(key);

      // Should only count requests within window (3)
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 5 - 3 - 1
    });

    it('should add new requests to sliding window', async () => {
      const limiter = new RateLimiter(mockKV as any, {
        maxRequests: 3,
        windowSeconds: 10,
        slidingWindow: true,
        prefix: 'slide',
      });

      const key = 'add';
      mockKV.get.mockResolvedValue({
        timestamps: [Date.now() - 5000, Date.now() - 3000],
      });

      await limiter.consume(key);

      expect(mockKV.put).toHaveBeenCalledWith(
        'slide:add',
        expect.any(String),
        expect.objectContaining({ expirationTtl: 70 }) // windowSeconds + 60 buffer
      );
    });
  });

  describe('Distributed Rate Limiting', () => {
    it('should persist state to KV', async () => {
      const key = 'distributed:test';
      mockKV.get.mockResolvedValue(null);

      await rateLimiter.consume(key);

      expect(mockKV.put).toHaveBeenCalledWith(
        `test:${key}`,
        expect.any(String),
        expect.objectContaining({ expirationTtl: 120 }) // windowSeconds + 60 buffer
      );
    });

    it('should handle concurrent requests correctly', async () => {
      const key = 'concurrent:test';
      const now = Date.now();
      let storedData = { count: 5, resetAt: now + 30000 };

      // Mock KV to simulate concurrent updates
      mockKV.get.mockImplementation(async () => storedData);
      mockKV.put.mockImplementation(async (k, v) => {
        storedData = JSON.parse(v);
      });

      // Simulate concurrent requests
      const results = await Promise.all([
        rateLimiter.check(key),
        rateLimiter.check(key),
        rateLimiter.check(key),
      ]);

      const allowedCount = results.filter(r => r.allowed).length;
      expect(allowedCount).toBe(3); // All should see count=5, so all allowed
    });
  });

  describe('Rate Limit Response', () => {
    it('should provide correct rate limit info', async () => {
      const key = 'headers:test';
      const now = Date.now();
      mockKV.get.mockResolvedValue({ count: 3, resetAt: now + 30000 });

      const result = await rateLimiter.check(key);

      expect(result).toHaveProperty('allowed', true);
      expect(result).toHaveProperty('remaining', 6); // 10 - 3 - 1
      expect(result).toHaveProperty('resetAt');
      expect(result.resetAt).toBe(now + 30000);
    });

    it('should calculate retry-after correctly', async () => {
      const key = 'retry:test';
      const now = Date.now();
      mockKV.get.mockResolvedValue({ count: 10, resetAt: now + 30000 });

      const result = await rateLimiter.check(key);

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(30); // 30 seconds until reset
    });
  });

  describe('Reset Functionality', () => {
    it('should reset rate limit for a key', async () => {
      const key = 'reset:test';

      await rateLimiter.reset(key);

      expect(mockKV.delete).toHaveBeenCalledWith(`test:${key}`);
    });
  });
});
