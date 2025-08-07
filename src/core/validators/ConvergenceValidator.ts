/**
 * ConvergenceValidator - Centralized validation for convergence technique
 * Handles all convergence-specific validation logic
 */

import { ErrorFactory } from '../../errors/enhanced-errors.js';
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import type { ExecuteThinkingStepInput, LateralThinkingResponse } from '../../types/index.js';

export interface ValidationResult {
  isValid: boolean;
  error?: LateralThinkingResponse;
}

export interface ParallelResult {
  technique: string;
  insights: string[];
  results?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  planId?: string;
}

export interface ConvergenceValidationOptions {
  requireMetrics?: boolean;
  requireResults?: boolean;
  minInsights?: number;
  maxInsights?: number;
}

/**
 * Dedicated validator for convergence technique
 */
export class ConvergenceValidator {
  private errorHandler: ErrorHandler;

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler || new ErrorHandler();
  }

  /**
   * Main validation entry point for convergence
   */
  validateConvergence(
    input: ExecuteThinkingStepInput,
    options: ConvergenceValidationOptions = {}
  ): ValidationResult {
    // Check if this is actually a convergence technique
    if (input.technique !== 'convergence') {
      return { isValid: true }; // Not our concern
    }

    // Validate parallel results exist
    const parallelResultsValidation = this.validateParallelResultsExist(input);
    if (!parallelResultsValidation.isValid) {
      return parallelResultsValidation;
    }

    // Validate parallel results structure
    const structureValidation = this.validateParallelResultsStructure(
      input.parallelResults as unknown[],
      options
    );
    if (!structureValidation.isValid) {
      return structureValidation;
    }

    // Validate convergence strategy
    const strategyValidation = this.validateConvergenceStrategy(input);
    if (!strategyValidation.isValid) {
      return strategyValidation;
    }

    return { isValid: true };
  }

  /**
   * Validate that parallel results exist and are non-empty
   */
  private validateParallelResultsExist(input: ExecuteThinkingStepInput): ValidationResult {
    if (!input.parallelResults) {
      const error = ErrorFactory.missingParameter('parallelResults', 'convergence');
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          technique: input.technique,
          hasParallelResults: false,
        }),
      };
    }

    if (!Array.isArray(input.parallelResults)) {
      const error = ErrorFactory.invalidInput(
        'parallelResults',
        'array',
        typeof input.parallelResults
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          technique: input.technique,
          parallelResultsType: typeof input.parallelResults,
        }),
      };
    }

    if (input.parallelResults.length === 0) {
      const error = ErrorFactory.invalidInput('parallelResults', 'non-empty array', 'empty array');
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          technique: input.technique,
          parallelResultsCount: 0,
        }),
      };
    }

    return { isValid: true };
  }

  /**
   * Validate the structure of parallel results
   */
  private validateParallelResultsStructure(
    parallelResults: unknown[],
    options: ConvergenceValidationOptions
  ): ValidationResult {
    for (let i = 0; i < parallelResults.length; i++) {
      const result = parallelResults[i] as ParallelResult;

      // Validate basic object structure
      const objectValidation = this.validateResultObject(result, i);
      if (!objectValidation.isValid) {
        return objectValidation;
      }

      // Validate technique field
      const techniqueValidation = this.validateResultTechnique(result, i);
      if (!techniqueValidation.isValid) {
        return techniqueValidation;
      }

      // Validate insights array
      const insightsValidation = this.validateResultInsights(result, i, options);
      if (!insightsValidation.isValid) {
        return insightsValidation;
      }

      // Validate optional fields
      const optionalValidation = this.validateOptionalFields(result, i, options);
      if (!optionalValidation.isValid) {
        return optionalValidation;
      }
    }

    return { isValid: true };
  }

  /**
   * Validate result is a proper object
   */
  private validateResultObject(result: unknown, index: number): ValidationResult {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      const error = ErrorFactory.invalidInput(
        `parallelResults[${index}]`,
        'valid result object',
        result
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
          actualType: Array.isArray(result) ? 'array' : typeof result,
        }),
      };
    }
    return { isValid: true };
  }

  /**
   * Validate result technique field
   */
  private validateResultTechnique(result: ParallelResult, index: number): ValidationResult {
    if (!result.technique || typeof result.technique !== 'string') {
      const error = ErrorFactory.missingParameter(
        `parallelResults[${index}].technique`,
        'convergence'
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
          actualValue: result.technique,
        }),
      };
    }

    // Validate it's a known technique
    const validTechniques = this.getValidTechniques();
    if (!validTechniques.includes(result.technique)) {
      const error = ErrorFactory.invalidInput(
        `parallelResults[${index}].technique`,
        `one of: ${validTechniques.join(', ')}`,
        result.technique
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
          invalidTechnique: result.technique,
        }),
      };
    }

    return { isValid: true };
  }

  /**
   * Validate result insights array
   */
  private validateResultInsights(
    result: ParallelResult,
    index: number,
    options: ConvergenceValidationOptions
  ): ValidationResult {
    if (!Array.isArray(result.insights)) {
      const error = ErrorFactory.invalidInput(
        `parallelResults[${index}].insights`,
        'array of strings',
        typeof result.insights
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
          actualType: typeof result.insights,
        }),
      };
    }

    // Check insights count if specified
    if (options.minInsights && result.insights.length < options.minInsights) {
      const error = ErrorFactory.invalidInput(
        `parallelResults[${index}].insights`,
        `at least ${options.minInsights} insights`,
        `${result.insights.length} insights`
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
          insightCount: result.insights.length,
          minRequired: options.minInsights,
        }),
      };
    }

    if (options.maxInsights && result.insights.length > options.maxInsights) {
      const error = ErrorFactory.invalidInput(
        `parallelResults[${index}].insights`,
        `at most ${options.maxInsights} insights`,
        `${result.insights.length} insights`
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
          insightCount: result.insights.length,
          maxAllowed: options.maxInsights,
        }),
      };
    }

    // Validate each insight is a string
    for (let j = 0; j < result.insights.length; j++) {
      if (typeof result.insights[j] !== 'string') {
        const error = ErrorFactory.invalidInput(
          `parallelResults[${index}].insights[${j}]`,
          'string',
          typeof result.insights[j]
        );
        return {
          isValid: false,
          error: this.errorHandler.handleError(error, 'execution', {
            invalidIndex: index,
            insightIndex: j,
            actualType: typeof result.insights[j],
          }),
        };
      }

      // Check for empty insights
      if (result.insights[j].trim().length === 0) {
        const error = ErrorFactory.invalidInput(
          `parallelResults[${index}].insights[${j}]`,
          'non-empty string',
          'empty string'
        );
        return {
          isValid: false,
          error: this.errorHandler.handleError(error, 'execution', {
            invalidIndex: index,
            insightIndex: j,
          }),
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate optional fields (results, metrics)
   */
  private validateOptionalFields(
    result: ParallelResult,
    index: number,
    options: ConvergenceValidationOptions
  ): ValidationResult {
    // Validate results object
    if (options.requireResults && !result.results) {
      const error = ErrorFactory.missingParameter(
        `parallelResults[${index}].results`,
        'convergence'
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
        }),
      };
    }

    if (result.results !== undefined && result.results !== null) {
      if (!this.isSerializableObject(result.results)) {
        const error = ErrorFactory.invalidInput(
          `parallelResults[${index}].results`,
          'serializable plain object',
          typeof result.results
        );
        return {
          isValid: false,
          error: this.errorHandler.handleError(error, 'execution', {
            invalidIndex: index,
            actualType: Array.isArray(result.results) ? 'array' : typeof result.results,
          }),
        };
      }
    }

    // Validate metrics object
    if (options.requireMetrics && !result.metrics) {
      const error = ErrorFactory.missingParameter(
        `parallelResults[${index}].metrics`,
        'convergence'
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidIndex: index,
        }),
      };
    }

    if (result.metrics !== undefined && result.metrics !== null) {
      if (!this.isSerializableObject(result.metrics)) {
        const error = ErrorFactory.invalidInput(
          `parallelResults[${index}].metrics`,
          'serializable plain object',
          typeof result.metrics
        );
        return {
          isValid: false,
          error: this.errorHandler.handleError(error, 'execution', {
            invalidIndex: index,
            actualType: Array.isArray(result.metrics) ? 'array' : typeof result.metrics,
          }),
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate convergence strategy
   */
  private validateConvergenceStrategy(input: ExecuteThinkingStepInput): ValidationResult {
    if (!input.convergenceStrategy) {
      // Strategy is optional, default will be used
      return { isValid: true };
    }

    const validStrategies = ['merge', 'select', 'hierarchical'];
    if (!validStrategies.includes(input.convergenceStrategy)) {
      const error = ErrorFactory.invalidInput(
        'convergenceStrategy',
        `one of: ${validStrategies.join(', ')}`,
        input.convergenceStrategy
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(error, 'execution', {
          invalidStrategy: input.convergenceStrategy,
        }),
      };
    }

    return { isValid: true };
  }

  /**
   * Check if a value is a serializable object
   */
  private isSerializableObject(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    try {
      // Check if it can be serialized
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of valid techniques
   */
  private getValidTechniques(): string[] {
    return [
      'six_hats',
      'po',
      'random_entry',
      'scamper',
      'concept_extraction',
      'yes_and',
      'design_thinking',
      'triz',
      'neural_state',
      'temporal_work',
      'cross_cultural',
      'collective_intel',
      'disney_method',
      'nine_windows',
      'convergence',
    ];
  }

  /**
   * Extract insights from parallel results for synthesis
   */
  extractInsights(parallelResults: ParallelResult[]): string[] {
    const allInsights: string[] = [];

    for (const result of parallelResults) {
      if (result.insights && Array.isArray(result.insights)) {
        allInsights.push(
          ...result.insights.filter(i => typeof i === 'string' && i.trim().length > 0)
        );
      }
    }

    return allInsights;
  }

  /**
   * Extract metrics for analysis
   */
  extractMetrics(parallelResults: ParallelResult[]): Record<string, unknown>[] {
    const metrics: Record<string, unknown>[] = [];

    for (const result of parallelResults) {
      if (result.metrics && this.isSerializableObject(result.metrics)) {
        metrics.push(result.metrics);
      }
    }

    return metrics;
  }
}
