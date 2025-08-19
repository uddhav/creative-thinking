/**
 * Authentication Manager
 *
 * Handles authentication and authorization for the MCP server
 */

import { createHash } from 'crypto';

export interface AuthConfig {
  /**
   * Authentication providers
   */
  providers: AuthProvider[];

  /**
   * Session configuration
   */
  session?: {
    ttl?: number; // seconds
    cookieName?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };

  /**
   * CORS configuration
   */
  cors?: {
    origins?: string[];
    credentials?: boolean;
    methods?: string[];
    headers?: string[];
  };
}

export interface AuthProvider {
  type: 'api-key' | 'basic' | 'bearer' | 'oauth' | 'custom';
  validate: (credentials: any) => Promise<AuthResult | null>;
  extractCredentials?: (request: Request) => any;
}

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  username?: string;
  roles?: string[];
  metadata?: Record<string, any>;
  expiresAt?: number;
}

export interface AuthContext {
  user?: AuthResult;
  sessionId?: string;
  provider?: string;
}

export class AuthManager {
  private config: AuthConfig;
  private kv?: KVNamespace;
  private sessionCache = new Map<string, AuthResult>();

  constructor(config: AuthConfig, kv?: KVNamespace) {
    this.config = {
      session: {
        ttl: 3600, // 1 hour
        cookieName: 'session',
        secure: true,
        sameSite: 'lax',
        ...config.session,
      },
      cors: {
        origins: ['*'],
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization'],
        ...config.cors,
      },
      ...config,
    };
    this.kv = kv;
  }

  /**
   * Authenticate a request
   */
  async authenticate(request: Request): Promise<AuthContext> {
    // Try session authentication first
    const sessionContext = await this.authenticateSession(request);
    if (sessionContext.user) {
      return sessionContext;
    }

    // Try each provider
    for (const provider of this.config.providers) {
      const credentials = provider.extractCredentials
        ? provider.extractCredentials(request)
        : this.extractCredentials(request, provider.type);

      if (credentials) {
        const result = await provider.validate(credentials);
        if (result && result.authenticated) {
          // Create session if configured
          const sessionId = await this.createSession(result);

          return {
            user: result,
            sessionId,
            provider: provider.type,
          };
        }
      }
    }

    return {};
  }

  /**
   * Create authentication middleware
   */
  createMiddleware(options?: {
    required?: boolean;
    roles?: string[];
    onUnauthenticated?: (request: Request) => Response | void;
    onUnauthorized?: (request: Request, user: AuthResult) => Response | void;
  }) {
    return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return this.handleCors(new Response(null, { status: 204 }));
      }

      const context = await this.authenticate(request);

