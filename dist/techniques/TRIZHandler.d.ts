/**
 * TRIZ technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class TRIZHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        contradiction?: string;
        inventivePrinciples?: string[];
        minimalSolution?: string;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=TRIZHandler.d.ts.map