/**
 * Rate Limiter
 *
 * Token bucket rate limiting for Cloudflare Workers
 */

import type { Env } from '../index.js';

export interface RateLimitConfig {
  /**
   * Maximum requests per window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Key prefix for storage
   */
  prefix?: string;

  /**
   * Whether to use sliding window
   */
  slidingWindow?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private kv: KVNamespace;

  constructor(kv: KVNamespace, config: RateLimitConfig) {
    this.kv = kv;
    this.config = {
      prefix: 'ratelimit',
      slidingWindow: false,
      ...config,
    };
  }

  /**
   * Check rate limit for a key
   */
  async check(key: string): Promise<RateLimitResult> {
    const storageKey = `${this.config.prefix}:${key}`;
    const now = Date.now();
    const windowStart = now - this.config.windowSeconds * 1000;

    if (this.config.slidingWindow) {
      return this.checkSlidingWindow(storageKey, now, windowStart);
    } else {
      return this.checkFixedWindow(storageKey, now);
    }
  }

  /**
   * Consume a token if available
   */
  async consume(key: string): Promise<RateLimitResult> {
    const result = await this.check(key);

    if (result.allowed) {
      await this.increment(key);
    }

    return result;
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    const storageKey = `${this.config.prefix}:${key}`;
    await this.kv.delete(storageKey);
  }

  /**
   * Check fixed window rate limit
   */
  private async checkFixedWindow(storageKey: string, now: number): Promise<RateLimitResult> {
    const data = (await this.kv.get(storageKey, 'json')) as any;

    if (!data || data.resetAt <= now) {
      // New window
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: now + this.config.windowSeconds * 1000,
      };
    }

    const remaining = this.config.maxRequests - data.count;
    const allowed = remaining > 0;

    return {
      allowed,
      remaining: Math.max(0, remaining - 1),
      resetAt: data.resetAt,
      retryAfter: allowed ? undefined : Math.ceil((data.resetAt - now) / 1000),
    };
  }

  /**
   * Check sliding window rate limit
   */
  private async checkSlidingWindow(
    storageKey: string,
    now: number,
    windowStart: number
  ): Promise<RateLimitResult> {
    const data = (await this.kv.get(storageKey, 'json')) as any;

    if (!data) {
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: now + this.config.windowSeconds * 1000,
      };
    }

    // Filter out expired timestamps
    const validTimestamps = (data.timestamps || []).filter((ts: number) => ts > windowStart);

    const count = validTimestamps.length;
    const remaining = this.config.maxRequests - count;
    const allowed = remaining > 0;

    const oldestTimestamp = validTimestamps[0] || now;
    const resetAt = oldestTimestamp + this.config.windowSeconds * 1000;

    return {
      allowed,
      remaining: Math.max(0, remaining - 1),
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil((resetAt - now) / 1000),
    };
  }

  /**
   * Increment counter for a key
   */
  private async increment(key: string): Promise<void> {
    const storageKey = `${this.config.prefix}:${key}`;
    const now = Date.now();

    if (this.config.slidingWindow) {
      await this.incrementSlidingWindow(storageKey, now);
    } else {
      await this.incrementFixedWindow(storageKey, now);
    }
  }

  /**
   * Increment fixed window counter
   */
  private async incrementFixedWindow(storageKey: string, now: number): Promise<void> {
    const data = (await this.kv.get(storageKey, 'json')) as any;
    const resetAt = now + this.config.windowSeconds * 1000;

    if (!data || data.resetAt <= now) {
      // New window
      await this.kv.put(
        storageKey,
        JSON.stringify({
          count: 1,
          resetAt,
        }),
        {
          expirationTtl: this.config.windowSeconds + 60, // Add buffer
        }
      );
    } else {
      // Increment existing window
      await this.kv.put(
        storageKey,
        JSON.stringify({
          count: data.count + 1,
          resetAt: data.resetAt,
        }),
        {
          expirationTtl: Math.ceil((data.resetAt - now) / 1000) + 60,
        }
      );
    }
  }

  /**
   * Increment sliding window counter
   */
  private async incrementSlidingWindow(storageKey: string, now: number): Promise<void> {
    const data = (await this.kv.get(storageKey, 'json')) as any;
    const windowStart = now - this.config.windowSeconds * 1000;

    let timestamps = (data?.timestamps || []).filter((ts: number) => ts > windowStart);

    timestamps.push(now);

    // Keep only the most recent timestamps to save space
    if (timestamps.length > this.config.maxRequests * 2) {
      timestamps = timestamps.slice(-this.config.maxRequests);
    }

    await this.kv.put(
      storageKey,
      JSON.stringify({
        timestamps,
      }),
      {
        expirationTtl: this.config.windowSeconds + 60,
      }
    );
  }
}

/**
 * Rate limit middleware
 */
export function createRateLimitMiddleware(
  kv: KVNamespace,
  config: RateLimitConfig & {
    keyExtractor?: (request: Request) => string;
    onRateLimited?: (request: Request, result: RateLimitResult) => Response | void;
  }
) {
  const limiter = new RateLimiter(kv, config);

  return async function rateLimitMiddleware(
    request: Request,
    next: () => Promise<Response>
  ): Promise<Response> {
    // Extract rate limit key
    const key = config.keyExtractor
      ? config.keyExtractor(request)
      : request.headers.get('CF-Connecting-IP') || 'anonymous';

    // Check rate limit
    const result = await limiter.consume(key);

    if (!result.allowed) {
      // Handle rate limited request
      if (config.onRateLimited) {
        const customResponse = config.onRateLimited(request, result);
        if (customResponse) return customResponse;
      }

      // Default rate limit response
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          resetAt: new Date(result.resetAt).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter || 60),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
          },
        }
      );
    }

    // Process request and add rate limit headers
    const response = await next();

    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)));

    return response;
  };
}
