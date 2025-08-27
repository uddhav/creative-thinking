/**
 * Anecdotal Signal Detection technique handler
 *
 * A 6-step technique inspired by Rory Sutherland's argument that
 * "the most important information about the future first arrives
 * in anecdotal form" - using outliers as early change indicators
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class AnecdotalSignalHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: unknown[]): string[];
}
//# sourceMappingURL=AnecdotalSignalHandler.d.ts.map