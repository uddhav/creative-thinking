/**
 * JSON Optimizer for performance improvements in large responses
 * Addresses issue #52 - Optimize JSON operations and response handling
 */
/**
 * Utilities for optimizing JSON operations and reducing response sizes
 */
export class JsonOptimizer {
    static DEFAULT_CONFIG = {
        maxStringLength: 1000,
        maxArrayLength: 100,
        maxDepth: 10,
        maxResponseSize: 1024 * 1024, // 1MB
        truncateMessage: '... [truncated]',
    };
    config;
    responseCache = new Map();
    MAX_CACHE_SIZE = 50;
    constructor(config = {}) {
        this.config = { ...JsonOptimizer.DEFAULT_CONFIG, ...config };
    }
    /**
     * Optimize a response object by reducing size and caching
     */
    /** JSON paths whose string values were cut this run, with original lengths. */
    truncatedPaths = [];
    optimizeResponse(content) {
        // Handle undefined specifically since JSON.stringify converts it to undefined (not "undefined")
        if (content === undefined) {
            return 'undefined';
        }
        const cacheKey = this.generateCacheKey(content);
        // Check cache first
        const cached = this.responseCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        // Apply optimizations
        this.truncatedPaths = [];
        const optimized = this.deepOptimize(content, 0);
        if (this.truncatedPaths.length > 0 &&
            optimized !== null &&
            typeof optimized === 'object' &&
            !Array.isArray(optimized)) {
            // Beside the data, not buried in it: which values were cut and how long
            // they really were. Array indices are collapsed (`$.history[3].data`
            // becomes `$.history[].data` with a count) — per-element entries are
            // noise, and an uncapped report once grew large enough to trip the
            // response size limit it was reporting on, which dropped the very fields
            // it described. The session history holds the full text — export
            // retrieves it untruncated.
            const aggregated = new Map();
            for (const { path, originalLength } of this.truncatedPaths) {
                const key = path.replace(/\[\d+\]/g, '[]');
                const entry = aggregated.get(key) ?? { count: 0, maxOriginalLength: 0 };
                entry.count += 1;
                entry.maxOriginalLength = Math.max(entry.maxOriginalLength, originalLength);
                aggregated.set(key, entry);
            }
            optimized.truncation = {
                fields: [...aggregated].map(([path, info]) => ({ path, ...info })),
                note: `Strings over ${this.config.maxStringLength} chars cut at end; session export returns full text.`,
            };
        }
        const result = JSON.stringify(optimized, null, 2);
        // Check size limit
        if (result.length > this.config.maxResponseSize) {
            // The report is the first thing sacrificed: it must never squeeze out
            // the data it describes. If dropping it gets the response under budget,
            // stop there.
            if (optimized !== null && typeof optimized === 'object' && 'truncation' in optimized) {
                const withoutReport = { ...optimized };
                delete withoutReport.truncation;
                const slimmed = JSON.stringify(withoutReport, null, 2);
                if (slimmed.length <= this.config.maxResponseSize) {
                    this.updateCache(cacheKey, slimmed);
                    return slimmed;
                }
            }
            const truncated = this.truncateResponse(optimized);
            const truncatedResult = JSON.stringify(truncated, null, 2);
            this.updateCache(cacheKey, truncatedResult);
            return truncatedResult;
        }
        this.updateCache(cacheKey, result);
        return result;
    }
    /**
     * Build response with optimization
     */
    buildOptimizedResponse(content) {
        const optimizedText = this.optimizeResponse(content);
        return {
            content: [
                {
                    type: 'text',
                    text: optimizedText,
                },
            ],
        };
    }
    /**
     * Deep optimize an object/array recursively
     */
    deepOptimize(value, depth, path = '$') {
        if (depth >= this.config.maxDepth) {
            return this.config.truncateMessage;
        }
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value === 'string') {
            return this.optimizeString(value, path);
        }
        if (Array.isArray(value)) {
            return this.optimizeArray(value, depth, path);
        }
        if (typeof value === 'object') {
            return this.optimizeObject(value, depth, path);
        }
        return value;
    }
    /**
     * Optimize string values
     */
    optimizeString(str, path) {
        if (str.length <= this.config.maxStringLength) {
            return str;
        }
        // Cut at the END and say so. The old form spliced the marker into the
        // MIDDLE — head + '... [truncated]' + tail — so a caller re-read a doctored
        // version of its own input with the marker buried mid-sentence and no
        // other signal anywhere. Measured: a 1200-char problemStatement came back
        // as 815 chars with the splice, silently, on 26 of 32 techniques. The
        // truncated paths are now collected per run and reported beside the data.
        if (path) {
            this.truncatedPaths.push({ path, originalLength: str.length });
        }
        return str.substring(0, this.config.maxStringLength) + this.config.truncateMessage;
    }
    /**
     * Optimize arrays
     */
    optimizeArray(arr, depth, path = '$') {
        if (arr.length <= this.config.maxArrayLength) {
            return arr.map((item, i) => this.deepOptimize(item, depth + 1, `${path}[${i}]`));
        }
        const half = Math.floor(this.config.maxArrayLength / 2);
        const result = [];
        // Keep first half
        for (let i = 0; i < half; i++) {
            result.push(this.deepOptimize(arr[i], depth + 1, `${path}[${i}]`));
        }
        // Add truncation marker
        result.push(`${this.config.truncateMessage} (${arr.length - this.config.maxArrayLength} items omitted)`);
        // Keep last few items
        for (let i = arr.length - 5; i < arr.length; i++) {
            if (i >= 0) {
                result.push(this.deepOptimize(arr[i], depth + 1, `${path}[${i}]`));
            }
        }
        return result;
    }
    /**
     * Optimize objects
     */
    optimizeObject(obj, depth, path = '$') {
        const result = {};
        // Special handling for known fields
        const priorityFields = [
            'sessionId',
            'technique',
            'currentStep',
            'totalSteps',
            'nextStepNeeded',
            'insights',
            // SCAMPER-specific fields that tests expect
            'pathImpact',
            'flexibilityScore',
            'modificationHistory',
            'alternativeSuggestions',
            // Other technique-specific fields
            'hatColor',
            'provocation',
            'randomStimulus',
            'scamperAction',
        ];
        const deferredFields = ['history', 'pathMemory', 'branches', 'optionGenerationResult'];
        // Process priority fields first
        for (const field of priorityFields) {
            if (field in obj) {
                result[field] = this.deepOptimize(obj[field], depth + 1, `${path}.${field}`);
            }
        }
        // Process other fields
        for (const [key, value] of Object.entries(obj)) {
            if (!priorityFields.includes(key) && !deferredFields.includes(key)) {
                result[key] = this.deepOptimize(value, depth + 1, `${path}.${key}`);
            }
        }
        // Process deferred fields with stricter limits
        const originalArrayLength = this.config.maxArrayLength;
        const originalStringLength = this.config.maxStringLength;
        // Apply stricter limits for deferred fields
        this.config.maxArrayLength = Math.min(20, this.config.maxArrayLength);
        this.config.maxStringLength = Math.min(500, this.config.maxStringLength);
        for (const field of deferredFields) {
            if (field in obj) {
                result[field] = this.deepOptimize(obj[field], depth + 1, `${path}.${field}`);
            }
        }
        // Restore original limits
        this.config.maxArrayLength = originalArrayLength;
        this.config.maxStringLength = originalStringLength;
        return result;
    }
    /**
     * Truncate response when too large
     */
    truncateResponse(content) {
        if (typeof content !== 'object' || content === null) {
            return content;
        }
        const obj = content;
        const result = {
            sessionId: obj.sessionId,
            technique: obj.technique,
            currentStep: obj.currentStep,
            totalSteps: obj.totalSteps,
            nextStepNeeded: obj.nextStepNeeded,
            insights: obj.insights,
            _truncated: true,
            _message: 'Response truncated due to size. Essential fields preserved.',
        };
        // Add technique-specific fields if present
        const techniqueFields = [
            'hatColor',
            'provocation',
            'randomStimulus',
            'scamperAction',
            'extractedConcepts',
            'disneyRole',
            'designStage',
            'currentCell',
        ];
        for (const field of techniqueFields) {
            if (field in obj) {
                result[field] = obj[field];
            }
        }
        return result;
    }
    /**
     * Generate cache key for content
     */
    generateCacheKey(content) {
        if (content === null)
            return 'response_null';
        if (content === undefined)
            return 'response_undefined';
        const str = JSON.stringify(content);
        // Simple hash for cache key
        let hash = 0;
        for (let i = 0; i < Math.min(str.length, 1000); i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `response_${hash}_${str.length}`;
    }
    /**
     * Update cache with LRU eviction
     */
    updateCache(key, value) {
        if (this.responseCache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.responseCache.keys().next().value;
            if (firstKey) {
                this.responseCache.delete(firstKey);
            }
        }
        this.responseCache.set(key, value);
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.responseCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.responseCache.size,
            maxSize: this.MAX_CACHE_SIZE,
        };
    }
}
// Singleton instance for shared use
export const defaultJsonOptimizer = new JsonOptimizer();
//# sourceMappingURL=JsonOptimizer.js.map