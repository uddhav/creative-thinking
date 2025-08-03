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
export declare class PerformanceTracker {
    private metrics;
    private startTime;
    private startMemory;
    private static readonly MEMORY_WARNING_THRESHOLD_MB;
    private static readonly MEMORY_CRITICAL_THRESHOLD_MB;
    start(): void;
    end(name: string, metadata?: Record<string, unknown>): PerformanceMetric;
    getMemoryMetrics(): MemoryMetrics;
    checkMemoryThresholds(): {
        warning?: string;
        critical?: string;
    };
    getAllMetrics(): PerformanceMetric[];
    reset(): void;
    formatForCI(): Array<{
        name: string;
        unit: string;
        value: number;
        extra?: Record<string, unknown>;
    }>;
}
//# sourceMappingURL=performanceMetrics.d.ts.map