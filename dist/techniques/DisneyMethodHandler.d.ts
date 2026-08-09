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
    /**
     * Report what each role actually produced, labelled by the role.
     *
     * This reads `entry.output`. Reading only the structured fields meant a
     * session of three substantive rooms returned a single fixed string
     * announcing the method had completed — an insight the session never
     * produced. Reaching the last step is already visible from the step count.
     */
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