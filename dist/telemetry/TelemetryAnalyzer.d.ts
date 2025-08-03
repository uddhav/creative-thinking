/**
 * Telemetry Analyzer
 * Analyzes telemetry data to provide insights on technique effectiveness
 */
import type { AnalyticsQuery, AnalyticsResult, TechniqueEffectiveness, SessionAnalytics, TelemetryConfig } from './types.js';
import type { LateralTechnique } from '../types/index.js';
export declare class TelemetryAnalyzer {
    private storage;
    constructor(config: TelemetryConfig);
    /**
     * Get analytics based on query
     */
    getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult>;
    /**
     * Get technique effectiveness analysis
     */
    getTechniqueEffectiveness(technique?: LateralTechnique): Promise<TechniqueEffectiveness[]>;
    /**
     * Get session analytics
     */
    getSessionAnalytics(sessionId?: string): Promise<SessionAnalytics[]>;
    /**
     * Get events for query
     */
    private getEventsForQuery;
    /**
     * Analyze events based on query
     */
    private analyzeEvents;
    /**
     * Get group key for event
     */
    private getGroupKey;
    /**
     * Update metrics based on event
     */
    private updateMetrics;
    /**
     * Finalize metrics (calculate averages)
     */
    private finalizeMetrics;
    /**
     * Generate analytics summary
     */
    private generateSummary;
    /**
     * Update technique statistics
     */
    private updateTechniqueStats;
    /**
     * Finalize technique statistics
     */
    private finalizeTechniqueStats;
    /**
     * Find common technique combinations
     */
    private findCommonCombinations;
    /**
     * Update session analytics
     */
    private updateSessionAnalytics;
    /**
     * Finalize session analytics
     */
    private finalizeSessionAnalytics;
    /**
     * Get default metrics
     */
    private getDefaultMetrics;
}
//# sourceMappingURL=TelemetryAnalyzer.d.ts.map