/**
 * Dynamic Stakes Discovery
 *
 * Forces concrete thinking about what's at risk without
 * predefined domain templates. Uses the LLM's own risk
 * discoveries to prompt specific quantification.
 */
import type { SessionData } from '../types/index.js';
import type { RiskEngagementMetrics } from './riskDismissalTracker.js';
export interface StakesDeclaration {
    whatIsAtRisk: string;
    quantifiedAmount?: string;
    percentageOfTotal?: number;
    cannotBeLost: string[];
    timeToRecover?: string;
    alternativeCount?: number;
    exitConditions: ExitCondition[];
}
export interface ExitCondition {
    condition: string;
    measurable: boolean;
    timeBound?: string;
    relatedToRisk: string;
}
export declare class StakesDiscovery {
    /**
     * Generate stakes requirement based on discovered risks
     */
    generateStakesPrompt(sessionData: SessionData, proposedAction: string): string;
    /**
     * Generate risk-specific quantification prompts
     */
    private generateRiskSpecificPrompts;
    /**
     * Extract relevant risks from session
     */
    private extractRelevantRisks;
    /**
     * Extract risk phrases from free text
     */
    private extractRiskPhrasesFromText;
    /**
     * Validate stakes declaration
     */
    validateStakes(declaration: Partial<StakesDeclaration>, metrics: RiskEngagementMetrics): {
        valid: boolean;
        missing: string[];
    };
    /**
     * Generate historical context based on stakes
     */
    generateHistoricalContext(declaration: Partial<StakesDeclaration>, indicators: string[]): string;
}
//# sourceMappingURL=stakesDiscovery.d.ts.map