/**
 * Inversion Strategy - Create options by flipping assumptions
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class InversionStrategy extends BaseOptionStrategy {
    readonly strategyName: "inversion";
    readonly description = "Create options by inverting current assumptions and constraints";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private identifyInvertibleAssumptions;
    private createInversionOption;
    private createConstraintInversionOption;
    private createProcessInversionOption;
    private extractAssumption;
    private assessInversionBenefit;
    private generateExample;
    private shortenAssumption;
    private hasInvertibleConstraints;
    private getCommonAssumptions;
    private createGenericConstraintInversion;
    private extractProcessFlow;
    private extractActionWord;
}
//# sourceMappingURL=inversion.d.ts.map