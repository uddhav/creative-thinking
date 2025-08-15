/**
 * PO (Provocative Operation) technique handler with reflexivity
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class POHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        provocation?: string;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=POHandler.d.ts.map