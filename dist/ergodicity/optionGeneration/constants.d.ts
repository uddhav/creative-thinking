/**
 * Constants for Option Generation System
 * Centralizes all magic numbers and thresholds used throughout the option generation engine
 */
/**
 * Flexibility score thresholds that determine system behavior
 */
export declare const FLEXIBILITY_THRESHOLDS: {
    /** Below this threshold, the situation is critical and requires immediate action */
    readonly CRITICAL: 0.3;
    /** Low flexibility - strong interventions needed */
    readonly LOW: 0.4;
    /** Moderate flexibility - triggers option generation */
    readonly MODERATE: 0.5;
    /** High flexibility - system is healthy */
    readonly HIGH: 0.6;
    /** Very high flexibility - abundant options available */
    readonly VERY_HIGH: 0.7;
};
/**
 * Constraint strength thresholds
 */
export declare const CONSTRAINT_THRESHOLDS: {
    /** Weak constraints that can be easily overcome */
    readonly WEAK: 0.3;
    /** Moderate constraints requiring attention */
    readonly MODERATE: 0.5;
    /** Strong constraints that significantly limit options */
    readonly STRONG: 0.6;
    /** Very strong constraints that are difficult to overcome */
    readonly VERY_STRONG: 0.7;
};
/**
 * Commitment level thresholds
 */
export declare const COMMITMENT_THRESHOLDS: {
    /** Low commitment - easily reversible */
    readonly LOW: 0.3;
    /** Medium commitment - some effort to reverse */
    readonly MEDIUM: 0.5;
    /** High commitment - difficult to reverse */
    readonly HIGH: 0.6;
};
/**
 * Reversibility cost thresholds
 */
export declare const REVERSIBILITY_THRESHOLDS: {
    /** Low cost to reverse */
    readonly LOW: 0.3;
    /** Medium cost to reverse */
    readonly MEDIUM: 0.5;
    /** High cost to reverse */
    readonly HIGH: 0.7;
};
/**
 * Option generation parameters
 */
export declare const OPTION_GENERATION: {
    /** Default number of options to generate */
    readonly DEFAULT_TARGET_COUNT: 10;
    /** Maximum options per strategy to prevent overwhelming users */
    readonly MAX_OPTIONS_PER_STRATEGY: 5;
    /** Weight applied to flexibility gain in scoring */
    readonly FLEXIBILITY_GAIN_WEIGHT: 0.5;
    /** Minimum flexibility score to trigger option generation */
    readonly GENERATION_TRIGGER_THRESHOLD: 0.5;
};
/**
 * Barrier proximity thresholds
 */
export declare const BARRIER_THRESHOLDS: {
    /** Distance considered dangerously close to a barrier */
    readonly DANGER_ZONE: 0.3;
    /** Distance at which to start monitoring barrier approach */
    readonly WARNING_ZONE: 0.5;
};
/**
 * Performance and resource limits
 */
export declare const RESOURCE_LIMITS: {
    /** Maximum total options to generate across all strategies */
    readonly MAX_OPTIONS_TOTAL: 50;
    /** Maximum time allowed for option generation (ms) */
    readonly MAX_GENERATION_TIME_MS: 1000;
    /** Maximum string length for descriptions and names */
    readonly MAX_STRING_LENGTH: 500;
    /** Maximum cache size for option generation results */
    readonly CACHE_SIZE_LIMIT: 100;
    /** Cache expiration time (ms) - 5 minutes */
    readonly CACHE_EXPIRY_MS: 300000;
};
/**
 * Strategy-specific thresholds
 */
export declare const STRATEGY_THRESHOLDS: {
    /** Decomposition strategy */
    readonly DECOMPOSITION: {
        /** Minimum commitment level to consider decomposition */
        readonly MIN_COMMITMENT_FOR_DECOMPOSITION: 0.5;
    };
    /** Temporal strategy */
    readonly TEMPORAL: {
        /** Minimum commitment to consider deferral */
        readonly MIN_COMMITMENT_FOR_DEFERRAL: 0.4;
        /** Flexibility threshold for creating buffers */
        readonly BUFFER_CREATION_THRESHOLD: 0.4;
    };
    /** Abstraction strategy */
    readonly ABSTRACTION: {
        /** Flexibility threshold to trigger abstraction */
        readonly TRIGGER_THRESHOLD: 0.4;
    };
    /** Inversion strategy */
    readonly INVERSION: {
        /** Minimum constraint strength to consider inversion */
        readonly MIN_CONSTRAINT_STRENGTH: 0.5;
        /** Minimum reversibility cost to trigger inversion */
        readonly MIN_REVERSIBILITY_COST: 0.7;
    };
    /** Resource strategy */
    readonly RESOURCE: {
        /** Flexibility threshold indicating resource pressure */
        readonly RESOURCE_PRESSURE_THRESHOLD: 0.4;
        /** Minimum constraints to indicate resource issues */
        readonly MIN_CONSTRAINTS_FOR_PRESSURE: 3;
    };
};
/**
 * Evaluation weights for scoring algorithm
 */
export declare const EVALUATION_WEIGHTS: {
    /** Weight for flexibility gain in final score */
    readonly FLEXIBILITY_GAIN: 0.3;
    /** Weight for reversibility in final score */
    readonly REVERSIBILITY: 0.25;
    /** Weight for constraint addressing in final score */
    readonly CONSTRAINT_RELIEF: 0.25;
    /** Weight for synergy with past decisions */
    readonly SYNERGY: 0.1;
    /** Weight for implementation effort (inverse) */
    readonly EFFORT: 0.1;
};
/**
 * Time-related constants (in milliseconds)
 */
export declare const TIME_CONSTANTS: {
    /** One hour in ms */
    readonly ONE_HOUR: 3600000;
    /** One day in ms */
    readonly ONE_DAY: 86400000;
    /** One week in ms */
    readonly ONE_WEEK: 604800000;
    /** Default option expiry time */
    readonly DEFAULT_OPTION_EXPIRY: 86400000;
};
/**
 * Text processing limits
 */
export declare const TEXT_LIMITS: {
    /** Maximum length for option names */
    readonly MAX_NAME_LENGTH: 100;
    /** Maximum length for option descriptions */
    readonly MAX_DESCRIPTION_LENGTH: 500;
    /** Maximum length for individual action items */
    readonly MAX_ACTION_LENGTH: 200;
    /** Maximum number of actions per option */
    readonly MAX_ACTIONS: 10;
    /** Maximum number of prerequisites per option */
    readonly MAX_PREREQUISITES: 8;
};
//# sourceMappingURL=constants.d.ts.map