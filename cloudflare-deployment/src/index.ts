/**
 * Creative Thinking MCP Server - Cloudflare Worker Entry Point
 *
 * This is the main entry point for the Cloudflare Worker that hosts
 * the Creative Thinking MCP Server with optional authentication,
 * performance monitoring, and rate limiting.
 */

import { CreativeThinkingMcpAgent } from './CreativeThinkingMcpAgent.js';
import { RateLimiter } from './middleware/rateLimiter.js';
import { OAuthMiddleware } from './middleware/oauth.js';
import { createLogger } from './utils/logger.js';
import type { ExecutionContext } from '@cloudflare/workers-types';

// Export the Durable Object class
export { CreativeThinkingMcpAgent };

// Define the Worker environment interface
export interface Env {
  KV: KVNamespace;
  CREATIVE_THINKING_AGENT: DurableObjectNamespace;
  AI?: any;

  // Core settings
  ENVIRONMENT?: string;
  LOG_LEVEL?: string;

  // OAuth settings (optional)
  OAUTH_ENABLED?: string;
  OAUTH_REQUIRED?: string;
  OAUTH_PROVIDER?: string;
  OAUTH_AUTHORIZE_URL?: string;
  OAUTH_TOKEN_URL?: string;
  OAUTH_USER_INFO_URL?: string;
  OAUTH_SCOPE?: string;
  OAUTH_REDIRECT_URI?: string;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;

  // Rate limiting
  RATE_LIMIT_ENABLED?: string;
  RATE_LIMIT_ANONYMOUS?: string;
  RATE_LIMIT_AUTHENTICATED?: string;

  // Performance monitoring
  PERFORMANCE_MONITORING?: string;
  METRICS_SAMPLE_RATE?: string;
}

/**
 * Handle OAuth authorization flow
 */
async function handleOAuthEndpoint(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  pathname: string
): Promise<Response> {
  if (env.OAUTH_ENABLED !== 'true') {
    return new Response('OAuth not enabled', { status: 404 });
  }

  const oauth = new OAuthMiddleware(env, ctx);

  switch (pathname) {
    case '/oauth/authorize':
      return oauth.authorize(request);
    case '/oauth/callback':
      return oauth.callback(request);
    case '/oauth/token':
      return oauth.token(request);
    default:
      return new Response('Not Found', { status: 404 });
  }
}

/**
 * Main Worker export with simplified MCP Agent routing
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const logger = createLogger(env, 'Worker');
    const url = new URL(request.url);

    logger.debug(`${request.method} ${url.pathname}`, {
      userAgent: request.headers.get('User-Agent'),
      origin: request.headers.get('Origin'),
    });

    try {
      // Handle root path - serve home page
      if (url.pathname === '/') {
        return new Response(
          `<!DOCTYPE html>
<html>
<head>
    <title>munshy</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .header { color: #2563eb; font-size: 2em; margin-bottom: 0.5em; }
        .tagline { color: #666; font-size: 1.2em; }
    </style>
</head>
<body>
    <h1 class="header">munshy</h1>
    <p class="tagline">by your side, always</p>
</body>
</html>`,
          {
            headers: { 'Content-Type': 'text/html' },
          }
        );
      }

      // Handle health check
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: env.ENVIRONMENT || 'development',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Handle OAuth endpoints
      if (url.pathname.startsWith('/oauth/')) {
        return handleOAuthEndpoint(request, env, ctx, url.pathname);
      }

      // Apply rate limiting for MCP endpoints (before auth)
      if (env.RATE_LIMIT_ENABLED === 'true') {
        const rateLimiter = RateLimiter.forEndpoint(env.KV, url.pathname);
        const rateLimitResult = await rateLimiter.enforce(request);
        if (rateLimitResult) {
          logger.warn('Rate limit exceeded', {
            path: url.pathname,
            ip: request.headers.get('CF-Connecting-IP'),
          });
          return rateLimitResult;
        }
      }

      // Apply OAuth authentication for MCP endpoints (if enabled and required)
      if (env.OAUTH_ENABLED === 'true' && env.OAUTH_REQUIRED === 'true') {
        const oauth = new OAuthMiddleware(env, ctx);
        const authResult = await oauth.validate(request);

        if (!authResult.valid) {
          logger.warn('Authentication required but not provided', {
            path: url.pathname,
          });
          return new Response(
            JSON.stringify({
              error: 'Unauthorized',
              message: 'Authentication required. Please authenticate via OAuth.',
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                'WWW-Authenticate': 'Bearer realm="Creative Thinking MCP"',
              },
            }
          );
        }

        // Add user ID to request headers for the MCP agent
        if (authResult.userId) {
          request = new Request(request, {
            headers: {
              ...Object.fromEntries(request.headers),
              'X-User-ID': authResult.userId,
            },
          });
        }
      }

      // SSE transport endpoint
      if (url.pathname.startsWith('/sse')) {
        logger.debug('Routing to SSE transport');
        return CreativeThinkingMcpAgent.serveSSE('/sse', {
          binding: 'CREATIVE_THINKING_AGENT',
          corsOptions: {
            origin: '*',
            methods: 'GET, POST, OPTIONS',
            headers: '*',
          },
        }).fetch(request, env, ctx);
      }

      // Streamable HTTP transport endpoint
      if (url.pathname === '/mcp') {
        logger.debug('Routing to Streamable HTTP transport');
        return CreativeThinkingMcpAgent.serve('/mcp', {
          binding: 'CREATIVE_THINKING_AGENT',
          corsOptions: {
            origin: '*',
            methods: 'GET, POST, OPTIONS',
            headers: '*',
          },
        }).fetch(request, env, ctx);
      }

      // Default 404 for unknown paths
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      logger.error('Worker error', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
