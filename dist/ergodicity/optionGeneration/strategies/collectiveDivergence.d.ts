/**
 * Collective Divergence Strategy - Create options through group-based expansion and diverse perspectives
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class CollectiveDivergenceStrategy extends BaseOptionStrategy {
    readonly strategyName: "collective_divergence";
    readonly description = "Create flexibility by leveraging collective intelligence and encouraging productive divergence";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private needsCollectiveSensing;
    private identifyDivergenceAreas;
    private createDivergentBrainstorming;
    private createPerspectiveMultiplication;
    private createCollectiveSensing;
    private createWisdomAggregation;
}
//# sourceMappingURL=collectiveDivergence.d.ts.map