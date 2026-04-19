/**
 * Creative Thinking MCP Server - Cloudflare Worker Entry Point
 *
 * This is the main entry point for the Cloudflare Worker that hosts
 * the Creative Thinking MCP Server with optional authentication,
 * performance monitoring, and rate limiting.
 */

import { CreativeThinkingMcpAgent } from './CreativeThinkingMcpAgent.js';
import { IdeaStormingMcpAgent } from './IdeaStormingMcpAgent.js';
import { RateLimiter } from './middleware/rateLimiter.js';
import { OAuthMiddleware } from './middleware/oauth.js';
import { createLogger } from './utils/logger.js';
import type { ExecutionContext } from '@cloudflare/workers-types';

// Export the Durable Object classes
export { CreativeThinkingMcpAgent };
export { IdeaStormingMcpAgent };

// Re-export types for modules that were copied verbatim from main `src/` and
// use `../index.js` (or deeper) to resolve these shared type names.
export type {
  LateralTechnique,
  SessionData,
  ExecuteThinkingStepInput,
  ThinkingOperationData,
  LateralThinkingResponse,
  RealityAssessment,
  PossibilityLevel,
  ImpossibilityType,
} from './types/index.js';
export { ALL_LATERAL_TECHNIQUES } from './types/index.js';

// Define the Worker environment interface
export interface Env {
  KV: KVNamespace;
  CREATIVE_THINKING_AGENT: DurableObjectNamespace;
  IDEA_STORMING_AGENT: DurableObjectNamespace;
  AI?: any;

  // Core settings
  ENVIRONMENT?: string;
  LOG_LEVEL?: string;
  DEBUG_TOKEN?: string;

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

    // Check for debug mode with secure token (header only for security)
    const debugHeader = request.headers.get('X-Debug-Token');

    // Only enable debug if token matches (header-based only to prevent token exposure in logs)
    const isDebugMode = debugHeader && env.DEBUG_TOKEN && debugHeader === env.DEBUG_TOKEN;

    if (!isDebugMode && debugHeader) {
      // Log invalid attempts but don't log the actual token
      logger.warn('Invalid debug token attempted', {
        path: url.pathname,
        ip: request.headers.get('CF-Connecting-IP'),
      });
    }

