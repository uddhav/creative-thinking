/**
 * Collective Intelligence technique handler with reflexivity tracking
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CollectiveIntelHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        wisdomSources?: string[];
        emergentPatterns?: string[];
        synergyCombinations?: string[];
        collectiveInsights?: string[];
        output?: string;
    }>): string[];
}
//# sourceMappingURL=CollectiveIntelHandler.d.ts.map