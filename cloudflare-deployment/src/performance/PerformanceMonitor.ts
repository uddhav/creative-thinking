/**
 * Performance Monitor
 *
 * Tracks and optimizes performance metrics for Cloudflare Workers
 */

import { randomUUID } from 'node:crypto';

export interface PerformanceMetrics {
  requestId: string;
  method: string;
  path: string;
  duration: number;
  cpu?: number;
  memory?: number;
  cacheHit?: boolean;
  statusCode?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceConfig {
  /**
   * Enable detailed timing
   */
  detailedTiming?: boolean;

  /**
   * Sample rate (0-1)
   */
  sampleRate?: number;

  /**
   * Slow request threshold (ms)
   */
  slowThreshold?: number;

  /**
   * Enable Analytics Engine integration
   */
  analyticsEngine?: any;

  /**
   * Custom metrics collector
   */
  collector?: (metrics: PerformanceMetrics) => void | Promise<void>;
}

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: Map<string, Partial<PerformanceMetrics>> = new Map();

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      detailedTiming: false,
      sampleRate: 1.0,
      slowThreshold: 1000,
      ...config,
    };
  }

  /**
   * Start tracking a request
   */
  startRequest(requestId: string, request: Request): void {
    // Sample rate check
    if (Math.random() > this.config.sampleRate!) return;

    const url = new URL(request.url);

    this.metrics.set(requestId, {
      requestId,
      method: request.method,
      path: url.pathname,
      timestamp: Date.now(),
    });
  }

  /**
   * End tracking a request
   */
  async endRequest(
    requestId: string,
    response: Response,
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric = this.metrics.get(requestId);
    if (!metric || !metric.timestamp) return;

    // Calculate duration
    metric.duration = Date.now() - metric.timestamp;
    metric.statusCode = response.status;
    metric.metadata = metadata;

    // Check cache status
    metric.cacheHit = response.headers.get('X-Cache') === 'HIT';

    // Check if slow request
    if (metric.duration > this.config.slowThreshold!) {
      console.warn(`Slow request detected: ${metric.method} ${metric.path} (${metric.duration}ms)`);
    }

    // Send to Analytics Engine
    if (this.config.analyticsEngine) {
      this.sendToAnalytics(metric as PerformanceMetrics);
    }

    // Call custom collector
    if (this.config.collector) {
      await this.config.collector(metric as PerformanceMetrics);
    }

    // Clean up
    this.metrics.delete(requestId);
  }

  /**
   * Track custom timing
   */
  trackTiming(requestId: string, name: string, duration: number): void {
    const metric = this.metrics.get(requestId);
    if (!metric) return;

    if (!metric.metadata) metric.metadata = {};
    if (!metric.metadata.timings) metric.metadata.timings = {};

    metric.metadata.timings[name] = duration;
  }

  /**
   * Create timing middleware
   */
  createMiddleware() {
    return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
      const requestId = randomUUID();

      // Start tracking
      this.startRequest(requestId, request);

      // Add request ID to headers for tracing
      const headers = new Headers(request.headers);
      headers.set('X-Request-ID', requestId);

      // Time the request
      const startTime = performance.now();
      let response: Response;

      try {
        // Process request
        response = await next();

        // Add timing headers
        const duration = performance.now() - startTime;
        response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
        response.headers.set('X-Request-ID', requestId);

        // End tracking
        await this.endRequest(requestId, response, {
          responseTime: duration,
        });

        return response;
      } catch (error) {
        // Track error
        const duration = performance.now() - startTime;
        await this.endRequest(requestId, new Response(null, { status: 500 }), {
          responseTime: duration,
          error: (error as Error).message,
        });

        throw error;
      }
    };
  }

  /**
   * Send metrics to Analytics Engine
   */
  private sendToAnalytics(metrics: PerformanceMetrics): void {
    if (!this.config.analyticsEngine) return;

    try {
      this.config.analyticsEngine.writeDataPoint({
        indexes: [metrics.path],
        doubles: [metrics.duration],
        blobs: [metrics.method, metrics.statusCode?.toString()],
      });
    } catch (error) {
      console.error('Failed to send metrics to Analytics Engine:', error);
    }
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): PerformanceMetrics[] {
    return Array.from(this.metrics.values()).filter(m => m.timestamp) as PerformanceMetrics[];
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Request timing helper
 */
export class RequestTimer {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  /**
   * Mark a timing point
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) throw new Error(`Mark '${startMark}' not found`);

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) throw new Error(`Mark '${endMark}' not found`);

    const duration = end - start;
    this.measures.set(name, duration);

    return duration;
  }

  /**
   * Get all measures
   */
  getMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
  /**
   * Batch multiple operations
   */
  static async batch<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    batchSize = 10
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(operation));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Memoize function results
   */
  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    getKey?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const result = fn(...args);
      cache.set(key, result);

      return result;
    }) as T;
  }
}
