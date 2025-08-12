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
    /**
     * Type guard to check if data is a valid step data object
     */
    private isValidStepData;
    /**
     * Validate cultural mapping step data
     * Expected format: { culturalContexts: string[], powerDynamics: { [key: string]: string } }
     */
    private validateCulturalMapping;
    /**
     * Validate touchpoint identification step data
     * Expected format: { naturalConnections: string[], frictionZones: string[] }
     */
    private validateTouchpointIdentification;
    /**
     * Validate bridge building step data
     * Expected format: { translationProtocols: object, trustMechanisms: string[] }
     */
    private validateBridgeBuilding;
    /**
     * Validate authentic synthesis step data
     * Expected format: { attributionMap: object, authenticityMeasures: string[] }
     */
    private validateAuthenticSynthesis;
    getPromptContext(step: number): Record<string, unknown>;
}
export {};
//# sourceMappingURL=CulturalCreativityHandler.d.ts.map