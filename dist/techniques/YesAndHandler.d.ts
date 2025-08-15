/**
 * Yes, And... technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class YesAndHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        initialIdea?: string;
        additions?: string[];
        evaluations?: string[];
        synthesis?: string;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=YesAndHandler.d.ts.map