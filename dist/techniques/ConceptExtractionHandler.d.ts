/**
 * Concept Extraction technique handler with reflexivity
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class ConceptExtractionHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Each of the three arrays was reduced to its first element — the caller was
     * asked for the concepts, plural, and got one back — and `entry.output` was
     * declared on the parameter and read by nothing, so a step that recorded only
     * prose reported nothing.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        successExample?: string;
        extractedConcepts?: string[];
        abstractedPatterns?: string[];
        applications?: string[];
        output?: string;
    }>): string[];
}
//# sourceMappingURL=ConceptExtractionHandler.d.ts.map