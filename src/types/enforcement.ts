/**
 * Enforcement levels for completion requirements
 */
export enum EnforcementLevel {
  NONE = 'none', // No enforcement
  LENIENT = 'lenient', // Warnings only
  STANDARD = 'standard', // Block at critical thresholds
  STRICT = 'strict', // Enforce minimum thresholds
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
