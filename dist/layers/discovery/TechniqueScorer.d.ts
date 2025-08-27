/**
 * TechniqueScorer - Multi-factor scoring system for technique selection
 * Provides intelligent technique recommendations based on multiple factors
 */
import type { LateralTechnique } from '../../types/index.js';
export interface ScoringFactors {
    categoryFit: number;
    complexityMatch: number;
    constraintCompatibility: number;
    outcomeAlignment: number;
}
export interface ScoringWeights {
    categoryFit: number;
    complexityMatch: number;
    constraintCompatibility: number;
    outcomeAlignment: number;
}
export interface TechniqueMetadata {
    complexity: 'low' | 'medium' | 'high';
    handlesTimeConstraints: boolean;
    handlesResourceConstraints: boolean;
    handlesCollaborationNeeds: boolean;
    outcomeProfiles: {
        innovative: number;
        systematic: number;
        riskAware: number;
        collaborative: number;
        analytical: number;
    };
    stepCount: number;
}
export interface ProblemContext {
    category: string;
    complexity: 'low' | 'medium' | 'high';
    hasTimeConstraints: boolean;
    hasResourceConstraints: boolean;
    needsCollaboration: boolean;
    preferredOutcome?: string;
}
export declare class TechniqueScorer {
    private readonly DEFAULT_WEIGHTS;
    private readonly techniqueMetadata;
    constructor(weights?: ScoringWeights);
    private weights;
    /**
     * Calculate multi-factor score for a technique given the problem context
     */
    calculateScore(technique: LateralTechnique, context: ProblemContext, categoryScore: number): number;
    /**
     * Get detailed scoring breakdown for debugging/transparency
     */
    getScoreBreakdown(technique: LateralTechnique, context: ProblemContext, categoryScore: number): ScoringFactors & {
        final: number;
    };
    /**
     * Calculate complexity match score
     */
    private calculateComplexityMatch;
    /**
     * Calculate constraint compatibility score
     */
    private calculateConstraintCompatibility;
    /**
     * Calculate outcome alignment score
     */
    private calculateOutcomeAlignment;
    /**
     * Normalize score to 0-1 range
     */
    private normalizScore;
    /**
     * Get technique metadata for external use
     */
    getTechniqueMetadata(technique: LateralTechnique): TechniqueMetadata | undefined;
    /**
     * Estimate execution time based on complexity and step count
     */
    estimateExecutionTime(technique: LateralTechnique): 'quick' | 'moderate' | 'extensive';
}
//# sourceMappingURL=TechniqueScorer.d.ts.map