/**
 * Performance profiling utility for monitoring execution overhead
 */

import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  startTime: number;
  endTime: number;
  memoryUsed?: number;
  cpuPercent?: number;
  metadata?: Record<string, unknown>;
}

export interface AggregatedMetrics {
  operationName: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p90Duration: number;
  p99Duration: number;
}

export interface PerformanceReport {
  timestamp: string;
  totalOperations: number;
  totalDuration: number;
  metrics: AggregatedMetrics[];
  slowOperations: PerformanceMetrics[];
  memoryPressure?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

export class PerformanceProfiler {
  private metrics: PerformanceMetrics[] = [];
  private activeOperations = new Map<string, number>();
  private slowOperationThreshold = 100; // ms
  private maxMetricsInMemory = 10000;
  private enabled = process.env.ENABLE_PERFORMANCE_PROFILING === 'true';

  /**
   * Start tracking an operation
   */
  startOperation(operationName: string, metadata?: Record<string, unknown>): string {
    if (!this.enabled) return '';

    const operationId = `${operationName}_${Date.now()}_${Math.random()}`;
    this.activeOperations.set(operationId, performance.now());

    // Store metadata for later
    if (metadata) {
      this.activeOperations.set(`${operationId}_metadata`, metadata as unknown as number);
    }

    return operationId;
  }

  /**
   * End tracking an operation
   */
  endOperation(operationId: string): PerformanceMetrics | undefined {
    if (!this.enabled || !operationId) return undefined;

    const startTime = this.activeOperations.get(operationId);
    if (startTime === undefined) return undefined;

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Get metadata if stored
    const metadata = this.activeOperations.get(`${operationId}_metadata`) as
      | Record<string, unknown>
      | undefined;

    // Extract operation name from ID
    const operationName = operationId.substring(
      0,
      operationId.lastIndexOf('_', operationId.lastIndexOf('_') - 1)
    );

    const metric: PerformanceMetrics = {
      operationName,
      duration,
      startTime,
      endTime,
      metadata,
    };

    // Add memory usage if available
    if (global.gc && typeof global.gc === 'function') {
      const memUsage = process.memoryUsage();
      metric.memoryUsed = memUsage.heapUsed;
    }

    // Clean up
    this.activeOperations.delete(operationId);
    if (metadata) {
      this.activeOperations.delete(`${operationId}_metadata`);
    }

    // Store metric
    this.metrics.push(metric);

    // Prevent unbounded memory growth
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    return metric;
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(operationName: string, operation: () => T, metadata?: Record<string, unknown>): T {
    if (!this.enabled) return operation();

    const operationId = this.startOperation(operationName, metadata);
    try {
      return operation();
    } finally {
      this.endOperation(operationId);
    }
  }

  /**
   * Measure an asynchronous operation
   */
  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) return operation();

    const operationId = this.startOperation(operationName, metadata);
    try {
      return await operation();
    } finally {
      this.endOperation(operationId);
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsForOperation(operationName: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.operationName === operationName);
  }

  /**
   * Get slow operations
   */
  getSlowOperations(threshold?: number): PerformanceMetrics[] {
    const slowThreshold = threshold ?? this.slowOperationThreshold;
    return this.metrics.filter(m => m.duration > slowThreshold);
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(): AggregatedMetrics[] {
    const grouped = new Map<string, PerformanceMetrics[]>();

    // Group by operation name
    for (const metric of this.metrics) {
      const existing = grouped.get(metric.operationName) || [];
      existing.push(metric);
      grouped.set(metric.operationName, existing);
    }

    // Calculate aggregates
    const aggregated: AggregatedMetrics[] = [];
    for (const [operationName, metrics] of grouped) {
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const count = durations.length;

      if (count === 0) continue;

      const totalDuration = durations.reduce((sum, d) => sum + d, 0);
      const avgDuration = totalDuration / count;
      const minDuration = durations[0];
      const maxDuration = durations[count - 1];

      // Calculate percentiles
      const p50Index = Math.floor(count * 0.5);
      const p90Index = Math.floor(count * 0.9);
      const p99Index = Math.floor(count * 0.99);

      aggregated.push({
        operationName,
        count,
        totalDuration,
        avgDuration,
        minDuration,
        maxDuration,
        p50Duration: durations[p50Index] || minDuration,
        p90Duration: durations[p90Index] || maxDuration,
        p99Duration: durations[p99Index] || maxDuration,
      });
    }

    return aggregated.sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * Generate a performance report
   */
  generateReport(): PerformanceReport {
    const metrics = this.getAggregatedMetrics();
    const slowOperations = this.getSlowOperations();
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      totalOperations: this.metrics.length,
      totalDuration,
      metrics,
      slowOperations: slowOperations.slice(0, 100), // Limit to top 100 slow operations
    };

    // Add memory pressure info
    const memUsage = process.memoryUsage();
    report.memoryPressure = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    };

    return report;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  /**
   * Set slow operation threshold
   */
  setSlowOperationThreshold(thresholdMs: number): void {
    this.slowOperationThreshold = thresholdMs;
  }

  /**
   * Enable or disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if profiling is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get operation statistics
   */
  getOperationStats(operationName: string): {
    count: number;
    avgDuration: number;
    totalDuration: number;
    lastDuration?: number;
  } | null {
    const metrics = this.getMetricsForOperation(operationName);
    if (metrics.length === 0) return null;

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalDuration / metrics.length;
    const lastDuration = metrics[metrics.length - 1]?.duration;

    return {
      count: metrics.length,
      avgDuration,
      totalDuration,
      lastDuration,
    };
  }
}

// Singleton instance
export const performanceProfiler = new PerformanceProfiler();
