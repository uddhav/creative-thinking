/**
 * Cultural Bridging Strategy - Create options by bridging different cultural and contextual frameworks
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class CulturalBridgingStrategy extends BaseOptionStrategy {
    readonly strategyName: "cultural_bridging";
    readonly description = "Create flexibility by bridging different cultural frameworks, contexts, and worldviews";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private hasMultipleValidApproaches;
    private identifyFrameworks;
    private createSynthesisFramework;
    private createTranslationInterface;
    private createParallelPaths;
    private createBridgeConcepts;
}
//# sourceMappingURL=culturalBridging.d.ts.map