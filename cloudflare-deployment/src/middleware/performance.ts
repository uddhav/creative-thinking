/**
 * Performance Middleware
 *
 * Performance optimization middleware for Cloudflare Workers
 */

import { randomUUID } from 'node:crypto';
import { CacheManager } from '../performance/CacheManager.js';
import { PerformanceMonitor, RequestTimer } from '../performance/PerformanceMonitor.js';
import type { Env } from '../index.js';

export interface PerformanceConfig {
  /**
   * Enable caching
   */
  cache?: {
    enabled: boolean;
    ttl?: number;
    strategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
    paths?: string[]; // Paths to cache
    excludePaths?: string[]; // Paths to exclude from caching
  };

  /**
   * Enable compression
   */
  compression?: {
    enabled: boolean;
    threshold?: number; // Minimum size to compress (bytes)
    types?: string[]; // Content types to compress
  };

  /**
   * Enable monitoring
   */
  monitoring?: {
    enabled: boolean;
    sampleRate?: number;
    slowThreshold?: number;
  };

  /**
   * Response optimization
   */
  optimization?: {
    minifyJson?: boolean;
    removeHeaders?: string[];
    etagEnabled?: boolean;
  };
}

export class PerformanceMiddleware {
  private config: PerformanceConfig;
  private cache?: CacheManager;
  private monitor?: PerformanceMonitor;

  constructor(env: Env, config: PerformanceConfig = {}) {
    this.config = {
      cache: {
        enabled: true,
        ttl: 3600,
        strategy: 'cache-first',
        paths: ['/api/discover_techniques', '/api/resources', '/api/prompts'],
        ...config.cache,
      },
      compression: {
        enabled: true,
        threshold: 1024,
        types: ['application/json', 'text/plain', 'text/html'],
        ...config.compression,
      },
      monitoring: {
        enabled: true,
        sampleRate: 1.0,
        slowThreshold: 1000,
        ...config.monitoring,
      },
      optimization: {
        minifyJson: true,
        removeHeaders: ['X-Powered-By'],
        etagEnabled: true,
        ...config.optimization,
      },
      ...config,
    };

    // Initialize cache
    if (this.config.cache?.enabled) {
      this.cache = new CacheManager(env.KV, {
        defaultTTL: this.config.cache.ttl,
        strategy: this.config.cache.strategy,
      });
    }

    // Initialize monitor
    if (this.config.monitoring?.enabled) {
      this.monitor = new PerformanceMonitor({
        sampleRate: this.config.monitoring.sampleRate,
        slowThreshold: this.config.monitoring.slowThreshold,
      });
    }
  }

  /**
   * Apply performance middleware
   */
  async apply(request: Request, next: () => Promise<Response>): Promise<Response> {
    const timer = new RequestTimer();
    timer.mark('start');

    const requestId = randomUUID();
    const url = new URL(request.url);

    // Start monitoring
    if (this.monitor) {
      this.monitor.startRequest(requestId, request);
    }

    try {
      // Check if path should be cached
      if (this.shouldCache(url.pathname, request.method)) {
        const response = await this.handleCachedRequest(request, next, timer);
        return this.optimizeResponse(response, request, timer, requestId);
      }

      // Non-cached request
      timer.mark('handler-start');
      const response = await next();
      timer.measure('handler', 'handler-start');

      return this.optimizeResponse(response, request, timer, requestId);
    } catch (error) {
      // Track error
      if (this.monitor) {
        await this.monitor.endRequest(requestId, new Response(null, { status: 500 }), {
          error: (error as Error).message,
        });
      }
      throw error;
    }
  }

