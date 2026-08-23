/**
 * Path-dependent metrics calculation system
 */
import type { FlexibilityMetrics, PathMemory, ErgodicityWarning } from './types.js';
/**
 * How many of the most recent steps `commitmentDepth` averages over.
 *
 * Picked by measurement, not by taste. Per-step commitment is one of four
 * values — 0.20 for a thinking step, then 0.50 / 0.90 / 0.95 for an action
 * step by how hard it is to undo — and 107 of the catalogue's 171 steps are
 * 0.20. Averaged over the whole session, as this was, the thinking steps never
 * leave the mean: the best any concatenation of whole techniques could reach
 * was 0.65, against a warning threshold of 0.7, so the warning could not fire
 * for any session that could be run.
 *
 * Best achievable window mean over any concatenation of whole techniques,
 * against that 0.7 threshold:
 *
 *   W=1  0.950   W=4  0.813   W=7  0.750   W=10 0.730
 *   W=2  0.925   W=5  0.830   W=8  0.738   W=15 0.703
 *   W=3  0.917   W=6  0.792   W=9  0.739
 *
 * Five is the choice. Below it the measure stops being a depth and becomes a
 * spot reading — at W=1 a single action step trips the warning, which is what
 * the per-step ladder already reports on its own. Above it dilution takes over
 * again: from W=6 on the best case sits within 0.09 of the threshold, so one
 * 0.20 thinking step inside the window is enough to silence a session that is
 * committing hard, and by W=15 the headroom is 0.003. At W=5 a run of
 * genuinely irreversible steps reaches 0.83, two steps of slack clear of the
 * threshold, while the healthy reflective control — thirteen steps, every one
 * of them 0.20 — reads 0.20 at every window and cannot approach it at any.
 *
 * This answers "how committed is this session now", which is the question both
 * the warning text and the escape-route gate ask. The old mean answered "on
 * average since it began", and a session cannot outrun its own history.
 */
export declare const COMMITMENT_WINDOW = 5;
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
     * Path divergence: how far the session has moved from its initial state,
     * saturated to 0-1.
     *
     * The raw accumulation (0.05/step + 0.1 x commitment per event) grows
     * monotonically with steps and commitment — that is the intent — but it was
     * reported unbounded and undocumented, so a caller reading 2.72 had no way
     * to interpret it. raw/(raw+1) keeps strict per-step monotonicity while
     * bounding the scale. This is also the ONE formula: pathMemory's
     * currentFlexibility.pathDivergence delegates here (it used to hold a rival
     * length x 0.1 that nothing read), and the option-generation context passes
     * this value instead of inventing 1 - flexibility.
     *
     * Bands: < 0.3 near the starting frame; 0.3-0.6 meaningfully evolved;
     * > 0.6 far from where it began (comparable across sessions of any length).
     */
    static calculatePathDivergence(pathHistory: ReadonlyArray<{
        commitmentLevel: number;
    }>): number;
    /**
     * Calculate option velocity
     * Rate of option creation vs destruction
     */
    private calculateOptionVelocity;
    /**
     * Mean commitment over the last `COMMITMENT_WINDOW` steps.
     *
     * See the constant for why the window exists and why it is five.
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