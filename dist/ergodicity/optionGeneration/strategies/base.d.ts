/**
 * Base class for option generation strategies
 */
import type { Option, OptionGenerationContext, OptionCategory, OptionGenerationStrategy } from '../types.js';
/**
 * Abstract base class for all option generation strategies
 */
export declare abstract class BaseOptionStrategy {
    abstract readonly strategyName: OptionGenerationStrategy;
    abstract readonly description: string;
    abstract readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    abstract readonly applicableCategories: OptionCategory[];
    /**
     * Check if this strategy is applicable in the current context
     */
    abstract isApplicable(context: OptionGenerationContext): boolean;
    /**
     * Generate options using this strategy
     * @returns 2-5 options typically
     */
    abstract generate(context: OptionGenerationContext): Option[];
    /**
     * Estimate effort required for options from this strategy
     */
    abstract estimateEffort(option: Option): 'low' | 'medium' | 'high';
    /**
     * Get priority score for this strategy (0-1)
     * Higher scores mean strategy should be tried first
     */
    getPriority(context: OptionGenerationContext): number;
    /**
     * Create a unique ID for an option
     */
    protected createOptionId(): string;
    /**
     * Helper to create base option structure
     */
    protected createOption(name: string, description: string, category: OptionCategory, actions: string[], prerequisites?: string[]): Option;
    /**
     * Extract relevant constraints from context
     */
    protected getRelevantConstraints(context: OptionGenerationContext): string[];
    /**
     * Check if option category is allowed
     */
    protected isCategoryAllowed(category: OptionCategory, context: OptionGenerationContext): boolean;
    /**
     * Get minimum reversibility requirement
     */
    protected getMinReversibility(context: OptionGenerationContext): number;
}
//# sourceMappingURL=base.d.ts.map