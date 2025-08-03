/**
 * Performance metrics utilities for benchmarking
 */
export class PerformanceTracker {
    metrics = [];
    startTime = 0;
    startMemory = null;
    start() {
        this.startTime = Date.now();
        this.startMemory = this.getMemoryMetrics();
        // Force GC if available
        if (typeof global !== 'undefined' && 'gc' in global && typeof global.gc === 'function') {
            global.gc();
        }
    }
    end(name, metadata) {
        const duration = Date.now() - this.startTime;
        const endMemory = this.getMemoryMetrics();
        const metric = {
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
    getMemoryMetrics() {
        const usage = process.memoryUsage();
        return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
            external: Math.round(usage.external / 1024 / 1024), // MB
            rss: Math.round(usage.rss / 1024 / 1024), // MB
        };
    }
    getAllMetrics() {
        return this.metrics;
    }
    reset() {
        this.metrics = [];
        this.startTime = 0;
        this.startMemory = null;
    }
    // Helper to format metrics for CI
    formatForCI() {
        return this.metrics.map(metric => ({
            name: metric.name,
            unit: metric.unit,
            value: metric.value,
            extra: metric.metadata,
        }));
    }
}
//# sourceMappingURL=performanceMetrics.js.map