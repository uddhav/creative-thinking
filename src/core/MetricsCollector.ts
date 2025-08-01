/**
 * Metrics Collector
 * Handles metrics tracking and analysis for sessions
 */

import type { SessionData, ThinkingOperationData } from '../types/index.js';

export interface SessionMetrics {
  creativityScore?: number;
  risksCaught?: number;
  antifragileFeatures?: number;
}

export interface DetailedMetrics extends SessionMetrics {
  totalSteps: number;
  revisionsCount: number;
  branchesCount: number;
  insightsGenerated: number;
  flexibilityScore?: number;
  constraintsIdentified?: number;
  escapePlanGenerated?: boolean;
  completionTime?: number;
  techniqueEffectiveness?: number;
}

export class MetricsCollector {
  /**
   * Update session metrics based on new input
   */
  public updateMetrics(session: SessionData, input: ThinkingOperationData): SessionMetrics {
    if (!session.metrics) {
      session.metrics = {
        creativityScore: 0,
        risksCaught: 0,
        antifragileFeatures: 0,
      };
    }

    // Update creativity score
    if (input.output) {
      session.metrics.creativityScore = this.calculateCreativityScore(
        input.output,
        session.metrics.creativityScore || 0
      );
    }

    // Update risks caught
    if (input.risks && input.risks.length > 0) {
      session.metrics.risksCaught = (session.metrics.risksCaught || 0) + input.risks.length;
    }

    // Update antifragile features
    if (input.antifragileProperties && input.antifragileProperties.length > 0) {
      session.metrics.antifragileFeatures =
        (session.metrics.antifragileFeatures || 0) + input.antifragileProperties.length;
    }

    return session.metrics;
  }

  /**
   * Calculate creativity score based on output
   */
  public calculateCreativityScore(output: string, currentScore: number): number {
    // Handle empty output
    if (!output || output.trim().length === 0) {
      return currentScore; // No change for empty output
    }

    // Simple heuristic: longer, more varied outputs score higher
    const words = output
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0);

    // If no meaningful words, return current score
    if (words.length === 0) {
      return currentScore;
    }

    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversity = uniqueWords.size / words.length;

    // Adjust score based on diversity and length
    const newContribution = Math.min(diversity * Math.log(words.length + 1) * 0.1, 0.2);

