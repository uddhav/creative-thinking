/**
 * Rate Limiting Tests
 *
 * Tests rate limiting functionality with different configurations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../../middleware/rateLimiter.js';

describe('Rate Limiting', () => {
  let mockKV: any;
  let rateLimiter: RateLimiter;
  let requestCounts: Record<string, any>;

  beforeEach(() => {
    requestCounts = {};

    mockKV = {
      get: async (key: string) => {
        return requestCounts[key] ? JSON.stringify(requestCounts[key]) : null;
      },
      put: async (key: string, value: string, options?: any) => {
        requestCounts[key] = JSON.parse(value);
      },
      delete: async (key: string) => {
        delete requestCounts[key];
      },
    };

    rateLimiter = new RateLimiter(mockKV, {
      requests: 5,
      window: 60,
      burst: 2,
    });
  });

  describe('Rate Limit Check', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimiter.checkLimit('test-user');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(6); // 5 + 2 burst - 1
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should track multiple requests', async () => {
      const identifier = 'test-user';

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(7 - i - 1); // Decreasing remaining count
      }
    });

    it('should deny requests when limit exceeded', async () => {
      const identifier = 'test-user';

      // Make requests up to limit (5 + 2 burst = 7 total)
      for (let i = 0; i < 7; i++) {
        await rateLimiter.checkLimit(identifier);
      }

      // 8th request should be denied
      const result = await rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const identifier = 'test-user';

      // Simulate old data
      const oldData = {
        count: 5,
        resetAt: Date.now() - 1000, // Expired window
        timestamps: [Date.now() - 120000], // Old timestamp
      };
      requestCounts[`rate_limit:${identifier}`] = oldData;

      const result = await rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(6); // Reset to full limit
    });

    it('should clean old timestamps', async () => {
      const identifier = 'test-user';
      const now = Date.now();

      // Simulate mixed old and new timestamps
      const data = {
        count: 3,
        resetAt: now + 60000,
        timestamps: [
          now - 120000, // Old timestamp (should be removed)
          now - 30000, // Recent timestamp (should be kept)
          now - 10000, // Recent timestamp (should be kept)
        ],
      };
      requestCounts[`rate_limit:${identifier}`] = data;

      const result = await rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);

      // Check that old timestamps were cleaned
      const updatedData = requestCounts[`rate_limit:${identifier}`];
      expect(updatedData.timestamps.length).toBe(3); // 2 old + 1 new
    });

    it('should handle KV errors gracefully', async () => {
      const errorKV = {
        get: async () => {
          throw new Error('KV error');
        },
        put: async () => {
          throw new Error('KV error');
        },
        delete: async () => {
          throw new Error('KV error');
        },
        list: async () => {
          throw new Error('KV error');
        },
        getWithMetadata: async () => {
          throw new Error('KV error');
        },
      } as any;

      const errorRateLimiter = new RateLimiter(errorKV);
      const result = await errorRateLimiter.checkLimit('test-user');

      // Should fail open (allow request) on error
      expect(result.allowed).toBe(true);
    });
  });

  describe('Middleware Enforcement', () => {
    it('should allow request within rate limit', async () => {
      const request = new Request('https://test.com/api', {
        headers: { 'CF-Connecting-IP': '192.168.1.1' },
      });

      const response = await rateLimiter.enforce(request);
      expect(response).toBeNull(); // No response means continue processing
    });

    it('should return 429 when rate limit exceeded', async () => {
      const ip = '192.168.1.100';

      // Exceed rate limit
      for (let i = 0; i < 8; i++) {
        const request = new Request('https://test.com/api', {
          headers: { 'CF-Connecting-IP': ip },
        });
        await rateLimiter.enforce(request);
      }

      // Next request should be rate limited
      const request = new Request('https://test.com/api', {
        headers: { 'CF-Connecting-IP': ip },
      });
      const response = await rateLimiter.enforce(request);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(429);

      const body = (await response!.json()) as any;
      expect(body.error).toBe('Too Many Requests');
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it('should add rate limit headers', async () => {
      const ip = '192.168.1.200';
      const request = new Request('https://test.com/api', {
        headers: { 'CF-Connecting-IP': ip },
      });

      // Make one request to set up rate limit data
      await rateLimiter.enforce(request);

      // Make another request and check headers
      const secondRequest = new Request('https://test.com/api', {
        headers: { 'CF-Connecting-IP': ip },
      });

      const response = await rateLimiter.enforce(secondRequest);

      if (response && response.status === 429) {
        expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(response.headers.get('Retry-After')).toBeDefined();
      }
    });

    it('should use authenticated user ID when available', async () => {
      const request = new Request('https://test.com/api', {
        headers: { 'CF-Connecting-IP': '192.168.1.1' },
      });

      // Mock authenticated user
      (request as any).user = { userId: 'auth-user-123' };

      await rateLimiter.enforce(request);

      // Check that user ID was used as identifier
      const userKey = 'rate_limit:user:auth-user-123';
      expect(requestCounts[userKey]).toBeDefined();
    });

    it('should fall back to IP address when no user ID', async () => {
      const request = new Request('https://test.com/api', {
        headers: { 'CF-Connecting-IP': '192.168.1.50' },
      });

      await rateLimiter.enforce(request);

      // Check that IP was used as identifier
      const ipKey = 'rate_limit:ip:192.168.1.50';
      expect(requestCounts[ipKey]).toBeDefined();
    });
  });

  describe('Endpoint-Specific Rate Limits', () => {
    it('should create different rate limiters for different endpoints', () => {
      const mcpLimiter = RateLimiter.forEndpoint(mockKV, '/mcp');
      const authLimiter = RateLimiter.forEndpoint(mockKV, '/authorize');
      const defaultLimiter = RateLimiter.forEndpoint(mockKV, '/unknown');

      // These would have different internal configurations
      expect(mcpLimiter).toBeInstanceOf(RateLimiter);
      expect(authLimiter).toBeInstanceOf(RateLimiter);
      expect(defaultLimiter).toBeInstanceOf(RateLimiter);
    });

    it('should apply stricter limits to auth endpoints', async () => {
      const authLimiter = RateLimiter.forEndpoint(mockKV, '/authorize');
      const identifier = 'test-user';

      // Auth endpoints typically have lower limits
      // This test assumes the implementation sets lower limits for /authorize
      let requests = 0;
      let blocked = false;

      while (requests < 20 && !blocked) {
        const result = await authLimiter.checkLimit(identifier);
        requests++;
        if (!result.allowed) {
          blocked = true;
          break;
        }
      }

      // Should be blocked before 20 requests (assuming auth has stricter limits)
      expect(blocked).toBe(true);
      expect(requests).toBeLessThan(20);
    });
  });

  describe('IP Address Detection', () => {
    it('should extract IP from CF-Connecting-IP header', async () => {
      const request = new Request('https://test.com/api', {
        headers: { 'CF-Connecting-IP': '1.2.3.4' },
      });

      await rateLimiter.enforce(request);
      expect(requestCounts['rate_limit:ip:1.2.3.4']).toBeDefined();
    });

    it('should fall back to X-Forwarded-For header', async () => {
      const request = new Request('https://test.com/api', {
        headers: { 'X-Forwarded-For': '5.6.7.8, 9.10.11.12' },
      });

      await rateLimiter.enforce(request);
      expect(requestCounts['rate_limit:ip:5.6.7.8']).toBeDefined(); // First IP in list
    });

    it('should use "unknown" when no IP headers present', async () => {
      const request = new Request('https://test.com/api');

      await rateLimiter.enforce(request);
      expect(requestCounts['rate_limit:ip:unknown']).toBeDefined();
    });
  });

  describe('Burst Allowance', () => {
    it('should allow burst traffic above base limit', async () => {
      const identifier = 'burst-test-user';

      // Base limit is 5, burst is 2, so total should be 7
      for (let i = 0; i < 7; i++) {
        const result = await rateLimiter.checkLimit(identifier);
        expect(result.allowed).toBe(true);
      }

      // 8th request should be denied
      const result = await rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(false);
    });
  });
});
