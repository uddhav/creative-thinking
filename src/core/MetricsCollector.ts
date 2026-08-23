/**
 * Metrics Collector
 * Handles metrics tracking and analysis for sessions
 */

import type { SessionData, ThinkingOperationData } from '../types/index.js';

export interface SessionMetrics {
  /** 0-1. How completely the session populated its outputs. See calculateOutputCompleteness. */
  outputCompleteness?: number;
  risksCaught?: number;
  antifragileFeatures?: number;
}

/**
 * Technique-native fields whose entries count as identified risks.
 *
 * The counters used to read only the legacy `risks` array — the one risk
 * field callers were never steered toward — so a session with a fully
 * populated steelman_red_team `failureModes` still reported `risksCaught: 0`.
 * Every field here is a string[] on the execute input; `timelineProjections`
 * nests two further lists and is handled in the extractors below.
 * `mitigations` is deliberately absent: a mitigation presumes a risk the
 * other fields already carry, so counting it would double-count.
 *
 * When a new technique adds a risk-bearing or antifragile field, add it here
 * — this constant is the single source for the session counters, the
 * per-technique completion telemetry, and the completeness score (see
 * CONTRIBUTING.md, "Adding a New Technique").
 */
export const RISK_FIELDS = [
  'risks',
  'failureModes',
  'blackSwans',
  'blackSwanScenarios',
  'failureModesPredicted',
  'failureInsights',
  'criticRisks',
  'earlyWarnings',
  'stressTestResults',
] as const;

export const ANTIFRAGILE_FIELDS = ['antifragileProperties', 'temporalEscapeRoutes'] as const;

function stringEntries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** Every risk entry a single step supplied, across all counted fields. */
export function riskEntries(entry: ThinkingOperationData): string[] {
  // Read as a plain record: two of the counted fields (blackSwanScenarios,
  // earlyWarnings) exist in the tool schema but not on the TS input types.
  const record = entry as unknown as Record<string, unknown>;
  const entries: string[] = [];
  for (const field of RISK_FIELDS) {
    entries.push(...stringEntries(record[field]));
  }
  const projections = record.timelineProjections as Record<string, unknown> | undefined;
  if (projections) {
    entries.push(...stringEntries(projections.blackSwanScenarios));
  }
  return entries;
}

/** Every antifragile entry a single step supplied. */
export function antifragileEntries(entry: ThinkingOperationData): string[] {
  const record = entry as unknown as Record<string, unknown>;
  const entries: string[] = [];
  for (const field of ANTIFRAGILE_FIELDS) {
    entries.push(...stringEntries(record[field]));
  }
  const projections = record.timelineProjections as Record<string, unknown> | undefined;
  if (projections) {
    entries.push(...stringEntries(projections.antifragileDesign));
  }
  return entries;
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
}

