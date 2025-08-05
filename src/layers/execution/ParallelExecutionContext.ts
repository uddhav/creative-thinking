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

/**
 * Singleton instance manager for parallel execution components
 */
export class ParallelExecutionContext {
  private static instance: ParallelExecutionContext | null = null;

  private sessionSynchronizer: SessionSynchronizer | null = null;
  private progressCoordinator: ProgressCoordinator | null = null;
  private parallelErrorHandler: ParallelErrorHandler | null = null;
  private parallelStepExecutor: ParallelStepExecutor | null = null;
  private convergenceExecutor: ConvergenceExecutor | null = null;

  private constructor(
    private sessionManager: SessionManager,
    private visualFormatter: VisualFormatter
  ) {}

  /**
   * Get or create the singleton instance
   */
  static getInstance(
    sessionManager: SessionManager,
    visualFormatter: VisualFormatter
  ): ParallelExecutionContext {
    if (!ParallelExecutionContext.instance) {
      ParallelExecutionContext.instance = new ParallelExecutionContext(
        sessionManager,
        visualFormatter
      );
    }
    return ParallelExecutionContext.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    if (ParallelExecutionContext.instance) {
      // Clean up any resources
      ParallelExecutionContext.instance.cleanup();
      ParallelExecutionContext.instance = null;
    }
  }

  /**
   * Get SessionSynchronizer (lazy initialization)
   */
  getSessionSynchronizer(): SessionSynchronizer {
    if (!this.sessionSynchronizer) {
      this.sessionSynchronizer = new SessionSynchronizer();
    }
    return this.sessionSynchronizer;
  }

  /**
   * Get ProgressCoordinator (lazy initialization)
   */
  getProgressCoordinator(): ProgressCoordinator {
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
  getParallelErrorHandler(): ParallelErrorHandler {
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
  getParallelStepExecutor(): ParallelStepExecutor {
    if (!this.parallelStepExecutor) {
      this.parallelStepExecutor = new ParallelStepExecutor(
        this.sessionManager,
        this.getSessionSynchronizer()
      );
    }
    return this.parallelStepExecutor;
  }

  /**
   * Get ConvergenceExecutor (lazy initialization)
   */
  getConvergenceExecutor(): ConvergenceExecutor {
    if (!this.convergenceExecutor) {
      this.convergenceExecutor = new ConvergenceExecutor(this.sessionManager, this.visualFormatter);
    }
    return this.convergenceExecutor;
  }

  /**
   * Check if parallel execution is needed for this input
   */
  isParallelExecutionNeeded(technique: string, sessionId?: string): boolean {
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
  private cleanup(): void {
    // Stop any timers
    if (this.progressCoordinator) {
      this.progressCoordinator.stopCleanupTimer();
    }

    // Clear references
    this.sessionSynchronizer = null;
    this.progressCoordinator = null;
    this.parallelErrorHandler = null;
    this.parallelStepExecutor = null;
    this.convergenceExecutor = null;
  }
}
