/**
 * Generic Technique Handler
 * Provides fallback handling for unknown techniques
 */
import type { TechniqueInfo, TechniqueHandler } from './types.js';
export declare class GenericHandler implements TechniqueHandler {
    private techniqueName;
    constructor(techniqueName: string);
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, _data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=GenericHandler.d.ts.map