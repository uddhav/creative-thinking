/**
 * Decomposition Strategy - Break monolithic commitments into flexible pieces
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class DecompositionStrategy extends BaseOptionStrategy {
    readonly strategyName: "decomposition";
    readonly description = "Break monolithic commitments into smaller, flexible pieces";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private identifyDecomposableCommitments;
    private createDecompositionOption;
    private createGeneralModularizationOption;
    private suggestModules;
    private suggestModulesForDecision;
    private extractCoreConcept;
    private identifyCoupledComponents;
}
//# sourceMappingURL=decomposition.d.ts.map