/**
 * Criteria-Based Analysis technique handler
 *
 * A 5-step technique for evaluating authenticity and validity
 * based on established criteria from deception detection research
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CriteriaBasedAnalysisHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
        validityScore?: number;
    }>): string[];
}
//# sourceMappingURL=CriteriaBasedAnalysisHandler.d.ts.map