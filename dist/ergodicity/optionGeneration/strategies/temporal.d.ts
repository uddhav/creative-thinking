/**
 * Temporal Strategy - Create options by changing time parameters
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class TemporalStrategy extends BaseOptionStrategy {
    readonly strategyName: "temporal";
    readonly description = "Create flexibility by changing time parameters - delay, accelerate, or sequence differently";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private identifyTemporalOpportunities;
    private createDelayOption;
    private createAccelerationOption;
    private createReorderingOption;
    private calculateOptimalDelay;
    private extractDecisionName;
    private hasReorderingPotential;
    private analyzeDependencies;
}
//# sourceMappingURL=temporal.d.ts.map