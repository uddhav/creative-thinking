/**
 * JSON Optimizer for performance improvements in large responses
 * Addresses issue #52 - Optimize JSON operations and response handling
 */
import type { LateralThinkingResponse } from '../types/index.js';
export interface JsonOptimizerConfig {
    maxStringLength?: number;
    maxArrayLength?: number;
    maxDepth?: number;
    maxResponseSize?: number;
    truncateMessage?: string;
}
/**
 * Utilities for optimizing JSON operations and reducing response sizes
 */
export declare class JsonOptimizer {
    private static readonly DEFAULT_CONFIG;
    private config;
    private responseCache;
    private readonly MAX_CACHE_SIZE;
    constructor(config?: JsonOptimizerConfig);
    /**
     * Optimize a response object by reducing size and caching
     */
    optimizeResponse(content: unknown): string;
    /**
     * Build response with optimization
     */
    buildOptimizedResponse(content: unknown): LateralThinkingResponse;
    /**
     * Deep optimize an object/array recursively
     */
    private deepOptimize;
    /**
     * Optimize string values
     */
    private optimizeString;
    /**
     * Optimize arrays
     */
    private optimizeArray;
    /**
     * Optimize objects
     */
    private optimizeObject;
    /**
     * Truncate response when too large
     */
    private truncateResponse;
    /**
     * Generate cache key for content
     */
    private generateCacheKey;
    /**
     * Update cache with LRU eviction
     */
    private updateCache;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
}
export declare const defaultJsonOptimizer: JsonOptimizer;
//# sourceMappingURL=JsonOptimizer.d.ts.map