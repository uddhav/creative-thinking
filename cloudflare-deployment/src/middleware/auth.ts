/**
 * Authentication middleware for validating tokens
 */

import { randomUUID } from 'node:crypto';

export interface TokenData {
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActivity?: number;
  scope?: string;
  metadata?: Record<string, any>;
}

export class AuthMiddleware {
  constructor(private kv: KVNamespace) {}

  /**
   * Validate a bearer token from the Authorization header
   */
  async validateToken(request: Request): Promise<TokenData | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token || !token.startsWith('ct_token_')) {
      return null;
    }

    try {
      // Retrieve token from KV
      const tokenDataStr = await this.kv.get(`token:${token}`);
      if (!tokenDataStr) {
        return null;
      }

      const tokenData = JSON.parse(tokenDataStr) as TokenData;

      // Check if token is expired
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        // Clean up expired token
        await this.kv.delete(`token:${token}`);
        return null;
      }

      // Update last activity
      tokenData.lastActivity = Date.now();
      await this.kv.put(`token:${token}`, JSON.stringify(tokenData), {
        expirationTtl: Math.floor((tokenData.expiresAt - Date.now()) / 1000),
      });

      return tokenData;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Create a new token with expiry
   */
  async createToken(
    userId: string,
    expiryHours: number = 24,
    metadata?: Record<string, any>
  ): Promise<string> {
    // Generate secure token
    const tokenId = randomUUID();
    const token = `ct_token_${tokenId}`;

    const tokenData: TokenData = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
      metadata,
    };

    // Store in KV with TTL
    await this.kv.put(`token:${token}`, JSON.stringify(tokenData), {
      expirationTtl: expiryHours * 60 * 60, // Convert to seconds
    });

    return token;
  }

  /**
   * Revoke a token
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      await this.kv.delete(`token:${token}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Exchange auth code for token
   */
  async exchangeCodeForToken(code: string): Promise<string | null> {
    try {
      // Retrieve auth code from KV
      const codeDataStr = await this.kv.get(`auth_code:${code}`);
      if (!codeDataStr) {
        return null;
      }

      const codeData = JSON.parse(codeDataStr);

      // Delete auth code (single use)
      await this.kv.delete(`auth_code:${code}`);

      // Check if code is expired (5 minutes)
      if (Date.now() - codeData.createdAt > 5 * 60 * 1000) {
        return null;
      }

      // Create token
      return await this.createToken(codeData.userId, 24, {
        authMethod: 'oauth_code',
        ...codeData,
      });
    } catch (error) {
      console.error('Code exchange error:', error);
      return null;
    }
  }

  /**
   * Middleware function to check authentication
   */
  async requireAuth(request: Request): Promise<Response | null> {
    const tokenData = await this.validateToken(request);

    if (!tokenData) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or missing authentication token',
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

    // Attach user context to request for downstream use
    (request as any).user = {
      userId: tokenData.userId,
      metadata: tokenData.metadata,
    };

    return null; // Continue processing
  }
}
