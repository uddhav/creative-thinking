/**
 * Security Middleware
 *
 * Comprehensive security middleware for Cloudflare Workers
 */

import {
  AuthManager,
  createApiKeyProvider,
  createBasicAuthProvider,
} from '../security/AuthManager.js';
import { RateLimiter } from '../security/RateLimiter.js';
import type { Env } from '../index.js';

export interface SecurityConfig {
  /**
   * Enable authentication
   */
  auth?: {
    enabled: boolean;
    required?: boolean;
    providers?: Array<'api-key' | 'basic' | 'bearer'>;
  };

  /**
   * Rate limiting configuration
   */
  rateLimit?: {
    enabled: boolean;
    maxRequests?: number;
    windowSeconds?: number;
    keyExtractor?: (request: Request) => string;
  };

  /**
   * Security headers
   */
  headers?: {
    enabled: boolean;
    csp?: string;
    hsts?: boolean;
    noSniff?: boolean;
    frameOptions?: 'DENY' | 'SAMEORIGIN';
    xssProtection?: boolean;
  };

  /**
   * IP filtering
   */
  ipFilter?: {
    enabled: boolean;
    whitelist?: string[];
    blacklist?: string[];
  };

  /**
   * Request validation
   */
  validation?: {
    maxBodySize?: number;
    allowedMethods?: string[];
    allowedContentTypes?: string[];
  };
}

export class SecurityMiddleware {
  private config: SecurityConfig;
  private authManager?: AuthManager;
  private rateLimiter?: RateLimiter;

  constructor(env: Env, config: SecurityConfig = {}) {
    this.config = {
      auth: {
        enabled: true,
        required: false,
        providers: ['api-key', 'basic'],
        ...config.auth,
      },
      rateLimit: {
        enabled: true,
        maxRequests: 100,
        windowSeconds: 60,
        ...config.rateLimit,
      },
      headers: {
        enabled: true,
        hsts: true,
        noSniff: true,
        frameOptions: 'DENY',
        xssProtection: true,
        ...config.headers,
      },
      ipFilter: {
        enabled: false,
        ...config.ipFilter,
      },
      validation: {
        maxBodySize: 10 * 1024 * 1024, // 10MB
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedContentTypes: ['application/json', 'text/plain'],
        ...config.validation,
      },
      ...config,
    };

    // Initialize auth manager
    if (this.config.auth?.enabled) {
      this.initializeAuthManager(env);
    }

    // Initialize rate limiter
    if (this.config.rateLimit?.enabled) {
      this.rateLimiter = new RateLimiter(env.KV, {
        maxRequests: this.config.rateLimit.maxRequests!,
        windowSeconds: this.config.rateLimit.windowSeconds!,
        prefix: 'ratelimit',
      });
    }
  }

  /**
   * Apply all security middleware
   */
  async apply(request: Request, next: () => Promise<Response>): Promise<Response> {
    try {
      // IP filtering
      if (this.config.ipFilter?.enabled) {
        const ipCheck = this.checkIpFilter(request);
        if (ipCheck) return ipCheck;
      }

      // Request validation
      const validationCheck = await this.validateRequest(request);
      if (validationCheck) return validationCheck;

      // Rate limiting
      if (this.config.rateLimit?.enabled && this.rateLimiter) {
        const rateLimitCheck = await this.checkRateLimit(request);
        if (rateLimitCheck) return rateLimitCheck;
      }

      // Authentication
      let authContext: any = {};
      if (this.config.auth?.enabled && this.authManager) {
        authContext = await this.authManager.authenticate(request);

        if (this.config.auth.required && !authContext.user) {
          return this.unauthorizedResponse();
        }
      }

      // Add security context to request
      (request as any).security = {
        auth: authContext,
        ip: this.getClientIp(request),
        requestId: crypto.randomUUID(),
      };

      // Process request
      let response = await next();

      // Add security headers
      if (this.config.headers?.enabled) {
        response = this.addSecurityHeaders(response);
      }

      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Initialize auth manager
   */
  private initializeAuthManager(env: Env): void {
    const providers = [];

    // API Key provider
    if (this.config.auth?.providers?.includes('api-key')) {
      // In production, load from KV or external service
      const validKeys = new Map([
        ['demo-key', { authenticated: true, userId: 'demo', username: 'Demo User' }],
      ]);

      providers.push(createApiKeyProvider(validKeys));
    }

    // Basic auth provider
    if (this.config.auth?.providers?.includes('basic')) {
      providers.push(
        createBasicAuthProvider(async (username, password) => {
          // In production, validate against database
          if (username === 'demo' && password === 'demo') {
            return {
              authenticated: true,
              userId: 'demo',
              username: 'Demo User',
            };
          }
          return null;
        })
      );
    }

    this.authManager = new AuthManager({ providers }, env.KV);
  }

  /**
   * Check IP filter
   */
  private checkIpFilter(request: Request): Response | null {
    const ip = this.getClientIp(request);

    // Check blacklist
    if (this.config.ipFilter?.blacklist?.includes(ip)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Check whitelist
    if (
      this.config.ipFilter?.whitelist &&
      this.config.ipFilter.whitelist.length > 0 &&
      !this.config.ipFilter.whitelist.includes(ip)
    ) {
      return new Response('Forbidden', { status: 403 });
    }

    return null;
  }

  /**
   * Validate request
   */
  private async validateRequest(request: Request): Promise<Response | null> {
    // Check method
    if (!this.config.validation?.allowedMethods?.includes(request.method)) {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: this.config.validation!.allowedMethods!.join(', ') },
      });
    }

    // Check content type for requests with body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('Content-Type');

      if (contentType) {
        const baseType = contentType.split(';')[0].trim();
        if (!this.config.validation?.allowedContentTypes?.includes(baseType)) {
          return new Response('Unsupported Media Type', { status: 415 });
        }
      }

      // Check body size
      const contentLength = request.headers.get('Content-Length');
      if (contentLength) {
        const size = parseInt(contentLength);
        if (size > this.config.validation!.maxBodySize!) {
          return new Response('Payload Too Large', { status: 413 });
        }
      }
    }

    return null;
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(request: Request): Promise<Response | null> {
    if (!this.rateLimiter) return null;

    const key = this.config.rateLimit?.keyExtractor
      ? this.config.rateLimit.keyExtractor(request)
      : this.getClientIp(request);

    const result = await this.rateLimiter.consume(key);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter || 60),
            'X-RateLimit-Limit': String(this.config.rateLimit!.maxRequests!),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  }

  /**
   * Add security headers
   */
  private addSecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);

    // HSTS
    if (this.config.headers?.hsts) {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Content-Type Options
    if (this.config.headers?.noSniff) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Frame Options
    if (this.config.headers?.frameOptions) {
      headers.set('X-Frame-Options', this.config.headers.frameOptions);
    }

    // XSS Protection
    if (this.config.headers?.xssProtection) {
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Content Security Policy
    if (this.config.headers?.csp) {
      headers.set('Content-Security-Policy', this.config.headers.csp);
    }

    // Additional security headers
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    return (
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0] ||
      'unknown'
    );
  }

  /**
   * Unauthorized response
   */
  private unauthorizedResponse(): Response {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="MCP Server"',
      },
    });
  }
}

/**
 * Create security middleware function
 */
export function createSecurityMiddleware(env: Env, config?: SecurityConfig) {
  const security = new SecurityMiddleware(env, config);

  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    return security.apply(request, next);
  };
}
