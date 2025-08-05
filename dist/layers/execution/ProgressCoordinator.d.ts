/**
 * ProgressCoordinator - Manages and tracks progress across parallel sessions
 * Provides real-time progress updates and coordination for parallel execution
 */
import { EventEmitter } from 'events';
import type { SessionManager } from '../../core/SessionManager.js';
import type { ParallelErrorHandler } from './ParallelErrorHandler.js';
/**
 * Progress update event data
 */
export interface ProgressUpdate {
    groupId: string;
    sessionId: string;
    technique: string;
    currentStep: number;
    totalSteps: number;
    status: 'started' | 'in_progress' | 'completed' | 'failed' | 'waiting';
    timestamp: number;
    metadata?: {
        insightsGenerated?: number;
        errorMessage?: string;
        dependencies?: string[];
    };
}
/**
 * Group progress summary
 */
export interface GroupProgressSummary {
    groupId: string;
    totalSessions: number;
    completedSessions: number;
    failedSessions: number;
    inProgressSessions: number;
    waitingSessions: number;
    overallProgress: number;
    estimatedTimeRemaining?: number;
    sessionProgress: Map<string, {
        technique: string;
        currentStep: number;
        totalSteps: number;
        status: ProgressUpdate['status'];
    }>;
}
/**
 * Coordinates progress tracking across parallel sessions
 */
export declare class ProgressCoordinator extends EventEmitter {
    private sessionManager;
    private sessionProgress;
    private groupStartTimes;
    private stepDurations;
    private groupCompletionTimes;
    private readonly CLEANUP_INTERVAL;
    private readonly DATA_RETENTION_PERIOD;
    private cleanupTimer?;
    private updateLocks;
    private errorHandler?;
    constructor(sessionManager: SessionManager);
    /**
     * Report progress for a session
     */
    reportProgress(update: ProgressUpdate): Promise<void>;
    /**
     * Get progress summary for a group
     */
    getGroupProgress(groupId: string): GroupProgressSummary | null;
    /**
     * Start tracking a group
     */
    startGroup(groupId: string): void;
    /**
     * Get real-time progress stream for a group
     */
    streamGroupProgress(groupId: string, callback: (summary: GroupProgressSummary) => void): () => void;
    /**
     * Get progress for a specific session
     */
    getSessionProgress(sessionId: string): ProgressUpdate | null;
    /**
     * Check if all sessions in a group are waiting (potential deadlock)
     */
    checkForDeadlock(groupId: string): boolean;
    /**
     * Clear progress data for a group
     */
    clearGroupProgress(groupId: string): void;
    /**
     * Track step duration for time estimation
     */
    private trackStepDuration;
    /**
     * Estimate time remaining for a group
     */
    private estimateTimeRemaining;
    /**
     * Check if a group is complete and emit event
     */
    private checkGroupCompletion;
    /**
     * Get formatted progress display
     */
    formatProgressDisplay(groupId: string): string;
    /**
     * Create a text progress bar
     */
    private createProgressBar;
    /**
     * Set error handler reference for coordinated cleanup
     */
    setErrorHandler(errorHandler: ParallelErrorHandler): void;
    /**
     * Start the cleanup timer
     */
    private startCleanupTimer;
    /**
     * Perform cleanup of old data
     */
    private performCleanup;
    /**
     * Stop the cleanup timer (for cleanup)
     */
    stopCleanupTimer(): void;
    /**
     * Get memory usage statistics
     */
    getMemoryStats(): {
        sessionProgressCount: number;
        groupCount: number;
        stepDurationCount: number;
        completedGroupsAwaitingCleanup: number;
    };
    /**
     * Synchronized update to prevent race conditions
     */
    private synchronizedUpdate;
}
//# sourceMappingURL=ProgressCoordinator.d.ts.map