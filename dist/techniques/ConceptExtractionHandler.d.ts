/**
 * Concept Extraction technique handler with reflexivity
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class ConceptExtractionHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
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