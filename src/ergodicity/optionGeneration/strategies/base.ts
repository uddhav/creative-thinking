/**
 * Base class for option generation strategies
 */

import type {
  Option,
  OptionGenerationContext,
  OptionCategory,
  OptionGenerationStrategy,
} from '../types.js';

/**
 * Abstract base class for all option generation strategies
 */
export abstract class BaseOptionStrategy {
  abstract readonly strategyName: OptionGenerationStrategy;
  abstract readonly description: string;
  abstract readonly typicalFlexibilityGain: { min: number; max: number };
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
  getPriority(context: OptionGenerationContext): number {
    // Default implementation - can be overridden
    const flexibilityScore = context.currentFlexibility.flexibilityScore;

    // Different strategies work better at different flexibility levels
    if (flexibilityScore < 0.2) {
      // Critical - prefer drastic strategies
      return this.typicalFlexibilityGain.max;
    } else if (flexibilityScore < 0.4) {
      // Low - prefer moderate strategies
      return (this.typicalFlexibilityGain.min + this.typicalFlexibilityGain.max) / 2;
    } else {
      // Moderate - prefer gentle strategies
      return this.typicalFlexibilityGain.min;
    }
  }

  /**
   * Create a unique ID for an option
   */
  protected createOptionId(): string {
    return `opt_${this.strategyName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper to create base option structure
   */
  protected createOption(
    name: string,
    description: string,
    category: OptionCategory,
    actions: string[],
    prerequisites: string[] = []
  ): Option {
    return {
      id: this.createOptionId(),
      name,
      description,
      strategy: this.strategyName,
      category,
      actions,
      prerequisites,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Extract relevant constraints from context
   */
  protected getRelevantConstraints(context: OptionGenerationContext): string[] {
    const constraints: string[] = [];

    // From path memory
    if (context.pathMemory.constraints.length > 0) {
      constraints.push(
        ...context.pathMemory.constraints.filter(c => c.strength > 0.5).map(c => c.description)
      );
    }

    // From generation constraints
    if (context.constraints) {
      constraints.push(...context.constraints.map(c => `${c.type}: ${c.value}`));
    }

    return constraints;
  }

  /**
   * Check if option category is allowed
   */
  protected isCategoryAllowed(category: OptionCategory, context: OptionGenerationContext): boolean {
    if (!context.constraints) return true;

    const excludeConstraints = context.constraints.filter(
      c => c.type === 'exclude_category' && c.value === category
    );

    return excludeConstraints.length === 0;
  }

  /**
   * Get minimum reversibility requirement
   */
  protected getMinReversibility(context: OptionGenerationContext): number {
    if (!context.constraints) return 0;

    const reversibilityConstraints = context.constraints
      .filter(c => c.type === 'min_reversibility')
      .map(c => c.value as number);

    return reversibilityConstraints.length > 0 ? Math.max(...reversibilityConstraints) : 0;
  }
}
