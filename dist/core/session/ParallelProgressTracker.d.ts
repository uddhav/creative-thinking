/**
 * ParallelProgressTracker - Tracks progress across parallel executions
 * Provides real-time progress monitoring and time estimation
 */
import type { ParallelSessionGroup, GroupProgress, ProgressSummary } from '../../types/parallel-session.js';
import { EventEmitter } from 'events';
/**
 * Tracks and reports progress for parallel execution groups
 */
export declare class ParallelProgressTracker extends EventEmitter {
    private groupProgress;
    private sessionToGroup;
    private progressHistory;
    /**
     * Initialize progress tracking for a group
     */
    initializeGroupProgress(group: ParallelSessionGroup): void;
    /**
     * Update session progress
     */
    updateSessionProgress(sessionId: string, completedSteps: number, totalSteps: number): void;
    /**
     * Get group progress
     */
    getGroupProgress(groupId: string): GroupProgress | undefined;
    /**
     * Get progress summary for a group
     */
    getProgressSummary(groupId: string): ProgressSummary;
    /**
     * Mark session as failed
     */
    markSessionFailed(sessionId: string, error?: string): void;
    /**
     * Mark group as completed
     */
    markGroupCompleted(groupId: string): void;
    /**
     * Get detailed progress report
     */
    getDetailedReport(groupId: string): {
        overall: ProgressSummary;
        sessions: Array<{
            sessionId: string;
            status: string;
            progress: number;
            estimatedCompletion?: number;
            executionTime?: number;
        }>;
        timeline: Array<{
            timestamp: number;
            progress: number;
        }>;
        estimatedVsActual?: {
            originalEstimate: number;
            currentEstimate: number;
            variance: number;
        };
    } | undefined;
    /**
     * Find group ID for a session
     */
    private findGroupForSession;
    /**
     * Recalculate group progress from session progress
     */
    private recalculateGroupProgress;
    /**
     * Estimate initial completion time for a group
     */
    private estimateCompletion;
    /**
     * Estimate completion time for a session
     */
    private estimateSessionCompletion;
    /**
     * Recalculate estimated completion based on current progress
     */
    private recalculateEstimatedCompletion;
    /**
     * Estimate time remaining for a group
     */
    private estimateTimeRemaining;
    /**
     * Track progress history for visualization
     */
    private trackProgressHistory;
    /**
     * Check for progress milestones
     */
    private checkMilestones;
    /**
     * Check if group should be marked as failed
     */
    private checkGroupFailure;
    /**
     * Get statistics about progress tracking
     */
    getStats(): {
        totalGroups: number;
        activeGroups: number;
        completedGroups: number;
        averageCompletionRate: number;
        averageProgress: number;
    };
    /**
     * Clear progress for a group
     */
    clearGroupProgress(groupId: string): void;
    /**
     * Clear all progress tracking
     */
    clear(): void;
}
//# sourceMappingURL=ParallelProgressTracker.d.ts.map