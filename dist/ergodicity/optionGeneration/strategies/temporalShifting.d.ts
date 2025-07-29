/**
 * Temporal Shifting Strategy - Create options by shifting time perspectives and temporal dynamics
 */
import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
export declare class TemporalShiftingStrategy extends BaseOptionStrategy {
    readonly strategyName: "temporal_shifting";
    readonly description = "Create flexibility by shifting temporal perspectives - zoom in/out on timeframes, create temporal buffers";
    readonly typicalFlexibilityGain: {
        min: number;
        max: number;
    };
    readonly applicableCategories: OptionCategory[];
    isApplicable(context: OptionGenerationContext): boolean;
    generate(context: OptionGenerationContext): Option[];
    estimateEffort(option: Option): 'low' | 'medium' | 'high';
    private hasRigidRhythm;
    private createTimeHorizonExpansion;
    private createTemporalBuffer;
    private createRhythmBreaking;
    private createTemporalDecoupling;
    private estimateCurrentHorizon;
    private identifyCoupledActivities;
}
//# sourceMappingURL=temporalShifting.d.ts.map