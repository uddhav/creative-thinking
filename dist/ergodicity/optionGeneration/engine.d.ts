/**
 * Main Option Generation Engine
 */
import type { Option, OptionGenerationContext, OptionGenerationResult, OptionGenerationStrategy } from './types.js';
/**
 * Option Generation Engine that systematically creates new possibilities
 */
export declare class OptionGenerationEngine {
    private strategies;
    private evaluator;
    constructor();
    /**
     * Generate options to increase flexibility
     */
    generateOptions(context: OptionGenerationContext, targetCount?: number): OptionGenerationResult;
    /**
     * Generate options using specific strategies
     */
    generateWithStrategies(context: OptionGenerationContext, strategies: OptionGenerationStrategy[], targetCount?: number): OptionGenerationResult;
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