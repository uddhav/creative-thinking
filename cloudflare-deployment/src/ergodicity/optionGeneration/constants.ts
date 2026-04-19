/**
 * Constants for Option Generation System
 * Centralizes all magic numbers and thresholds used throughout the option generation engine
 */

/**
 * Flexibility score thresholds that determine system behavior
 */
export const FLEXIBILITY_THRESHOLDS = {
  /** Below this threshold, the situation is critical and requires immediate action */
  CRITICAL: 0.3,
  /** Low flexibility - strong interventions needed */
  LOW: 0.4,
  /** Moderate flexibility - triggers option generation */
  MODERATE: 0.5,
  /** High flexibility - system is healthy */
  HIGH: 0.6,
  /** Very high flexibility - abundant options available */
  VERY_HIGH: 0.7,
} as const;

/**
 * Constraint strength thresholds
 */
export const CONSTRAINT_THRESHOLDS = {
  /** Weak constraints that can be easily overcome */
  WEAK: 0.3,
  /** Moderate constraints requiring attention */
  MODERATE: 0.5,
  /** Strong constraints that significantly limit options */
  STRONG: 0.6,
  /** Very strong constraints that are difficult to overcome */
  VERY_STRONG: 0.7,
} as const;

/**
 * Commitment level thresholds
 */
export const COMMITMENT_THRESHOLDS = {
  /** Low commitment - easily reversible */
  LOW: 0.3,
  /** Medium commitment - some effort to reverse */
  MEDIUM: 0.5,
  /** High commitment - difficult to reverse */
  HIGH: 0.6,
} as const;

/**
 * Reversibility cost thresholds
 */
export const REVERSIBILITY_THRESHOLDS = {
  /** Low cost to reverse */
  LOW: 0.3,
  /** Medium cost to reverse */
  MEDIUM: 0.5,
  /** High cost to reverse */
  HIGH: 0.7,
} as const;

/**
 * Option generation parameters
 */
export const OPTION_GENERATION = {
  /** Default number of options to generate */
  DEFAULT_TARGET_COUNT: 10,
  /** Maximum options per strategy to prevent overwhelming users */
  MAX_OPTIONS_PER_STRATEGY: 5,
  /** Weight applied to flexibility gain in scoring */
  FLEXIBILITY_GAIN_WEIGHT: 0.5,
  /** Minimum flexibility score to trigger option generation */
  GENERATION_TRIGGER_THRESHOLD: 0.5,
} as const;

/**
 * Barrier proximity thresholds
 */
export const BARRIER_THRESHOLDS = {
  /** Distance considered dangerously close to a barrier */
  DANGER_ZONE: 0.3,
  /** Distance at which to start monitoring barrier approach */
  WARNING_ZONE: 0.5,
} as const;

/**
 * Performance and resource limits
 */
export const RESOURCE_LIMITS = {
  /** Maximum total options to generate across all strategies */
  MAX_OPTIONS_TOTAL: 50,
  /** Maximum time allowed for option generation (ms) */
  MAX_GENERATION_TIME_MS: 1000,
  /** Maximum string length for descriptions and names */
  MAX_STRING_LENGTH: 500,
  /** Maximum cache size for option generation results */
  CACHE_SIZE_LIMIT: 100,
  /** Cache expiration time (ms) - 5 minutes */
  CACHE_EXPIRY_MS: 300000,
} as const;

/**
 * Strategy-specific thresholds
 */
export const STRATEGY_THRESHOLDS = {
  /** Decomposition strategy */
  DECOMPOSITION: {
    /** Minimum commitment level to consider decomposition */
    MIN_COMMITMENT_FOR_DECOMPOSITION: 0.5,
  },
  /** Temporal strategy */
  TEMPORAL: {
    /** Minimum commitment to consider deferral */
    MIN_COMMITMENT_FOR_DEFERRAL: 0.4,
    /** Flexibility threshold for creating buffers */
    BUFFER_CREATION_THRESHOLD: 0.4,
  },
  /** Abstraction strategy */
  ABSTRACTION: {
    /** Flexibility threshold to trigger abstraction */
    TRIGGER_THRESHOLD: 0.4,
  },
  /** Inversion strategy */
  INVERSION: {
    /** Minimum constraint strength to consider inversion */
    MIN_CONSTRAINT_STRENGTH: 0.5,
    /** Minimum reversibility cost to trigger inversion */
    MIN_REVERSIBILITY_COST: 0.7,
  },
  /** Resource strategy */
  RESOURCE: {
    /** Flexibility threshold indicating resource pressure */
    RESOURCE_PRESSURE_THRESHOLD: 0.4,
    /** Minimum constraints to indicate resource issues */
    MIN_CONSTRAINTS_FOR_PRESSURE: 3,
  },
} as const;

/**
 * Evaluation weights for scoring algorithm
 */
export const EVALUATION_WEIGHTS = {
  /** Weight for flexibility gain in final score */
  FLEXIBILITY_GAIN: 0.3,
  /** Weight for reversibility in final score */
  REVERSIBILITY: 0.25,
  /** Weight for constraint addressing in final score */
  CONSTRAINT_RELIEF: 0.25,
  /** Weight for synergy with past decisions */
  SYNERGY: 0.1,
  /** Weight for implementation effort (inverse) */
  EFFORT: 0.1,
} as const;

/**
 * Time-related constants (in milliseconds)
 */
export const TIME_CONSTANTS = {
  /** One hour in ms */
  ONE_HOUR: 3600000,
  /** One day in ms */
  ONE_DAY: 86400000,
  /** One week in ms */
  ONE_WEEK: 604800000,
  /** Default option expiry time */
  DEFAULT_OPTION_EXPIRY: 86400000, // 24 hours
} as const;

/**
 * Text processing limits
 */
export const TEXT_LIMITS = {
  /** Maximum length for option names */
  MAX_NAME_LENGTH: 100,
  /** Maximum length for option descriptions */
  MAX_DESCRIPTION_LENGTH: 500,
  /** Maximum length for individual action items */
  MAX_ACTION_LENGTH: 200,
  /** Maximum number of actions per option */
  MAX_ACTIONS: 10,
  /** Maximum number of prerequisites per option */
  MAX_PREREQUISITES: 8,
} as const;
