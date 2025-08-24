/**
 * OAuth 2.0 Middleware for Creative Thinking MCP Server
 *
 * Provides optional OAuth authentication with support for:
 * - Authorization code flow (for web clients)
 * - Client credentials flow (for service-to-service)
 * - Token validation and refresh
 * - Multiple OAuth providers (GitHub, Google, custom)
 */

import { randomUUID } from 'node:crypto';
import { createLogger, type Logger } from '../utils/logger.js';
import type { ExecutionContext } from '@cloudflare/workers-types';
import type { Env } from '../index.js';

export interface TokenData {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
  metadata?: Record<string, any>;
}

export interface AuthResult {
  valid: boolean;
  userId?: string;
  scope?: string;
  metadata?: Record<string, any>;
}

export interface OAuthProvider {
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  scope?: string;
}

// Built-in OAuth providers
const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  github: {
    name: 'GitHub',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'user:email',
  },
  google: {
    name: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
};

export class OAuthMiddleware {
  private logger: Logger;
  private provider: OAuthProvider;

  constructor(
    private env: Env,
    private ctx: ExecutionContext
  ) {
    this.logger = createLogger(env, 'OAuthMiddleware');
    this.provider = this.getProvider();
  }

  /**
   * Get OAuth provider configuration
   */
  private getProvider(): OAuthProvider {
    const providerName = this.env.OAUTH_PROVIDER || 'github';

    // Use built-in provider if available
    if (OAUTH_PROVIDERS[providerName]) {
      return OAUTH_PROVIDERS[providerName];
    }

    // Use custom provider configuration
    return {
      name: 'Custom',
      authorizeUrl: this.env.OAUTH_AUTHORIZE_URL || '',
      tokenUrl: this.env.OAUTH_TOKEN_URL || '',
      userInfoUrl: this.env.OAUTH_USER_INFO_URL,
      scope: this.env.OAUTH_SCOPE,
    };
  }

