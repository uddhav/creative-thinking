/**
 * Design Thinking technique handler
 */
import type { DesignThinkingStage } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class DesignThinkingHandler extends BaseTechniqueHandler {
    private readonly stageOrder;
    private readonly stepsWithReflexivity;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each stage recorded, keyed on `entry.currentStep`.
     *
     * The whole extraction used to hang off `entry.designStage`, which nothing
     * requires and the schema does not mark required — a session that ran all
     * five stages without naming them reported nothing at all. `currentStep` is
     * always present, so it decides the stage and `designStage` is treated as the
     * confirmation it is: used only when the caller sent no step number.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        designStage?: string;
        empathyInsights?: string[];
        problemStatement?: string;
        ideaList?: string[];
        failureModesPredicted?: string[];
        prototypeDescription?: string;
        stressTestResults?: string[];
        userFeedback?: string[];
        failureInsights?: string[];
        output?: string;
    }>): string[];
    getStage(step: number): DesignThinkingStage;
}
//# sourceMappingURL=DesignThinkingHandler.d.ts.map