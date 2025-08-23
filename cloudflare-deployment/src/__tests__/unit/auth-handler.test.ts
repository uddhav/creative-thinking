import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthHandler } from '../../auth-handler.js';

describe('AuthHandler', () => {
  let authHandler: AuthHandler;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEnv = {
      AUTH_API_KEY: 'test-api-key',
      AUTH_USERNAME: 'test-username',
      KV: {
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(null),
      },
      OAUTH_PROVIDER: {
        completeAuthorization: vi.fn().mockResolvedValue({
          redirectTo: 'https://redirect.example.com',
        }),
      },
    };

    authHandler = new AuthHandler(mockEnv);
  });

  describe('fetch handler', () => {
    it('should handle /authorize endpoint', async () => {
      const request = new Request(
        'https://example.com/authorize?client_id=test&redirect_uri=https://app.example.com'
      );
      const response = await authHandler.fetch(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      const html = await response.text();
      expect(html).toContain('Authorize Application');
      // Check that the authorization page shows client info
      expect(html).toContain('wants to access');
      expect(html).toContain('Creative Thinking MCP Server');
    });

    it('should handle /callback endpoint with code', async () => {
      const request = new Request('https://example.com/callback?code=test-code&state=test-state');
      const response = await authHandler.fetch(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('https://redirect.example.com/');
    });

    it('should handle /callback without code', async () => {
      const request = new Request('https://example.com/callback');
      const response = await authHandler.fetch(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing authorization code');
    });

    it('should handle /login GET request', async () => {
      const request = new Request('https://example.com/login');
      const response = await authHandler.fetch(request);

      expect(response.status).toBe(405);
      expect(await response.text()).toBe('Method not allowed');
    });

    it('should handle /login POST with valid API key', async () => {
      const formData = new FormData();
      formData.append('api_key', 'test-api-key');
      formData.append('state', 'test-state');
      formData.append('redirect_uri', '/app');

      const request = new Request('https://example.com/login', {
        method: 'POST',
        body: formData,
      });

      const response = await authHandler.fetch(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toMatch(
        /https:\/\/example\.com\/app\?code=auth_[a-f0-9-]+&state=test-state/
      );
      expect(mockEnv.KV.put).toHaveBeenCalled();
    });

    it('should handle /login POST with valid username', async () => {
      const formData = new FormData();
      formData.append('username', 'test-username');
      formData.append('state', 'test-state');
      formData.append('redirect_uri', '/app');

      const request = new Request('https://example.com/login', {
        method: 'POST',
        body: formData,
      });

      const response = await authHandler.fetch(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toMatch(
        /https:\/\/example\.com\/app\?code=auth_[a-f0-9-]+&state=test-state/
      );
      expect(mockEnv.KV.put).toHaveBeenCalled();
    });

    it('should handle /login POST with invalid credentials', async () => {
      const formData = new FormData();
      formData.append('api_key', 'wrong-key');

      const request = new Request('https://example.com/login', {
        method: 'POST',
        body: formData,
      });

      const response = await authHandler.fetch(request);

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Invalid credentials');
    });

    it('should handle missing auth configuration', async () => {
      mockEnv.AUTH_API_KEY = undefined;
      mockEnv.AUTH_USERNAME = undefined;

      const formData = new FormData();
      formData.append('api_key', 'any-key');

      const request = new Request('https://example.com/login', {
        method: 'POST',
        body: formData,
      });

      const response = await authHandler.fetch(request);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Authentication not configured');
    });

    it('should show login page for root path', async () => {
      const request = new Request('https://example.com/');
      const response = await authHandler.fetch(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      const html = await response.text();
      expect(html).toContain('Creative Thinking MCP');
      expect(html).toContain('Sign In');
    });

    it('should handle OAuth provider completion', async () => {
      mockEnv.OAUTH_PROVIDER = {
        completeAuthorization: vi.fn().mockResolvedValue({
          redirectTo: 'https://final.example.com/',
        }),
      };

      const request = new Request('https://example.com/callback?code=oauth-code&state=oauth-state');
      const response = await authHandler.fetch(request);

      expect(mockEnv.OAUTH_PROVIDER.completeAuthorization).toHaveBeenCalledWith({
        request: {
          code: 'oauth-code',
          state: 'oauth-state',
          scope: 'read write',
        },
        userId: expect.stringContaining('demo-user-'),
        metadata: expect.objectContaining({
          authorizedAt: expect.any(String),
          scope: 'read write',
        }),
        scope: 'read write',
        props: {
          accessToken: expect.stringContaining('ct_token_'),
        },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('https://final.example.com/');
    });
  });

  describe('Token generation', () => {
    it('should generate secure tokens', async () => {
      const formData = new FormData();
      formData.append('api_key', 'test-api-key');
      formData.append('redirect_uri', '/app');

      const request = new Request('https://example.com/login', {
        method: 'POST',
        body: formData,
      });

      const response = await authHandler.fetch(request);
      const location = response.headers.get('Location')!;
      const codeMatch = location.match(/code=(auth_[a-f0-9-]+)/);

      expect(codeMatch).toBeTruthy();
      expect(codeMatch![1]).toMatch(/^auth_[a-f0-9-]+$/);
    });

    it('should store auth codes with expiry', async () => {
      const formData = new FormData();
      formData.append('username', 'test-username');
      formData.append('redirect_uri', '/app');

      const request = new Request('https://example.com/login', {
        method: 'POST',
        body: formData,
      });

      await authHandler.fetch(request);

      expect(mockEnv.KV.put).toHaveBeenCalledWith(
        expect.stringMatching(/^auth_code:auth_/),
        expect.stringContaining('"userId":"user_test-username"'),
        { expirationTtl: 300 } // 5 minutes
      );
    });
  });

  describe('HTML generation', () => {
    it('should generate proper login page HTML', async () => {
      const request = new Request('https://example.com/');
      const response = await authHandler.fetch(request);
      const html = await response.text();

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<form method="POST" action="/login">');
      expect(html).toContain('name="username"');
      expect(html).toContain('name="api_key"');
      expect(html).toContain('type="submit"');
    });

    it('should generate proper authorization page HTML', async () => {
      const request = new Request('https://example.com/authorize?client_id=my-app&scope=read');
      const response = await authHandler.fetch(request);
      const html = await response.text();

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('my-app');
      expect(html).toContain('wants to access');
      expect(html).toContain('Authorize');
      expect(html).toContain('Cancel');
    });
  });
});
