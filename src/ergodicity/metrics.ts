/**
 * Path-dependent metrics calculation system
 */

import type {
  FlexibilityMetrics,
  PathMemory,
  PathEvent,
  ErgodicityWarning,
} from './types.js';
import { ErgodicityWarningLevel } from './types.js';

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
   * Calculate flexibility score (0.0-1.0)
   * Measures the ratio of available options to total possible options
   */
  private calculateFlexibilityScore(pathMemory: PathMemory): number {
    const totalOptions = pathMemory.availableOptions.length + pathMemory.foreclosedOptions.length;
    
    if (totalOptions === 0) return 1.0; // Start with full flexibility
    
    const availableRatio = pathMemory.availableOptions.length / totalOptions;
    
    // Factor in constraint strength
    const constraintPenalty = pathMemory.constraints.reduce((sum, c) => sum + c.strength, 0) * 0.1;
    
    return Math.max(0, Math.min(1, availableRatio - constraintPenalty));
  }

  /**
   * Calculate reversibility index
   * Percentage of decisions that can be undone
   */
  private calculateReversibilityIndex(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) return 1.0;
    
    const reversibleCount = pathMemory.pathHistory.filter(
      (event) => event.reversibilityCost < 0.5
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
      (sum, event) => sum + (event.commitmentLevel * 0.1),
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
    
    const optionsOpened = recentEvents.reduce(
      (sum, event) => sum + event.optionsOpened.length,
      0
    );
    
    const optionsClosed = recentEvents.reduce(
      (sum, event) => sum + event.optionsClosed.length,
      0
    );
    
    return (optionsOpened - optionsClosed) / recentEvents.length;
  }

  /**
   * Calculate average commitment depth
   */
  private calculateCommitmentDepth(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) return 0;
    
    const totalCommitment = pathMemory.pathHistory.reduce(
      (sum, event) => sum + event.commitmentLevel,
      0
    );
    
    return totalCommitment / pathMemory.pathHistory.length;
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

    // Option velocity warnings
    if (metrics.optionVelocity < -2) {
      warnings.push({
        level: ErgodicityWarningLevel.WARNING,
        message: 'Warning: Options closing rapidly. Need option generation.',
        metric: 'optionVelocity',
        value: metrics.optionVelocity,
        threshold: -2,
        recommendations: [
          'Use SCAMPER to generate variations',
          'Apply Concept Extraction from other domains',
          'Question constraints - which are real vs assumed?',
          'Seek inspiration from unrelated fields',
        ],
      });
    }

    // Commitment depth warnings
    if (metrics.commitmentDepth > 0.7) {
      warnings.push({
        level: ErgodicityWarningLevel.CAUTION,
        message: 'Caution: High average commitment level. Flexibility at risk.',
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
      `└─ Commitment Depth: ${this.formatPercentage(metrics.commitmentDepth)}`,
    ];

    if (metrics.barrierProximity.length > 0) {
      lines.push('\n⚠️ Barrier Warnings:');
      metrics.barrierProximity
        .filter((p) => p.distance < 0.5)
        .forEach((p) => {
          lines.push(`├─ ${p.barrier.name}: ${Math.round(p.distance * 100)}% away`);
        });
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