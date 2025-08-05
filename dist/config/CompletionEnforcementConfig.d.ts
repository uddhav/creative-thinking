/**
 * CompletionEnforcementConfig - Configuration for completion enforcement
 * Provides different strictness levels for session completion requirements
 */
import { type CompletionGatekeeperConfig } from '../types/enforcement.js';
/**
 * Predefined enforcement profiles
 */
export declare const ENFORCEMENT_PROFILES: Record<string, CompletionGatekeeperConfig>;
/**
 * Get enforcement configuration by profile name
 */
export declare function getEnforcementProfile(profileName: string): CompletionGatekeeperConfig;
/**
 * Create custom enforcement configuration
 */
export declare function createCustomEnforcement(overrides: Partial<CompletionGatekeeperConfig>): CompletionGatekeeperConfig;
/**
 * Environment-based configuration loader
 */
export declare function loadEnforcementConfigFromEnv(): CompletionGatekeeperConfig;
/**
 * Validate enforcement configuration
 */
export declare function validateEnforcementConfig(config: CompletionGatekeeperConfig): {
    isValid: boolean;
    errors: string[];
};
/**
 * Get problem type from problem description
 */
export declare function detectProblemType(problem: string): string;
//# sourceMappingURL=CompletionEnforcementConfig.d.ts.map