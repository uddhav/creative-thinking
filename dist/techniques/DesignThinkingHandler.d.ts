/**
 * Design Thinking technique handler
 */
import type { DesignThinkingStage } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class DesignThinkingHandler extends BaseTechniqueHandler {
    private readonly stages;
    private readonly stageOrder;
    private readonly stepsWithReflexivity;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
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