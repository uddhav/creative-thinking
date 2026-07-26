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
    outputCompleteness?: number;
}
export declare class MetricsCollector {
    /**
     * Update session metrics based on new input
     */
    updateMetrics(session: SessionData, input: ThinkingOperationData): SessionMetrics;
    /**
     * Calculate creativity score based on output
     */
    calculateCreativityScore(output: string, currentScore: number): number;
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
     *
     * This measures VOLUME and COVERAGE, not quality: it counts insights per
     * step and whether risk/antifragile fields were filled in. It cannot tell a
     * sharp insight from a padded one, so it must not be read as evidence that
     * the thinking was good — only that the session was filled in.
     *
     * A previous `revisionRate` factor scored sessions DOWN for containing
     * revisions. That penalised the exact behaviour this tool exists to
     * encourage — structured reconsideration — so it has been removed rather
     * than reweighted, and the remaining factors carry its weight.
     */
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