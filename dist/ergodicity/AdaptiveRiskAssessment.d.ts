/**
 * Adaptive Risk Assessment
 *
 * Generates context-appropriate risk assessment language based on
 * the detected context, without categorizing into fixed domains.
 * All high-stakes decisions are treated seriously with appropriate terminology.
 */
export interface ContextIndicators {
    hasPersonalFinance: boolean;
    hasBusinessContext: boolean;
    hasHealthSafety: boolean;
    hasCreativeExploration: boolean;
    hasTechnicalMigration: boolean;
    hasHighStakes: boolean;
    resourceType: string;
    stakeholders: string[];
    recoveryTimeframe: string;
}
export declare class AdaptiveRiskAssessment {
    private contextCache;
    /**
     * Analyze context from problem and output text
     */
    analyzeContext(problem: string, output: string): ContextIndicators;
    /**
     * Generate adaptive risk assessment prompt based on context
     */
    generateAdaptivePrompt(problem: string, proposedAction: string, context: ContextIndicators): string;
    /**
     * Generate context-appropriate escalation language
     */
    generateAdaptiveEscalation(level: number, indicators: string[], context: ContextIndicators): string;
    private detectPersonalFinance;
    private detectBusinessContext;
    private detectHealthSafety;
    private detectCreativeExploration;
    private detectTechnicalMigration;
    private detectHighStakes;
    private isPortfolioContext;
    private detectResourceType;
    private identifyStakeholders;
    private estimateRecoveryTimeframe;
    private getContextualHeader;
    private getContextualQuestions;
    private getStakeholderSection;
    private getMitigationSection;
    private getContextualReminder;
    private generateHighStakesEscalation;
    private formatRiskSummary;
    private generateStakesSection;
    private generateStakeholderQuestions;
    private generateExitCriteria;
    private generateValidationChecklist;
    private generateModerateEscalation;
    private generateLowEscalation;
    /**
     * Generate cache key for context analysis
     */
    private getCacheKey;
    /**
     * Cache context analysis result
     */
    private cacheContext;
    /**
     * Clear the context cache (useful for testing or session cleanup)
     */
    clearCache(): void;
}
export declare const adaptiveRiskAssessment: AdaptiveRiskAssessment;
//# sourceMappingURL=AdaptiveRiskAssessment.d.ts.map