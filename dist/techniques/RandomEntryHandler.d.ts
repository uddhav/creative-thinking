/**
 * Random Entry technique handler
 *
 * Enhanced with "Rory Mode" - behavioral economics-inspired wildcarding
 * that focuses on human irrationality and psychological insights
 */
import { BaseTechniqueHandler, type StepInfo, type TechniqueInfo } from './types.js';
interface RandomEntryContext {
    roryMode?: boolean;
    stimulus?: string;
    connections?: string[];
}
export declare class RandomEntryHandler extends BaseTechniqueHandler {
    private readonly roryModeStimuli;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string, context?: RandomEntryContext): string;
    /**
     * @deprecated Non-deterministic (Math.random) and caller-less in production.
     * Plan-time assignment (techniques/decks/assignment.ts) is the supported
     * path: seeded, per-instance, recoverable from the planId.
     */
    private getRandomRoryStimulus;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        currentStep?: number;
        randomStimulus?: string;
        connections?: string[];
        output?: string;
        roryMode?: boolean;
    }>): string[];
    /**
     * Get a suggested Rory Mode stimulus for a given problem
     * @deprecated Use the plan-time assignment (techniques/decks/assignment.ts)
     * — seeded and per-instance — instead of this Math.random draw.
     */
    suggestRoryStimulus(): string;
}
export {};
//# sourceMappingURL=RandomEntryHandler.d.ts.map