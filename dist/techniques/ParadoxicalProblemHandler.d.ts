/**
 * Paradoxical Problem Solving technique handler
 * Transcends contradictions by recognizing the path-dependent nature of seemingly incompatible requirements
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface ParadoxicalStep {
    name: string;
    focus: string;
    emoji: string;
}
export declare class ParadoxicalProblemHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): ParadoxicalStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getStepPrompt(step: number, problem: string): string;
    getRiskAssessmentPrompt(step: number): string;
    getPathDependencyPrompt(step: number): string;
}
export {};
//# sourceMappingURL=ParadoxicalProblemHandler.d.ts.map