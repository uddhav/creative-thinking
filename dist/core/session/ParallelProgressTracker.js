/**
 * ParallelProgressTracker - Tracks progress across parallel executions
 * Provides real-time progress monitoring and time estimation
 */
import { EventEmitter } from 'events';
/**
 * Tracks and reports progress for parallel execution groups
 */
export class ParallelProgressTracker extends EventEmitter {
    groupProgress = new Map();
    sessionToGroup = new Map();
    progressHistory = new Map();
    /**
     * Initialize progress tracking for a group
     */
    initializeGroupProgress(group) {
        const progress = {
            groupId: group.groupId,
            totalSteps: group.metadata.totalSteps,
            completedSteps: 0,
            sessionProgress: new Map(),
            startTime: Date.now(),
            estimatedCompletion: this.estimateCompletion(group),
            status: 'in_progress',
        };
        // Initialize per-session progress
        for (const sessionId of group.sessionIds) {
            progress.sessionProgress.set(sessionId, {
                sessionId,
                totalSteps: 0, // Will be updated when session starts
                completedSteps: 0,
                status: 'pending',
            });
            this.sessionToGroup.set(sessionId, group.groupId);
        }
        this.groupProgress.set(group.groupId, progress);
        this.progressHistory.set(group.groupId, []);
        // Emit initialization event
        this.emit('group:initialized', {
            groupId: group.groupId,
            totalSteps: group.metadata.totalSteps,
        });
    }
    /**
     * Update session progress
     */
    updateSessionProgress(sessionId, completedSteps, totalSteps) {
        // Find group containing this session
        const groupId = this.findGroupForSession(sessionId);
        if (!groupId) {
            console.error(`[ProgressTracker] No group found for session ${sessionId}`);
            return;
        }
        const groupProgress = this.groupProgress.get(groupId);
        if (!groupProgress)
            return;
        const sessionProgress = groupProgress.sessionProgress.get(sessionId);
        if (sessionProgress) {
            // Update session progress
            const previousCompleted = sessionProgress.completedSteps;
            sessionProgress.completedSteps = completedSteps;
            sessionProgress.totalSteps = totalSteps;
            // Update status based on progress
            if (completedSteps === 0 && sessionProgress.status === 'pending') {
                sessionProgress.status = 'in_progress';
                sessionProgress.startTime = Date.now();
            }
            else if (completedSteps >= totalSteps) {
                sessionProgress.status = 'completed';
            }
            else if (sessionProgress.status === 'pending') {
                sessionProgress.status = 'in_progress';
            }
            // Update estimated completion for session
            if (sessionProgress.status === 'in_progress' && sessionProgress.startTime) {
                sessionProgress.estimatedCompletion = this.estimateSessionCompletion(sessionProgress, completedSteps, totalSteps);
            }
            // Update group totals
            this.recalculateGroupProgress(groupProgress);
            // Track progress history
            this.trackProgressHistory(groupId, groupProgress);
            // Emit progress update event
            this.emit('progress:update', {
                groupId,
                sessionId,
                sessionProgress: {
                    completed: completedSteps,
                    total: totalSteps,
                    percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
                },
                groupProgress: this.getProgressSummary(groupId),
            });
            // Check for significant milestones
            this.checkMilestones(groupId, groupProgress, previousCompleted, completedSteps);
        }
    }
    /**
     * Get group progress
     */
    getGroupProgress(groupId) {
        return this.groupProgress.get(groupId);
    }
    /**
     * Get progress summary for a group
     */
    getProgressSummary(groupId) {
        const progress = this.groupProgress.get(groupId);
        if (!progress) {
            return { percentage: 0, status: 'unknown' };
        }
        const percentage = progress.totalSteps > 0 ? (progress.completedSteps / progress.totalSteps) * 100 : 0;
        const sessionStatuses = Array.from(progress.sessionProgress.values());
        const activeSessions = sessionStatuses.filter(s => s.status === 'in_progress').length;
        const completedSessions = sessionStatuses.filter(s => s.status === 'completed').length;
        return {
            percentage: Math.round(percentage),
            status: progress.status,
            activeSessions,
            completedSessions,
            estimatedTimeRemaining: this.estimateTimeRemaining(progress),
        };
    }
    /**
     * Mark session as failed
     */
    markSessionFailed(sessionId, error) {
        const groupId = this.findGroupForSession(sessionId);
        if (!groupId)
            return;
        const groupProgress = this.groupProgress.get(groupId);
        if (!groupProgress)
            return;
        const sessionProgress = groupProgress.sessionProgress.get(sessionId);
        if (sessionProgress) {
            sessionProgress.status = 'failed';
            // Recalculate group progress
            this.recalculateGroupProgress(groupProgress);
            // Emit failure event
            this.emit('session:failed', {
                groupId,
                sessionId,
                error,
            });
            // Check if group should fail
            this.checkGroupFailure(groupId, groupProgress);
        }
    }
    /**
     * Mark group as completed
     */
    markGroupCompleted(groupId) {
        const progress = this.groupProgress.get(groupId);
        if (progress) {
            progress.status = 'completed';
            // Calculate final execution time
            const executionTime = Date.now() - progress.startTime;
            this.emit('group:completed', {
                groupId,
                executionTime,
                completedSteps: progress.completedSteps,
                totalSteps: progress.totalSteps,
            });
        }
    }
    /**
     * Get detailed progress report
     */
    getDetailedReport(groupId) {
        const progress = this.groupProgress.get(groupId);
        if (!progress)
            return undefined;
        const overall = this.getProgressSummary(groupId);
        const sessions = Array.from(progress.sessionProgress.values()).map(session => ({
            sessionId: session.sessionId,
            status: session.status,
            progress: session.totalSteps > 0 ? (session.completedSteps / session.totalSteps) * 100 : 0,
            estimatedCompletion: session.estimatedCompletion,
            executionTime: session.startTime ? Date.now() - session.startTime : undefined,
        }));
        const timeline = this.progressHistory.get(groupId) || [];
        // Calculate estimate variance if in progress
        let estimatedVsActual;
        if (progress.status === 'in_progress' && progress.estimatedCompletion) {
            const currentEstimate = this.estimateTimeRemaining(progress) + Date.now();
            estimatedVsActual = {
                originalEstimate: progress.estimatedCompletion,
                currentEstimate,
                variance: ((currentEstimate - progress.estimatedCompletion) / progress.estimatedCompletion) * 100,
            };
        }
        return {
            overall,
            sessions,
            timeline,
            estimatedVsActual,
        };
    }
    /**
     * Find group ID for a session
     */
    findGroupForSession(sessionId) {
        return this.sessionToGroup.get(sessionId);
    }
    /**
     * Recalculate group progress from session progress
     */
    recalculateGroupProgress(groupProgress) {
        let totalCompleted = 0;
        let allCompleted = true;
        let anyFailed = false;
        for (const sessionProgress of groupProgress.sessionProgress.values()) {
            totalCompleted += sessionProgress.completedSteps;
            if (sessionProgress.status !== 'completed') {
                allCompleted = false;
            }
            if (sessionProgress.status === 'failed') {
                anyFailed = true;
            }
        }
        groupProgress.completedSteps = totalCompleted;
        // Update group status
        if (allCompleted) {
            groupProgress.status = 'completed';
        }
        else if (anyFailed) {
            groupProgress.status = 'partial_success';
        }
        // Update estimated completion
        if (groupProgress.status === 'in_progress') {
            groupProgress.estimatedCompletion = this.recalculateEstimatedCompletion(groupProgress);
        }
    }
    /**
     * Estimate initial completion time for a group
     */
    estimateCompletion(group) {
        // Use metadata estimate if available
        if (group.metadata.estimatedCompletion) {
            return group.metadata.estimatedCompletion;
        }
        // Otherwise, rough estimate based on step count
        const avgTimePerStep = 1000; // 1 second per step (rough estimate)
        const parallelismFactor = 0.7; // Account for parallel execution efficiency
        const estimatedMs = group.metadata.totalSteps * avgTimePerStep * parallelismFactor;
        return Date.now() + estimatedMs;
    }
    /**
     * Estimate completion time for a session
     */
    estimateSessionCompletion(session, completed, total) {
        if (!session.startTime || completed === 0) {
            return Date.now() + 60000; // Default 1 minute
        }
        const elapsed = Date.now() - session.startTime;
        const ratePerStep = elapsed / completed;
        const remainingSteps = total - completed;
        const remainingTime = remainingSteps * ratePerStep;
        return Date.now() + remainingTime;
    }
    /**
     * Recalculate estimated completion based on current progress
     */
    recalculateEstimatedCompletion(progress) {
        const activeSessions = Array.from(progress.sessionProgress.values()).filter(s => s.status === 'in_progress');
        if (activeSessions.length === 0) {
            return progress.estimatedCompletion || Date.now();
        }
        // Find the session that will complete last
        let latestCompletion = 0;
        for (const session of activeSessions) {
            if (session.estimatedCompletion) {
                latestCompletion = Math.max(latestCompletion, session.estimatedCompletion);
            }
        }
        return latestCompletion || progress.estimatedCompletion || Date.now();
    }
    /**
     * Estimate time remaining for a group
     */
    estimateTimeRemaining(progress) {
        if (progress.status === 'completed')
            return 0;
        const now = Date.now();
        const estimated = progress.estimatedCompletion || now;
        return Math.max(0, estimated - now);
    }
    /**
     * Track progress history for visualization
     */
    trackProgressHistory(groupId, progress) {
        const history = this.progressHistory.get(groupId) || [];
        const percentage = progress.totalSteps > 0 ? (progress.completedSteps / progress.totalSteps) * 100 : 0;
        history.push({
            timestamp: Date.now(),
            progress: percentage,
        });
        // Keep only last 100 entries
        if (history.length > 100) {
            history.shift();
        }
        this.progressHistory.set(groupId, history);
    }
    /**
     * Check for progress milestones
     */
    checkMilestones(groupId, progress, previousCompleted, currentCompleted) {
        const previousPercentage = progress.totalSteps > 0 ? (previousCompleted / progress.totalSteps) * 100 : 0;
        const currentPercentage = progress.totalSteps > 0 ? (currentCompleted / progress.totalSteps) * 100 : 0;
        // Check 25% milestones
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
            if (previousPercentage < milestone && currentPercentage >= milestone) {
                this.emit('milestone:reached', {
                    groupId,
                    milestone,
                    timestamp: Date.now(),
                });
            }
        }
    }
    /**
     * Check if group should be marked as failed
     */
    checkGroupFailure(groupId, progress) {
        const sessions = Array.from(progress.sessionProgress.values());
        const failedCount = sessions.filter(s => s.status === 'failed').length;
        const totalCount = sessions.length;
        // If more than 50% failed, mark group as failed
        if (failedCount > totalCount * 0.5) {
            progress.status = 'failed';
            this.emit('group:failed', {
                groupId,
                failedSessions: failedCount,
                totalSessions: totalCount,
            });
        }
    }
    /**
     * Get statistics about progress tracking
     */
    getStats() {
        let activeGroups = 0;
        let completedGroups = 0;
        let totalProgress = 0;
        let totalCompletionRate = 0;
        let groupsWithProgress = 0;
        for (const progress of this.groupProgress.values()) {
            if (progress.status === 'in_progress') {
                activeGroups++;
            }
            else if (progress.status === 'completed') {
                completedGroups++;
            }
            if (progress.totalSteps > 0) {
                const percentage = (progress.completedSteps / progress.totalSteps) * 100;
                totalProgress += percentage;
                groupsWithProgress++;
                // Calculate completion rate (steps per second)
                const elapsed = Date.now() - progress.startTime;
                if (elapsed > 0) {
                    const rate = (progress.completedSteps / elapsed) * 1000;
                    totalCompletionRate += rate;
                }
            }
        }
        return {
            totalGroups: this.groupProgress.size,
            activeGroups,
            completedGroups,
            averageCompletionRate: groupsWithProgress > 0 ? totalCompletionRate / groupsWithProgress : 0,
            averageProgress: groupsWithProgress > 0 ? totalProgress / groupsWithProgress : 0,
        };
    }
    /**
     * Clear progress for a group
     */
    clearGroupProgress(groupId) {
        const progress = this.groupProgress.get(groupId);
        if (progress) {
            // Clear session mappings
            for (const sessionId of progress.sessionProgress.keys()) {
                this.sessionToGroup.delete(sessionId);
            }
        }
        this.groupProgress.delete(groupId);
        this.progressHistory.delete(groupId);
    }
    /**
     * Clear all progress tracking
     */
    clear() {
        this.groupProgress.clear();
        this.sessionToGroup.clear();
        this.progressHistory.clear();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=ParallelProgressTracker.js.map