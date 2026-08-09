/**
 * Quantum Superposition technique handler
 * Maintains multiple contradictory solution states simultaneously until optimal collapse
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class QuantumSuperpositionHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
        solutionStates?: string[];
        preservedInsights?: string[];
    }>): string[];
}
//# sourceMappingURL=QuantumSuperpositionHandler.d.ts.map