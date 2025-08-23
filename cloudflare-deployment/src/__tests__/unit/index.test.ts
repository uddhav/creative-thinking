import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ExecutionContext } from '@cloudflare/workers-types';

// Mock modules
vi.mock('@cloudflare/workers-oauth-provider', () => ({
  default: vi.fn().mockImplementation(() => ({
    getAuthorizationUrl: vi.fn().mockResolvedValue('https://auth.example.com'),
    completeAuthorization: vi.fn().mockResolvedValue({
      redirectTo: 'https://redirect.example.com',
    }),
  })),
}));

vi.mock('../../CreativeThinkingMcpAgent.js', () => ({
  CreativeThinkingMcpAgent: {
    serveSSE: vi.fn().mockReturnValue({
      fetch: vi.fn().mockResolvedValue(new Response('SSE response')),
    }),
    mount: vi.fn().mockReturnValue({
      fetch: vi.fn().mockResolvedValue(new Response('HTTP response')),
    }),
    serve: vi.fn().mockReturnValue({
      fetch: vi.fn().mockResolvedValue(new Response('WebSocket response')),
    }),
  },
}));

vi.mock('../../auth-handler.js', () => ({
  AuthHandler: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue(new Response('Auth response')),
  })),
}));

vi.mock('../../middleware/security.js', () => ({
  createSecurityMiddleware: vi
    .fn()
    .mockReturnValue(async (request: Request, next: () => Promise<Response>) => next()),
}));

vi.mock('../../middleware/performance.js', () => ({
  createPerformanceMiddleware: vi
    .fn()
    .mockReturnValue(async (request: Request, next: () => Promise<Response>) => next()),
}));

// Import after mocks
import worker from '../../index.js';

describe('Cloudflare Worker - index.ts', () => {
  let mockEnv: any;
  let mockCtx: ExecutionContext;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset middleware mocks to default behavior (pass through)
    const { createSecurityMiddleware } = await import('../../middleware/security.js');
    const { createPerformanceMiddleware } = await import('../../middleware/performance.js');

    (createSecurityMiddleware as any).mockReturnValue(
      async (request: Request, next: () => Promise<Response>) => next()
    );
    (createPerformanceMiddleware as any).mockReturnValue(
      async (request: Request, next: () => Promise<Response>) => next()
    );

    mockEnv = {
      ENVIRONMENT: 'development',
      CREATIVE_THINKING_AGENT: {
        idFromName: vi.fn().mockReturnValue('test-id'),
        get: vi.fn().mockReturnValue({
          fetch: vi.fn().mockResolvedValue(new Response('Durable Object response')),
        }),
      },
      OAUTH_PROVIDER: null, // Will be created on demand
      KV: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockCtx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as unknown as ExecutionContext;
  });

  describe('Main fetch handler', () => {
    it('should serve home page for root path', async () => {
      const request = new Request('https://example.com/');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      const html = await response.text();
      expect(html).toContain('Creative Thinking MCP Server');
    });

    it('should handle /health endpoint', async () => {
      const request = new Request('https://example.com/health');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.status).toBe('healthy');
      expect(json.version).toBe('1.0.0');
      expect(json.environment).toBe('development');
    });

    it('should handle /mcp path for SSE', async () => {
      const request = new Request('https://example.com/mcp');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });

    it('should handle WebSocket upgrade', async () => {
      const request = new Request('https://example.com/ws', {
        headers: {
          Upgrade: 'websocket',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });

    it('should return 404 for unknown paths', async () => {
      const request = new Request('https://example.com/unknown');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('Not Found');
    });

    it('should apply security middleware', async () => {
      const { createSecurityMiddleware } = await import('../../middleware/security.js');
      const request = new Request('https://example.com/health');

      await worker.fetch(request, mockEnv, mockCtx);

      expect(createSecurityMiddleware).toHaveBeenCalledWith(mockEnv, expect.any(Object));
    });

    it('should apply performance middleware', async () => {
      const { createPerformanceMiddleware } = await import('../../middleware/performance.js');
      const request = new Request('https://example.com/health');

      await worker.fetch(request, mockEnv, mockCtx);

      expect(createPerformanceMiddleware).toHaveBeenCalledWith(mockEnv, expect.any(Object));
    });

    it('should handle /stream endpoint', async () => {
      const request = new Request('https://example.com/stream?user_id=test');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response).toBeDefined();
      expect(mockEnv.CREATIVE_THINKING_AGENT.idFromName).toHaveBeenCalledWith('test');
      expect(mockEnv.CREATIVE_THINKING_AGENT.get).toHaveBeenCalledWith('test-id');
    });

    it('should handle /api path for HTTP API', async () => {
      const request = new Request('https://example.com/test');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });
});
