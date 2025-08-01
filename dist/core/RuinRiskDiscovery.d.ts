/**
 * Dynamic Ruin Risk Discovery Framework
 *
 * This meta-framework helps LLMs discover domain-specific risks during inference
 * rather than relying on hard-coded validations. It uses Socratic questioning
 * to guide risk discovery and then enforces the LLM's own discovered constraints.
 *
 * Enhanced with adaptive domain discovery - learns about domains dynamically
 * without hardcoding specific domain knowledge.
 */
/**
 * Risk severity levels based on generic characteristics
 */
export declare enum RiskSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
    CATASTROPHIC = "catastrophic"
}
/**
 * Generic domain characteristics discovered through questioning
 */
export interface DomainCharacteristics {
    hasIrreversibleActions: boolean;
    hasAbsorbingBarriers: boolean;
    allowsRecovery: boolean;
    timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
    hasNetworkEffects: boolean;
    hasTimeDecay: boolean;
    requiresExpertise: boolean;
    hasRegulation: boolean;
    hasSocialConsequences: boolean;
}
/**
 * Result of domain identification by the LLM
 */
export interface DomainAssessment {
    primaryDomain: string;
    subDomains?: string[];
    domainCharacteristics: DomainCharacteristics;
    confidence: number;
    discoveredPatterns?: string[];
    nlpAnalysis?: {
        entities: string[];
        topics: string[];
        verbs: string[];
        temporalExpressions: string[];
        constraints: string[];
        relationships: Array<{
            subject: string;
            relation: string;
            object: string;
        }>;
    };
    riskFeatures?: {
        hasUndoableActions: boolean;
        timePressure: 'none' | 'low' | 'medium' | 'high' | 'critical';
        expertiseGap: number;
        impactRadius: 'self' | 'limited' | 'broad' | 'systemic';
        uncertaintyLevel: 'low' | 'medium' | 'high';
    };
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
     * Get structured prompts for the discovery process - adaptive version
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
     * Force the LLM to calculate specific risk metrics based on discovered characteristics
     */
    getForcedCalculations(domainAssessment: DomainAssessment, action: string): Record<string, string>;
    /**
     * Analyze text using Compromise NLP for generic risk features
     */
    private analyzeWithNLP;
    /**
     * Extract risk features using generic analysis
     */
    private extractRiskFeatures;
    /**
     * Extract domain from LLM's description without categorization
     */
    private extractDomainFromDescription;
    /**
     * Detect if actions can be undone based on language patterns
     */
    private detectUndoableActions;
    /**
     * Assess time pressure from temporal expressions and urgency language
     */
    private assessTimePressure;
    /**
     * Assess expertise gap based on technical language and requirements
     */
    private assessExpertiseGap;
    /**
     * Assess impact radius based on relationships and network effects
     */
    private assessImpactRadius;
    /**
     * Assess uncertainty level from language patterns
     */
    private assessUncertainty;
    private extractPrimaryDomain;
    private extractCharacteristics;
    private extractTimeHorizon;
    private extractTimeHorizonWithNLP;
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
     * Extract patterns from domain analysis response
     */
    private extractPatterns;
    /**
     * Get previously discovered risks for a domain (if any)
     */
    getCachedDiscovery(domain: string): RiskDiscovery | undefined;
    /**
     * Assess risk severity based on generic characteristics
     */
    assessRiskSeverity(characteristics: DomainCharacteristics): RiskSeverity;
    /**
     * Generate adaptive questions based on discovered characteristics
     */
    getAdaptiveQuestions(assessment: DomainAssessment): string[];
}
//# sourceMappingURL=RuinRiskDiscovery.d.ts.map