    // Running average
    return Math.min(currentScore + newContribution, 10);
  }

  /**
   * Count risks identified in the session
   */
  public countRisks(risks: string[]): number {
    return risks.length;
  }

  /**
   * Count antifragile properties
   */
  public countAntifragileFeatures(properties: string[]): number {
    return properties.length;
  }

  /**
   * Get detailed metrics for a session
   */
  public getDetailedMetrics(session: SessionData): DetailedMetrics {
    const basicMetrics = session.metrics || {
      creativityScore: 0,
      risksCaught: 0,
      antifragileFeatures: 0,
    };

    const revisionsCount = session.history.filter(h => h.isRevision).length;
    const branchesCount = Object.keys(session.branches).length;
    const insightsGenerated = session.insights.length;

    // Calculate completion time if available
    let completionTime: number | undefined;
    if (session.startTime && session.endTime) {
      completionTime = session.endTime - session.startTime;
    }

    // Get flexibility score from path memory if available
    let flexibilityScore: number | undefined;
    let constraintsIdentified: number | undefined;
    if (session.pathMemory) {
      flexibilityScore = session.pathMemory.currentFlexibility.flexibilityScore;
      constraintsIdentified = session.pathMemory.constraints.length;
    }

    // Check if escape plan was generated
    const escapePlanGenerated = session.escapeRecommendation !== undefined;

    // Calculate technique effectiveness (simple heuristic)
    const techniqueEffectiveness = this.calculateTechniqueEffectiveness(session);

    return {
      ...basicMetrics,
      totalSteps: session.history.length,
      revisionsCount,
      branchesCount,
      insightsGenerated,
      flexibilityScore,
      constraintsIdentified,
      escapePlanGenerated,
      completionTime,
      techniqueEffectiveness,
    };
  }

  /**
   * Calculate technique effectiveness score
   */
  private calculateTechniqueEffectiveness(session: SessionData): number {
    let score = 0;
    const factors = {
      insightsPerStep: session.insights.length / Math.max(session.history.length, 1),
      risksIdentified: (session.metrics?.risksCaught || 0) > 0 ? 1 : 0,
      antifragileFeatures: (session.metrics?.antifragileFeatures || 0) > 0 ? 1 : 0,
      completed: session.endTime !== undefined ? 1 : 0,
      revisionRate:
        1 - session.history.filter(h => h.isRevision).length / Math.max(session.history.length, 1),
    };

    // Weight the factors
    score =
      factors.insightsPerStep * 0.3 +
      factors.risksIdentified * 0.2 +
      factors.antifragileFeatures * 0.2 +
      factors.completed * 0.2 +
      factors.revisionRate * 0.1;

    return Math.min(score * 10, 10); // Scale to 0-10
  }

  /**
   * Generate metrics summary for display
   */
  public generateMetricsSummary(metrics: DetailedMetrics): string[] {
    const summary: string[] = [];

    summary.push(`Total Steps: ${metrics.totalSteps}`);
    summary.push(`Insights Generated: ${metrics.insightsGenerated}`);

    if (metrics.creativityScore !== undefined) {
      summary.push(`Creativity Score: ${metrics.creativityScore.toFixed(1)}/10`);
    }

    if (metrics.risksCaught && metrics.risksCaught > 0) {
      summary.push(`Risks Identified: ${metrics.risksCaught}`);
    }

    if (metrics.antifragileFeatures && metrics.antifragileFeatures > 0) {
      summary.push(`Antifragile Features: ${metrics.antifragileFeatures}`);
    }

    if (metrics.revisionsCount > 0) {
      summary.push(`Revisions Made: ${metrics.revisionsCount}`);
    }

    if (metrics.flexibilityScore !== undefined) {
      summary.push(`Flexibility Score: ${(metrics.flexibilityScore * 100).toFixed(0)}%`);
    }

    if (metrics.completionTime !== undefined) {
      const minutes = Math.floor(metrics.completionTime / 60000);
      const seconds = Math.floor((metrics.completionTime % 60000) / 1000);
      summary.push(`Completion Time: ${minutes}m ${seconds}s`);
    }

    if (metrics.techniqueEffectiveness !== undefined) {
      summary.push(`Technique Effectiveness: ${metrics.techniqueEffectiveness.toFixed(1)}/10`);
    }

    return summary;
  }

  /**
   * Compare two sessions' metrics
   */
  public compareMetrics(
    session1: DetailedMetrics,
    session2: DetailedMetrics
  ): Record<string, number> {
    const comparison: Record<string, number> = {};

    // Calculate percentage differences
    if (session1.creativityScore !== undefined && session2.creativityScore !== undefined) {
      comparison.creativityScoreDiff =
        ((session2.creativityScore - session1.creativityScore) / session1.creativityScore) * 100;
    }

    if (session1.risksCaught !== undefined && session2.risksCaught !== undefined) {
      const base = Math.max(session1.risksCaught, 1);
      comparison.risksCaughtDiff = ((session2.risksCaught - session1.risksCaught) / base) * 100;
    }

    if (session1.insightsGenerated && session2.insightsGenerated) {
      comparison.insightsGeneratedDiff =
        ((session2.insightsGenerated - session1.insightsGenerated) / session1.insightsGenerated) *
        100;
    }

    if (
      session1.techniqueEffectiveness !== undefined &&
      session2.techniqueEffectiveness !== undefined
    ) {
      comparison.effectivenessDiff =
        ((session2.techniqueEffectiveness - session1.techniqueEffectiveness) /
          session1.techniqueEffectiveness) *
        100;
    }

    return comparison;
  }

  /**
   * Aggregate metrics across multiple sessions
   */
  public aggregateMetrics(sessions: SessionData[]): {
    totalSessions: number;
    averageMetrics: DetailedMetrics;
    techniqueDistribution: Record<string, number>;
    successRate: number;
  } {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageMetrics: {
          totalSteps: 0,
          revisionsCount: 0,
          branchesCount: 0,
          insightsGenerated: 0,
        },
        techniqueDistribution: {},
        successRate: 0,
      };
    }

    // Collect all metrics
    const allMetrics = sessions.map(s => this.getDetailedMetrics(s));

    // Calculate averages
    const averageMetrics: DetailedMetrics = {
      totalSteps: 0,
      revisionsCount: 0,
      branchesCount: 0,
      insightsGenerated: 0,
      creativityScore: 0,
      risksCaught: 0,
      antifragileFeatures: 0,
    };

    let flexibilityTotal = 0;
    let flexibilityCount = 0;
    let effectivenessTotal = 0;
    let effectivenessCount = 0;

    allMetrics.forEach(m => {
      averageMetrics.totalSteps += m.totalSteps;
      averageMetrics.revisionsCount += m.revisionsCount;
      averageMetrics.branchesCount += m.branchesCount;
      averageMetrics.insightsGenerated += m.insightsGenerated;
      // These are initialized to 0 above, so they're always defined
      if (averageMetrics.creativityScore !== undefined) {
        averageMetrics.creativityScore += m.creativityScore || 0;
      }
      if (averageMetrics.risksCaught !== undefined) {
        averageMetrics.risksCaught += m.risksCaught || 0;
      }
      if (averageMetrics.antifragileFeatures !== undefined) {
        averageMetrics.antifragileFeatures += m.antifragileFeatures || 0;
      }

      if (m.flexibilityScore !== undefined) {
        flexibilityTotal += m.flexibilityScore;
        flexibilityCount++;
      }

      if (m.techniqueEffectiveness !== undefined) {
        effectivenessTotal += m.techniqueEffectiveness;
        effectivenessCount++;
      }
    });

    // Calculate averages
    const count = sessions.length;
    averageMetrics.totalSteps /= count;
    averageMetrics.revisionsCount /= count;
    averageMetrics.branchesCount /= count;
    averageMetrics.insightsGenerated /= count;
    // These are initialized to 0 above, so they're always defined
    if (averageMetrics.creativityScore !== undefined) {
      averageMetrics.creativityScore /= count;
    }
    if (averageMetrics.risksCaught !== undefined) {
      averageMetrics.risksCaught /= count;
    }
    if (averageMetrics.antifragileFeatures !== undefined) {
      averageMetrics.antifragileFeatures /= count;
    }

    if (flexibilityCount > 0) {
      averageMetrics.flexibilityScore = flexibilityTotal / flexibilityCount;
    }

    if (effectivenessCount > 0) {
      averageMetrics.techniqueEffectiveness = effectivenessTotal / effectivenessCount;
    }

    // Calculate technique distribution
    const techniqueDistribution: Record<string, number> = {};
    sessions.forEach(s => {
      techniqueDistribution[s.technique] = (techniqueDistribution[s.technique] || 0) + 1;
    });

    // Calculate success rate (sessions that were completed)
    const completedSessions = sessions.filter(s => s.endTime !== undefined).length;
    const successRate = (completedSessions / count) * 100;

    return {
      totalSessions: count,
      averageMetrics,
      techniqueDistribution,
      successRate,
    };
  }
}
