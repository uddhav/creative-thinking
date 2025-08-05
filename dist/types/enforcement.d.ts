/**
 * Enforcement levels for completion requirements
 */
export declare enum EnforcementLevel {
    NONE = "none",// No enforcement
    LENIENT = "lenient",// Warnings only
    STANDARD = "standard",// Block at critical thresholds
    STRICT = "strict"
}
/**
 * Configuration for completion enforcement
 */
export interface CompletionGatekeeperConfig {
    enforcementLevel: EnforcementLevel;
    minimumCompletionThreshold: number;
    criticalTechniques: string[];
    mandatoryStepsForProblemTypes: Record<string, string[]>;
    allowExplicitSkip: boolean;
    requireConfirmationThreshold: number;
}
//# sourceMappingURL=enforcement.d.ts.map