export class MetricsCollector {
  /**
   * Recompute session metrics from the full history.
   *
   * Callers invoke this AFTER pushing the current step onto `session.history`,
   * so the recomputation already accounts for the step being recorded. Both
   * counters are derived, never accumulated: entries are deduplicated by
   * trimmed text, so a caller that re-sends an array on a later step cannot
   * double-count, and calling this twice is harmless.
   */
  public updateMetrics(session: SessionData): SessionMetrics {
    if (!session.metrics) {
      session.metrics = {
        outputCompleteness: 0,
        risksCaught: 0,
        antifragileFeatures: 0,
      };
    }

    const risks = new Set<string>();
    const antifragile = new Set<string>();
    for (const entry of session.history) {
      for (const item of riskEntries(entry)) {
        const text = item.trim();
        if (text) risks.add(text);
      }
      for (const item of antifragileEntries(entry)) {
        const text = item.trim();
        if (text) antifragile.add(text);
      }
    }
    session.metrics.risksCaught = risks.size;
    session.metrics.antifragileFeatures = antifragile.size;

    // Recompute last: it reads risksCaught / antifragileFeatures updated above.
    session.metrics.outputCompleteness = this.calculateOutputCompleteness(session);

    return session.metrics;
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
      outputCompleteness: 0,
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

    // How fully the session's outputs were populated (coverage, not quality).
    // Recomputed rather than read off session.metrics so sessions restored from
    // disk before this field existed still report a value instead of undefined.
    const outputCompleteness = this.calculateOutputCompleteness(session);

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
      outputCompleteness,
    };
  }

  /**
   * How completely a session populated the outputs its techniques ask for.
   * Returns 0-1.
   *
   * This measures VOLUME and COVERAGE, not quality: it counts insights per
   * step and whether risk/antifragile fields were filled in. It cannot tell a
   * sharp insight from a padded one, so it must not be read as evidence that
   * the thinking was good — only that the session was filled in.
   *
   * This replaced a `creativityScore` that was
   * `min(lexicalDiversity * log(words+1) * 0.1, 0.2)` accumulated per step.
   * That measured vocabulary variety and verbosity — not creativity — and was
   * rendered as `X/10` on a scale it could not reach (a 7-step session topped
   * out near 1.4). Coverage of the fields a technique asks for is at least a
   * claim the data supports.
   *
   * A previous `revisionRate` factor scored sessions DOWN for containing
   * revisions. That penalised the exact behaviour this tool exists to
   * encourage — structured reconsideration — so it has been removed rather
   * than reweighted, and the remaining factors carry its weight.
   */
  /**
   * Recompute the derived completeness metric from the session as it stands.
   *
   * Separate from `updateMetrics` because the counters it reads and the
   * insights it counts are written at different points in a step: risk and
   * antifragile entries arrive with the input, but insights are extracted
   * later, while the response is being built. Computed once with the counters,
   * the metric always reported the previous step's insight count — a completed
   * three-insight session read 0.67 where it should read 0.8.
   *
   * (`updateMetrics` is safe to call twice now that the counters are derived;
   * this narrower helper remains for the response-building path, which only
   * needs the completeness refresh.)
   */
  public refreshOutputCompleteness(session: SessionData): number {
    if (!session.metrics) {
      return 0;
    }
    session.metrics.outputCompleteness = this.calculateOutputCompleteness(session);
    return session.metrics.outputCompleteness;
  }

  private calculateOutputCompleteness(session: SessionData): number {
    const factors = {
      insightsPerStep: session.insights.length / Math.max(session.history.length, 1),
      risksIdentified: (session.metrics?.risksCaught || 0) > 0 ? 1 : 0,
      antifragileFeatures: (session.metrics?.antifragileFeatures || 0) > 0 ? 1 : 0,
      completed: session.endTime !== undefined ? 1 : 0,
    };

    // Weight the factors (sums to 1.0)
    const score =
      factors.insightsPerStep * 0.4 +
      factors.risksIdentified * 0.2 +
      factors.antifragileFeatures * 0.2 +
      factors.completed * 0.2;

    // insightsPerStep is unbounded, so clamp rather than trust the weights.
    return Math.min(score, 1);
  }

  /**
   * Generate metrics summary for display
   */
  public generateMetricsSummary(metrics: DetailedMetrics): string[] {
    const summary: string[] = [];

    summary.push(`Total Steps: ${metrics.totalSteps}`);
    summary.push(`Insights Generated: ${metrics.insightsGenerated}`);

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

    if (metrics.outputCompleteness !== undefined) {
      // 0-1 fraction, shown as a percentage so it is not mistaken for a rating.
      summary.push(`Output Completeness: ${(metrics.outputCompleteness * 100).toFixed(0)}%`);
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
    if (session1.risksCaught !== undefined && session2.risksCaught !== undefined) {
      const base = Math.max(session1.risksCaught, 1);
      comparison.risksCaughtDiff = ((session2.risksCaught - session1.risksCaught) / base) * 100;
    }

    if (session1.insightsGenerated && session2.insightsGenerated) {
      comparison.insightsGeneratedDiff =
        ((session2.insightsGenerated - session1.insightsGenerated) / session1.insightsGenerated) *
        100;
    }

    if (session1.outputCompleteness !== undefined && session2.outputCompleteness !== undefined) {
      comparison.effectivenessDiff =
        ((session2.outputCompleteness - session1.outputCompleteness) /
          session1.outputCompleteness) *
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
      risksCaught: 0,
      antifragileFeatures: 0,
    };

    let flexibilityTotal = 0;
    let flexibilityCount = 0;
    let completenessTotal = 0;
    let completenessCount = 0;

    allMetrics.forEach(m => {
      averageMetrics.totalSteps += m.totalSteps;
      averageMetrics.revisionsCount += m.revisionsCount;
      averageMetrics.branchesCount += m.branchesCount;
      averageMetrics.insightsGenerated += m.insightsGenerated;
      // These are initialized to 0 above, so they're always defined
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

      if (m.outputCompleteness !== undefined) {
        completenessTotal += m.outputCompleteness;
        completenessCount++;
      }
    });

    // Calculate averages
    const count = sessions.length;
    averageMetrics.totalSteps /= count;
    averageMetrics.revisionsCount /= count;
    averageMetrics.branchesCount /= count;
    averageMetrics.insightsGenerated /= count;
    // These are initialized to 0 above, so they're always defined
    if (averageMetrics.risksCaught !== undefined) {
      averageMetrics.risksCaught /= count;
    }
    if (averageMetrics.antifragileFeatures !== undefined) {
      averageMetrics.antifragileFeatures /= count;
    }

    if (flexibilityCount > 0) {
      averageMetrics.flexibilityScore = flexibilityTotal / flexibilityCount;
    }

    if (completenessCount > 0) {
      averageMetrics.outputCompleteness = completenessTotal / completenessCount;
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
