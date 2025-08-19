/**
 * Cache Manager
 *
 * Intelligent caching for Cloudflare Workers using KV and Cache API
 */

export interface CacheConfig {
  /**
   * Default TTL in seconds
   */
  defaultTTL?: number;

  /**
   * Maximum cache size in bytes (for memory cache)
   */
  maxSize?: number;

  /**
   * Cache key prefix
   */
  prefix?: string;

  /**
   * Enable stale-while-revalidate
   */
  staleWhileRevalidate?: boolean;

  /**
   * Cache strategies
   */
  strategy?:
    | 'cache-first'
    | 'network-first'
    | 'cache-only'
    | 'network-only'
    | 'stale-while-revalidate';
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  metadata?: Record<string, any>;
}

export class CacheManager {
  private kv?: KVNamespace;
  private config: Required<CacheConfig>;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private cacheSize = 0;

  constructor(kv?: KVNamespace, config: CacheConfig = {}) {
    this.kv = kv;
    this.config = {
      defaultTTL: 3600, // 1 hour
      maxSize: 10 * 1024 * 1024, // 10MB
      prefix: 'cache',
      staleWhileRevalidate: false,
      strategy: 'cache-first',
      ...config,
    };
  }

  /**
   * Get item from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);

    // Try memory cache first
    const memoryEntry = this.getFromMemory<T>(cacheKey);
    if (memoryEntry !== null) {
      return memoryEntry;
    }

    // Try KV storage
    if (this.kv) {
      const kvEntry = await this.getFromKV<T>(cacheKey);
      if (kvEntry !== null) {
        // Populate memory cache
        this.setInMemory(cacheKey, kvEntry, this.config.defaultTTL);
        return kvEntry;
      }
    }

    return null;
  }

  /**
   * Set item in cache
   */
  async set<T = any>(
    key: string,
    value: T,
    ttl: number = this.config.defaultTTL,
    metadata?: Record<string, any>
  ): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      etag: this.generateETag(value),
      metadata,
    };

    // Set in memory cache
    this.setInMemory(cacheKey, value, ttl);

    // Set in KV storage
    if (this.kv) {
      await this.setInKV(cacheKey, entry, ttl);
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);

    // Delete from memory
    this.deleteFromMemory(cacheKey);

    // Delete from KV
    if (this.kv) {
      await this.kv.delete(cacheKey);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.cacheSize = 0;

    // Clear KV cache (with prefix)
    if (this.kv) {
      const keys = await this.kv.list({ prefix: this.config.prefix });
      await Promise.all(keys.keys.map(key => this.kv!.delete(key.name)));
    }
  }

  /**
   * Cache wrapper for async functions
   */
  async wrap<T = any>(
    key: string,
    fn: () => Promise<T>,
    options?: {
      ttl?: number;
      force?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<T> {
    const { ttl = this.config.defaultTTL, force = false, metadata } = options || {};

    // Check cache unless forced
    if (!force) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Execute function
    const result = await fn();

    // Cache result
    await this.set(key, result, ttl, metadata);

    return result;
  }

  /**
   * Handle HTTP cache headers
   */
  async handleHttpCache(request: Request, handler: () => Promise<Response>): Promise<Response> {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);

    // Try cache first
    let response = await cache.match(cacheKey);

    if (response) {
      // Check if stale
      const age = this.getResponseAge(response);
      const maxAge = this.getMaxAge(response);

      if (age < maxAge) {
        // Fresh cache hit
        return new Response(response.body, {
          ...response,
          headers: new Headers({
            ...response.headers,
            'X-Cache': 'HIT',
            Age: String(age),
          }),
        });
      } else if (this.config.staleWhileRevalidate) {
        // Serve stale while revalidating
        this.revalidateInBackground(request, handler, cache, cacheKey);
        return new Response(response.body, {
          ...response,
          headers: new Headers({
            ...response.headers,
            'X-Cache': 'STALE',
            Age: String(age),
          }),
        });
      }
    }

    // Cache miss or expired
    response = await handler();

    // Cache successful responses
    if (response.ok && this.shouldCache(request, response)) {
      const cacheResponse = new Response(response.body, {
        ...response,
        headers: new Headers({
          ...response.headers,
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${this.config.defaultTTL}`,
          Date: new Date().toUTCString(),
        }),
      });

      await cache.put(cacheKey, cacheResponse.clone());
      return cacheResponse;
    }

    return response;
  }

  // ============= Private Methods =============

  /**
   * Get cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  /**
   * Get from memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl * 1000) {
      // Expired
      this.deleteFromMemory(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set in memory cache
   */
  private setInMemory<T>(key: string, value: T, ttl: number): void {
    const size = this.estimateSize(value);

    // Evict if necessary
    while (this.cacheSize + size > this.config.maxSize && this.memoryCache.size > 0) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey !== undefined) {
        this.deleteFromMemory(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
    };

    this.memoryCache.set(key, entry);
    this.cacheSize += size;
  }

  /**
   * Delete from memory cache
   */
  private deleteFromMemory(key: string): void {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.cacheSize -= this.estimateSize(entry.data);
      this.memoryCache.delete(key);
    }
  }

  /**
   * Get from KV storage
   */
  private async getFromKV<T>(key: string): Promise<T | null> {
    if (!this.kv) return null;

    const entry = await this.kv.get<CacheEntry<T>>(key, 'json');

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl * 1000) {
      // Expired
      await this.kv.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set in KV storage
   */
  private async setInKV<T>(key: string, entry: CacheEntry<T>, ttl: number): Promise<void> {
    if (!this.kv) return;

    await this.kv.put(key, JSON.stringify(entry), {
      expirationTtl: ttl,
    });
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  /**
   * Generate ETag for value
   */
  private generateETag(value: any): string {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${hash.toString(36)}"`;
  }

  /**
   * Get response age in seconds
   */
  private getResponseAge(response: Response): number {
    const date = response.headers.get('Date');
    if (!date) return 0;
    return Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  }

  /**
   * Get max age from cache control
   */
  private getMaxAge(response: Response): number {
    const cacheControl = response.headers.get('Cache-Control');
    if (!cacheControl) return 0;

    const match = cacheControl.match(/max-age=(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Check if response should be cached
   */
  private shouldCache(request: Request, response: Response): boolean {
    // Only cache GET requests
    if (request.method !== 'GET') return false;

    // Only cache successful responses
    if (!response.ok) return false;

    // Check cache control headers
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl?.includes('no-store')) return false;
    if (cacheControl?.includes('private')) return false;

    return true;
  }

  /**
   * Revalidate cache in background
   */
  private async revalidateInBackground(
    request: Request,
    handler: () => Promise<Response>,
    cache: Cache,
    cacheKey: Request
  ): Promise<void> {
    // Fire and forget
    handler()
      .then(async response => {
        if (response.ok) {
          await cache.put(cacheKey, response);
        }
      })
      .catch(console.error);
  }
}
