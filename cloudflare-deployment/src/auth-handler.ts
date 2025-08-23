/**
 * Simple authentication handler for the Creative Thinking MCP Server
 * Supports both API key authentication and OAuth flow
 */

export interface AuthContext {
  userId: string;
  metadata?: Record<string, any>;
}

export class AuthHandler {
  constructor(private env: any) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle different auth endpoints
    if (path === '/authorize') {
      return this.handleAuthorize(request);
    }

    if (path === '/callback') {
      return this.handleCallback(request);
    }

    if (path === '/login') {
      return this.handleLogin(request);
    }

    // Default: show login page
    return this.showLoginPage();
  }

  private async handleAuthorize(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const state = url.searchParams.get('state');
    const scope = url.searchParams.get('scope');

    // For demo purposes, we'll use a simple form-based auth
    // In production, you'd integrate with GitHub, Google, etc.
    return new Response(this.getAuthorizePage(clientId, redirectUri, state, scope), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  private async handleCallback(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return new Response('Missing authorization code', { status: 400 });
    }

    // In a real implementation, exchange code for token with OAuth provider
    // For now, we'll generate a simple token
    const userId = 'demo-user-' + Date.now();
    const metadata = {
      authorizedAt: new Date().toISOString(),
      scope: 'read write',
    };

    // Complete the authorization flow
    const oauthProvider = this.env.OAUTH_PROVIDER;
    if (oauthProvider && oauthProvider.completeAuthorization) {
      const { redirectTo } = await oauthProvider.completeAuthorization({
        request: {
          code,
          state,
          scope: 'read write',
        },
        userId,
        metadata,
        scope: 'read write',
        props: {
          accessToken: this.generateToken(),
        },
      });

      // Ensure redirectTo has trailing slash removed if present
      return Response.redirect(redirectTo.replace(/\/$/, ''));
    }

    // Fallback redirect
    return Response.redirect(`${url.origin}/success?user=${userId}`);
  }

  private async handleLogin(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const formData = await request.formData();
    const apiKey = formData.get('api_key');
    const username = formData.get('username');

    // Use environment variables for credentials (required in production)
    const validApiKey = this.env.AUTH_API_KEY;
    const validUsername = this.env.AUTH_USERNAME;

    // Check if credentials are configured
    if (!validApiKey || !validUsername) {
      console.error('AUTH_API_KEY and AUTH_USERNAME must be configured');
      return new Response('Authentication not configured', { status: 500 });
    }

    // Simple validation - in production, verify against database
    if (apiKey === validApiKey || username === validUsername) {
      const code = this.generateAuthCode();
      const state = formData.get('state') || '';
      const redirectUri = formData.get('redirect_uri') || '/';

      // Store auth code in KV with expiry (5 minutes)
      if (this.env.KV) {
        await this.env.KV.put(
          `auth_code:${code}`,
          JSON.stringify({
            createdAt: Date.now(),
            userId: `user_${username}`,
            redirectUri,
            state,
          }),
          { expirationTtl: 300 }
        ); // 5 minutes
      }

      // Ensure redirectUri is a full URL for Response.redirect
      const fullRedirectUri = redirectUri.startsWith('http')
        ? redirectUri
        : `${new URL(request.url).origin}${redirectUri}`;
      return Response.redirect(`${fullRedirectUri}?code=${code}&state=${state}`);
    }

    return new Response('Invalid credentials', { status: 401 });
  }

  private showLoginPage(): Response {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Creative Thinking MCP - Login</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 400px;
            margin: 100px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 30px;
            text-align: center;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            color: #666;
            font-size: 14px;
          }
          input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }
          button {
            width: 100%;
            padding: 12px;
            background: #5850ec;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover {
            background: #4338ca;
          }
          .info {
            margin-top: 20px;
            padding: 15px;
            background: #f0f9ff;
            border-radius: 4px;
            font-size: 14px;
            color: #0369a1;
          }
          .divider {
            text-align: center;
            margin: 20px 0;
            color: #999;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🧠 Creative Thinking MCP</h1>
          
          <form method="POST" action="/login">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" placeholder="Enter username" required>
            </div>
            
            <div class="divider">OR</div>
            
            <div class="form-group">
              <label for="api_key">API Key</label>
              <input type="password" id="api_key" name="api_key" placeholder="Enter API key">
            </div>
            
            <input type="hidden" name="state" value="">
            <input type="hidden" name="redirect_uri" value="/callback">
            
            <button type="submit">Sign In</button>
          </form>
          
          <div class="info">
            <strong>Note:</strong> This is a demo authentication system.
            In production, integrate with your identity provider (GitHub, Google, etc.).
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  private getAuthorizePage(
    clientId: string | null,
    redirectUri: string | null,
    state: string | null,
    scope: string | null
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorize Creative Thinking MCP</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 500px;
            margin: 100px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .client-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .permissions {
            margin: 20px 0;
          }
          .permission {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .permission:last-child {
            border-bottom: none;
          }
          .buttons {
            display: flex;
            gap: 10px;
            margin-top: 30px;
          }
          button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .authorize {
            background: #5850ec;
            color: white;
          }
          .authorize:hover {
            opacity: 0.9;
          }
          .cancel {
            background: #e5e7eb;
            color: #374151;
          }
          .cancel:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🧠 Authorize Application</h1>
          
          <div class="client-info">
            <strong>${clientId || 'MCP Client'}</strong> wants to access your Creative Thinking MCP Server
          </div>
          
          <div class="permissions">
            <h3>This application will be able to:</h3>
            <div class="permission">✓ Discover creative thinking techniques</div>
            <div class="permission">✓ Plan thinking sessions</div>
            <div class="permission">✓ Execute thinking steps</div>
            <div class="permission">✓ Access session history</div>
          </div>
          
          <form method="POST" action="/callback">
            <input type="hidden" name="code" value="${this.generateAuthCode()}">
            <input type="hidden" name="state" value="${state || ''}">
            <input type="hidden" name="redirect_uri" value="${redirectUri || '/'}">
            
            <div class="buttons">
              <button type="submit" class="authorize">Authorize</button>
              <button type="button" class="cancel" onclick="window.close()">Cancel</button>
            </div>
          </form>
        </div>
      </body>
      </html>
    `;
  }

  private generateToken(): string {
    // Use crypto.randomUUID() for secure token generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `ct_token_${crypto.randomUUID()}`;
    }
    // Fallback to more secure random generation
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `ct_token_${token}`;
  }

  private generateAuthCode(): string {
    // Use crypto for secure auth code generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `auth_${crypto.randomUUID().substring(0, 12)}`;
    }
    // Fallback to crypto.getRandomValues
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const code = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `auth_${code}`;
  }
}

export default AuthHandler;
