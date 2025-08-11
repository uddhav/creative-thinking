/**
 * Biomimetic Path Management technique handler
 * Applies biological solutions and evolutionary strategies to innovation challenges
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface BiomimeticStep {
    name: string;
    focus: string;
    emoji: string;
}
export declare class BiomimeticPathHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): BiomimeticStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
export {};
//# sourceMappingURL=BiomimeticPathHandler.d.ts.map