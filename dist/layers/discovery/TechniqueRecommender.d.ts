/**
 * TechniqueRecommender - Handles technique recommendation logic
 * Extracted from discoverTechniques to improve maintainability
 */
import type { LateralTechnique } from '../../types/index.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
export declare class TechniqueRecommender {
    private readonly WILDCARD_PROBABILITY;
    /**
     * Recommend techniques based on problem category and other factors
     */
    recommendTechniques(problemCategory: string, preferredOutcome: string | undefined, constraints: string[] | undefined, complexity: 'low' | 'medium' | 'high', techniqueRegistry: TechniqueRegistry): Array<{
        technique: LateralTechnique;
        reasoning: string;
        effectiveness: number;
        isWildcard?: boolean;
    }>;
    /**
     * Adjust recommendations based on preferred outcome
     */
    private adjustForPreferredOutcome;
    /**
     * Select a wildcard technique to prevent algorithmic pigeonholing
     */
    private selectWildcardTechnique;
}
//# sourceMappingURL=TechniqueRecommender.d.ts.map