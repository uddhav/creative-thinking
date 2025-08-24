/**
 * OAuth Flow Tests
 *
 * Tests OAuth authentication functionality in isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthMiddleware } from '../../middleware/oauth.js';

// Mock environment for OAuth testing
const mockEnv = {
  KV: {
    get: async (key: string) => null,
    put: async (key: string, value: string, options?: any) => undefined,
    delete: async (key: string) => undefined,
    list: async (options?: any) => ({ keys: [] }),
  } as any,

  OAUTH_ENABLED: 'true',
  OAUTH_PROVIDER: 'github',
  OAUTH_CLIENT_ID: 'test-client-id',
  OAUTH_CLIENT_SECRET: 'test-client-secret',
  OAUTH_REDIRECT_URI: 'https://test.com/oauth/callback',
} as any;

const mockContext = {
  waitUntil: (promise: Promise<any>) => promise,
  passThroughOnException: () => {},
} as any;

describe('OAuth Flow', () => {
  let oauth: OAuthMiddleware;

  beforeEach(() => {
    oauth = new OAuthMiddleware(mockEnv, mockContext);
  });

  describe('Authorization Request', () => {
    it('should generate authorization URL with correct parameters', async () => {
      const request = new Request('https://test.com/oauth/authorize');
      const response = await oauth.authorize(request);

      expect(response.status).toBe(302);

      const location = response.headers.get('Location');
      expect(location).toBeDefined();
      expect(location).toContain('https://github.com/login/oauth/authorize');
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain('response_type=code');
      expect(location).toContain('state=');
    });

    it('should store state in KV for CSRF protection', async () => {
      let storedState: string | null = null;

      mockEnv.KV.put = async (key: string, value: string) => {
        if (key.startsWith('oauth_state:')) {
          storedState = key.replace('oauth_state:', '');
        }
      };

      const request = new Request('https://test.com/oauth/authorize');
      const response = await oauth.authorize(request);

      expect(storedState).toBeDefined();
      expect(storedState).toHaveLength(36); // UUID length
    });

    it('should handle missing OAuth configuration', async () => {
      const noConfigEnv = { ...mockEnv, OAUTH_CLIENT_ID: undefined };
      const oauthNoConfig = new OAuthMiddleware(noConfigEnv, mockContext);

      const request = new Request('https://test.com/oauth/authorize');
      const response = await oauthNoConfig.authorize(request);

      expect(response.status).toBe(500);
      const body = (await response.json()) as any;
      expect(body.error).toBe('OAuth not configured');
    });
  });

  describe('OAuth Callback', () => {
    it('should handle callback with error parameter', async () => {
      const request = new Request(
        'https://test.com/oauth/callback?error=access_denied&error_description=User%20denied'
      );
      const response = await oauth.callback(request);

      expect(response.status).toBe(400);
      const body = (await response.json()) as any;
      expect(body.error).toBe('OAuth Error');
      expect(body.message).toContain('access_denied');
    });

    it('should reject callback with missing parameters', async () => {
      const request = new Request('https://test.com/oauth/callback');
      const response = await oauth.callback(request);

      expect(response.status).toBe(400);
      const body = (await response.json()) as any;
      expect(body.error).toBe('Invalid Request');
    });

    it('should reject callback with invalid state', async () => {
      const request = new Request(
        'https://test.com/oauth/callback?code=test-code&state=invalid-state'
      );
      const response = await oauth.callback(request);

      expect(response.status).toBe(400);
      const body = (await response.json()) as any;
      expect(body.error).toBe('Invalid State');
    });

    it('should handle callback with valid state', async () => {
      // Mock state validation
      mockEnv.KV.get = async (key: string) => {
        if (key === 'oauth_state:valid-state') {
          return JSON.stringify({
            createdAt: Date.now() - 60000, // 1 minute ago
            returnTo: '/',
          });
        }
        return null;
      };

      // Mock successful token exchange
      global.fetch = async (input: any) => {
        const url = typeof input === 'string' ? input : input.url;

        if (url.includes('github.com/login/oauth/access_token')) {
          return new Response(
            JSON.stringify({
              access_token: 'github-access-token',
              token_type: 'bearer',
              expires_in: 3600,
            }),
            { status: 200 }
          );
        }

        // User info request
        if (url.includes('api.github.com/user')) {
          return new Response(
            JSON.stringify({
              id: 12345,
              login: 'testuser',
              email: 'test@example.com',
            }),
            { status: 200 }
          );
        }

        return new Response('Not Found', { status: 404 });
      };

      const request = new Request(
        'https://test.com/oauth/callback?code=test-code&state=valid-state'
      );
      const response = await oauth.callback(request);

      expect(response.status).toBe(302); // Redirect

      const location = response.headers.get('Location');
      expect(location).toContain('access_token=');
    });
  });

  describe('Token Validation', () => {
    it('should reject request without Authorization header', async () => {
      const request = new Request('https://test.com/api');
      const result = await oauth.validate(request);

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it('should reject request with invalid token format', async () => {
      const request = new Request('https://test.com/api', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      const result = await oauth.validate(request);

      expect(result.valid).toBe(false);
    });

    it('should validate valid token', async () => {
      // Mock token in KV
      mockEnv.KV.get = async (key: string) => {
        if (key === 'oauth_token:valid-token') {
          return JSON.stringify({
            userId: 'test-user',
            accessToken: 'valid-token',
            expiresAt: Date.now() + 3600000, // 1 hour from now
            scope: 'user',
            metadata: { provider: 'github' },
          });
        }
        return null;
      };

      const request = new Request('https://test.com/api', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const result = await oauth.validate(request);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('test-user');
      expect(result.scope).toBe('user');
    });

    it('should reject expired token', async () => {
      // Mock expired token
      mockEnv.KV.get = async (key: string) => {
        if (key === 'oauth_token:expired-token') {
          return JSON.stringify({
            userId: 'test-user',
            accessToken: 'expired-token',
            expiresAt: Date.now() - 3600000, // 1 hour ago
            scope: 'user',
            metadata: { provider: 'github' },
          });
        }
        return null;
      };

      const request = new Request('https://test.com/api', {
        headers: { Authorization: 'Bearer expired-token' },
      });
      const result = await oauth.validate(request);

      expect(result.valid).toBe(false);
    });
  });

  describe('Client Credentials Flow', () => {
    it('should issue service token for valid client credentials', async () => {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
      });

      const request = new Request('https://test.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const response = await oauth.token(request);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.access_token).toBeDefined();
      expect(data.token_type).toBe('bearer');
      expect(data.expires_in).toBe(3600);
      expect(data.scope).toBe('service');
    });

    it('should reject invalid client credentials', async () => {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'invalid-client',
        client_secret: 'invalid-secret',
      });

      const request = new Request('https://test.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const response = await oauth.token(request);

      expect(response.status).toBe(401);
      const data = (await response.json()) as any;
      expect(data.error).toBe('invalid_client');
    });

    it('should reject unsupported grant types', async () => {
      const body = new URLSearchParams({
        grant_type: 'password',
        username: 'user',
        password: 'pass',
      });

      const request = new Request('https://test.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const response = await oauth.token(request);

      expect(response.status).toBe(400);
      const data = (await response.json()) as any;
      expect(data.error).toBe('unsupported_grant_type');
    });
  });

  describe('Custom OAuth Providers', () => {
    it('should support custom OAuth provider', async () => {
      const customEnv = {
        ...mockEnv,
        OAUTH_PROVIDER: 'custom',
        OAUTH_AUTHORIZE_URL: 'https://auth.example.com/oauth/authorize',
        OAUTH_TOKEN_URL: 'https://auth.example.com/oauth/token',
        OAUTH_USER_INFO_URL: 'https://api.example.com/user',
        OAUTH_SCOPE: 'read:profile',
      };

      const customOAuth = new OAuthMiddleware(customEnv, mockContext);

      const request = new Request('https://test.com/oauth/authorize');
      const response = await customOAuth.authorize(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('https://auth.example.com/oauth/authorize');
      expect(location).toContain('scope=read%3Aprofile');
    });
  });
});
