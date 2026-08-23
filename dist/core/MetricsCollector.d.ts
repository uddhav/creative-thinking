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
export declare const RISK_FIELDS: readonly ["risks", "failureModes", "blackSwans", "blackSwanScenarios", "failureModesPredicted", "failureInsights", "criticRisks", "earlyWarnings", "stressTestResults"];
export declare const ANTIFRAGILE_FIELDS: readonly ["antifragileProperties", "temporalEscapeRoutes"];
/** Every risk entry a single step supplied, across all counted fields. */
export declare function riskEntries(entry: ThinkingOperationData): string[];
/** Every antifragile entry a single step supplied. */
export declare function antifragileEntries(entry: ThinkingOperationData): string[];
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
export declare class MetricsCollector {
    /**
     * Recompute session metrics from the full history.
     *
     * Callers invoke this AFTER pushing the current step onto `session.history`,
     * so the recomputation already accounts for the step being recorded. Both
     * counters are derived, never accumulated: entries are deduplicated by
     * trimmed text, so a caller that re-sends an array on a later step cannot
     * double-count, and calling this twice is harmless.
     */
    updateMetrics(session: SessionData): SessionMetrics;
    /**
     * Count risks identified in the session
     */
    countRisks(risks: string[]): number;
    /**
     * Count antifragile properties
     */
    countAntifragileFeatures(properties: string[]): number;
    /**
     * Get detailed metrics for a session
     */
    getDetailedMetrics(session: SessionData): DetailedMetrics;
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
    refreshOutputCompleteness(session: SessionData): number;
    private calculateOutputCompleteness;
    /**
     * Generate metrics summary for display
     */
    generateMetricsSummary(metrics: DetailedMetrics): string[];
    /**
     * Compare two sessions' metrics
     */
    compareMetrics(session1: DetailedMetrics, session2: DetailedMetrics): Record<string, number>;
    /**
     * Aggregate metrics across multiple sessions
     */
    aggregateMetrics(sessions: SessionData[]): {
        totalSessions: number;
        averageMetrics: DetailedMetrics;
        techniqueDistribution: Record<string, number>;
        successRate: number;
    };
}
//# sourceMappingURL=MetricsCollector.d.ts.map