/**
 * Paradoxical Problem Solving technique handler
 * Transcends contradictions by recognizing the path-dependent nature of seemingly incompatible requirements
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class ParadoxicalProblemHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getStepPrompt(step: number, problem: string): string;
    getRiskAssessmentPrompt(step: number): string;
    getPathDependencyPrompt(step: number): string;
}
//# sourceMappingURL=ParadoxicalProblemHandler.d.ts.map