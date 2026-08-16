/**
 * Yes, And... technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class YesAndHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Step 3 used to report an evaluation only when it contained the literal
     * substring "good" or "strong", so every negative or neutral judgement was
     * dropped by construction — the one place this technique can say an addition
     * did not work. The synthesis was also cut at 100 characters and marked with
     * an ellipsis, and `entry.output` was read for no step.
     */
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