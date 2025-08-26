/**
 * Linguistic Forensics technique handler
 *
 * A 6-step technique for analyzing communication patterns to reveal
 * hidden insights, cognitive states, and authenticity markers
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class LinguisticForensicsHandler extends BaseTechniqueHandler {
    private readonly steps;
    private readonly linguisticMarkers;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
        coherenceScore?: number;
        pronounRatios?: Record<string, number>;
    }>): string[];
    getLinguisticMarkers(): typeof this.linguisticMarkers;
}
//# sourceMappingURL=LinguisticForensicsHandler.d.ts.map