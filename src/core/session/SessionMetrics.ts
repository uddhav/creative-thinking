/**
 * SessionMetrics - Handles session metrics and memory statistics
 * Extracted from SessionManager to improve maintainability
 */

import type { SessionData } from '../../types/index.js';
import type { SessionConfig } from '../SessionManager.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

export interface MemoryStats {
  sessionCount: number;
  planCount: number;
  totalMemoryUsage: number;
  averageSessionSize: number;
  largestSessionSize: number;
  memoryUsageBySession: Map<string, number>;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export class SessionMetrics {
  constructor(
    private sessions: Map<string, SessionData>,
    private plans: Map<string, PlanThinkingSessionOutput>,
    private config: SessionConfig
  ) {}

  /**
   * Get the number of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get the number of stored plans
   */
  getPlanCount(): number {
    return this.plans.size;
  }

  /**
   * Calculate the size of a specific session
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

  /**
   * Get comprehensive memory statistics
   */
  getMemoryStats(): MemoryStats {
    const memoryUsageBySession = new Map<string, number>();
    let totalMemoryUsage = 0;
    let largestSessionSize = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const size = this.calculateSessionSize(session);
      memoryUsageBySession.set(sessionId, size);
      totalMemoryUsage += size;
      largestSessionSize = Math.max(largestSessionSize, size);
    }

    const memoryUsage = process.memoryUsage();

    return {
      sessionCount: this.sessions.size,
      planCount: this.plans.size,
      totalMemoryUsage,
      averageSessionSize: this.sessions.size > 0 ? totalMemoryUsage / this.sessions.size : 0,
      largestSessionSize,
      memoryUsageBySession,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
    };
  }

  /**
   * Get session configuration
   */
  getConfig(): SessionConfig {
    return { ...this.config };
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
   * Check if session size exceeds configured limit
   */
  isSessionTooLarge(sessionId: string): boolean {
    const size = this.getSessionSize(sessionId);
    return size > this.config.maxSessionSize;
  }

  /**
   * Get sessions sorted by size (largest first)
   */
  getSessionsBySize(): Array<{ sessionId: string; size: number }> {
    const sessionSizes: Array<{ sessionId: string; size: number }> = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      sessionSizes.push({
        sessionId,
        size: this.calculateSessionSize(session),
      });
    }

    return sessionSizes.sort((a, b) => b.size - a.size);
  }

  /**
   * Get sessions sorted by age (oldest first)
   */
  getSessionsByAge(): Array<{ sessionId: string; age: number }> {
    const now = Date.now();
    const sessionAges: Array<{ sessionId: string; age: number }> = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastAccessed = session.lastActivityTime || session.startTime || Date.now();
      sessionAges.push({
        sessionId,
        age: now - lastAccessed,
      });
    }

    return sessionAges.sort((a, b) => b.age - a.age);
  }

  /**
   * Check if memory pressure is high
   */
  isMemoryPressureHigh(): boolean {
    const stats = this.getMemoryStats();
    const heapUsagePercent = stats.heapUsed / stats.heapTotal;
    return heapUsagePercent > 0.8 || this.sessions.size > this.config.maxSessions;
  }
}
