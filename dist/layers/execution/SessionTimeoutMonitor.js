/**
 * SessionTimeoutMonitor - Monitors session execution times and handles timeouts
 */
import { EventEmitter } from 'events';
import { TimeoutConfigManager } from '../../config/timeouts.js';
/**
 * Monitors session timeouts and handles timeout events
 */
export class SessionTimeoutMonitor extends EventEmitter {
    sessionManager;
    progressCoordinator;
    sessionTrackers = new Map();
    timeoutConfig;
    monitoringInterval;
    MONITOR_INTERVAL = 1000; // Check every second
    constructor(sessionManager, progressCoordinator) {
        super();
        this.sessionManager = sessionManager;
        this.progressCoordinator = progressCoordinator;
        this.timeoutConfig = TimeoutConfigManager.getInstance();
        this.setupProgressListener();
        this.startMonitoring();
    }
    /**
     * Start monitoring a session
     */
    startMonitoringSession(sessionId, groupId, estimatedTime) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session)
            return;
        const config = this.timeoutConfig.getConfig();
        const timeoutMs = this.timeoutConfig.getSessionTimeout(estimatedTime);
        const tracker = {
            sessionId,
            groupId,
            technique: session.technique,
            startTime: Date.now(),
            lastProgressTime: Date.now(),
            timeoutMs,
            isWaiting: false,
        };
        // Set execution timeout
        tracker.timeoutTimer = setTimeout(() => {
            this.handleExecutionTimeout(sessionId);
        }, timeoutMs);
        // Set progress check timer
        tracker.progressTimer = setInterval(() => {
            this.checkProgressStale(sessionId);
        }, config.progressUpdate.staleThreshold);
        this.sessionTrackers.set(sessionId, tracker);
    }
    /**
     * Update session to waiting state
     */
    setSessionWaiting(sessionId, dependencies) {
        const tracker = this.sessionTrackers.get(sessionId);
        if (!tracker)
            return;
        tracker.isWaiting = true;
        tracker.dependencies = dependencies;
        // Clear execution timeout
        if (tracker.timeoutTimer) {
            clearTimeout(tracker.timeoutTimer);
        }
        // Set dependency wait timeout
        const config = this.timeoutConfig.getConfig();
        tracker.dependencyTimeoutMs = config.dependencyWait.default;
        tracker.timeoutTimer = setTimeout(() => {
            this.handleDependencyTimeout(sessionId);
        }, tracker.dependencyTimeoutMs);
    }
    /**
     * Stop monitoring a session
     */
    stopMonitoringSession(sessionId) {
        const tracker = this.sessionTrackers.get(sessionId);
        if (!tracker)
            return;
        // Clear timers
        if (tracker.timeoutTimer) {
            clearTimeout(tracker.timeoutTimer);
        }
        if (tracker.progressTimer) {
            clearInterval(tracker.progressTimer);
        }
        this.sessionTrackers.delete(sessionId);
    }
    /**
     * Handle execution timeout
     */
    handleExecutionTimeout(sessionId) {
        const tracker = this.sessionTrackers.get(sessionId);
        if (!tracker || tracker.isWaiting)
            return;
        const elapsed = Date.now() - tracker.startTime;
        const event = {
            sessionId,
            groupId: tracker.groupId,
            technique: tracker.technique,
            timeoutType: 'execution',
            elapsed,
            threshold: tracker.timeoutMs,
            timestamp: Date.now(),
        };
        this.emit('timeout', event);
        // Mark session as failed
        void this.progressCoordinator.reportProgress({
            groupId: tracker.groupId,
            sessionId,
            technique: tracker.technique,
            currentStep: 0,
            totalSteps: 0,
            status: 'failed',
            timestamp: Date.now(),
            metadata: {
                errorMessage: `Session timed out after ${Math.round(elapsed / 1000)}s`,
            },
        });
        this.stopMonitoringSession(sessionId);
    }
    /**
     * Handle dependency timeout
     */
    handleDependencyTimeout(sessionId) {
        const tracker = this.sessionTrackers.get(sessionId);
        if (!tracker || !tracker.isWaiting)
            return;
        const elapsed = Date.now() - tracker.lastProgressTime;
        const event = {
            sessionId,
            groupId: tracker.groupId,
            technique: tracker.technique,
            timeoutType: 'dependency',
            elapsed,
            threshold: tracker.dependencyTimeoutMs || 0,
            timestamp: Date.now(),
        };
        this.emit('timeout', event);
        // Attempt to proceed without dependencies
        this.emit('dependency-timeout', {
            sessionId,
            groupId: tracker.groupId,
            dependencies: tracker.dependencies,
            elapsed,
        });
        this.stopMonitoringSession(sessionId);
    }
    /**
     * Check if progress is stale
     */
    checkProgressStale(sessionId) {
        const tracker = this.sessionTrackers.get(sessionId);
        if (!tracker || tracker.isWaiting)
            return;
        const config = this.timeoutConfig.getConfig();
        const timeSinceLastProgress = Date.now() - tracker.lastProgressTime;
        if (timeSinceLastProgress > config.progressUpdate.staleThreshold) {
            const event = {
                sessionId,
                groupId: tracker.groupId,
                technique: tracker.technique,
                timeoutType: 'progress',
                elapsed: timeSinceLastProgress,
                threshold: config.progressUpdate.staleThreshold,
                timestamp: Date.now(),
            };
            this.emit('progress-stale', event);
        }
    }
    /**
     * Setup progress listener
     */
    setupProgressListener() {
        this.progressCoordinator.on('progress', (update) => {
            const tracker = this.sessionTrackers.get(update.sessionId);
            if (!tracker)
                return;
            // Update last progress time
            tracker.lastProgressTime = Date.now();
            // If session completed or failed, stop monitoring
            if (update.status === 'completed' || update.status === 'failed') {
                this.stopMonitoringSession(update.sessionId);
            }
            // If session is waiting, update to waiting state
            if (update.status === 'waiting' && !tracker.isWaiting) {
                this.setSessionWaiting(update.sessionId, update.metadata?.dependencies || []);
            }
        });
    }
    /**
     * Start monitoring loop
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.checkAllSessions();
        }, this.MONITOR_INTERVAL);
    }
    /**
     * Check all sessions for issues
     */
    checkAllSessions() {
        const now = Date.now();
        for (const [sessionId, tracker] of this.sessionTrackers) {
            // Check for long-running sessions
            const elapsed = now - tracker.startTime;
            if (elapsed > tracker.timeoutMs * 0.8 && !tracker.isWaiting) {
                // Emit warning at 80% of timeout
                this.emit('timeout-warning', {
                    sessionId,
                    groupId: tracker.groupId,
                    technique: tracker.technique,
                    elapsed,
                    threshold: tracker.timeoutMs,
                    percentComplete: (elapsed / tracker.timeoutMs) * 100,
                });
            }
        }
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        // Clear monitoring interval
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        // Clear all session trackers
        for (const sessionId of this.sessionTrackers.keys()) {
            this.stopMonitoringSession(sessionId);
        }
        this.sessionTrackers.clear();
    }
    /**
     * Get monitoring statistics
     */
    getMonitoringStats() {
        const now = Date.now();
        let totalElapsed = 0;
        let activeSessions = 0;
        let waitingSessions = 0;
        let longestRunning;
        for (const [sessionId, tracker] of this.sessionTrackers) {
            const elapsed = now - tracker.startTime;
            totalElapsed += elapsed;
            if (tracker.isWaiting) {
                waitingSessions++;
            }
            else {
                activeSessions++;
            }
            if (!longestRunning || elapsed > longestRunning.elapsed) {
                longestRunning = {
                    sessionId,
                    elapsed,
                    technique: tracker.technique,
                };
            }
        }
        return {
            activeSessions,
            waitingSessions,
            averageElapsedTime: this.sessionTrackers.size > 0 ? totalElapsed / this.sessionTrackers.size : 0,
            longestRunningSession: longestRunning,
        };
    }
    /**
     * Extend timeout for a session
     */
    extendTimeout(sessionId, additionalMs) {
        const tracker = this.sessionTrackers.get(sessionId);
        if (!tracker)
            return;
        // Clear existing timeout
        if (tracker.timeoutTimer) {
            clearTimeout(tracker.timeoutTimer);
        }
        // Set new timeout
        const newTimeout = tracker.timeoutMs + additionalMs;
        tracker.timeoutMs = newTimeout;
        const remainingTime = newTimeout - (Date.now() - tracker.startTime);
        if (remainingTime > 0) {
            tracker.timeoutTimer = setTimeout(() => {
                this.handleExecutionTimeout(sessionId);
            }, remainingTime);
        }
    }
}
//# sourceMappingURL=SessionTimeoutMonitor.js.map