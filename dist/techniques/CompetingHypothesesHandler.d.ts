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
    sensitivityFactors?: string[];
}
export declare class CompetingHypothesesHandler extends BaseTechniqueHandler {
    private readonly steps;
    private readonly ratingScale;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    private validateMatrix;
    /**
     * Report what each step recorded, labelled by the step it belongs to.
     *
     * Keyed on `entry.currentStep`, not on position: `execute` appends an entry
     * per call including revisions, so one revision shifts every later entry onto
     * the wrong step name. Keying on the step also lets a revision supersede the
     * entry it revises instead of reporting both.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        output?: string;
        matrix?: EvidenceHypothesisMatrix;
        probabilities?: Record<string, number>;
        leadingHypothesis?: string;
    }>): string[];
    /**
     * The matrix is the technique's central artefact and every part of it is
     * caller-supplied. Reporting only `hypotheses.length` discarded the evidence
     * list, every rating the caller was required to supply, and the diagnostic
     * scores that decide where to look next.
     */
    private describeMatrix;
    private describeProbabilities;
    createEmptyMatrix(hypotheses: string[], evidence: string[]): EvidenceHypothesisMatrix;
}
//# sourceMappingURL=CompetingHypothesesHandler.d.ts.map