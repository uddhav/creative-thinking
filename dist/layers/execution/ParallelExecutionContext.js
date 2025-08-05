/**
 * ParallelExecutionContext - Singleton manager for parallel execution components
 * Provides lazy initialization and caching of parallel execution infrastructure
 */
import { SessionSynchronizer } from '../../core/session/SessionSynchronizer.js';
import { ProgressCoordinator } from './ProgressCoordinator.js';
import { ParallelErrorHandler } from './ParallelErrorHandler.js';
import { ParallelStepExecutor } from './ParallelStepExecutor.js';
import { ConvergenceExecutor } from './ConvergenceExecutor.js';
import { SessionTimeoutMonitor } from './SessionTimeoutMonitor.js';
import { ParallelExecutionMetrics } from './ParallelExecutionMetrics.js';
/**
 * Singleton instance manager for parallel execution components
 */
export class ParallelExecutionContext {
    sessionManager;
    visualFormatter;
    static instance = null;
    sessionSynchronizer = null;
    progressCoordinator = null;
    parallelErrorHandler = null;
    parallelStepExecutor = null;
    convergenceExecutor = null;
    sessionTimeoutMonitor = null;
    executionMetrics = null;
    constructor(sessionManager, visualFormatter) {
        this.sessionManager = sessionManager;
        this.visualFormatter = visualFormatter;
        // Set this context on the session manager for metrics integration
        this.sessionManager.setParallelContext(this);
    }
    /**
     * Get or create the singleton instance
     */
    static getInstance(sessionManager, visualFormatter) {
        if (!ParallelExecutionContext.instance) {
            ParallelExecutionContext.instance = new ParallelExecutionContext(sessionManager, visualFormatter);
        }
        return ParallelExecutionContext.instance;
    }
    /**
     * Reset the singleton instance (useful for testing)
     */
    static reset() {
        if (ParallelExecutionContext.instance) {
            // Clean up any resources
            ParallelExecutionContext.instance.cleanup();
            ParallelExecutionContext.instance = null;
        }
    }
    /**
     * Get SessionSynchronizer (lazy initialization)
     */
    getSessionSynchronizer() {
        if (!this.sessionSynchronizer) {
            this.sessionSynchronizer = new SessionSynchronizer();
        }
        return this.sessionSynchronizer;
    }
    /**
     * Get ProgressCoordinator (lazy initialization)
     */
    getProgressCoordinator() {
        if (!this.progressCoordinator) {
            this.progressCoordinator = new ProgressCoordinator(this.sessionManager);
            // Wire up error handler reference for coordinated cleanup
            if (this.parallelErrorHandler) {
                this.progressCoordinator.setErrorHandler(this.parallelErrorHandler);
            }
        }
        return this.progressCoordinator;
    }
    /**
     * Get ParallelErrorHandler (lazy initialization)
     */
    getParallelErrorHandler() {
        if (!this.parallelErrorHandler) {
            this.parallelErrorHandler = new ParallelErrorHandler(this.sessionManager);
            // Wire up to progress coordinator if it exists
            if (this.progressCoordinator) {
                this.progressCoordinator.setErrorHandler(this.parallelErrorHandler);
            }
        }
        return this.parallelErrorHandler;
    }
    /**
     * Get ParallelStepExecutor (lazy initialization)
     */
    getParallelStepExecutor() {
        if (!this.parallelStepExecutor) {
            this.parallelStepExecutor = new ParallelStepExecutor(this.sessionManager, this.getSessionSynchronizer(), this.getSessionTimeoutMonitor(), this.getExecutionMetrics());
        }
        return this.parallelStepExecutor;
    }
    /**
     * Get ConvergenceExecutor (lazy initialization)
     */
    getConvergenceExecutor() {
        if (!this.convergenceExecutor) {
            this.convergenceExecutor = new ConvergenceExecutor(this.sessionManager, this.visualFormatter);
        }
        return this.convergenceExecutor;
    }
    /**
     * Get SessionTimeoutMonitor (lazy initialization)
     */
    getSessionTimeoutMonitor() {
        if (!this.sessionTimeoutMonitor) {
            this.sessionTimeoutMonitor = new SessionTimeoutMonitor(this.sessionManager, this.getProgressCoordinator());
        }
        return this.sessionTimeoutMonitor;
    }
    /**
     * Get ParallelExecutionMetrics (lazy initialization)
     */
    getExecutionMetrics() {
        if (!this.executionMetrics) {
            this.executionMetrics = new ParallelExecutionMetrics();
        }
        return this.executionMetrics;
    }
    /**
     * Check if parallel execution is needed for this input
     */
    isParallelExecutionNeeded(technique, sessionId) {
        // Quick check without creating instances
        if (technique === 'convergence') {
            return true;
        }
        if (sessionId) {
            const session = this.sessionManager.getSession(sessionId);
            if (session?.parallelGroupId) {
                return true;
            }
        }
        return false;
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        // Stop any timers
        if (this.progressCoordinator) {
            this.progressCoordinator.stopCleanupTimer();
        }
        // Stop timeout monitoring
        if (this.sessionTimeoutMonitor) {
            this.sessionTimeoutMonitor.stopMonitoring();
        }
        // Clear references
        this.sessionSynchronizer = null;
        this.progressCoordinator = null;
        this.parallelErrorHandler = null;
        this.parallelStepExecutor = null;
        this.convergenceExecutor = null;
        this.sessionTimeoutMonitor = null;
        this.executionMetrics = null;
    }
}
//# sourceMappingURL=ParallelExecutionContext.js.map