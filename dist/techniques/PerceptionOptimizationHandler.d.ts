/**
 * Perception Optimization technique handler
 *
 * A 5-step technique inspired by Rory Sutherland's principle
 * "optimize for perception, not reality" - recognizing that human
 * experience is fundamentally subjective
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class PerceptionOptimizationHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: unknown[]): string[];
}
//# sourceMappingURL=PerceptionOptimizationHandler.d.ts.map