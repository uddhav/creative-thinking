/**
 * Cross-Cultural Integration technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class CrossCulturalHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        culturalFrameworks?: string[];
        bridgeBuilding?: string[];
        respectfulSynthesis?: string[];
        parallelPaths?: string[];
        output?: string;
    }>): string[];
}
//# sourceMappingURL=CrossCulturalHandler.d.ts.map