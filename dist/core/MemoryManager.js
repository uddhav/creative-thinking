/**
 * Memory Manager
 * Abstracts global variable access and provides memory management utilities
 */
export class MemoryManager {
    static instance;
    config;
    constructor(config = {}) {
        this.config = {
            gcThreshold: 0.8,
            enableGC: true,
            ...config,
        };
    }
    static getInstance(config) {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager(config);
        }
        return MemoryManager.instance;
    }
    /**
     * Get current memory usage metrics
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            rss: usage.rss,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers,
        };
    }
    /**
     * Get memory usage in megabytes
     */
    getMemoryUsageMB() {
        const usage = this.getMemoryUsage();
        return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024),
        };
    }
    /**
     * Check if garbage collection is available
     */
    isGCAvailable() {
        return typeof global !== 'undefined' && typeof global.gc === 'function';
    }
    /**
     * Trigger garbage collection if available and conditions are met
     */
    triggerGCIfNeeded(forceGC = false) {
        if (!this.config.enableGC || !this.isGCAvailable()) {
            return false;
        }
        const usage = this.getMemoryUsage();
        const heapUsageRatio = usage.heapUsed / usage.heapTotal;
        if (forceGC || heapUsageRatio > this.config.gcThreshold) {
            try {
                // Use type assertion to access gc function
                const globalWithGc = global;
                if (globalWithGc.gc && typeof globalWithGc.gc === 'function') {
                    globalWithGc.gc();
                }
                if (this.config.onGCTriggered) {
                    this.config.onGCTriggered();
                }
                return true;
            }
            catch (error) {
                console.error('[MemoryManager] Failed to trigger GC:', error);
                return false;
            }
        }
        return false;
    }
    /**
     * Estimate object size in bytes (optimized version)
     * Uses a more efficient approach than JSON.stringify
     */
    estimateObjectSize(obj) {
        const seen = new WeakSet();
        function sizeOf(obj) {
            if (obj === null)
                return 4;
            const type = typeof obj;
            switch (type) {
                case 'boolean':
                    return 4;
                case 'number':
                    return 8;
                case 'string':
                    return obj.length * 2; // UTF-16
                case 'undefined':
                    return 0;
                case 'symbol':
                    return 0; // Symbols are not serialized
                case 'function':
                    return 0; // Functions are not serialized
                case 'object': {
                    if (seen.has(obj)) {
                        return 0; // Circular reference
                    }
                    seen.add(obj);
                    let size = 0;
                    if (Array.isArray(obj)) {
                        size += 8; // Array overhead
                        for (const item of obj) {
                            size += sizeOf(item);
                        }
                    }
                    else if (obj instanceof Date) {
                        size += 8;
                    }
                    else if (obj instanceof RegExp) {
                        size += obj.source.length * 2;
                    }
                    else {
                        size += 8; // Object overhead
                        for (const key in obj) {
                            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                                size += key.length * 2; // Key size
                                size += sizeOf(obj[key]);
                            }
                        }
                    }
                    return size;
                }
                default:
                    return 0;
            }
        }
        return sizeOf(obj);
    }
    /**
     * Format bytes to human-readable string
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
//# sourceMappingURL=MemoryManager.js.map