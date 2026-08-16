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
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Step 2 is the step this technique exists for — the coupling question no
     * other technique asks — and all three of its fields were validated and then
     * read by nothing, as were the measurement criteria and the chosen state.
     * What survived was cut to ten without saying so.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        output?: string;
        solutionStates?: string[];
        interferencePatterns?: {
            constructive?: string[];
            destructive?: string[];
            hybrid?: string[];
        };
        entanglements?: Array<{
            states: string[];
            dependency: string;
        }>;
        amplitudes?: Record<string, number>;
        measurementCriteria?: string[];
        chosenState?: string;
        preservedInsights?: string[];
    }>): string[];
}
//# sourceMappingURL=QuantumSuperpositionHandler.d.ts.map