/**
 * First Principles Thinking technique handler
 * Break down to fundamental truths and rebuild from the ground up
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class FirstPrinciplesHandler extends BaseTechniqueHandler {
    private readonly steps;
    private readonly stepsWithReflexivity;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
//# sourceMappingURL=FirstPrinciplesHandler.d.ts.map