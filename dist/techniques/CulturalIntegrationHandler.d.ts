/**
 * Cultural Integration technique handler
 *
 * Consolidates CrossCultural and CulturalCreativity techniques into a unified approach
 * that combines bridge-building with creative synthesis for culturally-aware solutions.
 *
 * This technique merges:
 * - CrossCultural: Integration of diverse cultural perspectives
 * - CulturalCreativity: Multi-cultural synthesis without appropriation
 *
 * The unified approach provides comprehensive cultural integration through:
 * 1. Mapping cultural landscapes and power dynamics
 * 2. Identifying authentic connection points
 * 3. Building respectful bridges between cultures
 * 4. Weaving perspectives creatively
 * 5. Synthesizing solutions that honor all sources
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CulturalIntegrationHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
}
//# sourceMappingURL=CulturalIntegrationHandler.d.ts.map