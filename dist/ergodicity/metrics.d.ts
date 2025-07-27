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
     * Calculate flexibility score (0.0-1.0)
     * Measures the ratio of available options to total possible options
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