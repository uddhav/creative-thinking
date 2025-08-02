/**
 * JSON Optimizer for performance improvements in large responses
 * Addresses issue #52 - Optimize JSON operations and response handling
 */

import type { LateralThinkingResponse } from '../types/index.js';

export interface JsonOptimizerConfig {
  maxStringLength?: number;
  maxArrayLength?: number;
  maxDepth?: number;
  maxResponseSize?: number; // in bytes
  truncateMessage?: string;
}

/**
 * Utilities for optimizing JSON operations and reducing response sizes
 */
export class JsonOptimizer {
  private static readonly DEFAULT_CONFIG: Required<JsonOptimizerConfig> = {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxDepth: 10,
    maxResponseSize: 1024 * 1024, // 1MB
    truncateMessage: '... [truncated]',
  };

  private config: Required<JsonOptimizerConfig>;
  private responseCache: Map<string, string> = new Map();
  private readonly MAX_CACHE_SIZE = 50;

  constructor(config: JsonOptimizerConfig = {}) {
    this.config = { ...JsonOptimizer.DEFAULT_CONFIG, ...config };
  }

  /**
   * Optimize a response object by reducing size and caching
   */
  public optimizeResponse(content: unknown): string {
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
    const optimized = this.deepOptimize(content, 0);
    const result = JSON.stringify(optimized, null, 2);

    // Check size limit
    if (result.length > this.config.maxResponseSize) {
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
  public buildOptimizedResponse(content: unknown): LateralThinkingResponse {
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
  private deepOptimize(value: unknown, depth: number): unknown {
    if (depth >= this.config.maxDepth) {
      return this.config.truncateMessage;
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.optimizeString(value);
    }

    if (Array.isArray(value)) {
      return this.optimizeArray(value, depth);
    }

    if (typeof value === 'object') {
      return this.optimizeObject(value as Record<string, unknown>, depth);
    }

    return value;
  }

  /**
   * Optimize string values
   */
  private optimizeString(str: string): string {
    if (str.length <= this.config.maxStringLength) {
      return str;
    }

    const half = Math.floor(this.config.maxStringLength / 2);
    return str.substring(0, half) + this.config.truncateMessage + str.substring(str.length - half);
  }

  /**
   * Optimize arrays
   */
  private optimizeArray(arr: unknown[], depth: number): unknown[] {
    if (arr.length <= this.config.maxArrayLength) {
      return arr.map(item => this.deepOptimize(item, depth + 1));
    }

    const half = Math.floor(this.config.maxArrayLength / 2);
    const result: unknown[] = [];

    // Keep first half
    for (let i = 0; i < half; i++) {
      result.push(this.deepOptimize(arr[i], depth + 1));
    }

    // Add truncation marker
    result.push(
      `${this.config.truncateMessage} (${arr.length - this.config.maxArrayLength} items omitted)`
    );

    // Keep last few items
    for (let i = arr.length - 5; i < arr.length; i++) {
      if (i >= 0) {
        result.push(this.deepOptimize(arr[i], depth + 1));
      }
    }

    return result;
  }

  /**
   * Optimize objects
   */
  private optimizeObject(obj: Record<string, unknown>, depth: number): Record<string, unknown> {
    const result: Record<string, unknown> = {};

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
        result[field] = this.deepOptimize(obj[field], depth + 1);
      }
    }

    // Process other fields
    for (const [key, value] of Object.entries(obj)) {
      if (!priorityFields.includes(key) && !deferredFields.includes(key)) {
        result[key] = this.deepOptimize(value, depth + 1);
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
        result[field] = this.deepOptimize(obj[field], depth + 1);
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
  private truncateResponse(content: unknown): unknown {
    if (typeof content !== 'object' || content === null) {
      return content;
    }

    const obj = content as Record<string, unknown>;
    const result: Record<string, unknown> = {
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
  private generateCacheKey(content: unknown): string {
    if (content === null) return 'response_null';
    if (content === undefined) return 'response_undefined';

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
  private updateCache(key: string, value: string): void {
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
  public clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.responseCache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

// Singleton instance for shared use
export const defaultJsonOptimizer = new JsonOptimizer();
