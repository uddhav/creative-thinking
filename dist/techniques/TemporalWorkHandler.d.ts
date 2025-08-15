/**
 * Temporal Work technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class TemporalWorkHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        temporalLandscape?: {
            fixedDeadlines?: string[];
            kairosOpportunities?: string[];
        };
        temporalEscapeRoutes?: string[];
        nextStepNeeded?: boolean;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=TemporalWorkHandler.d.ts.map