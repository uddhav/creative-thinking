/**
 * Resource Strategy - Create options through resource reallocation
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class ResourceStrategy extends BaseOptionStrategy {
    readonly strategyName: "resource";
    readonly description = "Generate flexibility by reallocating, sharing, or reimagining resources";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private analyzeResourceAllocation;
    private createReallocationOption;
    private createResourceSharingOption;
    private createSubstitutionOption;
    private createMultiplicationOption;
    private extractResourceType;
    private extractResourceMentions;
    private formatResourceName;
    private findSubstitute;
    private createGeneralReallocationOption;
}
//# sourceMappingURL=resource.d.ts.map