/**
 * Yes, And... technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class YesAndHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
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