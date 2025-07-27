/**
 * Option Evaluation Framework
 */
import type { Option, OptionEvaluation, OptionGenerationContext } from './types.js';
/**
 * Evaluates and ranks generated options
 */
export declare class OptionEvaluator {
    /**
     * Evaluate a single option
     */
    evaluateOption(option: Option, context: OptionGenerationContext): OptionEvaluation;
    /**
     * Evaluate and rank multiple options
     */
    evaluateOptions(options: Option[], context: OptionGenerationContext): OptionEvaluation[];
    /**
     * Calculate flexibility gain from implementing the option
     */
    private calculateFlexibilityGain;
    /**
     * Estimate implementation cost (0 = low cost, 1 = high cost)
     */
    private estimateImplementationCost;
    /**
     * Assess how reversible the option is (0 = irreversible, 1 = fully reversible)
     */
    private assessReversibility;
    /**
     * Calculate synergy with existing options and decisions
     */
    private calculateSynergies;
    /**
     * Estimate time to value in days
     */
    private estimateTimeToValue;
    /**
     * Calculate overall score combining all factors
     */
    private calculateOverallScore;
    /**
     * Determine recommendation level based on score and context
     */
    private determineRecommendation;
    /**
     * Generate human-readable reasoning for the evaluation
     */
    private generateReasoning;
    private calculateCategoryBonus;
    private hasPositiveSynergy;
    private hasConflict;
}
//# sourceMappingURL=evaluator.d.ts.map