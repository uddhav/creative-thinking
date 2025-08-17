/**
 * Rate limiting middleware for Cloudflare Workers
 */

export interface RateLimitConfig {
  requests: number; // Number of requests allowed
  window: number; // Time window in seconds
  burst?: number; // Burst allowance
}

export class RateLimiter {
  constructor(
    private kv: KVNamespace,
    private config: RateLimitConfig = {
      requests: 100,
      window: 60, // 1 minute
      burst: 20,
    }
  ) {}

  /**
   * Check if request should be rate limited
   */
  async checkLimit(
    identifier: string
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.window * 1000;

    try {
      // Get current rate limit data
      const dataStr = await this.kv.get(key);
      let data: { count: number; resetAt: number; timestamps: number[] } | null = null;

      if (dataStr) {
        data = JSON.parse(dataStr);
        // Clean old timestamps
        if (data) {
          data.timestamps = data.timestamps.filter(ts => ts > windowStart);
        }
      }

      if (!data || data.resetAt < now) {
        // Reset if window expired
        data = {
          count: 0,
          resetAt: now + this.config.window * 1000,
          timestamps: [],
        };
      }

      // Check if limit exceeded
      const currentCount = data.timestamps.length;
      const maxAllowed = this.config.requests + (this.config.burst || 0);

      if (currentCount >= maxAllowed) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: data.resetAt,
        };
      }

      // Add current request
      data.timestamps.push(now);
      data.count = data.timestamps.length;

      // Save updated data
      await this.kv.put(key, JSON.stringify(data), {
        expirationTtl: this.config.window + 60, // Extra buffer
      });

      return {
        allowed: true,
        remaining: maxAllowed - data.count,
        resetAt: data.resetAt,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow request on error (fail open)
      return {
        allowed: true,
        remaining: this.config.requests,
        resetAt: now + this.config.window * 1000,
      };
    }
  }

  /**
   * Middleware function to enforce rate limits
   */
  async enforce(request: Request): Promise<Response | null> {
    // Get identifier (IP address or user ID)
    const identifier = this.getIdentifier(request);
    const result = await this.checkLimit(identifier);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': this.config.requests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Add rate limit headers to request for downstream use
    (request as any).rateLimitInfo = {
      limit: this.config.requests,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };

    return null; // Continue processing
  }

  /**
   * Get identifier for rate limiting (IP or user ID)
   */
  private getIdentifier(request: Request): string {
    // Try to get authenticated user ID first
    const userId = (request as any).user?.userId;
    if (userId) {
      return `user:${userId}`;
    }

    // Fall back to CF-Connecting-IP header
    const ip =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0] ||
      'unknown';

    return `ip:${ip}`;
  }

  /**
   * Create rate limiter with different configs for different endpoints
   */
  static forEndpoint(kv: KVNamespace, endpoint: string): RateLimiter {
    const configs: Record<string, RateLimitConfig> = {
      '/mcp': { requests: 100, window: 60, burst: 20 },
      '/authorize': { requests: 10, window: 60, burst: 5 },
      '/token': { requests: 5, window: 60, burst: 2 },
      '/ws': { requests: 50, window: 60, burst: 10 },
      default: { requests: 60, window: 60, burst: 10 },
    };

    const config = configs[endpoint] || configs.default;
    return new RateLimiter(kv, config);
  }
}
