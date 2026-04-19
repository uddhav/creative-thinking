/**
 * SkipDetector - Detects patterns in skipped steps and techniques
 * Provides insights into user behavior and potential workflow issues
 */

import type { SessionData, LateralTechnique } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

/**
 * Skip pattern types
 */
export type SkipPattern =
  | 'early_termination' // User stops before completing 50% of steps
  | 'technique_avoidance' // Specific techniques are consistently skipped
  | 'critical_step_skip' // Important steps (like Black Hat) are skipped
  | 'rush_through' // Very quick completion with minimal output
  | 'selective_engagement' // Only certain techniques are fully engaged with
  | 'fatigue_pattern' // Declining engagement over time
  | 'risk_avoidance'; // Skipping risk-related steps specifically

/**
 * Skip detection result
 */
export interface SkipDetectionResult {
  patternsDetected: SkipPattern[];
  skipRate: number;
  averageCompletionPerTechnique: Record<LateralTechnique, number>;
  criticalSkips: Array<{
    technique: LateralTechnique;
    step: string;
    reason: string;
  }>;
  recommendations: string[];
  riskScore: number; // 0-1, higher means more concerning skip patterns
}

/**
 * Session skip statistics
 */
interface SessionSkipStats {
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
  averageOutputLength: number;
  timePerStep: number[];
  techniqueCompletion: Map<LateralTechnique, { completed: number; total: number }>;
}

/**
 * Detects skip patterns in thinking sessions
 */
export class SkipDetector {
  private readonly RUSH_THRESHOLD_SECONDS = 30; // Less than 30 seconds per step
  private readonly MIN_OUTPUT_LENGTH = 100; // Minimum characters for meaningful output
  private readonly CRITICAL_COMPLETION_THRESHOLD = 0.5; // 50% minimum for critical techniques

  /**
   * Analyze session for skip patterns
   */
  analyzeSession(session: SessionData, plan?: PlanThinkingSessionOutput): SkipDetectionResult {
    const stats = this.calculateSessionStats(session, plan);
    const patterns = this.detectPatterns(stats, session);
    const criticalSkips = this.identifyCriticalSkips(session, plan);
    const recommendations = this.generateRecommendations(patterns, criticalSkips, stats);
    const riskScore = this.calculateRiskScore(patterns, criticalSkips, stats);

    return {
      patternsDetected: patterns,
      skipRate: stats.totalSteps > 0 ? stats.skippedSteps / stats.totalSteps : 0,
      averageCompletionPerTechnique: this.calculateAverageCompletion(stats.techniqueCompletion),
      criticalSkips,
      recommendations,
      riskScore,
    };
  }

  /**
   * Analyze multiple sessions for user patterns
   */
  analyzeUserPatterns(sessions: SessionData[]): {
    consistentPatterns: SkipPattern[];
    problematicTechniques: LateralTechnique[];
    overallSkipRate: number;
    improvementTrend: 'improving' | 'declining' | 'stable';
  } {
    // Analyze each session
    const sessionResults = sessions.map(session => this.analyzeSession(session));

    // Find patterns that appear in >50% of sessions
    const patternCounts = new Map<SkipPattern, number>();
    sessionResults.forEach(result => {
      result.patternsDetected.forEach(pattern => {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      });
    });

    const consistentPatterns = Array.from(patternCounts.entries())
      .filter(([_, count]) => count > sessions.length * 0.5)
      .map(([pattern]) => pattern);

    // Find techniques with low completion rates
    const techniqueStats = new Map<LateralTechnique, { total: number; completed: number }>();
    sessionResults.forEach(result => {
      Object.entries(result.averageCompletionPerTechnique).forEach(([technique, completion]) => {
        const stats = techniqueStats.get(technique as LateralTechnique) || {
          total: 0,
          completed: 0,
        };
        stats.total++;
        stats.completed += completion;
        techniqueStats.set(technique as LateralTechnique, stats);
      });
    });

    const problematicTechniques = Array.from(techniqueStats.entries())
      .filter(([_, stats]) => stats.total > 0 && stats.completed / stats.total < 0.5)
      .map(([technique]) => technique);

    // Calculate overall skip rate
    const totalSkipRate =
      sessionResults.reduce((sum, r) => sum + r.skipRate, 0) / sessionResults.length;

    // Determine trend (compare first half to second half)
    const midpoint = Math.floor(sessions.length / 2);
    const firstHalfRate =
      sessionResults.slice(0, midpoint).reduce((sum, r) => sum + r.skipRate, 0) / midpoint;
    const secondHalfRate =
      sessionResults.slice(midpoint).reduce((sum, r) => sum + r.skipRate, 0) /
      (sessions.length - midpoint);

    let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfRate < firstHalfRate - 0.1) {
      improvementTrend = 'improving';
    } else if (secondHalfRate > firstHalfRate + 0.1) {
      improvementTrend = 'declining';
    }

