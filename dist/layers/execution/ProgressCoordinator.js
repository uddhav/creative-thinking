/**
 * ProgressCoordinator - Manages and tracks progress across parallel sessions
 * Provides real-time progress updates and coordination for parallel execution
 */
import { EventEmitter } from 'events';
import { TimeoutConfigManager } from '../../config/timeouts.js';
/**
 * Coordinates progress tracking across parallel sessions
 */
export class ProgressCoordinator extends EventEmitter {
    sessionManager;
    // Track progress for each session
    sessionProgress = new Map();
    // Track group start times for time estimation
    groupStartTimes = new Map();
    // Track average step durations for time estimation
    stepDurations = new Map();
    // Track group completion times for cleanup
    groupCompletionTimes = new Map();
    // Timeout configuration
    timeoutConfig;
    // Cleanup timer
    cleanupTimer;
    // Mutex for concurrent access control
    updateLocks = new Map();
    // Reference to error handler for cleanup coordination
    errorHandler;
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.timeoutConfig = TimeoutConfigManager.getInstance();
        this.startCleanupTimer();
    }
    /**
     * Report progress for a session
     */
    async reportProgress(update) {
        // Use synchronized update to prevent race conditions
        await this.synchronizedUpdate(update.sessionId, () => {
            // Store the update
            this.sessionProgress.set(update.sessionId, update);
            // Track step duration if completed
            if (update.status === 'completed' || update.status === 'in_progress') {
                this.trackStepDuration(update.sessionId, update.timestamp);
            }
            // Emit progress event
            this.emit('progress', update);
            this.emit(`progress:${update.groupId}`, update);
            this.emit(`progress:${update.sessionId}`, update);
        });
        // Check if group is complete (outside the lock to prevent deadlock)
        this.checkGroupCompletion(update.groupId);
    }
    /**
     * Get progress summary for a group
     */
    getGroupProgress(groupId) {
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group)
            return null;
        const summary = {
            groupId,
            totalSessions: group.sessionIds.length,
            completedSessions: 0,
            failedSessions: 0,
            inProgressSessions: 0,
            waitingSessions: 0,
            overallProgress: 0,
            sessionProgress: new Map(),
        };
        let totalSteps = 0;
        let completedSteps = 0;
        // Calculate progress for each session
        for (const sessionId of group.sessionIds) {
            const progress = this.sessionProgress.get(sessionId);
            const session = this.sessionManager.getSession(sessionId);
            if (!session)
                continue;
            const status = progress?.status || 'waiting';
            const currentStep = progress?.currentStep || 0;
            const sessionTotalSteps = progress?.totalSteps || 1;
            // Update counters
            switch (status) {
                case 'completed':
                    summary.completedSessions++;
                    break;
                case 'failed':
                    summary.failedSessions++;
                    break;
                case 'in_progress':
                case 'started':
                    summary.inProgressSessions++;
                    break;
                case 'waiting':
                    summary.waitingSessions++;
                    break;
            }
            // Track individual session progress
            summary.sessionProgress.set(sessionId, {
                technique: session.technique,
                currentStep,
                totalSteps: sessionTotalSteps,
                status,
            });
            // Calculate overall progress
            totalSteps += sessionTotalSteps;
            completedSteps += status === 'completed' ? sessionTotalSteps : currentStep;
        }
        // Calculate overall progress percentage
        summary.overallProgress = totalSteps > 0 ? completedSteps / totalSteps : 0;
        // Estimate time remaining
        summary.estimatedTimeRemaining = this.estimateTimeRemaining(groupId, summary);
        return summary;
    }
    /**
     * Start tracking a group
     */
    startGroup(groupId) {
        this.groupStartTimes.set(groupId, Date.now());
        this.emit('group:started', { groupId, timestamp: Date.now() });
    }
    /**
     * Get real-time progress stream for a group
     */
    streamGroupProgress(groupId, callback) {
        const handler = () => {
            const summary = this.getGroupProgress(groupId);
            if (summary) {
                callback(summary);
            }
        };
        // Send initial progress
        handler();
        // Subscribe to updates
        this.on(`progress:${groupId}`, handler);
        // Return unsubscribe function
        return () => {
            this.off(`progress:${groupId}`, handler);
        };
    }
    /**
     * Get progress for a specific session
     */
    getSessionProgress(sessionId) {
        return this.sessionProgress.get(sessionId) || null;
    }
    /**
     * Check if all sessions in a group are waiting (potential deadlock)
     */
    checkForDeadlock(groupId) {
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group)
            return false;
        let waitingCount = 0;
        let activeCount = 0;
        for (const sessionId of group.sessionIds) {
            const progress = this.sessionProgress.get(sessionId);
            if (progress?.status === 'waiting') {
                waitingCount++;
            }
            else if (progress?.status === 'in_progress' || progress?.status === 'started') {
                activeCount++;
            }
        }
        // Deadlock if all non-completed sessions are waiting
        const nonCompletedCount = group.sessionIds.length - group.completedSessions.size;
        return waitingCount === nonCompletedCount && activeCount === 0;
    }
    /**
     * Clear progress data for a group
     */
    clearGroupProgress(groupId) {
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group)
            return;
        // Clear session progress
        for (const sessionId of group.sessionIds) {
            this.sessionProgress.delete(sessionId);
            this.stepDurations.delete(sessionId);
            // Remove session-specific listeners
            this.removeAllListeners(`progress:${sessionId}`);
        }
        // Clear group data
        this.groupStartTimes.delete(groupId);
        // Remove group listeners
        this.removeAllListeners(`progress:${groupId}`);
        this.removeAllListeners(`group:${groupId}`);
    }
    /**
     * Track step duration for time estimation
     */
    trackStepDuration(sessionId, timestamp) {
        const durations = this.stepDurations.get(sessionId) || [];
        if (durations.length > 0) {
            const lastTimestamp = durations[durations.length - 1];
            const duration = timestamp - lastTimestamp;
            // Store duration (keep last 10 for average)
            durations.push(duration);
            if (durations.length > 10) {
                durations.shift();
            }
        }
        else {
            // First step
            durations.push(timestamp);
        }
        this.stepDurations.set(sessionId, durations);
    }
    /**
     * Estimate time remaining for a group
     */
    estimateTimeRemaining(groupId, summary) {
        const startTime = this.groupStartTimes.get(groupId);
        if (!startTime || summary.overallProgress === 0)
            return undefined;
        const elapsedTime = Date.now() - startTime;
        const estimatedTotalTime = elapsedTime / summary.overallProgress;
        const remainingTime = estimatedTotalTime - elapsedTime;
        return Math.max(0, Math.round(remainingTime));
    }
    /**
     * Check if a group is complete and emit event
     */
    checkGroupCompletion(groupId) {
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group)
            return;
        const summary = this.getGroupProgress(groupId);
        if (!summary)
            return;
        // Check if all sessions are either completed or failed
        const totalFinished = summary.completedSessions + summary.failedSessions;
        if (totalFinished === summary.totalSessions) {
            // Group is complete
            const endTime = Date.now();
            const startTime = this.groupStartTimes.get(groupId) || endTime;
            const duration = endTime - startTime;
            this.emit('group:completed', {
                groupId,
                summary,
                duration,
                success: summary.failedSessions === 0,
                timestamp: endTime,
            });
            // Update group status
            this.sessionManager.updateParallelGroupStatus(groupId, summary.failedSessions === 0 ? 'completed' : 'partial_success');
            // Mark group for cleanup
            this.groupCompletionTimes.set(groupId, endTime);
        }
    }
    /**
     * Get formatted progress display
     */
    formatProgressDisplay(groupId) {
        const summary = this.getGroupProgress(groupId);
        if (!summary)
            return 'No progress data available';
        const progressBar = this.createProgressBar(summary.overallProgress);
        const timeRemaining = summary.estimatedTimeRemaining
            ? `~${Math.ceil(summary.estimatedTimeRemaining / 1000)}s remaining`
            : '';
        let display = `Group Progress: ${progressBar} ${Math.round(summary.overallProgress * 100)}% ${timeRemaining}\n`;
        display += `Sessions: ${summary.completedSessions}/${summary.totalSessions} completed`;
        if (summary.failedSessions > 0) {
            display += ` (${summary.failedSessions} failed)`;
        }
        if (summary.waitingSessions > 0) {
            display += ` (${summary.waitingSessions} waiting)`;
        }
        return display;
    }
    /**
     * Create a text progress bar
     */
    createProgressBar(progress, width = 20) {
        const filled = Math.round(progress * width);
        const empty = width - filled;
        return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
    }
    /**
     * Set error handler reference for coordinated cleanup
     */
    setErrorHandler(errorHandler) {
        this.errorHandler = errorHandler;
    }
    /**
     * Start the cleanup timer
     */
    startCleanupTimer() {
        const config = this.timeoutConfig.getConfig();
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, config.memoryCleanup.interval);
    }
    /**
     * Perform cleanup of old data
     */
    performCleanup() {
        const now = Date.now();
        const config = this.timeoutConfig.getConfig();
        const cutoffTime = now - config.memoryCleanup.retentionPeriod;
        // Clean up completed groups
        const groupsToClean = [];
        for (const [groupId, completionTime] of this.groupCompletionTimes) {
            if (completionTime < cutoffTime) {
                groupsToClean.push(groupId);
            }
        }
        // Clean up each group
        for (const groupId of groupsToClean) {
            this.clearGroupProgress(groupId);
            this.groupCompletionTimes.delete(groupId);
        }
        // Also clean up stale retry attempts in error handler
        if (this.errorHandler) {
            this.errorHandler.cleanupStaleRetryAttempts();
        }
    }
    /**
     * Stop the cleanup timer (for cleanup)
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
    }
    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        return {
            sessionProgressCount: this.sessionProgress.size,
            groupCount: this.groupStartTimes.size,
            stepDurationCount: this.stepDurations.size,
            completedGroupsAwaitingCleanup: this.groupCompletionTimes.size,
        };
    }
    /**
     * Synchronized update to prevent race conditions
     */
    async synchronizedUpdate(key, updateFn) {
        // Get or create a lock for this key
        const existingLock = this.updateLocks.get(key);
        // Create a new promise that waits for the existing lock (if any) and then executes
        const newLock = (async () => {
            if (existingLock) {
                try {
                    await existingLock;
                }
                catch {
                    // Ignore errors from previous operations
                }
            }
            updateFn();
        })();
        // Store the new lock
        this.updateLocks.set(key, newLock);
        // Clean up the lock after completion
        try {
            await newLock;
        }
        finally {
            // Only remove if it's still our lock
            if (this.updateLocks.get(key) === newLock) {
                this.updateLocks.delete(key);
            }
        }
    }
}
//# sourceMappingURL=ProgressCoordinator.js.map