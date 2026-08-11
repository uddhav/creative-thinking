/**
 * Temporal Creativity with Path Memory Integration technique handler
 * Extends temporal thinking with deep path memory and option preservation
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class TemporalCreativityHandler extends BaseTechniqueHandler {
    private readonly steps;
    private readonly stepsWithReflexivity;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Every field below is validated by validateStep, so a caller that sent one
     * was told it was accepted. The previous version dropped most of them: the
     * whole of step 4, the three surviving branches of step 3's projection,
     * step 2's constraints, step 5's strategy and step 6's synthesis were
     * validated and then read by nothing. What did survive was filtered on
     * `length > 10` / `length > 5` — a test of how long a string is, not of
     * whether it is content — and the result was silently cut to twelve.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        output?: string;
        pathHistory?: Array<{
            decision: string;
            impact: string;
            constraintsCreated?: string[];
            optionsClosed?: string[];
        }>;
        decisionPatterns?: string[];
        currentConstraints?: string[];
        activeOptions?: string[];
        timelineProjections?: {
            bestCase?: string[];
            probableCase?: string[];
            worstCase?: string[];
            blackSwanScenarios?: string[];
            antifragileDesign?: string[];
        };
        blackSwanScenarios?: string[];
        delayOptions?: string[];
        accelerationOptions?: string[];
        parallelTimelines?: string[];
        lessonIntegration?: string[];
        strategyEvolution?: string;
        synthesisStrategy?: string;
        preservedOptions?: string[];
    }>): string[];
}
//# sourceMappingURL=TemporalCreativityHandler.d.ts.map