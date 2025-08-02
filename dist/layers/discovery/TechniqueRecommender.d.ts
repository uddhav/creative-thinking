/**
 * TechniqueRecommender - Handles technique recommendation logic
 * Extracted from discoverTechniques to improve maintainability
 */
import type { LateralTechnique } from '../../types/index.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
export declare class TechniqueRecommender {
    /**
     * Recommend techniques based on problem category and other factors
     */
    recommendTechniques(problemCategory: string, preferredOutcome: string | undefined, constraints: string[] | undefined, complexity: 'low' | 'medium' | 'high', techniqueRegistry: TechniqueRegistry): Array<{
        technique: LateralTechnique;
        reasoning: string;
        effectiveness: number;
    }>;
    /**
     * Adjust recommendations based on preferred outcome
     */
    private adjustForPreferredOutcome;
}
//# sourceMappingURL=TechniqueRecommender.d.ts.map