/**
 * RiskGenerator
 * Uses MCP Sampling to generate comprehensive risk assessments
 */
import type { SamplingManager } from '../SamplingManager.js';
import type { RiskAssessment } from '../types.js';
export declare class RiskGenerator {
    private samplingManager;
    constructor(samplingManager: SamplingManager);
    /**
     * Generate risk assessment for a solution
     */
    generateRisks(solution: string, context?: string, domain?: string): Promise<RiskAssessment>;
    /**
     * Generate risks for multiple solutions
     */
    generateBatchRisks(solutions: Array<{
        solution: string;
        context?: string;
    }>, domain?: string): Promise<RiskAssessment[]>;
    /**
     * Build system prompt for risk assessment
     */
    private buildSystemPrompt;
    /**
     * Build user prompt for risk assessment
     */
    private buildUserPrompt;
    /**
     * Parse AI response into structured risk assessment
     */
    private parseRiskAssessment;
    /**
     * Parse sections from AI response
     */
    private parseSections;
    /**
     * Extract risks from a section
     */
    private extractRisks;
    /**
     * Split text into individual risk blocks
     */
    private splitIntoRiskBlocks;
    /**
     * Parse individual risk block
     */
    private parseRiskBlock;
    /**
     * Extract bullet points from text
     */
    private extractBulletPoints;
    /**
     * Parse simple risk list from unstructured text
     */
    private parseSimpleRiskList;
    /**
     * Generate basic risks when parsing fails
     */
    private generateBasicRisks;
    /**
     * Fallback risk assessment when AI is not available
     */
    private fallbackRiskAssessment;
    /**
     * Handle risk generation errors
     */
    private handleError;
    /**
     * Calculate overall risk from individual risks
     */
    calculateOverallRisk(risks: RiskAssessment['risks']): RiskAssessment['overallRisk'];
}
//# sourceMappingURL=RiskGenerator.d.ts.map