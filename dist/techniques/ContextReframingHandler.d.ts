/**
 * Context Reframing technique handler
 *
 * A 5-step technique inspired by Rory Sutherland's principle that
 * "you can change a million minds or just change one context"
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class ContextReframingHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: unknown[]): string[];
}
//# sourceMappingURL=ContextReframingHandler.d.ts.map