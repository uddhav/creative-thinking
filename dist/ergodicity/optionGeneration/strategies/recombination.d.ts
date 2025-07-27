/**
 * Recombination Strategy - Create options by mixing existing elements
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class RecombinationStrategy extends BaseOptionStrategy {
    readonly strategyName: "recombination";
    readonly description = "Generate new options by recombining existing elements in novel ways";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private extractRecombinableElements;
    private createCrossPollinationOption;
    private createHybridOption;
    private createFeatureMigrationOption;
    private createSynthesisOption;
    private extractPattern;
    private extractComponents;
    private areComplementary;
    private findUnusedCombinations;
    private formatTechniqueName;
}
//# sourceMappingURL=recombination.d.ts.map