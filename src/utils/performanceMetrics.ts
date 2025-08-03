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

  // Memory threshold constants
  private static readonly MEMORY_WARNING_THRESHOLD_MB = 500;
  private static readonly MEMORY_CRITICAL_THRESHOLD_MB = 1000;

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
    const memoryWarnings = this.checkMemoryThresholds();

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
          warnings: Object.keys(memoryWarnings).length > 0 ? memoryWarnings : undefined,
        },
      },
    };

    // Log memory warnings to stderr
    if (memoryWarnings.critical) {
      console.error(`[Performance] CRITICAL: ${memoryWarnings.critical}`);
    } else if (memoryWarnings.warning) {
      console.error(`[Performance] WARNING: ${memoryWarnings.warning}`);
    }

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

  checkMemoryThresholds(): { warning?: string; critical?: string } {
    const current = this.getMemoryMetrics();
    const warnings: { warning?: string; critical?: string } = {};

    if (current.heapUsed > PerformanceTracker.MEMORY_CRITICAL_THRESHOLD_MB) {
      warnings.critical = `Heap usage (${current.heapUsed}MB) exceeds critical threshold (${PerformanceTracker.MEMORY_CRITICAL_THRESHOLD_MB}MB)`;
    } else if (current.heapUsed > PerformanceTracker.MEMORY_WARNING_THRESHOLD_MB) {
      warnings.warning = `Heap usage (${current.heapUsed}MB) exceeds warning threshold (${PerformanceTracker.MEMORY_WARNING_THRESHOLD_MB}MB)`;
    }

    if (current.rss > PerformanceTracker.MEMORY_CRITICAL_THRESHOLD_MB * 1.5) {
      warnings.critical = `RSS memory (${current.rss}MB) exceeds critical threshold`;
    }

    return warnings;
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
