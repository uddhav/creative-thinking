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
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     *
     * The four cultural fields are reported wherever they arrive rather than
     * pinned to a step, unlike every other technique here. Two reasons: this
     * handler's `validateStep` requires no field on any step, so nothing in the
     * technique says which step a field belongs to; and the one place that does
     * assert a mapping — CrossCulturalInsightStrategy — disagrees with the step
     * names, reading `bridgeBuilding` at step 2 while the step named Bridge
     * Building is step 3. Binding to a step would encode one of those two
     * orderings as fact. Naming the field alongside the step keeps the report
     * true either way.
     *
     * They are reported by content, not by count. "3 cultural perspectives
     * identified" says a field had three entries and nothing about which three,
     * which is exactly the information a synthesis needs.
     */
    extractInsights(history: unknown[]): string[];
}
//# sourceMappingURL=CulturalIntegrationHandler.d.ts.map