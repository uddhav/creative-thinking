/**
 * Performance profiling utility for monitoring execution overhead
 */
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
export declare class PerformanceProfiler {
    private metrics;
    private activeOperations;
    private slowOperationThreshold;
    private maxMetricsInMemory;
    private enabled;
    /**
     * Start tracking an operation
     */
    startOperation(operationName: string, metadata?: Record<string, unknown>): string;
    /**
     * End tracking an operation
     */
    endOperation(operationId: string): PerformanceMetrics | undefined;
    /**
     * Measure a synchronous operation
     */
    measureSync<T>(operationName: string, operation: () => T, metadata?: Record<string, unknown>): T;
    /**
     * Measure an asynchronous operation
     */
    measureAsync<T>(operationName: string, operation: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T>;
    /**
     * Get metrics for a specific operation
     */
    getMetricsForOperation(operationName: string): PerformanceMetrics[];
    /**
     * Get slow operations
     */
    getSlowOperations(threshold?: number): PerformanceMetrics[];
    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(): AggregatedMetrics[];
    /**
     * Generate a performance report
     */
    generateReport(): PerformanceReport;
    /**
     * Clear all metrics
     */
    clear(): void;
    /**
     * Export metrics to JSON
     */
    exportMetrics(): string;
    /**
     * Set slow operation threshold
     */
    setSlowOperationThreshold(thresholdMs: number): void;
    /**
     * Enable or disable profiling
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if profiling is enabled
     */
    isEnabled(): boolean;
    /**
     * Get current memory usage
     */
    getCurrentMemoryUsage(): NodeJS.MemoryUsage;
    /**
     * Get operation statistics
     */
    getOperationStats(operationName: string): {
        count: number;
        avgDuration: number;
        totalDuration: number;
        lastDuration?: number;
    } | null;
}
export declare const performanceProfiler: PerformanceProfiler;
//# sourceMappingURL=PerformanceProfiler.d.ts.map