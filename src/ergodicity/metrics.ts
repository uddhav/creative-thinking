/**
 * Path-dependent metrics calculation system
 */

import type { FlexibilityMetrics, PathMemory, ErgodicityWarning } from './types.js';
import { ErgodicityWarningLevel } from './types.js';

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
export const COMMITMENT_WINDOW = 5;

export class MetricsCalculator {
  /**
   * Calculate comprehensive flexibility metrics
   */
  calculateMetrics(pathMemory: PathMemory): FlexibilityMetrics {
    return {
      flexibilityScore: this.calculateFlexibilityScore(pathMemory),
      reversibilityIndex: this.calculateReversibilityIndex(pathMemory),
      pathDivergence: this.calculatePathDivergence(pathMemory),
      barrierProximity: pathMemory.currentFlexibility.barrierProximity,
      optionVelocity: this.calculateOptionVelocity(pathMemory),
      commitmentDepth: this.calculateCommitmentDepth(pathMemory),
    };
  }

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
  private calculateFlexibilityScore(pathMemory: PathMemory): number {
    return pathMemory.currentFlexibility?.flexibilityScore ?? 1.0;
  }

  /**
   * Calculate reversibility index
   * Percentage of decisions that can be undone
   */
  private calculateReversibilityIndex(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) return 1.0;

    const reversibleCount = pathMemory.pathHistory.filter(
      event => event.reversibilityCost < 0.5
    ).length;

