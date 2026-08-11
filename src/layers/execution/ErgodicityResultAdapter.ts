/**
 * ErgodicityResultAdapter - Handles complex type transformations for ergodicity results
 * Extracted from ErgodicityOrchestrator to improve maintainability
 */

import type { PathMemory } from '../../ergodicity/types.js';

// Type for the result from ErgodicityManager.recordThinkingStep
export interface ErgodicityManagerResult {
  event: {
    technique: string;
    step: number;
    timestamp: string;
    decision: string;
    reversibilityCost: number;
  };
  metrics: {
    pathDivergence: number;
    commitmentDepth?: number;
    optionVelocity?: number;
  };
  warnings: Array<{
    metric?: string;
    message: string;
    level: string;
  }>;
  earlyWarningState?: {
    activeWarnings: Array<{
      sensor?: string;
      message: string;
      severity: string;
      timestamp: string;
    }>;
    overallRisk?: string;
  };
  escapeRecommendation?: {
    name: string;
    description: string;
    steps: string[];
    level: number;
  };
  escapeVelocityNeeded?: boolean;
}

// Type for the adapted result
export interface ErgodicityResult {
  event: {
    type: string;
    timestamp: number;
    technique: string;
    step: number;
    reversibilityCost: number;
    description: string;
  };
  metrics: {
    currentFlexibility: number;
    pathDivergence: number;
    constraintLevel: number;
    optionSpaceSize: number;
  };
  warnings: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  earlyWarningState?: {
    activeWarnings: Array<{
      type: string;
      message: string;
      severity: string;
      timestamp: number;
    }>;
    overallSeverity: string;
  };
  escapeRecommendation?: {
    name: string;
    description: string;
    steps: string[];
    urgency: 'low' | 'medium' | 'high' | 'immediate';
  };
  escapeVelocityNeeded?: boolean;
}

export class ErgodicityResultAdapter {
  /**
   * Adapt ergodicity manager result to the expected interface
   */
  adapt(
    managerResult: ErgodicityManagerResult,
    currentFlexibility: number,
    pathMemory?: PathMemory
  ): ErgodicityResult {
    const result: ErgodicityResult = {
      event: this.adaptEvent(managerResult.event),
      metrics: this.adaptMetrics(managerResult.metrics, currentFlexibility, pathMemory),
      warnings: this.adaptWarnings(managerResult.warnings),
      earlyWarningState: this.adaptEarlyWarningState(managerResult.earlyWarningState),
      escapeRecommendation: this.adaptEscapeRecommendation(managerResult.escapeRecommendation),
      escapeVelocityNeeded: managerResult.escapeVelocityNeeded,
    };

    return result;
  }

  /**
   * Adapt event data
   */
  private adaptEvent(event: ErgodicityManagerResult['event']) {
    return {
      type: `${event.technique}_step`,
      timestamp: Date.parse(event.timestamp),
      technique: event.technique,
      step: event.step,
      reversibilityCost: event.reversibilityCost,
      description: event.decision,
    };
  }

  /**
   * Adapt metrics data
   *
   * `constraintLevel` used to add two different clocks together and treat a
   * missing reading as a middling one:
   *
   *     Math.min(1, (metrics.commitmentDepth || 0.5) + constraints.length * 0.05)
   *
   * `commitmentDepth` is a mean over the last five steps — a state a session
   * can leave — while `constraints.length` counts every constraint since step 1
   * and only grows, so the sum answered no single question about any moment.
   * Worse, the two count the same steps: `createConstraint` fires on
   * `commitmentLevel > 0.5`, which is exactly what `commitmentDepth` averages,
   * so a committing step was charged twice — the same double charge the
   * flexibility score shed when its own constraint penalty came off. And the
   * `|| 0.5` turned a depth of 0, a session that has committed to nothing, into
   * a reading halfway to fully constrained; 0 is a measurement, not a gap.
   *
   * One clock, the five-step window, and zero meaning zero.
   */
  private adaptMetrics(
    metrics: ErgodicityManagerResult['metrics'],
    currentFlexibility: number,
    pathMemory?: PathMemory
  ) {
    const enhancedConstraintLevel = metrics.commitmentDepth ?? 0;

    // Absent evidence is not a full option space.
    //
    // `|| 1.0` reported maximum optionality exactly when the measure read
    // zero — and it reads zero for thirty-one of the thirty-two techniques,
    // since only SCAMPER reports options at all. So the one number meant to
    // say how much room is left was at its most reassuring when it knew
    // nothing.
    const measuredVelocity = metrics.optionVelocity ?? 0;
    const adjustedOptionSpace = pathMemory
      ? measuredVelocity * Math.max(0.5, 1 - pathMemory.pathHistory.length * 0.01)
      : measuredVelocity;

    return {
      currentFlexibility,
      pathDivergence: metrics.pathDivergence,
      constraintLevel: enhancedConstraintLevel,
      optionSpaceSize: adjustedOptionSpace,
    };
  }

  /**
   * Adapt warnings with severity mapping
   */
  private adaptWarnings(warnings: ErgodicityManagerResult['warnings']) {
    return warnings.map(warning => ({
      type: warning.metric || 'unknown',
      message: warning.message,
      severity: this.mapSeverity(warning.level),
    }));
  }

  /**
   * Adapt early warning state
   */
  private adaptEarlyWarningState(earlyWarningState?: ErgodicityManagerResult['earlyWarningState']) {
    if (!earlyWarningState) return undefined;

    return {
      activeWarnings: earlyWarningState.activeWarnings.map(warning => ({
        type: warning.sensor || 'unknown',
        message: warning.message,
        severity: this.mapSeverityString(warning.severity),
        timestamp: Date.parse(warning.timestamp),
      })),
      // Not 'medium'. An absent risk level is an absent reading, and reporting
      // the middle of the scale for it invents a severity nothing measured.
      overallSeverity: earlyWarningState.overallRisk ?? 'unknown',
    };
  }

  /**
   * Adapt escape recommendation
   */
  private adaptEscapeRecommendation(
    escapeRecommendation?: ErgodicityManagerResult['escapeRecommendation']
  ) {
    if (!escapeRecommendation) return undefined;

    return {
      name: escapeRecommendation.name,
      description: escapeRecommendation.description,
      steps: escapeRecommendation.steps,
      urgency: this.mapUrgency(escapeRecommendation.level),
    };
  }

  /**
   * Map severity levels
   */
  private mapSeverity(level: string): 'low' | 'medium' | 'high' | 'critical' {
    if (level === 'critical') return 'critical';
    if (level === 'warning') return 'high';
    if (level === 'caution') return 'medium';
    return 'low';
  }

  /**
   * Map severity string (for early warning state)
   */
  private mapSeverityString(severity: string): string {
    if (severity === 'critical') return 'critical';
    if (severity === 'warning') return 'high';
    if (severity === 'caution') return 'medium';
    return 'low';
  }

  /**
   * Map urgency levels based on numeric level
   */
  private mapUrgency(level: number): 'low' | 'medium' | 'high' | 'immediate' {
    if (level >= 4) return 'immediate';
    if (level >= 3) return 'high';
    if (level >= 2) return 'medium';
    return 'low';
  }
}