      // Check if authentication is required
      if (options?.required && !context.user) {
        if (options.onUnauthenticated) {
          const customResponse = options.onUnauthenticated(request);
          if (customResponse) return this.handleCors(customResponse);
        }

        return this.handleCors(
          new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer realm="MCP Server"',
            },
          })
        );
      }

      // Check roles if specified
      if (context.user && options?.roles) {
        const hasRole = options.roles.some(role => context.user!.roles?.includes(role));

        if (!hasRole) {
          if (options.onUnauthorized) {
            const customResponse = options.onUnauthorized(request, context.user);
            if (customResponse) return this.handleCors(customResponse);
          }

          return this.handleCors(
            new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      }

      // Add auth context to request
      (request as any).auth = context;

      // Process request
      let response = await next();

      // Add session cookie if created
      if (
        context.sessionId &&
        !request.headers.get('Cookie')?.includes(this.config.session!.cookieName!)
      ) {
        response = new Response(response.body, response);
        response.headers.append('Set-Cookie', this.createSessionCookie(context.sessionId));
      }

      return this.handleCors(response);
    };
  }

  /**
   * Extract credentials based on type
   */
  private extractCredentials(request: Request, type: string): any {
    switch (type) {
      case 'api-key':
        return {
          apiKey:
            request.headers.get('X-API-Key') ||
            request.headers.get('Authorization')?.replace('ApiKey ', ''),
        };

      case 'basic':
        const basic = request.headers.get('Authorization')?.match(/^Basic (.+)$/);
        if (basic) {
          const decoded = atob(basic[1]);
          const [username, password] = decoded.split(':');
          return { username, password };
        }
        return null;

      case 'bearer':
        const bearer = request.headers.get('Authorization')?.match(/^Bearer (.+)$/);
        return bearer ? { token: bearer[1] } : null;

      default:
        return null;
    }
  }

  /**
   * Authenticate session
   */
  private async authenticateSession(request: Request): Promise<AuthContext> {
    const cookie = request.headers.get('Cookie');
    if (!cookie) return {};

    const sessionId = this.parseSessionCookie(cookie);
    if (!sessionId) return {};

    // Check memory cache
    let session = this.sessionCache.get(sessionId);

    // Check KV storage
    if (!session && this.kv) {
      session = (await this.kv.get(`session:${sessionId}`, 'json')) as AuthResult;
      if (session) {
        this.sessionCache.set(sessionId, session);
      }
    }

    if (session && (!session.expiresAt || session.expiresAt > Date.now())) {
      return { user: session, sessionId };
    }

    // Session expired
    if (session) {
      await this.deleteSession(sessionId);
    }

    return {};
  }

  /**
   * Create session
   */
  private async createSession(user: AuthResult): Promise<string | undefined> {
    if (!this.config.session || !this.kv) return undefined;

    const sessionId = this.generateSessionId();
    const sessionData = {
      ...user,
      expiresAt: Date.now() + this.config.session.ttl! * 1000,
    };

    // Store in KV
    await this.kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
      expirationTtl: this.config.session.ttl,
    });

    // Cache in memory
    this.sessionCache.set(sessionId, sessionData);

    return sessionId;
  }

  /**
   * Delete session
   */
  private async deleteSession(sessionId: string): Promise<void> {
    this.sessionCache.delete(sessionId);

    if (this.kv) {
      await this.kv.delete(`session:${sessionId}`);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    const random = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(random, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Parse session cookie
   */
  private parseSessionCookie(cookie: string): string | null {
    const match = cookie.match(new RegExp(`${this.config.session!.cookieName}=([^;]+)`));
    return match ? match[1] : null;
  }

  /**
   * Create session cookie
   */
  private createSessionCookie(sessionId: string): string {
    const parts = [
      `${this.config.session!.cookieName}=${sessionId}`,
      `Max-Age=${this.config.session!.ttl}`,
      'Path=/',
      'HttpOnly',
    ];

    if (this.config.session!.secure) {
      parts.push('Secure');
    }

    if (this.config.session!.sameSite) {
      parts.push(`SameSite=${this.config.session!.sameSite}`);
    }

    return parts.join('; ');
  }

  /**
   * Handle CORS headers
   */
  private handleCors(response: Response): Response {
    const corsHeaders: Record<string, string> = {};

    if (this.config.cors!.origins!.includes('*')) {
      corsHeaders['Access-Control-Allow-Origin'] = '*';
    } else {
      // Dynamic origin checking would go here
      corsHeaders['Access-Control-Allow-Origin'] = this.config.cors!.origins![0];
    }

    if (this.config.cors!.credentials) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }

    corsHeaders['Access-Control-Allow-Methods'] = this.config.cors!.methods!.join(', ');
    corsHeaders['Access-Control-Allow-Headers'] = this.config.cors!.headers!.join(', ');
    corsHeaders['Access-Control-Max-Age'] = '86400'; // 24 hours

    // Add CORS headers to response
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  }
}

/**
 * Create API key provider
 */
export function createApiKeyProvider(
  validKeys: Map<string, AuthResult> | ((key: string) => Promise<AuthResult | null>)
): AuthProvider {
  return {
    type: 'api-key',
    validate: async credentials => {
      if (!credentials.apiKey) return null;

      if (validKeys instanceof Map) {
        return validKeys.get(credentials.apiKey) || null;
      } else {
        return validKeys(credentials.apiKey);
      }
    },
  };
}

/**
 * Create basic auth provider
 */
export function createBasicAuthProvider(
  validate: (username: string, password: string) => Promise<AuthResult | null>
): AuthProvider {
  return {
    type: 'basic',
    validate: async credentials => {
      if (!credentials.username || !credentials.password) return null;
      return validate(credentials.username, credentials.password);
    },
  };
}
