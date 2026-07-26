/**
 * Cognitive Bias Audit technique handler
 *
 * A 9-step debiasing checklist distilled from Charlie Munger's
 * "The Psychology of Human Misjudgment" (1995). The decider runs the standard
 * causes of misjudgment against their own judgment, detects the multiplicative
 * "lollapalooza" confluence, then inverts and seeks disconfirmation before
 * committing.
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CognitiveBiasAuditHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Summarise what the audit actually surfaced, labelled by the lens that
     * surfaced it.
     *
     * This reads `entry.output`. Returning fixed strings keyed by step index —
     * as this once did — reports findings the session may never have produced,
     * which is fabricated insight dressed as analysis.
     */
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=CognitiveBiasAuditHandler.d.ts.map