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
    _pathMemory?: PathMemory
  ): ErgodicityResult {
    return {
      event: this.adaptEvent(managerResult.event),
      metrics: this.adaptMetrics(managerResult.metrics, currentFlexibility),
      warnings: this.adaptWarnings(managerResult.warnings),
      earlyWarningState: this.adaptEarlyWarningState(managerResult.earlyWarningState),
      escapeRecommendation: this.adaptEscapeRecommendation(managerResult.escapeRecommendation),
      escapeVelocityNeeded: managerResult.escapeVelocityNeeded,
    };
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
   */
  private adaptMetrics(metrics: ErgodicityManagerResult['metrics'], currentFlexibility: number) {
    return {
      currentFlexibility,
      pathDivergence: metrics.pathDivergence,
      constraintLevel: metrics.commitmentDepth || 0.5,
      optionSpaceSize: metrics.optionVelocity || 1.0,
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
      overallSeverity: earlyWarningState.overallRisk || 'medium',
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
