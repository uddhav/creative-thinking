/**
 * SessionCleaner - Handles session cleanup and memory management
 * Extracted from SessionManager to improve maintainability
 */

import type { SessionData } from '../../types/index.js';
import type { SessionConfig } from '../SessionManager.js';
import type { MemoryManager } from '../MemoryManager.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

export class SessionCleaner {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly PLAN_TTL = 4 * 60 * 60 * 1000; // 4 hours for plans

  constructor(
    private sessions: Map<string, SessionData>,
    private plans: Map<string, PlanThinkingSessionOutput>,
    private config: SessionConfig,
    private memoryManager: MemoryManager,
    private touchSession: (sessionId: string) => void
  ) {}

  /**
   * Start the session cleanup interval
   */
  startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up old sessions based on TTL and memory constraints
   */
  cleanupOldSessions(): void {
    const now = Date.now();
    const sessionsToDelete: string[] = [];

    // First pass: identify expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      const lastAccessed = session.lastActivityTime || session.startTime || Date.now();
      if (now - lastAccessed > this.config.sessionTTL) {
        sessionsToDelete.push(sessionId);
      }
    }

    // Delete expired sessions
    for (const sessionId of sessionsToDelete) {
      this.sessions.delete(sessionId);
      console.error(`[Session Cleanup] Removed expired session: ${sessionId}`);
    }

    // Clean up old plans (more aggressive cleanup for plans)
    const plansToDelete: string[] = [];
    for (const [planId, plan] of this.plans.entries()) {
      if (!plan.createdAt || now - plan.createdAt > this.PLAN_TTL) {
        plansToDelete.push(planId);
      }
    }

    for (const planId of plansToDelete) {
      this.plans.delete(planId);
      console.error(`[Session Cleanup] Removed expired plan: ${planId}`);
    }

    // Second pass: check memory pressure and evict if needed
    if (this.sessions.size >= this.config.maxSessions) {
      this.evictOldestSessions();
    }

    // Log memory metrics if monitoring is enabled
    if (this.config.enableMemoryMonitoring) {
      this.logMemoryMetrics();
    }
  }

  /**
   * Evict oldest sessions when memory pressure is high
   */
  private evictOldestSessions(): void {
    // Evict enough sessions to get back under the limit
    const sessionsToEvict = this.sessions.size - this.config.maxSessions + 1;

    if (sessionsToEvict <= 0) return;

    // Sort sessions by last accessed time
    const sortedSessions = Array.from(this.sessions.entries()).sort((a, b) => {
      const aTime = a[1].lastActivityTime || a[1].startTime || Date.now();
      const bTime = b[1].lastActivityTime || b[1].startTime || Date.now();
      return aTime - bTime;
    });

    // Evict oldest sessions
    for (let i = 0; i < sessionsToEvict && i < sortedSessions.length; i++) {
      const [sessionId] = sortedSessions[i];
      this.sessions.delete(sessionId);
      console.error(`[Session Eviction] Evicted session ${sessionId} (LRU)`);
    }
  }

  /**
   * Log memory metrics for monitoring
   */
  public logMemoryMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const externalMB = Math.round(memoryUsage.external / 1024 / 1024);
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);

    // Calculate session memory usage
    let totalSessionSize = 0;
    for (const session of this.sessions.values()) {
      totalSessionSize += this.calculateSessionSize(session);
    }
    const sessionSizeKB = Math.round(totalSessionSize / 1024);
    const avgSessionSizeKB =
      this.sessions.size > 0 ? Math.round(totalSessionSize / this.sessions.size / 1024) : 0;

    // Create structured metrics object
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        external: `${externalMB}MB`,
        rss: `${rssMB}MB`,
      },
      sessions: {
        count: this.sessions.size,
        estimatedSize: `${sessionSizeKB}KB`,
        averageSize: `${avgSessionSizeKB}KB`,
      },
      plans: {
        count: this.plans.size,
      },
    };

    console.error('[Memory Metrics]', metrics);

    // Trigger garbage collection if memory pressure is high
    const heapUsagePercent = heapUsedMB / heapTotalMB;
    if (heapUsagePercent > 0.8) {
      console.error(
        `[Memory Warning] High heap usage: ${Math.round(heapUsagePercent * 100)}%, considering GC`
      );
      // Trigger background GC if available
      this.memoryManager.triggerGCIfNeeded(true);
    }
  }

  /**
   * Calculate approximate size of a session in bytes
   */
  private calculateSessionSize(session: SessionData): number {
    try {
      // Rough estimation based on JSON stringification
      return JSON.stringify(session).length * 2; // UTF-16 characters
    } catch {
      return 0;
    }
  }

  /**
   * Get session size for a specific session
   */
  getSessionSize(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session ? this.calculateSessionSize(session) : 0;
  }

  /**
   * Get total memory usage across all sessions
   */
  getTotalMemoryUsage(): number {
    let total = 0;
    for (const session of this.sessions.values()) {
      total += this.calculateSessionSize(session);
    }
    return total;
  }
}
