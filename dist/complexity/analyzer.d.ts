/**
 * Hybrid Complexity Analyzer using NLP and MCP Sampling
 */
import type { ComplexityAssessment } from './types.js';
export declare class HybridComplexityAnalyzer {
    private cache;
    constructor();
    /**
     * Analyze text complexity using hybrid approach
     */
    analyze(text: string, useCache?: boolean): Promise<ComplexityAssessment>;
    /**
     * Perform local NLP analysis using Compromise
     */
    private localNLPAnalysis;
    /**
     * Detect interacting elements pattern
     */
    private detectInteractingElements;
    /**
     * Detect conflicts pattern
     */
    private detectConflicts;
    /**
     * Detect uncertainty pattern
     */
    private detectUncertainty;
    /**
     * Detect multiple stakeholders
     */
    private detectMultipleStakeholders;
    /**
     * Detect system complexity
     */
    private detectSystemComplexity;
    /**
     * Detect time pressure
     */
    private detectTimePressure;
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