/**
 * ObjectFieldValidator - Validates object-type fields in tool inputs
 * Prevents malformed JSON strings, wrong data types, and invalid structures
 */

export interface ObjectValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  value?: Record<string, unknown>;
}

export interface ArrayValidationResult {
  isValid: boolean;
  error?: string;
  recovery?: string;
  value?: string[];
}

export class ObjectFieldValidator {
  /**
   * Validates that a field is a proper object (not string, array, null, etc.)
   */
  static validateIsObject(value: unknown, fieldName: string): ObjectValidationResult {
    // Check for null/undefined
    if (value === null || value === undefined) {
      return {
        isValid: false,
        error: `${fieldName} is null or undefined`,
        suggestion: `Provide a valid object for ${fieldName}`,
      };
    }

    // Check if it's a string that looks like JSON
    if (typeof value === 'string') {
      return this.handleStringValue(value, fieldName);
    }

    // Check if it's an array (arrays are objects in JS but not what we want)
    if (Array.isArray(value)) {
      return {
        isValid: false,
        error: `${fieldName} is an array but should be an object`,
        suggestion: `Convert the array to an object structure for ${fieldName}`,
      };
    }

    // Check if it's a primitive
    if (typeof value !== 'object') {
      return {
        isValid: false,
        error: `${fieldName} must be an object, got ${typeof value}`,
        suggestion: `Provide an object with the required properties for ${fieldName}`,
      };
    }

    // It's a valid object
    return {
      isValid: true,
      value: value as Record<string, unknown>,
    };
  }

  /**
   * Handle string values that might be JSON
   */
  private static handleStringValue(value: string, fieldName: string): ObjectValidationResult {
    const trimmed = value.trim();

    // Check if it looks like JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      // Check for truncated JSON (doesn't end properly)
      const hasClosingBrace = trimmed.endsWith('}');
      const hasClosingBracket = trimmed.endsWith(']');

      if (trimmed.startsWith('{') && !hasClosingBrace) {
        return {
          isValid: false,
          error: `${fieldName} contains truncated JSON string: "${trimmed.substring(0, 50)}..."`,
          suggestion: `Ensure the JSON string is complete and properly closed. Expected format: ${this.getExpectedFormat(fieldName)}`,
        };
      }

      if (trimmed.startsWith('[') && !hasClosingBracket) {
        return {
          isValid: false,
          error: `${fieldName} contains truncated JSON array: "${trimmed.substring(0, 50)}..."`,
          suggestion: `Ensure the JSON array is complete and properly closed`,
        };
      }

      // Try to parse it
      try {
        const parsed = JSON.parse(trimmed) as unknown;

        // Check if parsed result is an object (not array)
        if (Array.isArray(parsed)) {
          return {
            isValid: false,
            error: `${fieldName} is a JSON array string but should be an object`,
            suggestion: `Pass an object directly, not a JSON string. Expected: ${this.getExpectedFormat(fieldName)}`,
          };
        }

        if (typeof parsed === 'object' && parsed !== null) {
          // Warn that they passed a JSON string instead of an object
          return {
            isValid: false,
            error: `${fieldName} was passed as a JSON string instead of an object`,
            suggestion: `Pass the object directly, not as a JSON string. Instead of "${trimmed}", use: ${JSON.stringify(parsed, null, 2)}`,
          };
        }

        return {
          isValid: false,
          error: `${fieldName} JSON string doesn't parse to an object`,
          suggestion: `Ensure ${fieldName} is a valid object structure`,
        };
      } catch (e) {
        return {
          isValid: false,
          error: `${fieldName} contains invalid JSON: ${(e as Error).message}`,
          suggestion: `Fix the JSON syntax errors in ${fieldName}. Expected format: ${this.getExpectedFormat(fieldName)}`,
        };
      }
    }

