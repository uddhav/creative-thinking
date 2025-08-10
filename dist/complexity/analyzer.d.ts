/**
 * Hybrid Complexity Analyzer using NLP and MCP Sampling
 */
import type { ComplexityAssessment } from './types.js';
export declare class HybridComplexityAnalyzer {
    private cache;
    private nlpService;
    constructor();
    /**
     * Analyze text complexity using hybrid approach
     */
    analyze(text: string, useCache?: boolean): ComplexityAssessment;
    /**
     * Perform local NLP analysis using centralized NLP Service
     */
    private localNLPAnalysis;
    /**
     * Convert NLP result to complexity assessment
     */
    private nlpResultToAssessment;
    /**
     * Calculate complexity level based on factor count
     */
    private calculateComplexityLevel;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        methodDistribution: Record<string, number>;
    };
    /**
     * Clear the cache
     */
    clearCache(): void;
}
//# sourceMappingURL=analyzer.d.ts.map