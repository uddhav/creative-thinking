/**
 * Abstraction Strategy - Move up levels to find new solution spaces
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class AbstractionStrategy extends BaseOptionStrategy {
    readonly strategyName: "abstraction";
    readonly description = "Move up abstraction levels to discover new solution spaces and patterns";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private createPatternAbstractionOption;
    private createDomainTransferOption;
    private createPrincipleExtractionOption;
    private createMetaphorOption;
    private identifyPatterns;
    private findAnalogousDomains;
    private extractPrinciples;
    private generateMetaphor;
}
//# sourceMappingURL=abstraction.d.ts.map