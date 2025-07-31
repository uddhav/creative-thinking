/**
 * Validation Strategies
 * Handles input validation for different operation types
 */

import type { LateralTechnique, ExecuteThinkingStepInput } from '../types/index.js';
import type { DiscoverTechniquesInput, PlanThinkingSessionInput } from '../types/planning.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  workflow?: string;
}

export interface ValidationStrategy {
  validate(input: unknown): ValidationResult;
}

/**
 * Base validator with common validation methods
 */
abstract class BaseValidator implements ValidationStrategy {
  abstract validate(input: unknown): ValidationResult;

  protected validateString(value: unknown, fieldName: string, errors: string[]): value is string {
    if (typeof value !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return false;
    }
    if (value.trim().length === 0) {
      errors.push(`${fieldName} cannot be empty`);
      return false;
    }
    return true;
  }

  protected validateNumber(
    value: unknown,
    fieldName: string,
    errors: string[],
    min?: number,
    max?: number
  ): value is number {
    if (typeof value !== 'number') {
      errors.push(`${fieldName} must be a number`);
      return false;
    }
    if (min !== undefined && value < min) {
      errors.push(`${fieldName} must be at least ${min}`);
      return false;
    }
    if (max !== undefined && value > max) {
      errors.push(`${fieldName} must be at most ${max}`);
      return false;
    }
    return true;
  }

  protected validateBoolean(value: unknown, fieldName: string, errors: string[]): value is boolean {
    if (typeof value !== 'boolean') {
      errors.push(`${fieldName} must be a boolean`);
      return false;
    }
    return true;
  }

  protected validateEnum<T>(
    value: unknown,
    validValues: readonly T[],
    fieldName: string,
    errors: string[]
  ): value is T {
    if (!validValues.includes(value as T)) {
      errors.push(`${fieldName} must be one of: ${validValues.join(', ')}`);
      return false;
    }
    return true;
  }

