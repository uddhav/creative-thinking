/**
 * Hybrid Complexity Analyzer using NLP and MCP Sampling
 * Enhanced with comprehensive NLP analysis via NLPService
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
     * Perform local NLP analysis using NLPService
     */
    private localNLPAnalysis;
    /**
     * Detect interacting elements pattern using NLP analysis
     */
    private detectInteractingElementsNLP;
    /**
     * Legacy method for backward compatibility
     */
    private detectInteractingElements;
    /**
     * Detect conflicts pattern using NLP analysis
     */
    private detectConflictsNLP;
    /**
     * Legacy method for backward compatibility
     */
    private detectConflicts;
    /**
     * Detect uncertainty pattern using NLP analysis
     */
    private detectUncertaintyNLP;
    /**
     * Legacy method for backward compatibility
     */
    private detectUncertainty;
    /**
     * Detect multiple stakeholders using NLP analysis
     */
    private detectMultipleStakeholdersNLP;
    /**
     * Legacy method for backward compatibility
     */
    private detectMultipleStakeholders;
    /**
     * Detect system complexity using NLP analysis
     */
    private detectSystemComplexityNLP;
    /**
     * Legacy method for backward compatibility
     */
    private detectSystemComplexity;
    /**
     * Detect time pressure using NLP analysis
     */
    private detectTimePressureNLP;
    /**
     * Legacy method for backward compatibility
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