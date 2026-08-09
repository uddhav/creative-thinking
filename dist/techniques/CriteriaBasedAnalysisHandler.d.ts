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
    /**
     * Report what each step actually assessed, labelled by the step.
     *
     * This reads `entry.output`. Gating on vocabulary — reporting a finding only
     * when the text happened to contain "consistent", "inconsistent" or
     * "contradiction" — meant a full five-step credibility assessment phrased any
     * other way returned nothing at all. The validity score, when supplied, is
     * real structured data and still reports, including its banded reading.
     */
    extractInsights(history: Array<{
        output?: string;
        validityScore?: number;
    }>): string[];
}
//# sourceMappingURL=CriteriaBasedAnalysisHandler.d.ts.map