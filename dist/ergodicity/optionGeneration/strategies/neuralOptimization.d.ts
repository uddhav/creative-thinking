/**
 * Neural Optimization Strategy - Create options by leveraging neural state management
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class NeuralOptimizationStrategy extends BaseOptionStrategy {
    readonly strategyName: "neural_optimization";
    readonly description = "Create flexibility by optimizing neural states - switching between focused and diffuse thinking modes";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private hasRepetitivePatterns;
    private needsDMNActivation;
    private needsECNOptimization;
    private needsSwitchingRhythm;
    private calculateVariability;
    private createDMNOption;
    private createECNOption;
    private createSwitchingOption;
    private createLoadRedistributionOption;
}
//# sourceMappingURL=neuralOptimization.d.ts.map