  /**
   * Handle cached request
   */
  private async handleCachedRequest(
    request: Request,
    next: () => Promise<Response>,
    timer: RequestTimer
  ): Promise<Response> {
    if (!this.cache) return next();

    const cacheKey = this.getCacheKey(request);

    // Try to get from cache
    timer.mark('cache-check');
    const cached = await this.cache.get<any>(cacheKey);
    timer.measure('cache-lookup', 'cache-check');

    if (cached) {
      // Cache hit
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
        },
      });
    }

    // Cache miss - execute handler
    timer.mark('handler-start');
    const response = await next();
    timer.measure('handler', 'handler-start');

    // Cache successful responses
    if (response.ok && response.headers.get('Content-Type')?.includes('json')) {
      timer.mark('cache-write');
      const data = await response.clone().json();
      await this.cache.set(cacheKey, data, this.config.cache!.ttl);
      timer.measure('cache-store', 'cache-write');

      // Return new response with cache headers
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers),
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
        },
      });
    }

    return response;
  }

  /**
   * Optimize response
   */
  private async optimizeResponse(
    response: Response,
    request: Request,
    timer: RequestTimer,
    requestId: string
  ): Promise<Response> {
    let optimized = response;

    // Add timing headers
    timer.measure('total', 'start');
    const timings = timer.getMeasures();

    optimized = new Response(optimized.body, optimized);
    optimized.headers.set('Server-Timing', this.formatServerTiming(timings));
    optimized.headers.set('X-Request-ID', requestId);

    // Minify JSON
    if (
      this.config.optimization?.minifyJson &&
      optimized.headers.get('Content-Type')?.includes('json')
    ) {
      const data = await optimized.json();
      optimized = new Response(
        JSON.stringify(data), // Removes formatting
        optimized
      );
    }

    // Compress response
    if (this.shouldCompress(optimized, request)) {
      optimized = await this.compressResponse(optimized, request);
    }

    // Add ETag
    if (this.config.optimization?.etagEnabled) {
      optimized = await this.addETag(optimized);
    }

    // Remove unwanted headers
    if (this.config.optimization?.removeHeaders) {
      for (const header of this.config.optimization.removeHeaders) {
        optimized.headers.delete(header);
      }
    }

    // End monitoring
    if (this.monitor) {
      await this.monitor.endRequest(requestId, optimized, {
        timings,
      });
    }

    return optimized;
  }

  /**
   * Check if path should be cached
   */
  private shouldCache(path: string, method: string): boolean {
    if (!this.config.cache?.enabled) return false;
    if (method !== 'GET' && method !== 'HEAD') return false;

    // Check exclude paths
    if (this.config.cache.excludePaths?.some(p => path.startsWith(p))) {
      return false;
    }

    // Check include paths
    if (this.config.cache.paths && this.config.cache.paths.length > 0) {
      return this.config.cache.paths.some(p => path.startsWith(p));
    }

    return true;
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(request: Request): string {
    const url = new URL(request.url);
    const params = Array.from(url.searchParams.entries()).sort();
    return `${request.method}:${url.pathname}:${JSON.stringify(params)}`;
  }

  /**
   * Check if response should be compressed
   */
  private shouldCompress(response: Response, request: Request): boolean {
    if (!this.config.compression?.enabled) return false;

    // Check if client accepts compression
    const acceptEncoding = request.headers.get('Accept-Encoding');
    if (!acceptEncoding?.includes('gzip')) return false;

    // Check content type
    const contentType = response.headers.get('Content-Type');
    if (!contentType) return false;

    const baseType = contentType.split(';')[0].trim();
    if (!this.config.compression.types?.includes(baseType)) return false;

    // Check size threshold
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      const size = parseInt(contentLength);
      if (size < this.config.compression.threshold!) return false;
    }

    return true;
  }

  /**
   * Compress response
   */
  private async compressResponse(response: Response, request: Request): Promise<Response> {
    const compressionStream = new CompressionStream('gzip');
    const compressed = response.body?.pipeThrough(compressionStream);

    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Content-Encoding': 'gzip',
        Vary: 'Accept-Encoding',
      },
    });
  }

  /**
   * Add ETag to response
   */
  private async addETag(response: Response): Promise<Response> {
    const body = await response.clone().text();
    const hash = await this.hashString(body);
    const etag = `"${hash}"`;

    response.headers.set('ETag', etag);

    return response;
  }

  /**
   * Hash string for ETag
   */
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);
  }

  /**
   * Format server timing header
   */
  private formatServerTiming(timings: Record<string, number>): string {
    return Object.entries(timings)
      .map(([name, duration]) => `${name};dur=${duration.toFixed(2)}`)
      .join(', ');
  }
}

/**
 * Create performance middleware function
 */
export function createPerformanceMiddleware(env: Env, config?: PerformanceConfig) {
  const performance = new PerformanceMiddleware(env, config);

  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    return performance.apply(request, next);
  };
}
