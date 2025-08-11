/**
 * First Principles Thinking technique handler
 * Break down to fundamental truths and rebuild from the ground up
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface FirstPrinciplesStep {
    name: string;
    focus: string;
    emoji: string;
    description?: string;
}
export declare class FirstPrinciplesHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): FirstPrinciplesStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
export {};
//# sourceMappingURL=FirstPrinciplesHandler.d.ts.map