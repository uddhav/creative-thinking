/**
 * Neuro-Computational Synthesis for Enhanced Creativity technique handler
 *
 * Combines neuroscience-inspired cognitive processes with computational creativity methods
 * to generate enhanced creative solutions through hybrid neural-computational approaches.
 *
 * Different from existing techniques:
 * - neural_state: Focuses on DMN/ECN balance, not computational synthesis
 * - meta_learning: Learns from patterns, doesn't create new computational models
 * - neuro_computational: Creates novel solutions through neural-computational hybrid models
 *
 * This technique implements neural network-inspired creativity generation with
 * explicit computational models for enhanced creative problem solving.
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface NeuroComputationalStep {
    name: string;
    focus: string;
    emoji: string;
    description?: string;
}
export declare class NeuroComputationalHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): NeuroComputationalStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
export {};
//# sourceMappingURL=NeuroComputationalHandler.d.ts.map