/**
 * Constants for complexity analysis
 */
export declare const COMPLEXITY_THRESHOLDS: {
    readonly DISCOVERY: {
        readonly HIGH: 4;
        readonly MEDIUM: 2;
    };
    readonly EXECUTION: {
        readonly HIGH: 3;
        readonly MEDIUM: 1;
    };
};
export declare const CONFIDENCE_THRESHOLDS: {
    readonly HIGH: 0.85;
    readonly MEDIUM: 0.7;
    readonly LOW: 0.5;
};
export declare const NLP_THRESHOLDS: {
    readonly SENTENCE_LENGTH: {
        readonly COMPLEX: 25;
        readonly MODERATE: 15;
    };
    readonly ENTITY_COUNT: {
        readonly MANY: 5;
        readonly SOME: 3;
    };
    readonly WORD_COUNT: {
        readonly MIN: 10;
        readonly MAX: 500;
    };
};
export declare const CACHE_CONFIG: {
    readonly MAX_SIZE: 100;
    readonly TTL_MS: number;
};
export declare const SAMPLING_CONFIG: {
    readonly MAX_TOKENS: 200;
    readonly MODEL_HINTS: readonly [{
        readonly name: "claude-3-haiku-20240307";
    }];
    readonly SPEED_PRIORITY: 0.8;
    readonly INTELLIGENCE_PRIORITY: 0.6;
    readonly TIMEOUT_MS: 5000;
};
export declare const COMPLEXITY_PATTERNS: {
    readonly INTERACTION: {
        readonly keywords: readonly ["interact", "depend", "connect", "influence", "affect", "relate"];
        readonly requiresContext: readonly ["multiple"];
    };
    readonly CONFLICT: {
        readonly keywords: readonly ["conflict", "compete", "contradict", "oppose", "tension", "versus"];
        readonly requiresContext: readonly [];
    };
    readonly UNCERTAINTY: {
        readonly keywords: readonly ["uncertain", "dynamic", "chang", "evolv", "unclear", "ambiguous"];
        readonly requiresContext: readonly [];
    };
    readonly STAKEHOLDER: {
        readonly keywords: readonly ["stakeholder", "user", "customer", "team", "department"];
        readonly requiresContext: readonly ["multiple", "diverse", "various"];
    };
    readonly SYSTEM: {
        readonly keywords: readonly ["system", "ecosystem", "complex", "architecture", "infrastructure"];
        readonly requiresContext: readonly [];
    };
    readonly TIME_PRESSURE: {
        readonly keywords: readonly ["deadline", "urgent", "asap", "immediate", "time pressure"];
        readonly requiresContext: readonly [];
    };
};
//# sourceMappingURL=constants.d.ts.map