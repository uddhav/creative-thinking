/**
 * CompletionEnforcementConfig - Configuration for completion enforcement
 * Provides different strictness levels for session completion requirements
 */

import { EnforcementLevel, type CompletionGatekeeperConfig } from '../types/enforcement.js';
import type { LateralTechnique } from '../types/index.js';

/**
 * Predefined enforcement profiles
 */
export const ENFORCEMENT_PROFILES: Record<string, CompletionGatekeeperConfig> = {
  /**
   * Permissive mode - No enforcement, just tracking
   * Suitable for exploratory sessions or experienced users
   */
  permissive: {
    enforcementLevel: EnforcementLevel.NONE,
    minimumCompletionThreshold: 0,
    criticalTechniques: [],
    mandatoryStepsForProblemTypes: {},
    allowExplicitSkip: true,
    requireConfirmationThreshold: 0,
  },

  /**
   * Lenient mode - Warnings only, no blocking
   * Good for casual use with gentle reminders
   */
  lenient: {
    enforcementLevel: EnforcementLevel.LENIENT,
    minimumCompletionThreshold: 0.7,
    criticalTechniques: ['six_hats', 'triz'],
    mandatoryStepsForProblemTypes: {
      risk: ['six_hats.black_hat'],
      technical: ['triz'],
    },
    allowExplicitSkip: true,
    requireConfirmationThreshold: 0.5,
  },

  /**
   * Standard mode - Default balanced enforcement
   * Blocks critical gaps but allows reasonable flexibility
   */
  standard: {
    enforcementLevel: EnforcementLevel.STANDARD,
    minimumCompletionThreshold: 0.8,
    criticalTechniques: ['six_hats', 'triz'],
    mandatoryStepsForProblemTypes: {
      risk: ['six_hats.black_hat', 'triz.contradiction'],
      technical: ['triz', 'scamper.parameterize'],
      user: ['design_thinking.empathize', 'six_hats.red_hat'],
    },
    allowExplicitSkip: true,
    requireConfirmationThreshold: 0.5,
  },

  /**
   * Strict mode - Enforces comprehensive analysis
   * Ensures all planned steps are completed
   */
  strict: {
    enforcementLevel: EnforcementLevel.STRICT,
    minimumCompletionThreshold: 0.9,
    criticalTechniques: ['six_hats', 'triz', 'scamper', 'design_thinking'],
    mandatoryStepsForProblemTypes: {
      risk: ['six_hats.black_hat', 'triz.contradiction', 'scamper.eliminate'],
      technical: ['triz', 'scamper.parameterize', 'nine_windows'],
      user: ['design_thinking.empathize', 'design_thinking.test', 'six_hats.red_hat'],
      creative: ['po', 'random_entry', 'yes_and'],
    },
    allowExplicitSkip: false,
    requireConfirmationThreshold: 0.7,
  },

  /**
   * Research mode - Specialized for thorough research
   * Emphasizes multiple perspectives and cross-validation
   */
  research: {
    enforcementLevel: EnforcementLevel.STRICT,
    minimumCompletionThreshold: 0.95,
    criticalTechniques: ['six_hats', 'triz', 'cultural_integration', 'collective_intel'],
    mandatoryStepsForProblemTypes: {
      risk: ['six_hats.black_hat', 'six_hats.yellow_hat', 'triz.contradiction'],
      technical: ['triz', 'scamper', 'nine_windows'],
      user: ['design_thinking', 'cultural_integration', 'collective_intel'],
      creative: ['po', 'random_entry', 'concept_extraction'],
    },
    allowExplicitSkip: false,
    requireConfirmationThreshold: 0.8,
  },
};

/**
 * Get enforcement configuration by profile name
 */
export function getEnforcementProfile(profileName: string): CompletionGatekeeperConfig {
  const profile = ENFORCEMENT_PROFILES[profileName.toLowerCase()];
  if (!profile) {
    console.warn(`Unknown enforcement profile: ${profileName}, using standard`);
    return ENFORCEMENT_PROFILES.standard;
  }
  return profile;
}

/**
 * Create custom enforcement configuration
 */
export function createCustomEnforcement(
  overrides: Partial<CompletionGatekeeperConfig>
): CompletionGatekeeperConfig {
  // Start with standard profile and apply overrides
  return {
    ...ENFORCEMENT_PROFILES.standard,
    ...overrides,
  };
}

/**
 * Environment-based configuration loader
 */
export function loadEnforcementConfigFromEnv(): CompletionGatekeeperConfig {
  const enforcementMode = process.env.COMPLETION_ENFORCEMENT_MODE || 'standard';

  // Check for specific overrides
  const envConfig: Partial<CompletionGatekeeperConfig> = {};

  if (process.env.COMPLETION_MINIMUM_THRESHOLD) {
    envConfig.minimumCompletionThreshold = parseFloat(process.env.COMPLETION_MINIMUM_THRESHOLD);
  }

  if (process.env.COMPLETION_ALLOW_SKIP) {
    envConfig.allowExplicitSkip = process.env.COMPLETION_ALLOW_SKIP === 'true';
  }

  if (process.env.COMPLETION_CRITICAL_TECHNIQUES) {
    envConfig.criticalTechniques = process.env.COMPLETION_CRITICAL_TECHNIQUES.split(
      ','
    ) as LateralTechnique[];
  }

  // If we have overrides, create custom config
  if (Object.keys(envConfig).length > 0) {
    return createCustomEnforcement({
      ...getEnforcementProfile(enforcementMode),
      ...envConfig,
    });
  }

  return getEnforcementProfile(enforcementMode);
}

/**
 * Validate enforcement configuration
 */
export function validateEnforcementConfig(config: CompletionGatekeeperConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate thresholds
  if (config.minimumCompletionThreshold < 0 || config.minimumCompletionThreshold > 1) {
    errors.push('Minimum completion threshold must be between 0 and 1');
  }

  if (config.requireConfirmationThreshold < 0 || config.requireConfirmationThreshold > 1) {
    errors.push('Confirmation threshold must be between 0 and 1');
  }

  // Validate enforcement level
  if (!Object.values(EnforcementLevel).includes(config.enforcementLevel)) {
    errors.push(`Invalid enforcement level: ${config.enforcementLevel}`);
  }

  // Validate critical techniques
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
    'cultural_integration',
    'collective_intel',
    'disney_method',
    'nine_windows',
  ];

  for (const technique of config.criticalTechniques) {
    if (!validTechniques.includes(technique as LateralTechnique)) {
      errors.push(`Invalid critical technique: ${technique}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get problem type from problem description
 */
export function detectProblemType(problem: string): string {
  const lowerProblem = problem.toLowerCase();

  if (
    lowerProblem.includes('risk') ||
    lowerProblem.includes('security') ||
    lowerProblem.includes('safety') ||
    lowerProblem.includes('failure')
  ) {
    return 'risk';
  }

  if (
    lowerProblem.includes('technical') ||
    lowerProblem.includes('system') ||
    lowerProblem.includes('engineering') ||
    lowerProblem.includes('architecture')
  ) {
    return 'technical';
  }

  if (
    lowerProblem.includes('user') ||
    lowerProblem.includes('experience') ||
    lowerProblem.includes('customer') ||
    lowerProblem.includes('interface')
  ) {
    return 'user';
  }

  if (
    lowerProblem.includes('creative') ||
    lowerProblem.includes('innovative') ||
    lowerProblem.includes('novel') ||
    lowerProblem.includes('original')
  ) {
    return 'creative';
  }

  return 'general';
}
