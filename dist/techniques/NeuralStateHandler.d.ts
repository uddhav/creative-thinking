/**
 * Neural State Optimization technique handler
 */
import { BaseTechniqueHandler, type StepInfo, type TechniqueInfo } from './types.js';
export declare class NeuralStateHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        dominantNetwork?: string;
        suppressionDepth?: number;
        switchingRhythm?: string[];
        integrationInsights?: string[];
        nextStepNeeded?: boolean;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=NeuralStateHandler.d.ts.map