  /**
   * Handle OAuth authorization request
   */
  async authorize(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const state = randomUUID();
    const redirectUri = this.env.OAUTH_REDIRECT_URI;

    if (!redirectUri || !this.env.OAUTH_CLIENT_ID) {
      return new Response(
        JSON.stringify({
          error: 'OAuth not configured',
          message: 'OAUTH_CLIENT_ID and OAUTH_REDIRECT_URI must be set',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store state for CSRF protection
    await this.env.KV.put(
      `oauth_state:${state}`,
      JSON.stringify({
        createdAt: Date.now(),
        returnTo: url.searchParams.get('return_to') || '/',
      }),
      { expirationTtl: 600 }
    ); // 10 minutes

    // Build authorization URL
    const authUrl = new URL(this.provider.authorizeUrl);
    authUrl.searchParams.set('client_id', this.env.OAUTH_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    if (this.provider.scope) {
      authUrl.searchParams.set('scope', this.provider.scope);
    }

    this.logger.info('OAuth authorization initiated', {
      provider: this.provider.name,
      state,
    });

    return Response.redirect(authUrl.toString(), 302);
  }

  /**
   * Handle OAuth callback
   */
  async callback(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      this.logger.warn('OAuth callback error', {
        error,
        description: url.searchParams.get('error_description'),
      });
      return new Response(
        JSON.stringify({
          error: 'OAuth Error',
          message: `Authentication failed: ${error}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!code || !state) {
      return new Response(
        JSON.stringify({
          error: 'Invalid Request',
          message: 'Missing code or state parameter',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify state
    const stateData = await this.env.KV.get(`oauth_state:${state}`);
    if (!stateData) {
      this.logger.warn('Invalid or expired OAuth state', { state });
      return new Response(
        JSON.stringify({
          error: 'Invalid State',
          message: 'OAuth state is invalid or expired',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete used state
    await this.env.KV.delete(`oauth_state:${state}`);

    try {
      // Exchange code for token
      const tokenResponse = await this.exchangeCodeForToken(code);
      if (!tokenResponse.success || !tokenResponse.data) {
        return new Response(
          JSON.stringify({
            error: 'Token Exchange Failed',
            message: tokenResponse.error,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { returnTo } = JSON.parse(stateData);
      const redirectUrl = new URL(returnTo, url.origin);

      // Add token to redirect URL (for client-side handling) or set cookie
      redirectUrl.searchParams.set('access_token', tokenResponse.data.accessToken);

      this.logger.info('OAuth callback successful', {
        userId: tokenResponse.data.userId,
        provider: this.provider.name,
      });

      return Response.redirect(redirectUrl.toString(), 302);
    } catch (error) {
      this.logger.error('OAuth callback error', error);
      return new Response(
        JSON.stringify({
          error: 'Authentication Failed',
          message: 'Unable to complete authentication',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Handle token endpoint (for client credentials flow)
   */
  async token(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const contentType = request.headers.get('Content-Type');
    if (!contentType?.includes('application/x-www-form-urlencoded')) {
      return new Response('Unsupported Media Type', { status: 415 });
    }

    const body = await request.text();
    const params = new URLSearchParams(body);
    const grantType = params.get('grant_type');

    if (grantType === 'client_credentials') {
      return this.handleClientCredentials(params);
    } else if (grantType === 'refresh_token') {
      return this.handleRefreshToken(params);
    }

    return new Response(
      JSON.stringify({
        error: 'unsupported_grant_type',
        error_description: 'Only client_credentials and refresh_token grant types are supported',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Validate authorization token from request
   */
  async validate(request: Request): Promise<AuthResult> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false };
    }

    const token = authHeader.substring(7);
    if (!token) {
      return { valid: false };
    }

    try {
      // Check if token exists in KV
      const tokenDataStr = await this.env.KV.get(`oauth_token:${token}`);
      if (!tokenDataStr) {
        return { valid: false };
      }

      const tokenData = JSON.parse(tokenDataStr) as TokenData;

      // Check if token is expired
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        // Try to refresh token if refresh token is available
        if (tokenData.refreshToken) {
          const refreshResult = await this.refreshTokenInternal(tokenData.refreshToken);
          if (refreshResult.success && refreshResult.data) {
            return {
              valid: true,
              userId: refreshResult.data.userId,
              scope: refreshResult.data.scope,
              metadata: refreshResult.data.metadata,
            };
          }
        }

        // Clean up expired token
        await this.env.KV.delete(`oauth_token:${token}`);
        return { valid: false };
      }

      // Update last activity
      tokenData.metadata = { ...tokenData.metadata, lastActivity: Date.now() };

      // Background update (don't await)
      this.ctx.waitUntil(
        this.env.KV.put(`oauth_token:${token}`, JSON.stringify(tokenData), {
          expirationTtl: Math.floor((tokenData.expiresAt - Date.now()) / 1000),
        })
      );

      return {
        valid: true,
        userId: tokenData.userId,
        scope: tokenData.scope,
        metadata: tokenData.metadata,
      };
    } catch (error) {
      this.logger.error('Token validation error', error);
      return { valid: false };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<{
    success: boolean;
    data?: TokenData;
    error?: string;
  }> {
    try {
      const tokenRequest = new Request(this.provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: this.env.OAUTH_CLIENT_ID!,
          client_secret: this.env.OAUTH_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.env.OAUTH_REDIRECT_URI!,
        }),
      });

      const response = await fetch(tokenRequest);
      const data = (await response.json()) as any;

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error_description || data.error || 'Token exchange failed',
        };
      }

      // Get user info
      const userInfo = await this.getUserInfo(data.access_token);
      const userId = userInfo.id || userInfo.login || userInfo.email || randomUUID();

      // Create our token
      const ourToken = `ct_oauth_${randomUUID()}`;
      const expiresIn = data.expires_in ? parseInt(data.expires_in) : 3600; // Default 1 hour
      const expiresAt = Date.now() + expiresIn * 1000;

      const tokenData: TokenData = {
        userId: String(userId),
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        scope: data.scope,
        metadata: {
          provider: this.provider.name,
          userInfo,
          createdAt: Date.now(),
        },
      };

      // Store token in KV
      await this.env.KV.put(`oauth_token:${ourToken}`, JSON.stringify(tokenData), {
        expirationTtl: expiresIn,
      });

      return {
        success: true,
        data: {
          ...tokenData,
          accessToken: ourToken, // Return our token, not the provider's
        },
      };
    } catch (error) {
      this.logger.error('Token exchange error', error);
      return {
        success: false,
        error: 'Token exchange failed',
      };
    }
  }

  /**
   * Get user info from OAuth provider
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    if (!this.provider.userInfoUrl) {
      return { id: 'unknown' };
    }

    try {
      const response = await fetch(this.provider.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      this.logger.warn('Failed to get user info', error);
    }

    return { id: 'unknown' };
  }

  /**
   * Handle client credentials grant
   */
  private async handleClientCredentials(params: URLSearchParams): Promise<Response> {
    const clientId = params.get('client_id');
    const clientSecret = params.get('client_secret');

    // Validate client credentials
    if (clientId !== this.env.OAUTH_CLIENT_ID || clientSecret !== this.env.OAUTH_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create service token
    const token = `ct_service_${randomUUID()}`;
    const expiresIn = 3600; // 1 hour
    const expiresAt = Date.now() + expiresIn * 1000;

    const tokenData: TokenData = {
      userId: `service:${clientId}`,
      accessToken: token,
      expiresAt,
      scope: 'service',
      metadata: {
        grantType: 'client_credentials',
        createdAt: Date.now(),
      },
    };

    await this.env.KV.put(`oauth_token:${token}`, JSON.stringify(tokenData), {
      expirationTtl: expiresIn,
    });

    return new Response(
      JSON.stringify({
        access_token: token,
        token_type: 'bearer',
        expires_in: expiresIn,
        scope: 'service',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Handle refresh token grant
   */
  private async handleRefreshToken(params: URLSearchParams): Promise<Response> {
    const refreshToken = params.get('refresh_token');
    if (!refreshToken) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          error_description: 'Missing refresh_token parameter',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await this.refreshTokenInternal(refreshToken);
    if (!result.success || !result.data) {
      return new Response(
        JSON.stringify({
          error: 'invalid_grant',
          error_description: result.error,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const expiresIn = Math.floor((result.data.expiresAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        access_token: result.data.accessToken,
        token_type: 'bearer',
        expires_in: expiresIn,
        scope: result.data.scope,
        refresh_token: result.data.refreshToken,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Refresh token internally
   */
  private async refreshTokenInternal(refreshToken: string): Promise<{
    success: boolean;
    data?: TokenData;
    error?: string;
  }> {
    try {
      // This would typically involve calling the OAuth provider's token endpoint
      // For now, we'll just extend the current token if it exists

      // Find token by refresh token (this is a simplified implementation)
      // In production, you'd want to store refresh tokens separately
      const keys = await this.env.KV.list({ prefix: 'oauth_token:' });

      for (const key of keys.keys) {
        const tokenDataStr = await this.env.KV.get(key.name);
        if (tokenDataStr) {
          const tokenData = JSON.parse(tokenDataStr) as TokenData;
          if (tokenData.refreshToken === refreshToken) {
            // Create new token
            const newToken = `ct_oauth_${randomUUID()}`;
            const expiresIn = 3600; // 1 hour
            const expiresAt = Date.now() + expiresIn * 1000;

            const newTokenData: TokenData = {
              ...tokenData,
              accessToken: newToken,
              expiresAt,
              metadata: {
                ...tokenData.metadata,
                refreshedAt: Date.now(),
              },
            };

            // Store new token
            await this.env.KV.put(`oauth_token:${newToken}`, JSON.stringify(newTokenData), {
              expirationTtl: expiresIn,
            });

            // Delete old token
            await this.env.KV.delete(key.name);

            return {
              success: true,
              data: newTokenData,
            };
          }
        }
      }

      return {
        success: false,
        error: 'Invalid refresh token',
      };
    } catch (error) {
      this.logger.error('Token refresh error', error);
      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  }
}