    // Regular string that doesn't look like JSON
    return {
      isValid: false,
      error: `${fieldName} is a string but should be an object`,
      suggestion: `Pass an object for ${fieldName}, not a string. Expected format: ${this.getExpectedFormat(fieldName)}`,
    };
  }

  /**
   * Get expected format for common fields
   */
  private static getExpectedFormat(fieldName: string): string {
    const formats: Record<string, string> = {
      currentCell:
        '{ "timeFrame": "past|present|future", "systemLevel": "sub-system|system|super-system" }',
      pathImpact: '{ "key": "value", ... }',
      temporalLandscape: '{ "key": "value", ... }',
      results: '{ "output": "...", ... }',
      metrics: '{ "confidence": 0.8, "flexibility": 0.7, ... }',
      parallelResults:
        '[{ "planId": "...", "technique": "...", "results": {...}, "insights": [...], "metrics": {...} }, ...]',
    };

    return formats[fieldName] || '{ ... }';
  }

  /**
   * Validate currentCell structure for Nine Windows technique
   */
  static validateCurrentCell(value: unknown): ObjectValidationResult {
    const baseValidation = this.validateIsObject(value, 'currentCell');
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const obj = baseValidation.value as Record<string, unknown>;
    const errors: string[] = [];

    // Validate timeFrame
    if (!obj.timeFrame) {
      errors.push('Missing required property: timeFrame');
    } else {
      // Convert to string safely, handling all types
      let timeFrameStr: string = '';
      const timeFrameValue = obj.timeFrame;
      if (timeFrameValue === null) {
        timeFrameStr = 'null';
      } else if (typeof timeFrameValue === 'undefined') {
        timeFrameStr = 'undefined';
      } else if (typeof timeFrameValue === 'string') {
        timeFrameStr = timeFrameValue;
      } else if (typeof timeFrameValue === 'number') {
        timeFrameStr = String(timeFrameValue);
      } else if (typeof timeFrameValue === 'boolean') {
        timeFrameStr = String(timeFrameValue);
      } else if (typeof timeFrameValue === 'symbol') {
        timeFrameStr = timeFrameValue.toString();
      } else if (typeof timeFrameValue === 'bigint') {
        timeFrameStr = timeFrameValue.toString();
      } else if (typeof timeFrameValue === 'function') {
        timeFrameStr = 'function';
      } else if (typeof timeFrameValue === 'object') {
        timeFrameStr = JSON.stringify(timeFrameValue);
      }

      if (!['past', 'present', 'future'].includes(timeFrameStr)) {
        errors.push(`Invalid timeFrame: "${timeFrameStr}". Must be one of: past, present, future`);
      }
    }

    // Validate systemLevel
    if (!obj.systemLevel) {
      errors.push('Missing required property: systemLevel');
    } else {
      // Convert to string safely, handling all types
      let systemLevelStr: string = '';
      const systemLevelValue = obj.systemLevel;
      if (systemLevelValue === null) {
        systemLevelStr = 'null';
      } else if (typeof systemLevelValue === 'undefined') {
        systemLevelStr = 'undefined';
      } else if (typeof systemLevelValue === 'string') {
        systemLevelStr = systemLevelValue;
      } else if (typeof systemLevelValue === 'number') {
        systemLevelStr = String(systemLevelValue);
      } else if (typeof systemLevelValue === 'boolean') {
        systemLevelStr = String(systemLevelValue);
      } else if (typeof systemLevelValue === 'symbol') {
        systemLevelStr = systemLevelValue.toString();
      } else if (typeof systemLevelValue === 'bigint') {
        systemLevelStr = systemLevelValue.toString();
      } else if (typeof systemLevelValue === 'function') {
        systemLevelStr = 'function';
      } else if (typeof systemLevelValue === 'object') {
        systemLevelStr = JSON.stringify(systemLevelValue);
      }

      if (!['sub-system', 'system', 'super-system'].includes(systemLevelStr)) {
        errors.push(
          `Invalid systemLevel: "${systemLevelStr}". Must be one of: sub-system, system, super-system`
        );
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: `currentCell validation failed: ${errors.join('; ')}`,
        suggestion:
          'Provide currentCell as: { "timeFrame": "past|present|future", "systemLevel": "sub-system|system|super-system" }',
      };
    }

    return { isValid: true, value: obj };
  }

  /**
   * Validate nineWindowsMatrix item structure
   */
  static validateNineWindowsMatrixItem(value: unknown, index: number): ObjectValidationResult {
    const fieldName = `nineWindowsMatrix[${index}]`;
    const baseValidation = this.validateIsObject(value, fieldName);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const obj = baseValidation.value as Record<string, unknown>;
    const errors: string[] = [];

    // Required fields
    if (!obj.timeFrame || !['past', 'present', 'future'].includes(obj.timeFrame as string)) {
      errors.push('Invalid or missing timeFrame');
    }

    if (
      !obj.systemLevel ||
      !['sub-system', 'system', 'super-system'].includes(obj.systemLevel as string)
    ) {
      errors.push('Invalid or missing systemLevel');
    }

    if (typeof obj.content !== 'string') {
      errors.push('Missing or invalid content (must be string)');
    }

    // Optional but typed fields
    if (obj.pathDependencies !== undefined && !Array.isArray(obj.pathDependencies)) {
      errors.push('pathDependencies must be an array if provided');
    }

    if (obj.irreversible !== undefined && typeof obj.irreversible !== 'boolean') {
      errors.push('irreversible must be a boolean if provided');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: `${fieldName} validation failed: ${errors.join('; ')}`,
        suggestion:
          'Each matrix item needs: timeFrame, systemLevel, content, and optionally pathDependencies (array) and irreversible (boolean)',
      };
    }

    return { isValid: true, value: obj };
  }

  /**
   * Validate parallelResults item structure
   */
  static validateParallelResultItem(value: unknown, index: number): ObjectValidationResult {
    const fieldName = `parallelResults[${index}]`;
    const baseValidation = this.validateIsObject(value, fieldName);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const obj = baseValidation.value as Record<string, unknown>;
    const errors: string[] = [];

    // Required fields
    if (typeof obj.planId !== 'string' || obj.planId.trim() === '') {
      errors.push('Missing or invalid planId (must be non-empty string)');
    }

    if (typeof obj.technique !== 'string' || obj.technique.trim() === '') {
      errors.push('Missing or invalid technique (must be non-empty string)');
    }

    // Validate nested objects
    if (obj.results !== undefined) {
      const resultsValidation = this.validateIsObject(obj.results, `${fieldName}.results`);
      if (!resultsValidation.isValid) {
        if (resultsValidation.error) {
          errors.push(resultsValidation.error);
        }
      }
    }

    if (obj.metrics !== undefined) {
      const metricsValidation = this.validateIsObject(obj.metrics, `${fieldName}.metrics`);
      if (!metricsValidation.isValid) {
        if (metricsValidation.error) {
          errors.push(metricsValidation.error);
        }
      }
    }

    if (obj.insights !== undefined && !Array.isArray(obj.insights)) {
      errors.push('insights must be an array if provided');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: `${fieldName} validation failed: ${errors.join('; ')}`,
        suggestion:
          'Each parallel result needs: planId, technique, and optionally results (object), insights (array), metrics (object)',
      };
    }

    return { isValid: true, value: obj };
  }

  /**
   * Validates that a field is an array of strings
   */
  static validateStringArray(value: unknown, fieldName: string): ArrayValidationResult {
    // Check for null/undefined
    if (value === null || value === undefined) {
      return {
        isValid: false,
        error: `${fieldName} is null or undefined`,
        recovery: `Ensure ${fieldName} is provided as an array of strings`,
      };
    }

    // Check if it's actually an array
    if (!Array.isArray(value)) {
      // Check for common mistakes
      if (typeof value === 'string') {
        // Check if it's a JSON string that should be parsed
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (Array.isArray(parsed)) {
              return {
                isValid: false,
                error: `${fieldName} was passed as a JSON string instead of an array`,
                recovery: `Parse the JSON string before passing it to the API. Use JSON.parse() or send the actual array.`,
              };
            }
          } catch (e) {
            return {
              isValid: false,
              error: `${fieldName} contains invalid JSON array string: ${(e as Error).message}`,
              recovery: `Fix the JSON syntax in ${fieldName} or send it as a proper array`,
            };
          }
        }
        return {
          isValid: false,
          error: `${fieldName} is a string but should be an array`,
          recovery: `Convert ${fieldName} to an array. If it's a single value, wrap it in brackets: ["${value}"]`,
        };
      }

      if (typeof value === 'object') {
        return {
          isValid: false,
          error: `${fieldName} is an object but should be an array`,
          recovery: `Convert ${fieldName} to an array format. Objects should be wrapped in an array: [${JSON.stringify(value)}]`,
        };
      }

      return {
        isValid: false,
        error: `${fieldName} must be an array, got ${typeof value}`,
        recovery: `Provide ${fieldName} as an array of strings`,
      };
    }

    // Validate each element is a string
    for (let i = 0; i < value.length; i++) {
      const item = value[i] as unknown;
      if (typeof item !== 'string') {
        return {
          isValid: false,
          error: `${fieldName}[${i}] is not a string (got ${typeof item})`,
          recovery: `Ensure all elements in ${fieldName} are strings. Convert ${fieldName}[${i}] to a string.`,
        };
      }
    }

    return { isValid: true, value: value as string[] };
  }

  /**
   * Validates Disney Method specific array fields
   */
  static validateDisneyMethodArrays(params: Record<string, unknown>): ArrayValidationResult {
    // Check dreamerVision
    if (params.dreamerVision !== undefined) {
      const validation = this.validateStringArray(params.dreamerVision, 'dreamerVision');
      if (!validation.isValid) {
        return validation;
      }
    }

    // Check realistPlan
    if (params.realistPlan !== undefined) {
      const validation = this.validateStringArray(params.realistPlan, 'realistPlan');
      if (!validation.isValid) {
        return validation;
      }
    }

    // Check criticRisks
    if (params.criticRisks !== undefined) {
      const validation = this.validateStringArray(params.criticRisks, 'criticRisks');
      if (!validation.isValid) {
        return validation;
      }
    }

    return { isValid: true };
  }

  /**
   * Generic method to validate any technique's array fields
   */
  static validateTechniqueArrayFields(
    technique: string,
    params: Record<string, unknown>
  ): ArrayValidationResult {
    // Map of technique to its array fields
    const techniqueArrayFields: Record<string, string[]> = {
      disney_method: ['dreamerVision', 'realistPlan', 'criticRisks'],
      cross_cultural: [
        'culturalFrameworks',
        'bridgeBuilding',
        'respectfulSynthesis',
        'parallelPaths',
      ],
      collective_intel: [
        'wisdomSources',
        'emergentPatterns',
        'synergyCombinations',
        'collectiveInsights',
      ],
      design_thinking: [
        'empathyInsights',
        'ideaList',
        'failureModesPredicted',
        'stressTestResults',
        'userFeedback',
        'failureInsights',
      ],
      concept_extraction: ['extractedConcepts', 'abstractedPatterns', 'applications'],
      yes_and: ['additions', 'evaluations'],
      triz: ['inventivePrinciples', 'viaNegativaRemovals'],
      neural_state: ['switchingRhythm', 'integrationInsights'],
      temporal_work: [
        'circadianAlignment',
        'pressureTransformation',
        'asyncSyncBalance',
        'temporalEscapeRoutes',
      ],
      scamper: ['modifications', 'alternativeSuggestions'],
      po: ['principles', 'connections'],
      six_hats: [], // No specific array fields
      nine_windows: ['interdependencies'],
      random_entry: [], // No specific array fields
    };

    const arrayFields = techniqueArrayFields[technique] || [];

    // Also check common array fields that apply to all techniques
    const commonArrayFields = [
      'risks',
      'failureModes',
      'mitigations',
      'antifragileProperties',
      'blackSwans',
    ];
    const allFields = [...arrayFields, ...commonArrayFields];

    for (const field of allFields) {
      if (params[field] !== undefined) {
        const validation = this.validateStringArray(params[field], field);
        if (!validation.isValid) {
          return validation;
        }
      }
    }

    return { isValid: true };
  }
}
