/**
 * Dynamic Ruin Risk Discovery Framework
 *
 * This meta-framework helps LLMs discover domain-specific risks during inference
 * rather than relying on hard-coded validations. It uses Socratic questioning
 * to guide risk discovery and then enforces the LLM's own discovered constraints.
 */
/**
 * Result of domain identification by the LLM
 */
export interface DomainAssessment {
    primaryDomain: string;
    subDomains?: string[];
    domainCharacteristics: {
        hasIrreversibleActions: boolean;
        hasAbsorbingBarriers: boolean;
        allowsRecovery: boolean;
        timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
    };
    confidence: number;
}
/**
 * Discovered risks in a specific domain
 */
export interface RiskDiscovery {
    domain: string;
    identifiedRisks: Array<{
        risk: string;
        reversibility: 'reversible' | 'difficult' | 'irreversible';
        impactMagnitude: 'minor' | 'moderate' | 'severe' | 'catastrophic';
        likelihood?: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
    }>;
    domainSpecificSafetyPractices: string[];
    maxAcceptableLoss?: string;
    recoveryMechanisms?: string[];
}
/**
 * Ruin scenario discovered by the LLM
 */
export interface RuinScenario {
    scenario: string;
    triggers: string[];
    consequences: string[];
    recoveryPossible: boolean;
    timeToRuin?: string;
    warningSignals?: string[];
}
/**
 * Result of validating an action against discovered risks
 */
export interface ValidationResult {
    isValid: boolean;
    violatedConstraints: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'unacceptable';
    requiredMitigations?: string[];
    alternativeActions?: string[];
    educationalFeedback?: string;
}
/**
 * Structured prompts for discovery phases
 */
export interface DiscoveryPrompts {
    domainIdentification: string;
    riskDiscovery: string;
    ruinScenarios: string;
    safetyPractices: string;
    maxAcceptableLoss: string;
    validation: string;
}
/**
 * Main discovery framework that guides LLMs through risk identification
 */
export declare class RuinRiskDiscovery {
    private discoveryHistory;
    /**
     * Get structured prompts for the discovery process
     */
    getDiscoveryPrompts(problem: string, proposedAction?: string): DiscoveryPrompts;
    /**
     * Process LLM's domain assessment response
     */
    processDomainAssessment(response: string): DomainAssessment;
    /**
     * Process discovered risks from LLM response
     */
    processRiskDiscovery(domain: string, response: string): RiskDiscovery;
    /**
     * Validate an action against discovered risks
     */
    validateAgainstDiscoveredRisks(action: string, discovery: RiskDiscovery, ruinScenarios: RuinScenario[]): ValidationResult;
    /**
     * Force the LLM to calculate specific risk metrics
     */
    getForcedCalculations(domain: string, action: string): Record<string, string>;
    private extractPrimaryDomain;
    private extractCharacteristics;
    private extractTimeHorizon;
    private assessConfidence;
    private extractRisks;
    private extractSafetyPractices;
    private extractMaxLoss;
    private actionViolatesPractice;
    private extractNumericLimit;
    private extractNumericAmount;
    private assessRiskLevel;
    private generateEducationalFeedback;
    /**
     * Get previously discovered risks for a domain (if any)
     */
    getCachedDiscovery(domain: string): RiskDiscovery | undefined;
}
//# sourceMappingURL=RuinRiskDiscovery.d.ts.map