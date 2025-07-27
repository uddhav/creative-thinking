/**
 * Main Option Generation Engine
 */
import type { Option, OptionGenerationContext, OptionGenerationResult, OptionGenerationStrategy } from './types.js';
/**
 * Error reporting for option generation
 */
export interface OptionGenerationError {
    strategy: string;
    error: Error;
    timestamp: number;
    context: string;
}
/**
 * Option Generation Engine that systematically creates new possibilities
 */
export declare class OptionGenerationEngine {
    private strategies;
    private evaluator;
    private errors;
    private optionCache;
    constructor();
    /**
     * Validate option generation context
     */
    private validateContext;
    /**
     * Sanitize string input to prevent injection and limit length
     */
    private sanitizeString;
    /**
     * Clean and validate generated options
     */
    private cleanOptions;
    /**
     * Report an error during option generation
     */
    private reportError;
    /**
     * Get reported errors
     */
    getErrors(): OptionGenerationError[];
    /**
     * Generate cache key from context
     */
    private getCacheKey;
    /**
     * Get cached options if available and fresh
     */
    private getCachedOptions;
    /**
     * Clean up expired options and cache entries
     */
    private cleanupExpiredOptions;
    /**
     * Generate options to increase flexibility
     */
    generateOptions(context: OptionGenerationContext, targetCount?: number): OptionGenerationResult;
    /**
     * Create result object
     */
    private createResult;
    /**
     * Create empty result for error cases
     */
    private createEmptyResult;
    /**
     * Generate options using specific strategies
     * @deprecated Use generateOptions with preferredStrategies in context
     */
    generateWithStrategies(context: OptionGenerationContext, strategies: OptionGenerationStrategy[], targetCount?: number): OptionGenerationResult;
    /**
     * Generate options with specific strategies (alias for tests)
     */
    generateOptionsWithStrategies(context: OptionGenerationContext, strategies: OptionGenerationStrategy[], targetCount?: number): OptionGenerationResult;
    /**
     * Check if option generation is recommended
     */
    shouldGenerateOptions(context: OptionGenerationContext): boolean;
    /**
     * Get a quick option without full generation
     */
    getQuickOption(context: OptionGenerationContext): Option | null;
    /**
     * Get available strategies
     */
    getAvailableStrategies(): Array<{
        name: OptionGenerationStrategy;
        description: string;
        typicalGain: {
            min: number;
            max: number;
        };
    }>;
    /**
     * Get strategy details
     */
    getStrategyDetails(strategyName: OptionGenerationStrategy): {
        name: string;
        description: string;
        applicableCategories: string[];
        typicalGain: {
            min: number;
            max: number;
        };
    } | null;
    private getApplicableStrategies;
    private calculateProjectedFlexibility;
    private identifyCriticalConstraints;
}
//# sourceMappingURL=engine.d.ts.map