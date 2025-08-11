/**
 * Cultural Path Navigation Strategies technique handler
 *
 * Navigates solution pathways through cultural and contextual landscapes,
 * focusing on path-dependent decision making in culturally complex environments.
 *
 * Different from cross_cultural technique:
 * - cross_cultural: Integrates diverse cultural perspectives respectfully into solutions
 * - cultural_path: Navigates through cultural contexts to find viable solution pathways
 *
 * This technique emphasizes the journey and navigation through cultural terrain,
 * rather than just the integration of different perspectives.
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