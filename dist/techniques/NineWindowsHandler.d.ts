/**
 * Nine Windows (System Operator) technique handler with reflexivity for future projections
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import type { NineWindowsCell } from '../types/index.js';
export declare class NineWindowsHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report every window, labelled by the cell it belongs to.
     *
     * Only steps 2, 5 and 8 — the middle column — were read before, so the six
     * sub-system and super-system cells produced nothing however much was written
     * in them. That is most of the grid: the technique's whole claim is that the
     * system reads differently at three scales, and two of the three scales were
     * discarded on the way out.
     */
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