/**
 * TRIZ technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class TRIZHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Step 2 — Remove Compromise — had no branch at all, so `viaNegativaRemovals`
     * was declared, whitelisted by ObjectFieldValidator and reported nowhere;
     * only the first inventive principle of however many were applied survived;
     * and `entry.output` was read for no step.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        contradiction?: string;
        viaNegativaRemovals?: string[];
        inventivePrinciples?: string[];
        minimalSolution?: string;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=TRIZHandler.d.ts.map