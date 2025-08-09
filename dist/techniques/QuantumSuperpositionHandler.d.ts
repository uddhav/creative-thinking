/**
 * Quantum Superposition technique handler
 * Maintains multiple contradictory solution states simultaneously until optimal collapse
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface SuperpositionStep {
    name: string;
    focus: string;
    emoji: string;
}
export declare class QuantumSuperpositionHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): SuperpositionStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
        solutionStates?: string[];
        preservedInsights?: string[];
    }>): string[];
}
export {};
//# sourceMappingURL=QuantumSuperpositionHandler.d.ts.map