/**
 * Constants for ergodicity and risk assessment
 */
export declare const CONFIDENCE_THRESHOLDS: {
    /** Minimum confidence to proceed with any action */
    readonly MINIMUM: 0.3;
    /** Standard confidence for moderate risk actions */
    readonly MODERATE: 0.5;
    /** Required confidence for high-stakes actions */
    readonly HIGH_STAKES: 0.7;
};
export declare const DOMAIN_CONFIDENCE: {
    /** Minimum confidence for domain detection */
    readonly MINIMUM: 0.3;
    /** Confidence when multiple indicators present */
    readonly MULTIPLE_INDICATORS: 0.5;
    /** High confidence with strong signals */
    readonly HIGH: 0.7;
};
export declare const FLEXIBILITY_THRESHOLDS: {
    /** Critical flexibility - escape needed */
    readonly CRITICAL: 0.3;
    /** Low flexibility - caution advised */
    readonly LOW: 0.4;
    /** Moderate flexibility - standard operations */
    readonly MODERATE: 0.6;
    /** High flexibility - safe to experiment */
    readonly HIGH: 0.7;
};
export declare const TEXT_LIMITS: {
    /** Maximum characters for NLP analysis */
    readonly NLP_MAX_CHARS: 10000;
    /** Maximum domain description length */
    readonly DOMAIN_DESC_MAX: 100;
    /** Minimum word count for unlock response */
    readonly UNLOCK_MIN_WORDS: 50;
};
export declare const RISK_PARAMS: {
    /** Degradation factor for high commitment actions */
    readonly HIGH_COMMITMENT_DEGRADATION: 0.7;
    /** Typical reversibility costs by action type */
    readonly REVERSIBILITY_COSTS: {
        readonly ELIMINATE: 0.8;
        readonly SUBSTITUTE: 0.4;
        readonly COMBINE: 0.3;
        readonly ADAPT: 0.35;
        readonly MODIFY: 0.4;
        readonly PUT_TO_OTHER_USE: 0.3;
        readonly REVERSE: 0.5;
        readonly PARAMETERIZE: 0.2;
    };
};
export declare const ESCALATION_LEVELS: {
    readonly LOW: 1;
    readonly MODERATE: 2;
    readonly HIGH: 3;
    readonly CRITICAL: 4;
};
export declare const TIME_HORIZONS: {
    readonly IMMEDIATE: "immediate";
    readonly SHORT: "short";
    readonly MEDIUM: "medium";
    readonly LONG: "long";
};
export declare const RISK_SCORING: {
    readonly IRREVERSIBLE_ACTIONS: 3;
    readonly ABSORBING_BARRIERS: 3;
    readonly NO_RECOVERY: 2;
    readonly IMMEDIATE_TIMEFRAME: 2;
    readonly NETWORK_EFFECTS: 1;
    readonly TIME_DECAY: 1;
    readonly REQUIRES_EXPERTISE: 1;
    readonly HAS_REGULATION: 2;
    readonly SOCIAL_CONSEQUENCES: 1;
};
export declare const SEVERITY_THRESHOLDS: {
    readonly CATASTROPHIC: 12;
    readonly CRITICAL: 9;
    readonly HIGH: 6;
    readonly MEDIUM: 3;
};
//# sourceMappingURL=constants.d.ts.map