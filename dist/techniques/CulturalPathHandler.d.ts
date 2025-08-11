/**
 * Cultural Path Navigation Strategies technique handler
 * Navigates solution paths through cultural and contextual landscapes
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface CulturalPathStep {
    name: string;
    focus: string;
    emoji: string;
    description?: string;
}
export declare class CulturalPathHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): CulturalPathStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
export {};
//# sourceMappingURL=CulturalPathHandler.d.ts.map