/**
 * Reverse Benchmarking technique handler
 *
 * A 5-step technique inspired by Rory Sutherland's approach to finding
 * competitive advantage by excelling where all competitors fail
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
interface VacantSpace {
    space: string;
    opportunityValue: 'low' | 'medium' | 'high' | 'very_high';
    implementationDifficulty: 'low' | 'medium' | 'high';
    whyVacant: string;
}
interface HistoryEntry {
    output?: string;
    weaknessMapping?: {
        universalWeaknesses?: string[];
    };
    vacantSpaces?: VacantSpace[];
    antiMimeticStrategy?: unknown;
    excellenceDesign?: {
        area?: string;
    };
}
export declare class ReverseBenchmarkingHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: HistoryEntry[]): string[];
}
export {};
//# sourceMappingURL=ReverseBenchmarkingHandler.d.ts.map