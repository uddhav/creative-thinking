/**
 * Simple LRU Cache implementation for complexity assessments
 */
import { createHash } from 'crypto';
import { CACHE_CONFIG } from './constants.js';
export class ComplexityCache {
    cache = new Map();
    accessOrder = [];
    maxSize = CACHE_CONFIG.MAX_SIZE;
    ttlMs = CACHE_CONFIG.TTL_MS;
    /**
     * Get a cached assessment if available and not expired
     */
    get(text) {
        const key = this.hashText(text);
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            this.accessOrder = this.accessOrder.filter(k => k !== key);
            return undefined;
        }
        // Update access order (move to end)
        this.updateAccessOrder(key);
        return entry.assessment;
    }
    /**
     * Set a cache entry
     */
    set(text, assessment, analysisMethod) {
        const key = this.hashText(text);
        // Remove oldest entry if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.accessOrder.shift();
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        // Add or update entry
        this.cache.set(key, {
            assessment,
            timestamp: Date.now(),
            analysisMethod,
        });
        // Update access order
        this.updateAccessOrder(key);
    }
    /**
     * Clear the cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * Get cache statistics
     */
    getStats() {
        let hits = 0;
        let total = 0;
        const methods = {
            'local-nlp': 0,
            'mcp-sampling': 0,
            'fallback': 0,
        };
        for (const entry of this.cache.values()) {
            methods[entry.analysisMethod]++;
        }
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: total > 0 ? hits / total : 0,
            methodDistribution: methods,
        };
    }
    /**
     * Generate a hash key for text
     */
    hashText(text) {
        return createHash('sha256').update(text.toLowerCase().trim()).digest('hex').slice(0, 16);
    }
    /**
     * Update access order for LRU
     */
    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }
}
//# sourceMappingURL=cache.js.map