/**
 * Design Thinking technique handler
 */
import type { DesignThinkingStage } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class DesignThinkingHandler extends BaseTechniqueHandler {
    private readonly stages;
    private readonly stageOrder;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
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