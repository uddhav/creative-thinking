/**
 * SessionTimeoutMonitor - Monitors session execution times and handles timeouts
 */
import { EventEmitter } from 'events';
import type { SessionManager } from '../../core/SessionManager.js';
import type { ProgressCoordinator } from './ProgressCoordinator.js';
/**
 * Timeout event data
 */
export interface TimeoutEvent {
    sessionId: string;
    groupId: string;
    technique: string;
    timeoutType: 'execution' | 'dependency' | 'progress';
    elapsed: number;
    threshold: number;
    timestamp: number;
}
/**
 * Monitors session timeouts and handles timeout events
 */
export declare class SessionTimeoutMonitor extends EventEmitter {
    private sessionManager;
    private progressCoordinator;
    private sessionTrackers;
    private timeoutConfig;
    private monitoringInterval?;
    private readonly MONITOR_INTERVAL;
    constructor(sessionManager: SessionManager, progressCoordinator: ProgressCoordinator);
    /**
     * Start monitoring a session
     */
    startMonitoringSession(sessionId: string, groupId: string, estimatedTime: 'quick' | 'thorough' | 'comprehensive'): void;
    /**
     * Update session to waiting state
     */
    setSessionWaiting(sessionId: string, dependencies: string[]): void;
    /**
     * Stop monitoring a session
     */
    stopMonitoringSession(sessionId: string): void;
    /**
     * Handle execution timeout
     */
    private handleExecutionTimeout;
    /**
     * Handle dependency timeout
     */
    private handleDependencyTimeout;
    /**
     * Check if progress is stale
     */
    private checkProgressStale;
    /**
     * Setup progress listener
     */
    private setupProgressListener;
    /**
     * Start monitoring loop
     */
    private startMonitoring;
    /**
     * Check all sessions for issues
     */
    private checkAllSessions;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Get monitoring statistics
     */
    getMonitoringStats(): {
        activeSessions: number;
        waitingSessions: number;
        averageElapsedTime: number;
        longestRunningSession?: {
            sessionId: string;
            elapsed: number;
            technique: string;
        };
    };
    /**
     * Extend timeout for a session
     */
    extendTimeout(sessionId: string, additionalMs: number): void;
}
//# sourceMappingURL=SessionTimeoutMonitor.d.ts.map