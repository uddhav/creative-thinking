/**
 * Stakeholder Strategy - Create options by shifting perspectives
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class StakeholderStrategy extends BaseOptionStrategy {
    readonly strategyName: "stakeholder";
    readonly description = "Generate options by considering different stakeholder perspectives and needs";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private identifyStakeholders;
    private createPerspectiveShiftOption;
    private createStakeholderReframeOption;
    private createCoalitionOption;
    private createValueRedistributionOption;
    private extractStakeholderMentions;
    private inferPosition;
    private assessStakeholderFlexibility;
    private assessStakeholderInfluence;
}
//# sourceMappingURL=stakeholder.d.ts.map