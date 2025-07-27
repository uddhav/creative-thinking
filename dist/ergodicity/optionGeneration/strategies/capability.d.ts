/**
 * Capability Strategy - Create options by developing new skills
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class CapabilityStrategy extends BaseOptionStrategy {
    readonly strategyName: "capability";
    readonly description = "Build flexibility by developing new capabilities and skills";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private analyzeCapabilityGaps;
    private createSkillDevelopmentOption;
    private createKnowledgeTransferOption;
    private createToolMasteryOption;
    private createLearningSystemOption;
    private inferRequiredSkill;
    private formatSkillName;
}
//# sourceMappingURL=capability.d.ts.map