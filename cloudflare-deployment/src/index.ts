/**
 * Creative Thinking MCP Server - Cloudflare Worker Entry Point
 *
 * This is the main entry point for the Cloudflare Worker that hosts
 * the Creative Thinking MCP Server with OAuth authentication.
 */

import OAuthProvider from '@cloudflare/workers-oauth-provider';
import { CreativeThinkingMcpAgent } from './CreativeThinkingMcpAgent.js';
import { AuthHandler } from './auth-handler.js';

// Export the Durable Object class
export { CreativeThinkingMcpAgent };

// Error logging function
async function logError(error: unknown, request: Request, env: Env): Promise<void> {
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : { message: String(error) },
      environment: env.ENVIRONMENT || 'production',
    };

    // Store error log in KV with expiry
    if (env.KV) {
      const errorId = crypto.randomUUID();
      await env.KV.put(
        `error:${errorId}`,
        JSON.stringify(errorLog),
        { expirationTtl: 86400 } // 24 hours
      );
    }

    // Log to console for Cloudflare Logpush
    console.error('Error logged:', errorLog);
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

// Define the Worker environment interface
export interface Env {
  KV: KVNamespace;
  CREATIVE_THINKING_AGENT: DurableObjectNamespace;
  OAUTH_PROVIDER?: any;
  AI?: any;
  ENVIRONMENT?: string;
  LOG_LEVEL?: string;
}

// Create and configure the OAuth Provider
const createOAuthProvider = (env: Env) => {
  return new OAuthProvider({
    // MCP endpoint where clients connect
    apiRoute: '/mcp',

    // Mount the MCP Agent at the API route
    apiHandler: async (request: Request) => {
      // Get or create Durable Object instance
      // Use a hash of the user ID or session ID for instance selection
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id') || 'default';
      const id = env.CREATIVE_THINKING_AGENT.idFromName(userId);
      const stub = env.CREATIVE_THINKING_AGENT.get(id);

      // Forward the request to the Durable Object
      return stub.fetch(request);
    },

    // Authentication handler
    defaultHandler: async (request: Request) => {
      const authHandler = new AuthHandler(env);
      return authHandler.fetch(request);
    },

    // OAuth endpoints
    authorizeEndpoint: '/authorize',
    tokenEndpoint: '/token',
    clientRegistrationEndpoint: '/register',

    // Optional: Custom configuration
    config: {
      issuer: 'https://creative-thinking.example.com',
      supportedResponseTypes: ['code'],
      supportedGrantTypes: ['authorization_code', 'refresh_token'],
      supportedScopes: ['read', 'write', 'execute'],
      tokenEndpointAuthMethods: ['client_secret_basic', 'client_secret_post'],
    },
  });
};

// Main Worker fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);

      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            version: '1.0.0',
            environment: env.ENVIRONMENT || 'production',
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // API documentation endpoint
      if (url.pathname === '/') {
        return new Response(getHomePage(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // WebSocket upgrade for direct connections (bypassing OAuth)
      if (request.headers.get('Upgrade') === 'websocket') {
        // For WebSocket connections, directly connect to Durable Object
        const userId = url.searchParams.get('user_id') || 'default';
        const id = env.CREATIVE_THINKING_AGENT.idFromName(userId);
        const stub = env.CREATIVE_THINKING_AGENT.get(id);
        return stub.fetch(request);
      }

      // Handle OAuth-protected endpoints
      if (!env.OAUTH_PROVIDER) {
        // Create OAuth provider if not already created
        env.OAUTH_PROVIDER = createOAuthProvider(env);
      }

      return env.OAUTH_PROVIDER.fetch(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);

      // Enhanced error handling with stack traces in development
      const isDevelopment = env.ENVIRONMENT === 'development';
      const errorResponse = {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        path: new URL(request.url).pathname,
        ...(isDevelopment && error instanceof Error && { stack: error.stack }),
      };

      // Log to Cloudflare Analytics if available
      if (ctx.waitUntil && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(logError(error, request, env));
      }

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Id': crypto.randomUUID(),
        },
      });
    }
  },
};

// Home page HTML
function getHomePage(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Creative Thinking MCP Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 18px;
          margin-bottom: 30px;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .feature {
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #5850ec;
        }
        .feature h3 {
          margin: 0 0 10px 0;
          color: #5850ec;
        }
        .endpoints {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
        }
        .endpoint {
          background: white;
          padding: 10px 15px;
          margin: 10px 0;
          border-radius: 4px;
          font-family: monospace;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .method {
          background: #5850ec;
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 12px;
        }
        .connect-btn {
          display: inline-block;
          background: #5850ec;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          margin-top: 20px;
          transition: opacity 0.2s;
        }
        .connect-btn:hover {
          opacity: 0.9;
        }
        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🧠 Creative Thinking MCP Server</h1>
        <p class="subtitle">A three-layer MCP server for structured creative problem-solving</p>
        
        <div class="features">
          <div class="feature">
            <h3>🔍 Discover</h3>
            <p>Analyze problems and get technique recommendations</p>
          </div>
          <div class="feature">
            <h3>📋 Plan</h3>
            <p>Create structured workflows with 23 techniques</p>
          </div>
          <div class="feature">
            <h3>🚀 Execute</h3>
            <p>Step-by-step guidance through thinking sessions</p>
          </div>
          <div class="feature">
            <h3>💾 Persist</h3>
            <p>Sessions saved with Durable Objects</p>
          </div>
        </div>
        
        <div class="endpoints">
          <h2>API Endpoints</h2>
          <div class="endpoint">
            <span>/mcp</span>
            <span class="method">MCP</span>
          </div>
          <div class="endpoint">
            <span>/authorize</span>
            <span class="method">OAuth</span>
          </div>
          <div class="endpoint">
            <span>/health</span>
            <span class="method">GET</span>
          </div>
          <div class="endpoint">
            <span>wss://[domain]/ws</span>
            <span class="method">WebSocket</span>
          </div>
        </div>
        
        <h2>Quick Start</h2>
        <p>Connect your MCP client to this server:</p>
        <code>https://${self.location.host}/mcp</code>
        
        <h2>Available Techniques</h2>
        <p>23 creative thinking techniques including Six Hats, SCAMPER, TRIZ, Design Thinking, First Principles, and more.</p>
        
        <a href="/authorize" class="connect-btn">Connect with OAuth →</a>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
          <p>Powered by Cloudflare Workers + Durable Objects + Agents SDK</p>
          <p>WebSocket hibernation enabled for cost-efficient real-time connections</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
