import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceProfiler } from '../../utils/PerformanceProfiler.js';

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
    profiler.setEnabled(true);
  });

  describe('basic operations', () => {
    it('should track synchronous operations', () => {
      const result = profiler.measureSync('test-operation', () => {
        // Simulate some work - store result to prevent optimization
        let _sum = 0;
        for (let i = 0; i < 10000; i++) {
          _sum += i * i;
        }
        return 'test-result';
      });

      expect(result).toBe('test-result');

      const metrics = profiler.getMetricsForOperation('test-operation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operationName).toBe('test-operation');
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    it('should track asynchronous operations', async () => {
      const result = await profiler.measureAsync('async-operation', async () => {
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 1));
        return 'async-result';
      });

      expect(result).toBe('async-result');

      const metrics = profiler.getMetricsForOperation('async-operation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operationName).toBe('async-operation');
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    it('should track metadata', () => {
      profiler.measureSync('metadata-operation', () => 'result', { userId: '123', action: 'test' });

      const metrics = profiler.getMetricsForOperation('metadata-operation');
      expect(metrics[0].metadata).toEqual({ userId: '123', action: 'test' });
    });
  });

  describe('operation tracking', () => {
    it('should start and end operations manually', () => {
      const operationId = profiler.startOperation('manual-op');
      // Do some work
      Array(100)
        .fill(0)
        .forEach((_, i) => i * i);
      const metric = profiler.endOperation(operationId);

      expect(metric).toBeDefined();
      expect(metric?.operationName).toBe('manual-op');
      expect(metric?.duration).toBeGreaterThan(0);
    });

    it('should handle missing operation gracefully', () => {
      const metric = profiler.endOperation('non-existent');
      expect(metric).toBeUndefined();
    });
  });

  describe('slow operation detection', () => {
    it('should identify slow operations', () => {
      profiler.setSlowOperationThreshold(0.5); // 0.5ms threshold

      profiler.measureSync('fast-op', () => {
        // Small workload
        Array(10)
          .fill(0)
          .forEach((_, i) => i * i);
      });

      profiler.measureSync('slow-op', () => {
        // Large workload - ensure it takes more than 0.5ms
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.sqrt(i) * Math.sin(i);
        }
        return sum;
      });

      const slowOps = profiler.getSlowOperations();
      expect(slowOps.length).toBeGreaterThanOrEqual(1);
      const slowOp = slowOps.find(op => op.operationName === 'slow-op');
      expect(slowOp).toBeDefined();
    });

    it('should use custom threshold', () => {
      // First create a fast operation
      profiler.measureSync('fast-op', () => {
        return 1 + 1;
      });

      // Then create a slower operation
      profiler.measureSync('medium-op', () => {
        let _sum = 0;
        for (let i = 0; i < 100000; i++) {
          _sum += Math.sqrt(i);
        }
        return _sum;
      });

      // Get all metrics to see what durations we got
      const allMetrics = profiler.getMetricsForOperation('medium-op');
      const mediumDuration = allMetrics[0]?.duration || 0;

      // Use a threshold higher than the medium operation
      const slowOps = profiler.getSlowOperations(mediumDuration + 1);
      expect(slowOps).toHaveLength(0);

      // Use a threshold lower than the medium operation
      const slowOps2 = profiler.getSlowOperations(mediumDuration / 2);
      expect(slowOps2.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('aggregated metrics', () => {
    it('should calculate aggregated metrics correctly', () => {
      // Create multiple operations with different durations
      [100, 200, 300, 400, 500].forEach(size => {
        profiler.measureSync('repeated-op', () => {
          // Variable workload
          Array(size)
            .fill(0)
            .forEach((_, i) => i * i);
        });
      });

      const aggregated = profiler.getAggregatedMetrics();
      expect(aggregated).toHaveLength(1);

      const metrics = aggregated[0];
      expect(metrics.operationName).toBe('repeated-op');
      expect(metrics.count).toBe(5);
      expect(metrics.avgDuration).toBeGreaterThan(0);
      expect(metrics.minDuration).toBeGreaterThan(0);
      expect(metrics.maxDuration).toBeGreaterThan(metrics.minDuration);
      expect(metrics.p50Duration).toBeGreaterThan(0);
      expect(metrics.p90Duration).toBeGreaterThanOrEqual(metrics.p50Duration);
    });

    it('should sort by total duration', () => {
      profiler.measureSync('op1', () =>
        Array(1000)
          .fill(0)
          .forEach((_, i) => i * i)
      );
      profiler.measureSync('op2', () =>
        Array(10000)
          .fill(0)
          .forEach((_, i) => i * i)
      );
      profiler.measureSync('op3', () =>
        Array(100)
          .fill(0)
          .forEach((_, i) => i * i)
      );

      const aggregated = profiler.getAggregatedMetrics();
      expect(aggregated[0].operationName).toBe('op2');
      expect(aggregated[1].operationName).toBe('op1');
      expect(aggregated[2].operationName).toBe('op3');
    });
  });

  describe('reports', () => {
    it('should generate performance report', () => {
      profiler.measureSync('test-op', () =>
        Array(1000)
          .fill(0)
          .forEach((_, i) => i * i)
      );

      const report = profiler.generateReport();

      expect(report.timestamp).toBeDefined();
      expect(report.totalOperations).toBe(1);
      expect(report.totalDuration).toBeGreaterThan(0);
      expect(report.metrics).toHaveLength(1);
      expect(report.slowOperations).toBeDefined();
      expect(report.memoryPressure).toBeDefined();
    });

    it('should export metrics as JSON', () => {
      profiler.measureSync('export-op', () => {});

      const exported = profiler.exportMetrics();
      const parsed = JSON.parse(exported) as { totalOperations: number; metrics: unknown[] };

      expect(parsed.totalOperations).toBe(1);
      expect(parsed.metrics).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should respect enabled flag', () => {
      profiler.setEnabled(false);

      const result = profiler.measureSync('disabled-op', () => 'result');
      expect(result).toBe('result');

      const metrics = profiler.getMetricsForOperation('disabled-op');
      expect(metrics).toHaveLength(0);
    });

    it('should clear all metrics', () => {
      profiler.measureSync('clear-op', () => {});
      expect(profiler.getAggregatedMetrics()).toHaveLength(1);

      profiler.clear();
      expect(profiler.getAggregatedMetrics()).toHaveLength(0);
    });

    it('should limit metrics in memory', () => {
      // This test would require setting maxMetricsInMemory to a lower value
      // For now, just verify the property exists
      expect(profiler['maxMetricsInMemory']).toBeDefined();
    });
  });

  describe('operation statistics', () => {
    it('should provide operation statistics', () => {
      [100, 200, 300].forEach(size => {
        profiler.measureSync('stats-op', () => {
          Array(size)
            .fill(0)
            .forEach((_, i) => i * i);
        });
      });

      const stats = profiler.getOperationStats('stats-op');
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(3);
      expect(stats?.avgDuration).toBeGreaterThan(0);
      expect(stats?.totalDuration).toBeGreaterThan(0);
      expect(stats?.lastDuration).toBeGreaterThan(0);
    });

    it('should return null for non-existent operation', () => {
      const stats = profiler.getOperationStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('memory usage', () => {
    it('should get current memory usage', () => {
      const memUsage = profiler.getCurrentMemoryUsage();
      expect(memUsage).toBeDefined();
      expect(memUsage.heapUsed).toBeDefined();
      expect(memUsage.heapTotal).toBeDefined();
      expect(memUsage.rss).toBeDefined();
    });
  });
});
