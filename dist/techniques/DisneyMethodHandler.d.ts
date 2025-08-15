/**
 * Disney Method technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import type { DisneyRole } from '../types/index.js';
export declare class DisneyMethodHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        disneyRole?: DisneyRole;
        dreamerVision?: string[];
        realistPlan?: string[];
        criticRisks?: string[];
        nextStepNeeded?: boolean;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=DisneyMethodHandler.d.ts.map