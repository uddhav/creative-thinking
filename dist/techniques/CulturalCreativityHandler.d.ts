/**
 * Cultural Creativity Orchestration Framework technique handler
 *
 * Enables multi-cultural synthesis without appropriation through respectful integration protocols.
 * Creates new combinations that honor source cultures while generating novel solutions.
 *
 * Different from existing techniques:
 * - cross_cultural: Integrates diverse cultural perspectives respectfully into solutions
 * - cultural_path: Navigates through cultural contexts to find viable solution pathways
 * - cultural_creativity: Orchestrates multi-cultural synthesis without appropriation
 *
 * This technique implements a 4-step respectful integration protocol that ensures
 * authentic collaboration and proper attribution while creating innovative combinations.
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface CulturalCreativityStep {
    name: string;
    focus: string;
    emoji: string;
    description?: string;
}
export declare class CulturalCreativityHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): CulturalCreativityStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
export {};
//# sourceMappingURL=CulturalCreativityHandler.d.ts.map