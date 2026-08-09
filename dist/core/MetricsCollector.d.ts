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
     * Update session metrics based on new input.
     *
     * Callers invoke this AFTER pushing the current step onto `session.history`,
     * so a whole-session recomputation here already accounts for the step being
     * recorded. That is why `outputCompleteness` is derived from the session
     * rather than accumulated per call.
     */
    updateMetrics(session: SessionData, input: ThinkingOperationData): SessionMetrics;
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
     * insights it counts are written at different points in a step: risks and
     * antifragile features arrive with the input, but insights are extracted
     * later, while the response is being built. Computed once with the counters,
     * the metric always reported the previous step's insight count — a completed
     * three-insight session read 0.67 where it should read 0.8.
     *
     * `updateMetrics` cannot simply be called again: it increments the risk and
     * antifragile counters, so a second call would double them.
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