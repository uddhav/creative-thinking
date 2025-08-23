import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AuthManager,
  createApiKeyProvider,
  createBasicAuthProvider,
} from '../../../security/AuthManager';

// Mock KV namespace
const mockKV = {
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

// Mock crypto.getRandomValues
vi.stubGlobal('crypto', {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  randomUUID: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,
});

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Key Authentication', () => {
    it('should authenticate valid API key', async () => {
      const validKeys = new Map([
        [
          'test-key-123',
          {
            authenticated: true,
            userId: 'user1',
            username: 'Test User',
            roles: ['user'],
          },
        ],
      ]);

      authManager = new AuthManager(
        {
          providers: [createApiKeyProvider(validKeys)],
        },
        mockKV as any
      );

      const request = new Request('https://example.com', {
        headers: { 'X-API-Key': 'test-key-123' },
      });

      const result = await authManager.authenticate(request);

      expect(result.user).toBeDefined();
      expect(result.user?.authenticated).toBe(true);
      expect(result.user?.userId).toBe('user1');
      expect(result.provider).toBe('api-key');
    });

    it('should reject invalid API key', async () => {
      const validKeys = new Map([['valid-key', { authenticated: true, userId: 'user1' }]]);

      authManager = new AuthManager(
        {
          providers: [createApiKeyProvider(validKeys)],
        },
        mockKV as any
      );

      const request = new Request('https://example.com', {
        headers: { 'X-API-Key': 'invalid-key' },
      });

      const result = await authManager.authenticate(request);

      expect(result.user).toBeUndefined();
    });

    it('should support API key in Authorization header', async () => {
      const validKeys = new Map([['bearer-key', { authenticated: true, userId: 'user2' }]]);

      authManager = new AuthManager(
        {
          providers: [createApiKeyProvider(validKeys)],
        },
        mockKV as any
      );

      const request = new Request('https://example.com', {
        headers: { Authorization: 'ApiKey bearer-key' },
      });

      const result = await authManager.authenticate(request);

      expect(result.user?.authenticated).toBe(true);
      expect(result.user?.userId).toBe('user2');
    });
  });

  describe('Basic Authentication', () => {
    it('should authenticate valid credentials', async () => {
      const validator = async (username: string, password: string) => {
        if (username === 'admin' && password === 'secret') {
          return {
            authenticated: true,
            userId: 'admin-id',
            username: 'Admin User',
            roles: ['admin'],
          };
        }
        return null;
      };

      authManager = new AuthManager(
        {
          providers: [createBasicAuthProvider(validator)],
        },
        mockKV as any
      );

      const credentials = Buffer.from('admin:secret').toString('base64');
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${credentials}` },
      });

      const result = await authManager.authenticate(request);

      expect(result.user?.authenticated).toBe(true);
      expect(result.user?.roles).toContain('admin');
    });

    it('should reject invalid credentials', async () => {
      const validator = async (username: string, password: string) => {
        if (username === 'admin' && password === 'correct') {
          return { authenticated: true, userId: 'admin' };
        }
        return null;
      };

      authManager = new AuthManager(
        {
          providers: [createBasicAuthProvider(validator)],
        },
        mockKV as any
      );

      const credentials = Buffer.from('admin:wrong').toString('base64');
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${credentials}` },
      });

      const result = await authManager.authenticate(request);

      expect(result.user).toBeUndefined();
    });
  });

  describe('Session Management', () => {
    it('should create session on successful authentication', async () => {
      const validKeys = new Map([['session-key', { authenticated: true, userId: 'user1' }]]);

      authManager = new AuthManager(
        {
          providers: [createApiKeyProvider(validKeys)],
          session: { ttl: 3600 },
        },
        mockKV as any
      );

      const request = new Request('https://example.com', {
        headers: { 'X-API-Key': 'session-key' },
      });

      const result = await authManager.authenticate(request);

      expect(result.sessionId).toBeDefined();
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.any(String),
        expect.objectContaining({ expirationTtl: 3600 })
      );
    });

    it('should authenticate with session cookie', async () => {
      const sessionData = {
        authenticated: true,
        userId: 'cookie-user',
        expiresAt: Date.now() + 3600000,
      };

      mockKV.get.mockResolvedValue(sessionData);

      authManager = new AuthManager(
        {
          providers: [],
          session: { cookieName: 'sid' },
        },
        mockKV as any
      );

      const request = new Request('https://example.com', {
        headers: { Cookie: 'sid=test-session-id' },
      });

      const result = await authManager.authenticate(request);

      expect(result.user?.userId).toBe('cookie-user');
      expect(result.sessionId).toBe('test-session-id');
    });

    it('should reject expired sessions', async () => {
      const sessionData = {
        authenticated: true,
        userId: 'expired-user',
        expiresAt: Date.now() - 1000, // Expired
      };

      mockKV.get.mockResolvedValue(sessionData);

      authManager = new AuthManager(
        {
          providers: [],
          session: { cookieName: 'sid' },
        },
        mockKV as any
      );

      const request = new Request('https://example.com', {
        headers: { Cookie: 'sid=expired-session' },
      });

      const result = await authManager.authenticate(request);

      expect(result.user).toBeUndefined();
      expect(mockKV.delete).toHaveBeenCalledWith('session:expired-session');
    });
  });

  describe('Middleware', () => {
    it('should enforce authentication when required', async () => {
      authManager = new AuthManager(
        {
          providers: [],
        },
        mockKV as any
      );

      const middleware = authManager.createMiddleware({ required: true });
      const next = vi.fn().mockResolvedValue(new Response('OK'));

      const request = new Request('https://example.com');
      const response = await middleware(request, next);

      expect(response.status).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated requests when not required', async () => {
      authManager = new AuthManager(
        {
          providers: [],
        },
        mockKV as any
      );

      const middleware = authManager.createMiddleware({ required: false });
      const next = vi.fn().mockResolvedValue(new Response('OK'));

      const request = new Request('https://example.com');
      const response = await middleware(request, next);

      expect(response.status).toBe(200);
      expect(next).toHaveBeenCalled();
    });

    it('should enforce role-based access', async () => {
      const validKeys = new Map([
        [
          'user-key',
          {
            authenticated: true,
            userId: 'user1',
            roles: ['user'],
          },
        ],
      ]);

      authManager = new AuthManager(
        {
          providers: [createApiKeyProvider(validKeys)],
        },
        mockKV as any
      );

      const middleware = authManager.createMiddleware({
        required: true,
        roles: ['admin'],
      });
      const next = vi.fn().mockResolvedValue(new Response('OK'));

      const request = new Request('https://example.com', {
        headers: { 'X-API-Key': 'user-key' },
      });

      const response = await middleware(request, next);

      expect(response.status).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle CORS preflight requests', async () => {
      authManager = new AuthManager(
        {
          providers: [],
          cors: {
            origins: ['https://allowed.com'],
            methods: ['GET', 'POST'],
            headers: ['Content-Type', 'Authorization'],
          },
        },
        mockKV as any
      );

      const middleware = authManager.createMiddleware();
      const next = vi.fn();

      const request = new Request('https://example.com', {
        method: 'OPTIONS',
      });

      const response = await middleware(request, next);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Security Headers', () => {
    it('should add session cookie with secure flags', async () => {
      const validKeys = new Map([['key', { authenticated: true, userId: 'user1' }]]);

      authManager = new AuthManager(
        {
          providers: [createApiKeyProvider(validKeys)],
          session: {
            ttl: 3600,
            cookieName: 'session',
            secure: true,
            sameSite: 'strict',
          },
        },
        mockKV as any
      );

      const middleware = authManager.createMiddleware();
      const next = vi.fn().mockResolvedValue(new Response('OK'));

      const request = new Request('https://example.com', {
        headers: { 'X-API-Key': 'key' },
      });

      const response = await middleware(request, next);
      const setCookie = response.headers.get('Set-Cookie');

      expect(setCookie).toContain('Secure');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=strict');
    });
  });
});
