/**
 * TechniqueRecommender
 * Uses MCP Sampling to recommend next best techniques
 */
import type { SamplingManager } from '../SamplingManager.js';
import type { TechniqueRecommendation } from '../types.js';
import type { LateralTechnique } from '../../types/index.js';
export interface SessionState {
    problem: string;
    techniquesUsed: LateralTechnique[];
    ideasGenerated: number;
    flexibilityScore?: number;
    duration: number;
    currentMomentum?: 'high' | 'medium' | 'low';
    userPreference?: 'creative' | 'analytical' | 'systematic' | 'rapid';
    domain?: string;
}
export declare class TechniqueRecommender {
    private samplingManager;
    private readonly allTechniques;
    constructor(samplingManager: SamplingManager);
    /**
     * Recommend next technique based on session state
     */
    recommendNextTechnique(state: SessionState): Promise<TechniqueRecommendation>;
    /**
     * Get multiple technique recommendations
     */
    recommendMultipleTechniques(state: SessionState, count?: number): Promise<TechniqueRecommendation[]>;
    /**
     * Build system prompt for recommendations
     */
    private buildSystemPrompt;
    /**
     * Build user prompt for recommendation
     */
    private buildUserPrompt;
    /**
     * Parse AI response into recommendation
     */
    private parseRecommendation;
    /**
     * Extract section from response
     */
    private extractSection;
    /**
     * Extract bullet points
     */
    private extractBulletPoints;
    /**
     * Extract alternative techniques
     */
    private extractAlternatives;
    /**
     * Normalize technique name
     */
    private normalizedTechniqueName;
    /**
     * Check if technique is valid
     */
    private isValidTechnique;
    /**
     * Select fallback technique based on state
     */
    private selectFallbackTechnique;
    /**
     * Get expected benefits for a technique
     */
    private getExpectedBenefits;
    /**
     * Generate alternative recommendations
     */
    private generateAlternatives;
    /**
     * Fallback recommendation when AI is not available
     */
    private fallbackRecommendation;
    /**
     * Handle recommendation errors
     */
    private handleError;
}
//# sourceMappingURL=TechniqueRecommender.d.ts.map