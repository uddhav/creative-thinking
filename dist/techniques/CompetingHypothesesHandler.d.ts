/**
 * Competing Hypotheses Analysis technique handler
 *
 * An 8-step structured analytical technique for evaluating multiple
 * competing explanations using evidence matrices and Bayesian reasoning
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export interface EvidenceHypothesisMatrix {
    hypotheses: string[];
    evidence: string[];
    ratings: {
        [key: string]: number;
    };
    diagnosticValue: {
        [evidence: string]: number;
    };
    probabilities: {
        [hypothesis: string]: number;
    };
}
export declare class CompetingHypothesesHandler extends BaseTechniqueHandler {
    private readonly steps;
    private readonly ratingScale;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    private validateMatrix;
    extractInsights(history: Array<{
        output?: string;
        matrix?: EvidenceHypothesisMatrix;
        probabilities?: Record<string, number>;
        leadingHypothesis?: string;
    }>): string[];
    createEmptyMatrix(hypotheses: string[], evidence: string[]): EvidenceHypothesisMatrix;
}
//# sourceMappingURL=CompetingHypothesesHandler.d.ts.map