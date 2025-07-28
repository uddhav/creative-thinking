/**
 * Main Option Generation Engine
 */

import type {
  Option,
  OptionGenerationContext,
  OptionGenerationResult,
  OptionGenerationStrategy,
  OptionEvaluation,
} from './types.js';

import type { BaseOptionStrategy } from './strategies/base.js';
import { DecompositionStrategy } from './strategies/decomposition.js';
import { TemporalStrategy } from './strategies/temporal.js';
import { AbstractionStrategy } from './strategies/abstraction.js';
import { InversionStrategy } from './strategies/inversion.js';
import { StakeholderStrategy } from './strategies/stakeholder.js';
import { ResourceStrategy } from './strategies/resource.js';
import { CapabilityStrategy } from './strategies/capability.js';
import { RecombinationStrategy } from './strategies/recombination.js';
import { OptionEvaluator } from './evaluator.js';
import {
  OPTION_GENERATION,
  FLEXIBILITY_THRESHOLDS,
  BARRIER_THRESHOLDS,
  RESOURCE_LIMITS,
  TEXT_LIMITS,
  CONSTRAINT_THRESHOLDS,
} from './constants.js';
import { ErrorCode, ValidationError } from '../../errors/index.js';

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
export class OptionGenerationEngine {
  private strategies: Map<OptionGenerationStrategy, BaseOptionStrategy>;
  private evaluator: OptionEvaluator;
  private errors: OptionGenerationError[] = [];
  private optionCache: Map<string, { options: Option[]; timestamp: number }> = new Map();

  constructor() {
    this.strategies = new Map<OptionGenerationStrategy, BaseOptionStrategy>();
    this.strategies.set('decomposition', new DecompositionStrategy());
    this.strategies.set('temporal', new TemporalStrategy());
    this.strategies.set('abstraction', new AbstractionStrategy());
    this.strategies.set('inversion', new InversionStrategy());
    this.strategies.set('stakeholder', new StakeholderStrategy());
    this.strategies.set('resource', new ResourceStrategy());
    this.strategies.set('capability', new CapabilityStrategy());
    this.strategies.set('recombination', new RecombinationStrategy());

    this.evaluator = new OptionEvaluator();
  }

