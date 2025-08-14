/**
 * Constants for ergodicity and risk assessment
 */
// Confidence thresholds for risk assessment
export const CONFIDENCE_THRESHOLDS = {
    /** Minimum confidence to proceed with any action */
    MINIMUM: 0.3,
    /** Standard confidence for moderate risk actions */
    MODERATE: 0.5,
    /** Required confidence for high-stakes actions */
    HIGH_STAKES: 0.7,
};
// Domain assessment confidence thresholds
export const DOMAIN_CONFIDENCE = {
    /** Minimum confidence for domain detection */
    MINIMUM: 0.3,
    /** Confidence when multiple indicators present */
    MULTIPLE_INDICATORS: 0.5,
    /** High confidence with strong signals */
    HIGH: 0.7,
};
// Flexibility thresholds for SCAMPER and other techniques
export const FLEXIBILITY_THRESHOLDS = {
    /** Critical flexibility - escape needed */
    CRITICAL: 0.3,
    /** Low flexibility - caution advised */
    LOW: 0.4,
    /** Moderate flexibility - standard operations */
    MODERATE: 0.6,
    /** High flexibility - safe to experiment */
    HIGH: 0.7,
};
// Text processing limits
export const TEXT_LIMITS = {
    /** Maximum characters for NLP analysis */
    NLP_MAX_CHARS: 10000,
    /** Maximum domain description length */
    DOMAIN_DESC_MAX: 100,
    /** Minimum word count for unlock response */
    UNLOCK_MIN_WORDS: 50,
};
// Cache configuration
export const CACHE_LIMITS = {
    /** Maximum number of entries in context cache */
    MAX_CONTEXT_CACHE_SIZE: 100,
    /** Number of characters to use for cache key generation */
    CACHE_KEY_TRUNCATE_LENGTH: 100,
    /** Maximum input length for regex processing (prevent ReDoS) */
    MAX_REGEX_INPUT_LENGTH: 10000,
};
// Risk assessment parameters
export const RISK_PARAMS = {
    /** Degradation factor for high commitment actions */
    HIGH_COMMITMENT_DEGRADATION: 0.7,
    /** Typical reversibility costs by action type */
    REVERSIBILITY_COSTS: {
        ELIMINATE: 0.8,
        SUBSTITUTE: 0.4,
        COMBINE: 0.3,
        ADAPT: 0.35,
        MODIFY: 0.4,
        PUT_TO_OTHER_USE: 0.3,
        REVERSE: 0.5,
        PARAMETERIZE: 0.2,
    },
};
// Escalation levels
export const ESCALATION_LEVELS = {
    LOW: 1,
    MODERATE: 2,
    HIGH: 3,
    CRITICAL: 4,
};
// Time horizons for risk assessment
export const TIME_HORIZONS = {
    IMMEDIATE: 'immediate',
    SHORT: 'short',
    MEDIUM: 'medium',
    LONG: 'long',
};
// Risk severity scoring weights
export const RISK_SCORING = {
    IRREVERSIBLE_ACTIONS: 3,
    ABSORBING_BARRIERS: 3,
    NO_RECOVERY: 2,
    IMMEDIATE_TIMEFRAME: 2,
    NETWORK_EFFECTS: 1,
    TIME_DECAY: 1,
    REQUIRES_EXPERTISE: 1,
    HAS_REGULATION: 2,
    SOCIAL_CONSEQUENCES: 1,
};
// Risk severity thresholds
export const SEVERITY_THRESHOLDS = {
    CATASTROPHIC: 12,
    CRITICAL: 9,
    HIGH: 6,
    MEDIUM: 3,
};
//# sourceMappingURL=constants.js.map