/**
 * Random Entry technique handler
 *
 * Enhanced with "Rory Mode" - behavioral economics-inspired wildcarding
 * that focuses on human irrationality and psychological insights
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface RandomEntryContext {
    roryMode?: boolean;
    stimulus?: string;
    connections?: string[];
}
export declare class RandomEntryHandler extends BaseTechniqueHandler {
    private readonly roryModeStimuli;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string, context?: RandomEntryContext): string;
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
     */
    suggestRoryStimulus(): string;
}
export {};
//# sourceMappingURL=RandomEntryHandler.d.ts.map