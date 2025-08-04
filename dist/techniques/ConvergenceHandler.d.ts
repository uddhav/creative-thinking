/**
 * ConvergenceHandler - Special technique for synthesizing results from parallel creative thinking sessions
 * Analyzes outputs from different approaches, identifies patterns and conflicts, and produces unified recommendations
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class ConvergenceHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=ConvergenceHandler.d.ts.map