    return reversibleCount / pathMemory.pathHistory.length;
  }

  /**
   * Calculate path divergence
   * How far we've moved from the initial state
   */
  private calculatePathDivergence(pathMemory: PathMemory): number {
    // Simple model: each step increases divergence
    const stepDivergence = pathMemory.pathHistory.length * 0.05;

    // High-commitment decisions increase divergence more
    const commitmentDivergence = pathMemory.pathHistory.reduce(
      (sum, event) => sum + event.commitmentLevel * 0.1,
      0
    );

    return stepDivergence + commitmentDivergence;
  }

  /**
   * Calculate option velocity
   * Rate of option creation vs destruction
   */
  private calculateOptionVelocity(pathMemory: PathMemory): number {
    const recentWindow = 5;
    const recentEvents = pathMemory.pathHistory.slice(-recentWindow);

    if (recentEvents.length === 0) return 0;

    const optionsOpened = recentEvents.reduce((sum, event) => sum + event.optionsOpened.length, 0);

    const optionsClosed = recentEvents.reduce((sum, event) => sum + event.optionsClosed.length, 0);

    return (optionsOpened - optionsClosed) / recentEvents.length;
  }

  /**
   * Mean commitment over the last `COMMITMENT_WINDOW` steps.
   *
   * See the constant for why the window exists and why it is five.
   */
  private calculateCommitmentDepth(pathMemory: PathMemory): number {
    const recent = pathMemory.pathHistory.slice(-COMMITMENT_WINDOW);
    if (recent.length === 0) return 0;

    const totalCommitment = recent.reduce((sum, event) => sum + event.commitmentLevel, 0);

    return totalCommitment / recent.length;
  }

  /**
   * Generate warnings based on metrics
   */
  generateWarnings(metrics: FlexibilityMetrics): ErgodicityWarning[] {
    const warnings: ErgodicityWarning[] = [];

    // Flexibility warnings
    if (metrics.flexibilityScore < 0.2) {
      warnings.push({
        level: ErgodicityWarningLevel.CRITICAL,
        message: 'Critical: Flexibility dangerously low. Most options are foreclosed.',
        metric: 'flexibilityScore',
        value: metrics.flexibilityScore,
        threshold: 0.2,
        recommendations: [
          'Consider using Pattern Interruption escape protocol',
          'Challenge all current assumptions',
          'Seek radically different perspectives',
          'Consider strategic pivot if necessary',
        ],
      });
    } else if (metrics.flexibilityScore < 0.4) {
      warnings.push({
        level: ErgodicityWarningLevel.WARNING,
        message: 'Warning: Low flexibility. Options are becoming limited.',
        metric: 'flexibilityScore',
        value: metrics.flexibilityScore,
        threshold: 0.4,
        recommendations: [
          'Use Random Entry to open new paths',
          'Avoid high-commitment decisions',
          'Focus on reversible choices',
          'Generate multiple alternatives before committing',
        ],
      });
    } else if (metrics.flexibilityScore < 0.6) {
      warnings.push({
        level: ErgodicityWarningLevel.CAUTION,
        message: 'Caution: Moderate flexibility. Monitor option creation.',
        metric: 'flexibilityScore',
        value: metrics.flexibilityScore,
        threshold: 0.6,
        recommendations: [
          'Balance exploration with commitment',
          'Keep multiple paths open',
          'Document decision rationale for potential reversal',
        ],
      });
    }

    // Reversibility warnings
    if (metrics.reversibilityIndex < 0.3) {
      warnings.push({
        level: ErgodicityWarningLevel.WARNING,
        message: 'Warning: Most decisions are irreversible. Proceed with caution.',
        metric: 'reversibilityIndex',
        value: metrics.reversibilityIndex,
        threshold: 0.3,
        recommendations: [
          'Prefer small, testable steps',
          'Build in explicit reversal mechanisms',
          'Document assumptions for future challenge',
          'Consider prototyping before full commitment',
        ],
      });
    }

    // No option-velocity warning. It fired below -2 options closed per step,
    // and SCAMPER is the only one of the thirty-two techniques that ever
    // reports an option as opened or closed at all — for the other thirty-one
    // the input is two empty arrays, so the velocity is exactly 0.00 for every
    // step of every chain, and the measured minimum across all of them is
    // 0.00. The threshold was never the problem: the warning asserted
    // something nothing in the system could observe. `optionVelocity` is still
    // computed and still reported in the metrics summary, where a reader can
    // see it is zero; it just no longer pretends to be a trigger.

    // Commitment depth warnings
    if (metrics.commitmentDepth > 0.7) {
      warnings.push({
        level: ErgodicityWarningLevel.CAUTION,
        message: `Caution: High commitment across the last ${COMMITMENT_WINDOW} steps. Flexibility at risk.`,
        metric: 'commitmentDepth',
        value: metrics.commitmentDepth,
        threshold: 0.7,
        recommendations: [
          'Decompose commitments into smaller pieces',
          'Build flexibility into current commitments',
          'Identify which commitments could be relaxed',
          'Create contingency plans',
        ],
      });
    }

    // Barrier proximity warnings
    for (const proximity of metrics.barrierProximity) {
      if (proximity.distance < 0.2) {
        warnings.push({
          level: ErgodicityWarningLevel.CRITICAL,
          message: `Critical: Approaching ${proximity.barrier.name} (${Math.round(proximity.distance * 100)}% distance)`,
          metric: 'barrierProximity',
          value: proximity.distance,
          threshold: 0.2,
          recommendations: proximity.barrier.avoidanceStrategies,
        });
      } else if (proximity.distance < proximity.barrier.warningThreshold) {
        warnings.push({
          level: ErgodicityWarningLevel.WARNING,
          message: `Warning: ${proximity.barrier.name} detected (${Math.round(proximity.distance * 100)}% distance)`,
          metric: 'barrierProximity',
          value: proximity.distance,
          threshold: proximity.barrier.warningThreshold,
          recommendations: proximity.barrier.avoidanceStrategies.slice(0, 2),
        });
      }
    }

    return warnings;
  }

  /**
   * Get a human-readable summary of current metrics
   */
  getMetricsSummary(metrics: FlexibilityMetrics): string {
    const lines: string[] = [
      '\n📊 Path Dependency Metrics:',
      `├─ Flexibility Score: ${this.formatPercentage(metrics.flexibilityScore)} ${this.getFlexibilityEmoji(metrics.flexibilityScore)}`,
      `├─ Reversibility: ${this.formatPercentage(metrics.reversibilityIndex)}`,
      `├─ Path Divergence: ${metrics.pathDivergence.toFixed(2)}`,
      `├─ Option Velocity: ${metrics.optionVelocity > 0 ? '+' : ''}${metrics.optionVelocity.toFixed(1)}/step`,
      `└─ Commitment Depth (last ${COMMITMENT_WINDOW}): ${this.formatPercentage(metrics.commitmentDepth)}`,
    ];

    if (metrics.barrierProximity.length > 0) {
      lines.push('\n⚠️ Barrier Warnings:');
      metrics.barrierProximity
        .filter(p => p.distance < 0.5)
        .forEach(p => {
          lines.push(`├─ ${p.barrier.name}: ${Math.round(p.distance * 100)}% away`);
        });
    }

    // Add escape velocity indicator if flexibility is low
    if (metrics.flexibilityScore < 0.3) {
      lines.push('\n🚀 Escape Velocity Status:');
      if (metrics.flexibilityScore < 0.1) {
        lines.push('├─ 🔴 CRITICAL: Immediate escape protocol required!');
      } else if (metrics.flexibilityScore < 0.2) {
        lines.push('├─ 🟠 HIGH: Escape velocity protocols recommended');
      } else {
        lines.push('├─ 🟡 MEDIUM: Consider escape protocols soon');
      }
      lines.push(
        `└─ Available protocols based on ${this.formatPercentage(metrics.flexibilityScore)} flexibility`
      );
    }

    return lines.join('\n');
  }

  /**
   * Format a decimal as percentage
   */
  private formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  /**
   * Get emoji indicator for flexibility level
   */
  private getFlexibilityEmoji(flexibility: number): string {
    if (flexibility >= 0.7) return '🟢';
    if (flexibility >= 0.4) return '🟡';
    if (flexibility >= 0.2) return '🟠';
    return '🔴';
  }
}
