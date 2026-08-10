/**
 * Path-dependent metrics calculation system
 */
import type { FlexibilityMetrics, PathMemory, ErgodicityWarning } from './types.js';
export declare class MetricsCalculator {
    /**
     * Calculate comprehensive flexibility metrics
     */
    calculateMetrics(pathMemory: PathMemory): FlexibilityMetrics;
    /**
     * Flexibility score (0.0-1.0), as the path memory measures it.
     *
     * This used to compute a rival number — the ratio of still-available options
     * to all options ever named, minus a constraint penalty — while
     * `PathMemoryManager.updateFlexibilityMetrics` computed a different one from
     * what each step cost. Two fields called `flexibilityScore`, two formulas,
     * and the warnings below fire on this one at 0.2 / 0.4 / 0.6 while every
     * gate in the execution layer reads the other. Only SCAMPER ever reported an
     * option as closed and nothing populates `constraintsCreated`, so this one
     * sat at 1.0 for thirty-one techniques and its warnings never fired at all.
     *
     * One measure now, and only one. A constraint penalty of 0.1 per recorded
     * constraint was kept at first, on the reasoning that constraints are a cost
     * the step product does not see. They are not: `createConstraint` fires on
     * any step whose reversibility cost or commitment exceeds 0.7 — the same
     * steps the product already charges — so it billed one commitment twice,
     * uncapped and growing with session length. That is the double-charge this
     * whole change set exists to remove.
     */
    private calculateFlexibilityScore;
    /**
     * Calculate reversibility index
     * Percentage of decisions that can be undone
     */
    private calculateReversibilityIndex;
    /**
     * Calculate path divergence
     * How far we've moved from the initial state
     */
    private calculatePathDivergence;
    /**
     * Calculate option velocity
     * Rate of option creation vs destruction
     */
    private calculateOptionVelocity;
    /**
     * Calculate average commitment depth
     */
    private calculateCommitmentDepth;
    /**
     * Generate warnings based on metrics
     */
    generateWarnings(metrics: FlexibilityMetrics): ErgodicityWarning[];
    /**
     * Get a human-readable summary of current metrics
     */
    getMetricsSummary(metrics: FlexibilityMetrics): string;
    /**
     * Format a decimal as percentage
     */
    private formatPercentage;
    /**
     * Get emoji indicator for flexibility level
     */
    private getFlexibilityEmoji;
}
//# sourceMappingURL=metrics.d.ts.map