  protected validateArray<T>(
    value: unknown,
    fieldName: string,
    errors: string[],
    itemValidator?: (item: unknown, index: number) => boolean
  ): value is T[] {
    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array`);
      return false;
    }
    if (itemValidator) {
      value.forEach((item, index) => {
        if (!itemValidator(item, index)) {
          errors.push(`${fieldName}[${index}] is invalid`);
        }
      });
    }
    return true;
  }
}

/**
 * Validator for discovery operations
 */
export class DiscoveryValidator extends BaseValidator {
  validate(input: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Input must be an object'] };
    }

    const data = input as DiscoverTechniquesInput;

    // Required fields
    if (!data.problem) {
      errors.push('Problem description is required');
      return { valid: false, errors };
    }
    if (!this.validateString(data.problem, 'problem', errors)) {
      return { valid: false, errors };
    }

    // Optional fields
    if (data.context !== undefined) {
      this.validateString(data.context, 'context', errors);
    }

    if (data.preferredOutcome !== undefined) {
      // Don't validate preferredOutcome enum - accept any string as guidance
      this.validateString(data.preferredOutcome, 'preferredOutcome', errors);
    }

    if (data.constraints !== undefined) {
      this.validateArray<string>(
        data.constraints,
        'constraints',
        errors,
        item => typeof item === 'string'
      );
    }

    if (data.currentFlexibility !== undefined) {
      this.validateNumber(data.currentFlexibility, 'currentFlexibility', errors, 0, 1);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

/**
 * Validator for planning operations
 */
export class PlanningValidator extends BaseValidator {
  validate(input: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Input must be an object'] };
    }

    const data = input as PlanThinkingSessionInput;

    // Required fields
    if (!this.validateString(data.problem, 'problem', errors)) {
      return { valid: false, errors };
    }

    if (!this.validateArray<LateralTechnique>(data.techniques, 'techniques', errors)) {
      return { valid: false, errors };
    }

    if (data.techniques && data.techniques.length === 0) {
      errors.push('at least one technique');
    }

    // Optional fields
    if (data.objectives !== undefined) {
      this.validateArray<string>(
        data.objectives,
        'objectives',
        errors,
        item => typeof item === 'string'
      );
    }

    if (data.constraints !== undefined) {
      this.validateArray<string>(
        data.constraints,
        'constraints',
        errors,
        item => typeof item === 'string'
      );
    }

    if (data.timeframe !== undefined) {
      this.validateEnum(
        data.timeframe,
        ['quick', 'thorough', 'comprehensive'] as const,
        'timeframe',
        errors
      );
    }

    if (data.includeOptions !== undefined) {
      this.validateBoolean(data.includeOptions, 'includeOptions', errors);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private isValidTechnique(value: string): boolean {
    const validTechniques: LateralTechnique[] = [
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
    ];
    return validTechniques.includes(value as LateralTechnique);
  }
}

/**
 * Validator for thinking step execution
 */
export class ExecutionValidator extends BaseValidator {
  validate(input: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Input must be an object'] };
    }

    const data = input as ExecuteThinkingStepInput;

    // Check if this looks like a completely invalid operation
    if (!data.planId && !data.technique && !data.problem && !data.currentStep) {
      return {
        valid: false,
        errors: [
          'Invalid operation. This server only supports three tools: discover_techniques, plan_thinking_session, and execute_thinking_step',
        ],
      };
    }

    // planId is REQUIRED - enforce three-layer workflow
    if (!data.planId) {
      return {
        valid: false,
        errors: ['planId is required'],
        workflow: 'discover_techniques → plan_thinking_session → execute_thinking_step',
      };
    }

    if (!this.validateString(data.planId, 'planId', errors)) {
      return { valid: false, errors };
    }

    if (!data.technique) {
      errors.push('Invalid technique');
      return { valid: false, errors };
    }

    if (!this.validateString(data.technique, 'technique', errors)) {
      errors.push('Invalid technique');
      return { valid: false, errors };
    }

    if (!this.isValidTechnique(data.technique)) {
      errors.push(`Invalid technique: ${data.technique}`);
    }

    if (!data.problem) {
      errors.push('Invalid problem');
      return { valid: false, errors };
    }

    if (!this.validateString(data.problem, 'problem', errors)) {
      errors.push('Invalid problem');
      return { valid: false, errors };
    }

    // Allow negative steps but add warning
    if (typeof data.currentStep !== 'number') {
      errors.push('currentStep must be a number');
      return { valid: false, errors };
    }

    if (data.currentStep < 1) {
      warnings.push(`currentStep ${data.currentStep} is less than 1`);
    }

    if (!this.validateNumber(data.totalSteps, 'totalSteps', errors, 1)) {
      return { valid: false, errors };
    }

    if (!data.output) {
      errors.push('Invalid output');
      return { valid: false, errors };
    }

    if (!this.validateString(data.output, 'output', errors)) {
      errors.push('Invalid output');
      return { valid: false, errors };
    }

    if (!this.validateBoolean(data.nextStepNeeded, 'nextStepNeeded', errors)) {
      return { valid: false, errors };
    }

    // Validate currentStep <= totalSteps
    if (data.currentStep > data.totalSteps) {
      warnings.push(`currentStep ${data.currentStep} exceeds totalSteps ${data.totalSteps}`);
    }

    // Technique-specific validation
    this.validateTechniqueSpecificFields(data, errors, warnings);

    // Revision validation
    if (data.isRevision) {
      if (!this.validateNumber(data.revisesStep, 'revisesStep', errors, 1)) {
        errors.push('revisesStep is required when isRevision is true');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateTechniqueSpecificFields(
    data: ExecuteThinkingStepInput,
    errors: string[],
    warnings: string[]
  ): void {
    switch (data.technique) {
      case 'six_hats':
        if (data.hatColor === undefined && data.currentStep >= 1 && data.currentStep <= 6) {
          warnings.push('hatColor is recommended for six_hats technique to track thinking mode');
        }
        if (data.hatColor !== undefined) {
          if (
            !this.validateEnum(
              data.hatColor,
              ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'] as const,
              'hatColor',
              errors
            )
          ) {
            // Add specific error for invalid hat color
            if (
              !['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'].includes(
                data.hatColor as string
              )
            ) {
              throw new ValidationError(
                ErrorCode.INVALID_FIELD_VALUE,
                'Invalid hatColor for six_hats technique',
                'hatColor'
              );
            }
          }
        }
        break;

      case 'po':
        if (data.provocation === undefined && data.currentStep === 1) {
          warnings.push('provocation is recommended for the first step of PO technique');
        }
        if (data.provocation !== undefined) {
          this.validateString(data.provocation, 'provocation', errors);
        }
        if (data.principles !== undefined) {
          this.validateArray<string>(
            data.principles,
            'principles',
            errors,
            item => typeof item === 'string'
          );
        }
        break;

      case 'random_entry':
        if (data.randomStimulus !== undefined) {
          this.validateString(data.randomStimulus, 'randomStimulus', errors);
        }
        if (data.connections !== undefined) {
          this.validateArray<string>(
            data.connections,
            'connections',
            errors,
            item => typeof item === 'string'
          );
        }
        break;

      case 'scamper':
        if (data.scamperAction === undefined) {
          warnings.push('scamperAction should be specified for SCAMPER technique');
        }
        if (data.scamperAction !== undefined) {
          if (
            !this.validateEnum(
              data.scamperAction,
              [
                'substitute',
                'combine',
                'adapt',
                'modify',
                'put_to_other_use',
                'eliminate',
                'reverse',
                'parameterize',
              ] as const,
              'scamperAction',
              errors
            )
          ) {
            // Add specific error for invalid SCAMPER action
            if (
              ![
                'substitute',
                'combine',
                'adapt',
                'modify',
                'put_to_other_use',
                'eliminate',
                'reverse',
                'parameterize',
              ].includes(data.scamperAction as string)
            ) {
              throw new ValidationError(
                ErrorCode.INVALID_FIELD_VALUE,
                'Invalid scamperAction for scamper technique',
                'scamperAction'
              );
            }
          }
        }
        if (data.flexibilityScore !== undefined) {
          this.validateNumber(data.flexibilityScore, 'flexibilityScore', errors, 0, 1);
        }
        break;

      case 'design_thinking':
        if (data.designStage === undefined) {
          warnings.push('designStage is recommended to track Design Thinking progress');
        }
        if (data.designStage !== undefined) {
          this.validateEnum(
            data.designStage,
            ['empathize', 'define', 'ideate', 'prototype', 'test'] as const,
            'designStage',
            errors
          );
        }
        break;

      case 'neural_state':
        if (data.dominantNetwork !== undefined) {
          this.validateEnum(
            data.dominantNetwork,
            ['dmn', 'ecn'] as const,
            'dominantNetwork',
            errors
          );
        }
        if (data.suppressionDepth !== undefined) {
          this.validateNumber(data.suppressionDepth, 'suppressionDepth', errors, 0, 10);
        }
        break;
    }

    // Validate risk/adversarial fields
    if (
      data.risks !== undefined &&
      data.risks.length > 0 &&
      (!data.mitigations || data.mitigations.length === 0)
    ) {
      warnings.push('Consider providing mitigations when risks are identified');
    }
    if (data.risks !== undefined) {
      this.validateArray<string>(data.risks, 'risks', errors, item => typeof item === 'string');
    }
    if (data.mitigations !== undefined) {
      this.validateArray<string>(
        data.mitigations,
        'mitigations',
        errors,
        item => typeof item === 'string'
      );
    }
  }

  private isValidTechnique(value: string): boolean {
    const validTechniques: LateralTechnique[] = [
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
    ];
    return validTechniques.includes(value as LateralTechnique);
  }
}

/**
 * Validator for session operations
 */
export class SessionOperationValidator extends BaseValidator {
  validate(input: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Input must be an object'] };
    }

    const data = input as {
      sessionOperation?: string;
      saveOptions?: {
        sessionName?: string;
        tags?: string[];
        asTemplate?: boolean;
      };
      loadOptions?: { sessionId?: string };
      listOptions?: {
        limit?: number;
        technique?: string;
        status?: string;
      };
      deleteOptions?: { sessionId?: string };
      exportOptions?: {
        sessionId?: string;
        format?: string;
      };
    };

    if (
      !this.validateEnum(
        data.sessionOperation,
        ['save', 'load', 'list', 'delete', 'export'] as const,
        'sessionOperation',
        errors
      )
    ) {
      return { valid: false, errors };
    }

    // Validate operation-specific fields
    switch (data.sessionOperation) {
      case 'save':
        if (data.saveOptions) {
          this.validateSaveOptions(data.saveOptions, errors);
        }
        break;

      case 'load':
        if (!data.loadOptions || !data.loadOptions.sessionId) {
          errors.push('loadOptions.sessionId is required for load operation');
        }
        break;

      case 'list':
        if (data.listOptions) {
          this.validateListOptions(data.listOptions, errors);
        }
        break;

      case 'delete':
        if (!data.deleteOptions || !data.deleteOptions.sessionId) {
          errors.push('deleteOptions.sessionId is required for delete operation');
        }
        break;

      case 'export':
        if (!data.exportOptions || !data.exportOptions.sessionId) {
          errors.push('exportOptions.sessionId is required for export operation');
        }
        if (
          data.exportOptions &&
          !this.validateEnum(
            data.exportOptions.format,
            ['json', 'markdown', 'csv'] as const,
            'exportOptions.format',
            errors
          )
        ) {
          errors.push('exportOptions.format must be one of: json, markdown, csv');
        }
        break;
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateSaveOptions(
    options: {
      sessionName?: string;
      tags?: string[];
      asTemplate?: boolean;
    },
    errors: string[]
  ): void {
    if (options.sessionName !== undefined) {
      this.validateString(options.sessionName, 'saveOptions.sessionName', errors);
    }
    if (options.tags !== undefined) {
      this.validateArray<string>(
        options.tags,
        'saveOptions.tags',
        errors,
        item => typeof item === 'string'
      );
    }
    if (options.asTemplate !== undefined) {
      this.validateBoolean(options.asTemplate, 'saveOptions.asTemplate', errors);
    }
  }

  private validateListOptions(
    options: {
      limit?: number;
      technique?: string;
      status?: string;
    },
    errors: string[]
  ): void {
    if (options.limit !== undefined) {
      this.validateNumber(options.limit, 'listOptions.limit', errors, 1, 1000);
    }
    if (options.technique !== undefined && !this.isValidTechnique(options.technique)) {
      errors.push(`Invalid technique in listOptions: ${options.technique}`);
    }
    if (options.status !== undefined) {
      this.validateEnum(
        options.status,
        ['active', 'completed', 'all'] as const,
        'listOptions.status',
        errors
      );
    }
  }

  private isValidTechnique(value: string): boolean {
    const validTechniques: LateralTechnique[] = [
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
    ];
    return validTechniques.includes(value as LateralTechnique);
  }
}

/**
 * Validation strategy factory
 */
export class ValidationStrategyFactory {
  static createValidator(operationType: string): ValidationStrategy {
    switch (operationType) {
      case 'discover':
        return new DiscoveryValidator();
      case 'plan':
        return new PlanningValidator();
      case 'execute':
        return new ExecutionValidator();
      case 'session':
        return new SessionOperationValidator();
      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }
  }
}
