/**
 * Disney Method technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
import type { DisneyRole } from '../types/index.js';
export declare class DisneyMethodHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
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