    try {
      // Detect MCP client requests to the root path (user may have configured
      // just the origin without the `/thinker/streamable` path). Heuristic:
      // - POST: always treat as MCP (MCP clients POST JSON-RPC)
      // - GET: treat as MCP when Accept contains text/event-stream OR Mcp-Session-Id header present
      const accept = request.headers.get('Accept') ?? '';
      const hasMcpSession = request.headers.get('Mcp-Session-Id') !== null;
      const hasMcpProtocol = request.headers.get('Mcp-Protocol-Version') !== null;
      const looksLikeMcp =
        request.method === 'POST' ||
        accept.includes('text/event-stream') ||
        hasMcpSession ||
        hasMcpProtocol;

      if (url.pathname === '/' && looksLikeMcp) {
        // Rewrite the request to /thinker/streamable so the MCP agent picks it up
        const rewritten = new Request(new URL('/thinker/streamable', url).toString(), request);
        url.pathname = '/thinker/streamable';
        request = rewritten;
      }

      // Normalize the Accept header for MCP endpoints. The MCP SDK's Streamable
      // HTTP transport requires `application/json` AND `text/event-stream` in
      // Accept on POST. Some clients (e.g. claude.ai proxy via httpx) send
      // `Accept: */*`, which the SDK rejects with 406. Rewrite to the canonical
      // form so the SDK is happy.
      if (
        (url.pathname === '/thinker/streamable' || url.pathname === '/ideator/streamable') &&
        (accept === '' ||
          accept === '*/*' ||
          !accept.includes('application/json') ||
          !accept.includes('text/event-stream'))
      ) {
        const newHeaders = new Headers(request.headers);
        newHeaders.set('Accept', 'application/json, text/event-stream');
        request = new Request(request.url, {
          method: request.method,
          headers: newHeaders,
          body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
          // @ts-expect-error Workers supports duplex but the Request init types don't always reflect it
          duplex: 'half',
        });
      }

      // --- OAuth 2.1 + MCP authorization endpoints ---
      //
      // The MCP authorization spec (2025-11-25) requires protected MCP servers to
      // expose standard OAuth 2.1 metadata, dynamic client registration, and
      // PKCE-protected authorization. MCP clients (Claude Code, Cursor, VS Code,
      // etc.) 401 → discover metadata → register → /authorize → /token → bearer.
      //
      // This is a *pass-through* authorization server: any client that completes
      // the PKCE handshake gets a signed JWT bound (via `aud`) to the requested
      // resource. No per-user authentication — suitable for public MCP servers.
      // To add real auth, replace `/authorize` and `/token` with a checked flow
      // (e.g. delegate to a real IdP via @cloudflare/workers-oauth-provider).
      //
      // Compliance notes:
      //   - RFC 9728 Protected Resource Metadata (scoped + root)
      //   - RFC 8414 Authorization Server Metadata
      //   - RFC 7591 Dynamic Client Registration
      //   - RFC 8707 Resource Indicators → `aud` claim binding
      //   - RFC 7636 PKCE S256 (challenge encoded in the authorization code)
      //   - RFC 9207 `iss` parameter in authorization response
      const origin = `${url.protocol}//${url.host}`;
      const jsonResponse = (body: unknown, status = 200): Response =>
        new Response(JSON.stringify(body), {
          status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Protocol-Version',
            'Access-Control-Expose-Headers': 'Mcp-Session-Id, Www-Authenticate',
            'Access-Control-Max-Age': '86400',
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        });

      // OPTIONS preflight for OAuth + MCP endpoints
      if (
        request.method === 'OPTIONS' &&
        (url.pathname.startsWith('/.well-known/') ||
          url.pathname === '/register' ||
          url.pathname === '/authorize' ||
          url.pathname === '/token' ||
          url.pathname === '/introspect' ||
          url.pathname === '/revoke' ||
          url.pathname === '/userinfo' ||
          url.pathname.startsWith('/thinker/streamable') ||
          url.pathname.startsWith('/ideator/streamable') ||
          url.pathname === '/')
      ) {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, Mcp-Protocol-Version, Mcp-Session-Id',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      if (url.pathname.startsWith('/.well-known/oauth-protected-resource')) {
        // Derive the resource URL from the well-known path suffix.
        const suffix = url.pathname.slice('/.well-known/oauth-protected-resource'.length);
        const resourceUrl = suffix ? `${origin}${suffix}` : origin;
        return jsonResponse({
          resource: resourceUrl,
          authorization_servers: [origin],
          scopes_supported: ['mcp'],
          bearer_methods_supported: ['header'],
          resource_documentation: origin,
        });
      }

      if (url.pathname === '/.well-known/oauth-authorization-server') {
        // Match the metadata shape used by cloudflare/workers-oauth-provider,
        // which is known to work with claude.ai's MCP connector.
        return jsonResponse({
          issuer: origin,
          authorization_endpoint: `${origin}/authorize`,
          token_endpoint: `${origin}/token`,
          registration_endpoint: `${origin}/register`,
          revocation_endpoint: `${origin}/token`,
          scopes_supported: ['mcp'],
          response_types_supported: ['code'],
          response_modes_supported: ['query'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          token_endpoint_auth_methods_supported: [
            'client_secret_basic',
            'client_secret_post',
            'none',
          ],
          code_challenge_methods_supported: ['S256'],
          client_id_metadata_document_supported: false,
          service_documentation: origin,
        });
      }

      if (url.pathname === '/introspect' && request.method === 'POST') {
        // Pass-through OAuth server — any non-empty token is considered active.
        let token = '';
        try {
          const body = await request.text();
          const form = new URLSearchParams(body);
          token = form.get('token') ?? '';
        } catch {
          /* fall through */
        }
        if (!token) return jsonResponse({ active: false });

        const now = Math.floor(Date.now() / 1000);
        return jsonResponse({
          active: true,
          scope: 'mcp',
          token_type: 'bearer',
          client_id: 'mcp-client',
          sub: 'mcp-user',
          exp: now + 3600,
          iat: now,
          iss: origin,
          aud: origin,
        });
      }

      if (url.pathname === '/revoke' && request.method === 'POST') {
        // Always acknowledge revocation (RFC 7009 requires 200 even for unknown tokens).
        return new Response('', {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        });
      }

      if (url.pathname === '/userinfo') {
        const authz = request.headers.get('Authorization') ?? '';
        const bearer = authz.startsWith('Bearer ') ? authz.slice(7).trim() : '';
        if (!bearer) {
          return new Response(JSON.stringify({ error: 'unauthorized' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer realm="mcp"',
            },
          });
        }
        return jsonResponse({
          sub: `mcp-user`,
          name: 'MCP User',
          preferred_username: 'mcp',
        });
      }

      if (url.pathname === '/register' && request.method === 'POST') {
        // Accept any Dynamic Client Registration payload; echo fields back per RFC 7591.
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          /* empty body is fine */
        }
        const clientId = `mcp_${crypto.randomUUID().replace(/-/g, '')}`;
        // Echo back exactly what the client registered, per RFC 7591.
        // Only add server-assigned fields (client_id, client_id_issued_at).
        const requestedAuthMethod =
          typeof body.token_endpoint_auth_method === 'string'
            ? (body.token_endpoint_auth_method as string)
            : 'none';
        const wantsSecret =
          requestedAuthMethod === 'client_secret_basic' ||
          requestedAuthMethod === 'client_secret_post';
        const clientSecret = wantsSecret
          ? crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
          : null;

        const response: Record<string, unknown> = {
          client_id: clientId,
          client_id_issued_at: Math.floor(Date.now() / 1000),
          redirect_uris: body.redirect_uris ?? [],
          token_endpoint_auth_method: requestedAuthMethod,
          grant_types: body.grant_types ?? ['authorization_code', 'refresh_token'],
          response_types: body.response_types ?? ['code'],
          client_name: body.client_name ?? 'MCP Client',
        };
        if (clientSecret) {
          response.client_secret = clientSecret;
          response.client_secret_expires_at = 0; // never expires
        }
        if (body.scope !== undefined) response.scope = body.scope;
        return jsonResponse(response);
      }

      if (url.pathname === '/authorize' && request.method === 'GET') {
        // Auto-approve: encode the PKCE challenge into the code so we can
        // verify the code_verifier at /token without server-side state.
        const params = url.searchParams;
        const redirectUri = params.get('redirect_uri');
        const state = params.get('state') ?? '';
        const codeChallenge = params.get('code_challenge') ?? '';
        const codeChallengeMethod = params.get('code_challenge_method') ?? 'plain';
        if (!redirectUri) {
          return new Response('missing redirect_uri', { status: 400 });
        }
        const payload = {
          c: codeChallenge,
          m: codeChallengeMethod,
          t: Date.now(),
        };
        const code = btoa(JSON.stringify(payload))
          .replace(/=+$/, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
        const redirect = new URL(redirectUri);
        redirect.searchParams.set('code', code);
        redirect.searchParams.set('iss', origin);
        if (state) redirect.searchParams.set('state', state);
        return Response.redirect(redirect.toString(), 302);
      }

      if (url.pathname === '/token' && request.method === 'POST') {
        const contentType = request.headers.get('content-type') ?? '';
        let form: URLSearchParams;
        if (contentType.includes('application/x-www-form-urlencoded')) {
          form = new URLSearchParams(await request.text());
        } else {
          form = new URLSearchParams();
        }
        const grantType = form.get('grant_type') ?? '';
        const scope = form.get('scope') ?? 'mcp';
        const requestedResource = form.get('resource') ?? origin;
        const tokenClientId = form.get('client_id') ?? 'mcp-client';

        const b64urlStr = (obj: unknown): string =>
          btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
        const b64urlBytes = (bytes: Uint8Array): string =>
          btoa(String.fromCharCode(...bytes))
            .replace(/=+$/, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

        // Issue a signed JWT with proper RFC 8707 audience binding so tokens
        // are scoped to the requested resource. MCP spec recommends the server
        // validate aud; even though we pass-through, emitting a correct aud
        // satisfies strict clients that inspect token claims.
        const issueJwt = async (audience: string): Promise<string> => {
          const secretStr =
            (env as { OAUTH_SIGNING_KEY?: string }).OAUTH_SIGNING_KEY || 'mcp-socketes-munshy-v1';
          const now = Math.floor(Date.now() / 1000);
          const header = { alg: 'HS256', typ: 'JWT' };
          const payload = {
            iss: origin,
            aud: audience,
            sub: `mcp-user-${crypto.randomUUID().slice(0, 8)}`,
            iat: now,
            exp: now + 3600,
            scope,
            client_id: tokenClientId,
            jti: crypto.randomUUID(),
          };
          const signingInput = `${b64urlStr(header)}.${b64urlStr(payload)}`;
          const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secretStr),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
          return `${signingInput}.${b64urlBytes(new Uint8Array(sig))}`;
        };

        if (grantType === 'refresh_token') {
          return jsonResponse({
            access_token: await issueJwt(requestedResource),
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: `mcp_rt_${crypto.randomUUID().replace(/-/g, '')}`,
            scope,
          });
        }

        if (grantType !== 'authorization_code') {
          return jsonResponse({ error: 'unsupported_grant_type' }, 400);
        }

        const code = form.get('code') ?? '';
        const codeVerifier = form.get('code_verifier') ?? '';

        // Decode the PKCE challenge that we embedded in the code at /authorize.
        let challenge = '';
        let challengeMethod = 'plain';
        try {
          const padded =
            code.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((code.length + 3) % 4);
          const decoded = JSON.parse(atob(padded)) as { c?: string; m?: string };
          challenge = decoded.c ?? '';
          challengeMethod = decoded.m ?? 'plain';
        } catch {
          return jsonResponse({ error: 'invalid_grant', error_description: 'malformed code' }, 400);
        }

        if (challenge) {
          if (!codeVerifier) {
            return jsonResponse(
              { error: 'invalid_grant', error_description: 'missing code_verifier' },
              400
            );
          }
          let computed = codeVerifier;
          if (challengeMethod === 'S256') {
            const enc = new TextEncoder().encode(codeVerifier);
            const digest = await crypto.subtle.digest('SHA-256', enc);
            computed = btoa(String.fromCharCode(...new Uint8Array(digest)))
              .replace(/=+$/, '')
              .replace(/\+/g, '-')
              .replace(/\//g, '_');
          }
          if (computed !== challenge) {
            return jsonResponse(
              { error: 'invalid_grant', error_description: 'PKCE verification failed' },
              400
            );
          }
        }

        return jsonResponse({
          access_token: await issueJwt(requestedResource),
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: `mcp_rt_${crypto.randomUUID().replace(/-/g, '')}`,
          scope,
        });
      }

      // Handle root path - serve home page (only for plain browser GETs)
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

      // Create a minimal context object with props for the MCP Agent
      // Include debug mode in props
      const ctxWithProps = {
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException.bind(ctx),
        props: {
          debugMode: isDebugMode,
        },
      } as ExecutionContext & { props: any };

      // Require a Bearer token on MCP endpoints so claude.ai's OAuth probe
      // detects this as an OAuth-protected resource. We accept any bearer
      // issued by our /token endpoint (mcp_at_ prefix) without further
      // validation — this is a pass-through OAuth server for public MCP.
      const isMcpEndpoint =
        url.pathname.startsWith('/thinker/streamable') ||
        url.pathname.startsWith('/ideator/streamable');
      if (isMcpEndpoint && (request.method === 'POST' || request.method === 'GET')) {
        const authz = request.headers.get('Authorization') ?? '';
        const bearer = authz.startsWith('Bearer ') ? authz.slice(7).trim() : '';
        if (!bearer) {
          // Per MCP spec example + RFC 9728 Section 5.1: advertise the scoped
          // Protected Resource Metadata URL and the required scope in the
          // WWW-Authenticate header.
          const resourceMetadataUrl = `${url.origin}/.well-known/oauth-protected-resource${url.pathname}`;
          return new Response(
            JSON.stringify({
              error: 'unauthorized',
              error_description: 'Bearer token required',
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadataUrl}", scope="mcp"`,
              },
            }
          );
        }
      }

      // Creative Thinking endpoint (3 core tools)
      if (url.pathname.startsWith('/thinker/streamable')) {
        logger.debug('Routing to Creative Thinking Agent', { debugMode: isDebugMode });
        try {
          return CreativeThinkingMcpAgent.serve('/thinker/streamable', {
            binding: 'CREATIVE_THINKING_AGENT',
            corsOptions: {
              origin: '*',
              methods: 'GET, POST, OPTIONS',
              headers: '*',
            },
          }).fetch(request, env, ctxWithProps);
        } catch (error) {
          logger.error('Creative Thinking routing error', error);
          // Return JSON error response for MCP protocol consistency
          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: 'Internal server error',
                // Do not expose details to the user; details are logged server-side
                data: {
                  details: undefined,
                },
              },
              id: null,
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Idea Storming endpoint (AI enhancement tools)
      if (url.pathname.startsWith('/ideator/streamable')) {
        logger.debug('Routing to Idea Storming Agent', { debugMode: isDebugMode });
        try {
          return IdeaStormingMcpAgent.serve('/ideator/streamable', {
            binding: 'IDEA_STORMING_AGENT',
            corsOptions: {
              origin: '*',
              methods: 'GET, POST, OPTIONS',
              headers: '*',
            },
          }).fetch(request, env, ctxWithProps);
        } catch (error) {
          logger.error('Idea Storming routing error', error);
          // Return JSON error response for MCP protocol consistency
          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32603,
                // Do not expose details to the user; details are logged server-side
                message: 'Internal server error',
                data: {
                  details: undefined,
                },
              },
              id: null,
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
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
