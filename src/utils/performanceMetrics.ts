/**
 * Performance metrics utilities for benchmarking
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private startTime: number = 0;
  private startMemory: MemoryMetrics | null = null;

  start(): void {
    this.startTime = Date.now();
    this.startMemory = this.getMemoryMetrics();

    // Force GC if available
    if (typeof global !== 'undefined' && 'gc' in global && typeof global.gc === 'function') {
      global.gc();
    }
  }

  end(name: string, metadata?: Record<string, unknown>): PerformanceMetric {
    const duration = Date.now() - this.startTime;
    const endMemory = this.getMemoryMetrics();

    const metric: PerformanceMetric = {
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        memory: {
          start: this.startMemory,
          end: endMemory,
          delta: this.startMemory
            ? {
                heapUsed: endMemory.heapUsed - this.startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - this.startMemory.heapTotal,
                external: endMemory.external - this.startMemory.external,
                rss: endMemory.rss - this.startMemory.rss,
              }
            : null,
        },
      },
    };

    this.metrics.push(metric);
    return metric;
  }

  getMemoryMetrics(): MemoryMetrics {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
    };
  }

  getAllMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  reset(): void {
    this.metrics = [];
    this.startTime = 0;
    this.startMemory = null;
  }

  // Helper to format metrics for CI
  formatForCI(): Array<{
    name: string;
    unit: string;
    value: number;
    extra?: Record<string, unknown>;
  }> {
    return this.metrics.map(metric => ({
      name: metric.name,
      unit: metric.unit,
      value: metric.value,
      extra: metric.metadata,
    }));
  }
}
