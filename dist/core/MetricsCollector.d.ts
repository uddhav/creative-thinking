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
     * Calculate technique effectiveness score
     */
    private calculateTechniqueEffectiveness;
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