    return {
      consistentPatterns,
      problematicTechniques,
      overallSkipRate: totalSkipRate,
      improvementTrend,
    };
  }

  /**
   * Calculate session statistics
   */
  private calculateSessionStats(
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): SessionSkipStats {
    const techniqueCompletion = new Map<LateralTechnique, { completed: number; total: number }>();

    // Initialize from plan if available
    if (plan) {
      let stepIndex = 0;
      plan.workflow.forEach(workflow => {
        const completed = session.history.filter(
          h =>
            h.technique === workflow.technique &&
            h.currentStep > stepIndex &&
            h.currentStep <= stepIndex + workflow.steps.length
        ).length;

        techniqueCompletion.set(workflow.technique, {
          completed,
          total: workflow.steps.length,
        });

        stepIndex += workflow.steps.length;
      });
    } else {
      // Estimate from history
      session.history.forEach(entry => {
        const stats = techniqueCompletion.get(entry.technique) || {
          completed: 0,
          total: entry.totalSteps,
        };
        stats.completed++;
        techniqueCompletion.set(entry.technique, stats);
      });
    }

    // Calculate time per step
    const timePerStep: number[] = [];
    for (let i = 1; i < session.history.length; i++) {
      const prevTime = new Date(session.history[i - 1].timestamp).getTime();
      const currTime = new Date(session.history[i].timestamp).getTime();
      timePerStep.push((currTime - prevTime) / 1000); // seconds
    }

    // Calculate stats
    const totalSteps =
      plan?.totalSteps || session.history[session.history.length - 1]?.totalSteps || 0;
    const completedSteps = session.history.length;
    const skippedSteps = Math.max(0, totalSteps - completedSteps);
    const averageOutputLength =
      session.history.reduce((sum, h) => sum + h.output.length, 0) /
      Math.max(1, session.history.length);

    return {
      totalSteps,
      completedSteps,
      skippedSteps,
      averageOutputLength,
      timePerStep,
      techniqueCompletion,
    };
  }

  /**
   * Detect skip patterns
   */
  private detectPatterns(stats: SessionSkipStats, session: SessionData): SkipPattern[] {
    const patterns: SkipPattern[] = [];

    // Early termination
    if (stats.completedSteps < stats.totalSteps * 0.5) {
      patterns.push('early_termination');
    }

    // Rush through (fast completion + short outputs)
    const avgTimePerStep =
      stats.timePerStep.reduce((a, b) => a + b, 0) / Math.max(1, stats.timePerStep.length);
    if (
      avgTimePerStep < this.RUSH_THRESHOLD_SECONDS &&
      stats.averageOutputLength < this.MIN_OUTPUT_LENGTH
    ) {
      patterns.push('rush_through');
    }

    // Technique avoidance
    const avoidedTechniques = Array.from(stats.techniqueCompletion.entries()).filter(
      ([_, data]) => data.total > 0 && data.completed === 0
    );
    if (avoidedTechniques.length > 0) {
      patterns.push('technique_avoidance');
    }

    // Critical step skip
    const hasBlackHatSkip = session.history.some(
      h => h.technique === 'six_hats' && h.currentStep === 5 && h.output.length < 50
    );
    if (hasBlackHatSkip) {
      patterns.push('critical_step_skip');
    }

    // Risk avoidance
    const riskSteps = session.history.filter(
      h =>
        (h.technique === 'six_hats' && h.currentStep === 5) || // Black Hat
        (h.technique === 'triz' && h.currentStep === 1) || // Contradiction
        (h.risks?.length || 0) > 0
    );
    if (riskSteps.length === 0 && stats.completedSteps > 5) {
      patterns.push('risk_avoidance');
    }

    // Fatigue pattern (declining output length over time)
    if (session.history.length > 10) {
      const firstThird = session.history.slice(0, Math.floor(session.history.length / 3));
      const lastThird = session.history.slice(-Math.floor(session.history.length / 3));

      const firstAvgLength =
        firstThird.reduce((sum, h) => sum + h.output.length, 0) / firstThird.length;
      const lastAvgLength =
        lastThird.reduce((sum, h) => sum + h.output.length, 0) / lastThird.length;

      if (lastAvgLength < firstAvgLength * 0.5) {
        patterns.push('fatigue_pattern');
      }
    }

    // Selective engagement
    const engagementVariance = this.calculateEngagementVariance(stats.techniqueCompletion);
    if (engagementVariance > 0.5) {
      patterns.push('selective_engagement');
    }

    return patterns;
  }

  /**
   * Identify critical skipped steps
   */
  private identifyCriticalSkips(
    session: SessionData,
    _plan?: PlanThinkingSessionOutput
  ): Array<{ technique: LateralTechnique; step: string; reason: string }> {
    const criticalSkips: Array<{ technique: LateralTechnique; step: string; reason: string }> = [];

    // Check for Black Hat skip in Six Hats
    const sixHatsSteps = session.history.filter(h => h.technique === 'six_hats');
    const hasBlackHat = sixHatsSteps.some(h => h.currentStep === 5);
    if (sixHatsSteps.length > 0 && !hasBlackHat) {
      criticalSkips.push({
        technique: 'six_hats',
        step: 'Black Hat',
        reason: 'Critical risk assessment perspective missing',
      });
    }

    // Check for TRIZ contradiction skip
    const trizSteps = session.history.filter(h => h.technique === 'triz');
    const hasContradiction = trizSteps.some(h => h.currentStep === 1);
    if (trizSteps.length > 0 && !hasContradiction) {
      criticalSkips.push({
        technique: 'triz',
        step: 'Contradiction',
        reason: 'Fundamental conflict analysis missing',
      });
    }

    // Check for Design Thinking empathize skip
    const dtSteps = session.history.filter(h => h.technique === 'design_thinking');
    const hasEmpathize = dtSteps.some(h => h.currentStep === 1);
    if (dtSteps.length > 0 && !hasEmpathize) {
      criticalSkips.push({
        technique: 'design_thinking',
        step: 'Empathize',
        reason: 'User understanding foundation missing',
      });
    }

    return criticalSkips;
  }

  /**
   * Generate recommendations based on patterns
   */
  private generateRecommendations(
    patterns: SkipPattern[],
    criticalSkips: Array<{ technique: LateralTechnique; step: string; reason: string }>,
    stats: SessionSkipStats
  ): string[] {
    const recommendations: string[] = [];

    if (patterns.includes('early_termination')) {
      recommendations.push(
        'Consider using a shorter workflow or breaking the problem into smaller parts'
      );
    }

    if (patterns.includes('rush_through')) {
      recommendations.push('Take more time with each step to develop deeper insights');
    }

    if (patterns.includes('technique_avoidance')) {
      const avoided = Array.from(stats.techniqueCompletion.entries())
        .filter(([_, data]) => data.total > 0 && data.completed === 0)
        .map(([tech]) => tech);
      recommendations.push(`Try engaging with avoided techniques: ${avoided.join(', ')}`);
    }

    if (patterns.includes('critical_step_skip') || criticalSkips.length > 0) {
      recommendations.push(
        'Critical analysis steps were skipped - consider revisiting for comprehensive analysis'
      );
    }

    if (patterns.includes('risk_avoidance')) {
      recommendations.push(
        'Include risk assessment perspectives (Black Hat, TRIZ contradiction) for balanced analysis'
      );
    }

    if (patterns.includes('fatigue_pattern')) {
      recommendations.push('Consider taking breaks or splitting the session to maintain quality');
    }

    if (patterns.includes('selective_engagement')) {
      recommendations.push(
        'Try to maintain consistent engagement across all techniques for balanced insights'
      );
    }

    return recommendations;
  }

  /**
   * Calculate risk score based on patterns
   */
  private calculateRiskScore(
    patterns: SkipPattern[],
    criticalSkips: Array<{ technique: LateralTechnique; step: string; reason: string }>,
    stats: SessionSkipStats
  ): number {
    let score = 0;

    // Pattern weights
    const patternWeights: Record<SkipPattern, number> = {
      early_termination: 0.3,
      technique_avoidance: 0.2,
      critical_step_skip: 0.4,
      rush_through: 0.2,
      selective_engagement: 0.1,
      fatigue_pattern: 0.15,
      risk_avoidance: 0.35,
    };

    patterns.forEach(pattern => {
      score += patternWeights[pattern] || 0.1;
    });

    // Add for critical skips
    score += criticalSkips.length * 0.2;

    // Add for low completion rate
    const completionRate = stats.completedSteps / Math.max(1, stats.totalSteps);
    if (completionRate < 0.3) {
      score += 0.3;
    } else if (completionRate < 0.5) {
      score += 0.2;
    } else if (completionRate < 0.7) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate average completion per technique
   */
  private calculateAverageCompletion(
    techniqueCompletion: Map<LateralTechnique, { completed: number; total: number }>
  ): Record<LateralTechnique, number> {
    const result: Partial<Record<LateralTechnique, number>> = {};

    techniqueCompletion.forEach((data, technique) => {
      if (data.total > 0) {
        result[technique] = data.completed / data.total;
      }
    });

    return result as Record<LateralTechnique, number>;
  }

  /**
   * Calculate engagement variance across techniques
   */
  private calculateEngagementVariance(
    techniqueCompletion: Map<LateralTechnique, { completed: number; total: number }>
  ): number {
    const completionRates: number[] = [];

    techniqueCompletion.forEach(data => {
      if (data.total > 0) {
        completionRates.push(data.completed / data.total);
      }
    });

    if (completionRates.length < 2) return 0;

    const mean = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
    const variance =
      completionRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) /
      completionRates.length;

    return Math.sqrt(variance);
  }
}
