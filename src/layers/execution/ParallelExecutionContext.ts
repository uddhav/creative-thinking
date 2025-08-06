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
export class ParallelExecutionContext {
  private static instance: ParallelExecutionContext | null = null;

  private sessionSynchronizer: SessionSynchronizer | null = null;
  private progressCoordinator: ProgressCoordinator | null = null;
  private parallelErrorHandler: ParallelErrorHandler | null = null;
  private parallelStepExecutor: ParallelStepExecutor | null = null;
  private convergenceExecutor: ConvergenceExecutor | null = null;
  private sessionTimeoutMonitor: SessionTimeoutMonitor | null = null;
  private executionMetrics: ParallelExecutionMetrics | null = null;

  // Memory monitoring
  private memoryHighWaterMark: number = 0;
  private memoryWarningThreshold: number = 500 * 1024 * 1024; // 500MB
  private memoryCriticalThreshold: number = 1024 * 1024 * 1024; // 1GB

  private constructor(
    private sessionManager: SessionManager,
    private visualFormatter: VisualFormatter
  ) {
    // Set this context on the session manager for metrics integration
    this.sessionManager.setParallelContext(this);
  }

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
        this.getSessionSynchronizer(),
        this.getSessionTimeoutMonitor(),
        this.getExecutionMetrics()
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
   * Get SessionTimeoutMonitor (lazy initialization)
   */
  getSessionTimeoutMonitor(): SessionTimeoutMonitor {
    if (!this.sessionTimeoutMonitor) {
      this.sessionTimeoutMonitor = new SessionTimeoutMonitor(
        this.sessionManager,
        this.getProgressCoordinator()
      );
    }
    return this.sessionTimeoutMonitor;
  }

  /**
   * Get ParallelExecutionMetrics (lazy initialization)
   */
  getExecutionMetrics(): ParallelExecutionMetrics {
    if (!this.executionMetrics) {
      this.executionMetrics = new ParallelExecutionMetrics();
    }
    return this.executionMetrics;
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
   * Check memory pressure and determine if parallel execution should proceed
   */
  checkMemoryPressure(): {
    canProceed: boolean;
    memoryUsage: number;
    warning?: string;
  } {
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;

    // Update high water mark
    if (heapUsed > this.memoryHighWaterMark) {
      this.memoryHighWaterMark = heapUsed;
    }

    // Check critical threshold
    if (heapUsed > this.memoryCriticalThreshold) {
      return {
        canProceed: false,
        memoryUsage: heapUsed,
        warning: `Memory usage critical: ${Math.round(heapUsed / 1024 / 1024)}MB. Falling back to sequential execution.`,
      };
    }

    // Check warning threshold
    if (heapUsed > this.memoryWarningThreshold) {
      return {
        canProceed: true,
        memoryUsage: heapUsed,
        warning: `Memory usage high: ${Math.round(heapUsed / 1024 / 1024)}MB. Consider reducing parallel group size.`,
      };
    }

    return {
      canProceed: true,
      memoryUsage: heapUsed,
    };
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    current: number;
    highWaterMark: number;
    warningThreshold: number;
    criticalThreshold: number;
  } {
    return {
      current: process.memoryUsage().heapUsed,
      highWaterMark: this.memoryHighWaterMark,
      warningThreshold: this.memoryWarningThreshold,
      criticalThreshold: this.memoryCriticalThreshold,
    };
  }

  /**
   * Update memory thresholds (for configuration)
   */
  updateMemoryThresholds(warning: number, critical: number): void {
    this.memoryWarningThreshold = warning;
    this.memoryCriticalThreshold = critical;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
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