  /**
   * Validate option generation context
   */
  private validateContext(context: OptionGenerationContext): void {
    if (!context) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Context is required for option generation',
        'context'
      );
    }

    if (!context.sessionState) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Session state is required',
        'sessionState'
      );
    }

    if (!context.currentFlexibility) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Current flexibility state is required',
        'currentFlexibility'
      );
    }

    const flexScore = context.currentFlexibility.flexibilityScore;
    if (typeof flexScore !== 'number' || flexScore < 0 || flexScore > 1) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Flexibility score must be a number between 0 and 1',
        'currentFlexibility.flexibilityScore'
      );
    }

    if (!context.pathMemory) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Path memory is required',
        'pathMemory'
      );
    }

    if (!Array.isArray(context.pathMemory.pathHistory)) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Path history must be an array',
        'pathMemory.pathHistory'
      );
    }

    if (!Array.isArray(context.pathMemory.constraints)) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Constraints must be an array',
        'pathMemory.constraints'
      );
    }
  }

  /**
   * Sanitize string input to prevent injection and limit length
   */
  private sanitizeString(
    input: string,
    maxLength: number = TEXT_LIMITS.MAX_DESCRIPTION_LENGTH
  ): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .slice(0, maxLength);
  }

  /**
   * Clean and validate generated options
   */
  private cleanOptions(options: Option[]): Option[] {
    return options
      .filter(option => option && option.id && option.name)
      .map(option => ({
        ...option,
        name: this.sanitizeString(option.name, TEXT_LIMITS.MAX_NAME_LENGTH),
        description: this.sanitizeString(option.description, TEXT_LIMITS.MAX_DESCRIPTION_LENGTH),
        actions: option.actions
          .slice(0, TEXT_LIMITS.MAX_ACTIONS)
          .map(action => this.sanitizeString(action, TEXT_LIMITS.MAX_ACTION_LENGTH)),
        prerequisites: option.prerequisites
          .slice(0, TEXT_LIMITS.MAX_PREREQUISITES)
          .map(prereq => this.sanitizeString(prereq, TEXT_LIMITS.MAX_ACTION_LENGTH)),
      }));
  }

  /**
   * Report an error during option generation
   */
  private reportError(strategy: string, error: Error, context: string): void {
    this.errors.push({
      strategy,
      error,
      timestamp: Date.now(),
      context,
    });

    // Keep only recent errors
    const oneHourAgo = Date.now() - 3600000;
    this.errors = this.errors.filter(e => e.timestamp > oneHourAgo);
  }

  /**
   * Get reported errors
   */
  getErrors(): OptionGenerationError[] {
    return [...this.errors];
  }

  /**
   * Generate cache key from context
   */
  private getCacheKey(context: OptionGenerationContext): string {
    const key = `${context.currentFlexibility.flexibilityScore.toFixed(2)}-${
      context.pathMemory.constraints.length
    }-${context.pathMemory.pathHistory.length}`;
    return key;
  }

  /**
   * Get cached options if available and fresh
   */
  private getCachedOptions(key: string): Option[] | null {
    const cached = this.optionCache.get(key);
    if (cached && Date.now() - cached.timestamp < RESOURCE_LIMITS.CACHE_EXPIRY_MS) {
      return cached.options;
    }
    return null;
  }

  /**
   * Clean up expired options and cache entries
   */
  private cleanupExpiredOptions(): void {
    const now = Date.now();

    // Clean cache
    for (const [key, value] of this.optionCache.entries()) {
      if (now - value.timestamp > RESOURCE_LIMITS.CACHE_EXPIRY_MS) {
        this.optionCache.delete(key);
      }
    }

    // Limit cache size
    if (this.optionCache.size > RESOURCE_LIMITS.CACHE_SIZE_LIMIT) {
      const entries = Array.from(this.optionCache.entries()).sort(
        (a, b) => b[1].timestamp - a[1].timestamp
      );

      // Keep only the most recent entries
      this.optionCache.clear();
      entries.slice(0, RESOURCE_LIMITS.CACHE_SIZE_LIMIT / 2).forEach(([k, v]) => {
        this.optionCache.set(k, v);
      });
    }
  }

  /**
   * Generate options to increase flexibility
   */
  generateOptions(
    context: OptionGenerationContext,
    targetCount: number = OPTION_GENERATION.DEFAULT_TARGET_COUNT
  ): OptionGenerationResult {
    const startTime = Date.now();

    try {
      // Validate context
      this.validateContext(context);
    } catch (error) {
      this.reportError('validation', error as Error, 'Context validation failed');
      return this.createEmptyResult(context);
    }

    // Check cache
    const cacheKey = this.getCacheKey(context);
    const cachedOptions = this.getCachedOptions(cacheKey);
    if (cachedOptions) {
      const evaluations = this.evaluator.evaluateOptions(cachedOptions, context);
      // Ensure minimum generation time even for cached results
      const generationTime = Math.max(1, Date.now() - startTime);
      return this.createResult(cachedOptions, evaluations, [], generationTime, context);
    }

    // Clean up periodically
    this.cleanupExpiredOptions();

    const options: Option[] = [];
    const strategiesUsed: OptionGenerationStrategy[] = [];

    // Limit target count
    targetCount = Math.min(targetCount, RESOURCE_LIMITS.MAX_OPTIONS_TOTAL);

    // Get applicable strategies sorted by priority
    const applicableStrategies = this.getApplicableStrategies(context);

    // Generate options from each strategy until target reached
    for (const [strategyName, strategy] of applicableStrategies) {
      if (options.length >= targetCount) break;

      // Check time limit
      if (Date.now() - startTime > RESOURCE_LIMITS.MAX_GENERATION_TIME_MS) {
        this.reportError('timeout', new Error('Generation timeout'), 'Exceeded time limit');
        break;
      }

      try {
        const strategyOptions = strategy
          .generate(context)
          .slice(0, OPTION_GENERATION.MAX_OPTIONS_PER_STRATEGY);

        if (strategyOptions.length > 0) {
          const cleanedOptions = this.cleanOptions(strategyOptions);
          options.push(...cleanedOptions);
          strategiesUsed.push(strategyName);
        }
      } catch (error) {
        this.reportError(strategyName, error as Error, `Strategy execution failed`);
      }
    }

    // Cache successful results
    if (options.length > 0) {
      this.optionCache.set(cacheKey, { options, timestamp: Date.now() });
    }

    // Evaluate all options
    const evaluations = this.evaluator.evaluateOptions(options, context);

    return this.createResult(options, evaluations, strategiesUsed, Date.now() - startTime, context);
  }

  /**
   * Create result object
   */
  private createResult(
    options: Option[],
    evaluations: OptionEvaluation[],
    strategiesUsed: OptionGenerationStrategy[],
    generationTime: number,
    context: OptionGenerationContext
  ): OptionGenerationResult {
    // Find top recommendation
    const topRecommendation =
      evaluations.length > 0 ? options.find(o => o.id === evaluations[0].optionId) || null : null;

    // Calculate projected flexibility
    const projectedFlexibility = this.calculateProjectedFlexibility(
      context.currentFlexibility.flexibilityScore,
      evaluations
    );

    // Identify critical constraints being addressed
    const criticalConstraints = this.identifyCriticalConstraints(options, context);

    return {
      options,
      evaluations,
      topRecommendation,
      strategiesUsed,
      generationTime,
      context: {
        initialFlexibility: context.currentFlexibility.flexibilityScore,
        projectedFlexibility,
        criticalConstraints,
      },
    };
  }

  /**
   * Create empty result for error cases
   */
  private createEmptyResult(context: OptionGenerationContext): OptionGenerationResult {
    return {
      options: [],
      evaluations: [],
      topRecommendation: null,
      strategiesUsed: [],
      generationTime: 0,
      context: {
        initialFlexibility: context.currentFlexibility?.flexibilityScore || 0,
        projectedFlexibility: context.currentFlexibility?.flexibilityScore || 0,
        criticalConstraints: [],
      },
    };
  }

  /**
   * Generate options using specific strategies
   * @deprecated Use generateOptions with preferredStrategies in context
   */
  generateWithStrategies(
    context: OptionGenerationContext,
    strategies: OptionGenerationStrategy[],
    targetCount: number = 10
  ): OptionGenerationResult {
    // Filter context to use only specified strategies
    const filteredContext = {
      ...context,
      preferredStrategies: strategies,
    };

    return this.generateOptions(filteredContext, targetCount);
  }

  /**
   * Generate options with specific strategies (alias for tests)
   */
  generateOptionsWithStrategies(
    context: OptionGenerationContext,
    strategies: OptionGenerationStrategy[],
    targetCount: number = 10
  ): OptionGenerationResult {
    return this.generateWithStrategies(context, strategies, targetCount);
  }

  /**
   * Check if option generation is recommended
   */
  shouldGenerateOptions(context: OptionGenerationContext): boolean {
    const flexibility = context.currentFlexibility.flexibilityScore;

    // Recommend when flexibility is below moderate threshold
    if (flexibility < FLEXIBILITY_THRESHOLDS.MODERATE) return true;

    // Critical situation - always generate
    if (flexibility < FLEXIBILITY_THRESHOLDS.CRITICAL) return true;

    // Also recommend when options are being closed faster than opened
    if (context.currentFlexibility.optionVelocity && context.currentFlexibility.optionVelocity < 0)
      return true;

    // Recommend when approaching barriers
    const approachingBarrier =
      context.pathMemory?.barrierProximity?.some(
        bp => bp.distance < BARRIER_THRESHOLDS.DANGER_ZONE
      ) || false;

    return approachingBarrier;
  }

  /**
   * Get a quick option without full generation
   */
  getQuickOption(context: OptionGenerationContext): Option | null {
    // Validate context first
    try {
      this.validateContext(context);
    } catch {
      return null;
    }

    // Find the highest priority applicable strategy
    const applicableStrategies = this.getApplicableStrategies(context);

    if (applicableStrategies.length === 0) return null;

    const [strategyName, strategy] = applicableStrategies[0];

    try {
      const options = strategy.generate(context);
      return options[0] || null;
    } catch (error) {
      console.error(`Error generating quick option with ${strategyName} strategy:`, error);
      return null;
    }
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): Array<{
    name: OptionGenerationStrategy;
    description: string;
    typicalGain: { min: number; max: number };
  }> {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      description: strategy.description,
      typicalGain: strategy.typicalFlexibilityGain,
    }));
  }

  /**
   * Get strategy details
   */
  getStrategyDetails(strategyName: OptionGenerationStrategy): {
    name: string;
    description: string;
    applicableCategories: string[];
    typicalGain: { min: number; max: number };
  } | null {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return null;

    return {
      name: strategyName,
      description: strategy.description,
      applicableCategories: strategy.applicableCategories,
      typicalGain: strategy.typicalFlexibilityGain,
    };
  }

  // Private helper methods

  private getApplicableStrategies(
    context: OptionGenerationContext
  ): Array<[OptionGenerationStrategy, BaseOptionStrategy]> {
    const applicable: Array<[OptionGenerationStrategy, BaseOptionStrategy]> = [];

    // Check each strategy
    for (const [name, strategy] of this.strategies.entries()) {
      // Skip if not in preferred strategies (if specified)
      if (context.preferredStrategies && !context.preferredStrategies.includes(name)) {
        continue;
      }

      // Check if strategy is applicable
      if (strategy.isApplicable(context)) {
        applicable.push([name, strategy]);
      }
    }

    // Sort by priority
    applicable.sort(([, a], [, b]) => b.getPriority(context) - a.getPriority(context));

    return applicable;
  }

  private calculateProjectedFlexibility(
    currentFlexibility: number,
    evaluations: OptionEvaluation[]
  ): number {
    // Calculate potential flexibility if all highly recommended options are implemented
    const highlyRecommended = evaluations.filter(e => e.recommendation === 'highly_recommended');

    const recommended = evaluations.filter(e => e.recommendation === 'recommended');

    let projectedGain = 0;

    // Assume 80% of highly recommended options might be implemented
    highlyRecommended.forEach(evaluation => {
      projectedGain += evaluation.flexibilityGain * 0.8;
    });

    // Assume 50% of recommended options might be implemented
    recommended.slice(0, 3).forEach(evaluation => {
      projectedGain += evaluation.flexibilityGain * OPTION_GENERATION.FLEXIBILITY_GAIN_WEIGHT;
    });

    // Account for diminishing returns
    projectedGain *= 0.8;

    // Cap gains to be realistic
    projectedGain = Math.min(projectedGain, FLEXIBILITY_THRESHOLDS.LOW);

    return Math.min(1.0, currentFlexibility + projectedGain);
  }

  private identifyCriticalConstraints(
    options: Option[],
    context: OptionGenerationContext
  ): string[] {
    const criticalConstraints: Set<string> = new Set();

    // Find constraints with high strength
    const strongConstraints = context.pathMemory.constraints
      .filter(c => c.strength > CONSTRAINT_THRESHOLDS.STRONG)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);

    strongConstraints.forEach(constraint => {
      // Check if any option addresses this constraint
      const addressed = options.some(
        option =>
          option.description.toLowerCase().includes(constraint.type) ||
          option.actions.some(action =>
            action.toLowerCase().includes(constraint.description.toLowerCase())
          )
      );

      if (addressed) {
        criticalConstraints.add(constraint.description);
      }
    });

    return Array.from(criticalConstraints);
  }
}
