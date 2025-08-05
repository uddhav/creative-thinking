/**
 * ParallelExecutionMetrics - Tracks and reports performance metrics for parallel execution
 */
import type { LateralTechnique } from '../../types/index.js';
/**
 * Execution metrics for a single session
 */
export interface SessionMetrics {
    sessionId: string;
    technique: LateralTechnique;
    startTime: number;
    endTime?: number;
    duration?: number;
    steps: {
        stepNumber: number;
        startTime: number;
        endTime: number;
        duration: number;
    }[];
    waitTime?: number;
    retryCount: number;
    status: 'in_progress' | 'completed' | 'failed';
    errorCount: number;
    insightsGenerated: number;
}
/**
 * Group execution metrics
 */
export interface GroupMetrics {
    groupId: string;
    startTime: number;
    endTime?: number;
    totalDuration?: number;
    parallelEfficiency?: number;
    sessions: Map<string, SessionMetrics>;
    convergenceOptions?: {
        strategy: string;
        sessionCount: number;
    };
    resourceUsage: {
        peakMemoryUsage: number;
        averageMemoryUsage: number;
        cpuTime: number;
    };
}
/**
 * Aggregate metrics across all executions
 */
export interface AggregateMetrics {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    averageParallelEfficiency: number;
    techniquePerformance: Map<LateralTechnique, {
        count: number;
        averageDuration: number;
        successRate: number;
        averageInsights: number;
    }>;
    peakConcurrency: number;
    totalInsightsGenerated: number;
}
/**
 * Tracks performance metrics for parallel execution
 */
export declare class ParallelExecutionMetrics {
    private groupMetrics;
    private completedGroups;
    private currentConcurrency;
    private peakConcurrency;
    private metricsStartTime;
    /**
     * Start tracking a group
     */
    startGroup(groupId: string, sessionCount: number, convergenceOptions?: {
        strategy: string;
    }): void;
    /**
     * Start tracking a session
     */
    startSession(groupId: string, sessionId: string, technique: LateralTechnique, waitTime?: number): void;
    /**
     * Record step completion
     */
    recordStepCompletion(sessionId: string, stepNumber: number, startTime: number, endTime: number): void;
    /**
     * Complete a session
     */
    completeSession(sessionId: string, status: 'completed' | 'failed', insightsGenerated: number): void;
    /**
     * Record error
     */
    recordError(sessionId: string): void;
    /**
     * Record retry
     */
    recordRetry(sessionId: string): void;
    /**
     * Complete a group
     */
    completeGroup(groupId: string): void;
    /**
     * Calculate parallel efficiency
     */
    private calculateParallelEfficiency;
    /**
     * Update resource usage
     */
    private updateResourceUsage;
    /**
     * Update concurrency tracking
     */
    private updateConcurrency;
    /**
     * Get current metrics snapshot
     */
    getCurrentMetrics(): {
        activeGroups: number;
        activeSessions: number;
        currentConcurrency: number;
        peakConcurrency: number;
        uptime: number;
    };
    /**
     * Get aggregate metrics
     */
    getAggregateMetrics(): AggregateMetrics;
    /**
     * Get detailed group metrics
     */
    getGroupMetrics(groupId: string): GroupMetrics | undefined;
    /**
     * Export metrics as JSON
     */
    exportMetrics(): string;
    /**
     * Reset metrics
     */
    reset(): void;
}
//# sourceMappingURL=ParallelExecutionMetrics.d.ts.map