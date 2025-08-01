/**
 * Memory Manager
 * Abstracts global variable access and provides memory management utilities
 */
export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external?: number;
    arrayBuffers?: number;
}
export interface MemoryManagerConfig {
    gcThreshold: number;
    enableGC: boolean;
    onGCTriggered?: () => void;
}
export declare class MemoryManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(config?: Partial<MemoryManagerConfig>): MemoryManager;
    /**
     * Get current memory usage metrics
     */
    getMemoryUsage(): MemoryMetrics;
    /**
     * Get memory usage in megabytes
     */
    getMemoryUsageMB(): {
        heapUsed: number;
        heapTotal: number;
        rss: number;
    };
    /**
     * Check if garbage collection is available
     */
    isGCAvailable(): boolean;
    /**
     * Trigger garbage collection if available and conditions are met
     */
    triggerGCIfNeeded(forceGC?: boolean): boolean;
    /**
     * Estimate object size in bytes (optimized version)
     * Uses a more efficient approach than JSON.stringify
     */
    estimateObjectSize(obj: unknown): number;
    /**
     * Format bytes to human-readable string
     */
    formatBytes(bytes: number): string;
}
//# sourceMappingURL=MemoryManager.d.ts.map