/**
 * Nine Windows (System Operator) technique handler with reflexivity for future projections
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import type { NineWindowsCell } from '../types/index.js';
export declare class NineWindowsHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        nineWindowsMatrix?: NineWindowsCell[];
        currentCell?: {
            timeFrame: 'past' | 'present' | 'future';
            systemLevel: 'sub-system' | 'system' | 'super-system';
        };
        interdependencies?: string[];
        nextStepNeeded?: boolean;
        output?: string;
    }>): string[];
    /**
     * Helper method to get cell info by coordinates
     */
    getCellByCoordinates(timeFrame: 'past' | 'present' | 'future', systemLevel: 'sub-system' | 'system' | 'super-system'): number;
}
//# sourceMappingURL=NineWindowsHandler.d.ts.map