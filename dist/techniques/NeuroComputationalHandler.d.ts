/**
 * Neuro-Computational Synthesis for Enhanced Creativity technique handler with reflexivity
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
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
/**
 * Named convergence ratings, so callers report a judgement instead of copying a
 * decimal out of an error message.
 *
 * Same problem the discovery layer's effectiveness scale had: the numbers were
 * invented, they looked measured, and worked examples carrying values like 0.85
 * taught every caller to invent their own to matching precision. Naming the
 * tiers keeps the wire format numeric while making it plain that only a few
 * levels are meaningful, and that the rating needs a stated basis.
 */
export declare const CONVERGENCE_RATING: {
    readonly STRONG: 0.9;
    readonly MODERATE: 0.7;
    readonly WEAK: 0.5;
};
export declare class NeuroComputationalHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    /**
     * A convergence rating as the caller was asked to give it.
     *
     * `getStepGuidance` and the step-4/5 validation errors offer exactly three
     * ratings — strong, moderate, weak — so a value that is one of them is
     * reported by its name, which is what the caller chose. Anything else is
     * reported as the bare number: the handler defines no scale between the
     * tiers, so bucketing 0.83 into "moderate" would invent a judgement the
     * session never made, which is the same fault the named tiers exist to
     * prevent.
     */
    private renderConvergenceMetrics;
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     *
     * `validateStep` rejects a step that omits its field, so a session that got
     * this far named its mappings, its patterns, which of them reinforce and
     * which cancel, its models and its ratings; reporting none of them was the
     * defect this fixes.
     */
    extractInsights(history: unknown[]): string[];
    getPromptContext(step: number): Record<string, unknown>;
}
//# sourceMappingURL=NeuroComputationalHandler.d.ts.map