import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSecurityMiddleware } from '../../middleware/security';
import { createPerformanceMiddleware } from '../../middleware/performance';
import type { Env } from '../../index';

// Mock environment
const mockEnv: Env = {
  KV: {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  } as any,
  CREATIVE_THINKING_AGENT: {} as any,
  IDEA_STORMING_AGENT: {} as any,
  ENVIRONMENT: 'test',
};

describe('Middleware Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Security Middleware', () => {
    it('should apply rate limiting', async () => {
      const middleware = createSecurityMiddleware(mockEnv, {
        rateLimit: {
          enabled: true,
          maxRequests: 3,
          windowSeconds: 60,
        },
      });

      const next = vi.fn().mockResolvedValue(new Response('OK'));

      // Mock rate limit exceeded
      mockEnv.KV.get = vi.fn().mockResolvedValue({
        count: 3,
        resetAt: Date.now() + 30000,
      });

      const request = new Request('https://example.com');
      const response = await middleware(request, next);

      expect(response.status).toBe(429);
      expect(await response.json()).toHaveProperty('error', 'Rate limit exceeded');
    });

    it('should validate request methods', async () => {
      const middleware = createSecurityMiddleware(mockEnv, {
        rateLimit: { enabled: false }, // Disable rate limiting for this test
        validation: {
          allowedMethods: ['GET', 'POST'],
        },
      });

      const next = vi.fn().mockResolvedValue(new Response('OK'));

      // Allowed method
      mockEnv.KV.get = vi.fn().mockResolvedValue(null); // No rate limit data
      let request = new Request('https://example.com', { method: 'GET' });
      let response = await middleware(request, next);
      expect(response.status).toBe(200);

      // Disallowed method
      request = new Request('https://example.com', { method: 'DELETE' });
      response = await middleware(request, next);
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, POST'); // Only the allowed methods
    });

    it('should add security headers', async () => {
      const middleware = createSecurityMiddleware(mockEnv, {
        rateLimit: { enabled: false },
        headers: {
          enabled: true,
          hsts: true,
          frameOptions: 'DENY',
          xssProtection: true,
          noSniff: true,
        },
      });

      mockEnv.KV.get = vi.fn().mockResolvedValue(null);
      const next = vi.fn().mockResolvedValue(new Response('OK'));
      const request = new Request('https://example.com');
      const response = await middleware(request, next);

      expect(response.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains'
      );
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should handle authentication', async () => {
      const middleware = createSecurityMiddleware(mockEnv, {
        rateLimit: { enabled: false },
        auth: {
          enabled: true,
          required: true,
          providers: ['api-key'],
        },
      });

      mockEnv.KV.get = vi.fn().mockResolvedValue(null);
      const next = vi.fn().mockResolvedValue(new Response('OK'));

      // Without auth
      let request = new Request('https://example.com');
      let response = await middleware(request, next);
      expect(response.status).toBe(401);

      // With valid auth (demo key)
      request = new Request('https://example.com', {
        headers: { 'X-API-Key': 'demo-key' },
      });
      response = await middleware(request, next);
      expect(response.status).toBe(200);
    });
  });

  describe('Performance Middleware', () => {
    it('should cache responses', async () => {
      const middleware = createPerformanceMiddleware(mockEnv, {
        cache: {
          enabled: true,
          ttl: 300,
          paths: ['/api/test'],
        },
      });

      const responseData = { data: 'test response' };
      const next = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(responseData), {
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // First request - cache miss
      let request = new Request('https://example.com/api/test');
      let response = await middleware(request, next);

      expect(response.headers.get('X-Cache')).toBe('MISS');
      expect(next).toHaveBeenCalledTimes(1);

      // Setup cache hit
      mockEnv.KV.get = vi.fn().mockResolvedValue(
        JSON.stringify({
          data: responseData,
          timestamp: Date.now(),
          ttl: 300000,
        })
      );

      // Second request - cache hit
      request = new Request('https://example.com/api/test');
      response = await middleware(request, next);

      expect(response.headers.get('X-Cache')).toBe('HIT');
      expect(next).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should compress responses', async () => {
      const largeData = { data: 'x'.repeat(2000) };
      const middleware = createPerformanceMiddleware(mockEnv, {
        compression: {
          enabled: true,
          threshold: 1024,
          types: ['application/json'],
        },
      });

      const next = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(largeData), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': '2000',
          },
        })
      );

      const request = new Request('https://example.com', {
        headers: { 'Accept-Encoding': 'gzip' },
      });

      const response = await middleware(request, next);

      expect(response.headers.get('Content-Encoding')).toBe('gzip');
      expect(response.headers.get('Vary')).toBe('Accept-Encoding');
    });

    it('should add performance timing headers', async () => {
      const middleware = createPerformanceMiddleware(mockEnv, {
        monitoring: {
          enabled: true,
        },
      });

      const next = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return new Response('OK');
      });

      const request = new Request('https://example.com');
      const response = await middleware(request, next);

      expect(response.headers.get('Server-Timing')).toMatch(/total;dur=\d+/);
      expect(response.headers.get('X-Request-ID')).toMatch(/^[a-f0-9-]+$/);
    });

    it('should add ETag headers', async () => {
      const middleware = createPerformanceMiddleware(mockEnv, {
        optimization: {
          etagEnabled: true,
        },
      });

      const responseBody = JSON.stringify({ data: 'test' });
      const next = vi.fn().mockResolvedValue(
        new Response(responseBody, {
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new Request('https://example.com');
      const response = await middleware(request, next);

      expect(response.headers.get('ETag')).toMatch(/^"[a-f0-9]{16}"$/);
    });
  });

  describe('Middleware Chain', () => {
    it('should compose security and performance middleware', async () => {
      mockEnv.KV.get = vi.fn().mockResolvedValue(null);

      const securityMiddleware = createSecurityMiddleware(mockEnv, {
        headers: {
          enabled: true,
          noSniff: true, // Ensure noSniff header is added
        },
        rateLimit: { enabled: false }, // Disable to avoid interference
      });

      const performanceMiddleware = createPerformanceMiddleware(mockEnv, {
        cache: { enabled: false }, // Disable to simplify test
        monitoring: { enabled: true },
      });

      const handler = vi.fn().mockResolvedValue(new Response('Success', { status: 200 }));

      // Compose middleware chain
      const request = new Request('https://example.com/api/test');
      const response = await securityMiddleware(request, async () => {
        return performanceMiddleware(request, handler);
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff'); // Security header
      expect(response.headers.get('Server-Timing')).toBeDefined(); // Performance header
      expect(handler).toHaveBeenCalled();
    });

    it('should short-circuit on security failure', async () => {
      mockEnv.KV.get = vi.fn().mockResolvedValue(null);

      const securityMiddleware = createSecurityMiddleware(mockEnv, {
        rateLimit: { enabled: false },
        auth: { enabled: true, required: true },
      });

      const performanceMiddleware = createPerformanceMiddleware(mockEnv, {});
      const handler = vi.fn().mockResolvedValue(new Response('OK'));

      // Request without auth
      const request = new Request('https://example.com');
      const response = await securityMiddleware(request, async () => {
        return performanceMiddleware(request, handler);
      });

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled(); // Handler never reached
    });
  });
});
