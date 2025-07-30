/**
 * Simple LRU Cache implementation for complexity assessments
 */
import type { ComplexityAssessment } from './types.js';
export declare class ComplexityCache {
    private cache;
    private accessOrder;
    private readonly maxSize;
    private readonly ttlMs;
    /**
     * Get a cached assessment if available and not expired
     */
    get(text: string): ComplexityAssessment | undefined;
    /**
     * Set a cache entry
     */
    set(text: string, assessment: ComplexityAssessment, analysisMethod: 'local-nlp' | 'mcp-sampling' | 'fallback'): void;
    /**
     * Clear the cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        methodDistribution: Record<string, number>;
    };
    /**
     * Generate a hash key for text
     */
    private hashText;
    /**
     * Update access order for LRU
     */
    private updateAccessOrder;
}
//# sourceMappingURL=cache.d.ts.map