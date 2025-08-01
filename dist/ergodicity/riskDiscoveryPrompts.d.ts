/**
 * Dynamic Risk Discovery Prompts
 *
 * These prompts guide LLMs to discover domain-specific risks during inference
 * rather than relying on pre-programmed domain knowledge.
 */
import type { LateralTechnique } from '../types/index.js';
/**
 * Phase of the discovery process
 */
export type DiscoveryPhase = 'domain_identification' | 'risk_discovery' | 'ruin_scenarios' | 'safety_practices' | 'forced_calculations' | 'validation';
/**
 * Get phase-specific prompts for risk discovery
 */
export declare function getDiscoveryPhasePrompt(phase: DiscoveryPhase, context: {
    problem: string;
    technique?: LateralTechnique;
    proposedAction?: string;
    previousPhaseOutput?: string;
}): string;
/**
 * Generate a meta-prompt that ensures thorough discovery
 */
export declare function getMetaDiscoveryPrompt(): string;
/**
 * Check if a response indicates high-risk discovery
 */
export declare function isHighRiskDiscovery(response: string): boolean;
/**
 * Extract concrete constraints from discovery
 */
export declare function extractHardConstraints(discoveryResponses: Record<DiscoveryPhase, string>): string[];
/**
 * Context for constraint violation feedback
 */
interface DiscoveryContext {
    domain: string;
    risks?: string[];
    ruinScenarios?: number;
    worstCase?: string;
}
/**
 * Generate educational feedback when constraints are violated
 */
export declare function generateConstraintViolationFeedback(proposedAction: string, violatedConstraints: string[], discoveryContext: DiscoveryContext): string;
export {};
//# sourceMappingURL=riskDiscoveryPrompts.d.ts.map