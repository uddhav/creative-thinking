/**
 * ParallelExecutionContext - Singleton manager for parallel execution components
 * Provides lazy initialization and caching of parallel execution infrastructure
 */
import type { SessionManager } from '../../core/SessionManager.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
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
export declare class ParallelExecutionContext {
    private sessionManager;
    private visualFormatter;
    private static instance;
    private sessionSynchronizer;
    private progressCoordinator;
    private parallelErrorHandler;
    private parallelStepExecutor;
    private convergenceExecutor;
    private sessionTimeoutMonitor;
    private executionMetrics;
    private constructor();
    /**
     * Get or create the singleton instance
     */
    static getInstance(sessionManager: SessionManager, visualFormatter: VisualFormatter): ParallelExecutionContext;
    /**
     * Reset the singleton instance (useful for testing)
     */
    static reset(): void;
    /**
     * Get SessionSynchronizer (lazy initialization)
     */
    getSessionSynchronizer(): SessionSynchronizer;
    /**
     * Get ProgressCoordinator (lazy initialization)
     */
    getProgressCoordinator(): ProgressCoordinator;
    /**
     * Get ParallelErrorHandler (lazy initialization)
     */
    getParallelErrorHandler(): ParallelErrorHandler;
    /**
     * Get ParallelStepExecutor (lazy initialization)
     */
    getParallelStepExecutor(): ParallelStepExecutor;
    /**
     * Get ConvergenceExecutor (lazy initialization)
     */
    getConvergenceExecutor(): ConvergenceExecutor;
    /**
     * Get SessionTimeoutMonitor (lazy initialization)
     */
    getSessionTimeoutMonitor(): SessionTimeoutMonitor;
    /**
     * Get ParallelExecutionMetrics (lazy initialization)
     */
    getExecutionMetrics(): ParallelExecutionMetrics;
    /**
     * Check if parallel execution is needed for this input
     */
    isParallelExecutionNeeded(technique: string, sessionId?: string): boolean;
    /**
     * Cleanup resources
     */
    private cleanup;
}
//# sourceMappingURL=ParallelExecutionContext.d.ts.map