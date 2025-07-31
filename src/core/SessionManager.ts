/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */

import type { SessionData, ThinkingOperationData } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import { createAdapter, getDefaultConfig } from '../persistence/factory.js';

export interface SessionConfig {
  maxSessions: number;
  maxSessionSize: number;
  sessionTTL: number;
  cleanupInterval: number;
  enableMemoryMonitoring: boolean;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private plans: Map<string, PlanThinkingSessionOutput> = new Map();
  private currentSessionId: string | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private persistenceAdapter: PersistenceAdapter | null = null;
  private readonly PLAN_TTL = 4 * 60 * 60 * 1000; // 4 hours for plans

  private config: SessionConfig = {
    maxSessions: parseInt(process.env.MAX_SESSIONS || '100', 10),
    maxSessionSize: parseInt(process.env.MAX_SESSION_SIZE || String(1024 * 1024), 10), // 1MB default
    sessionTTL: parseInt(process.env.SESSION_TTL || String(24 * 60 * 60 * 1000), 10), // 24 hours
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || String(60 * 60 * 1000), 10), // 1 hour
    enableMemoryMonitoring: process.env.ENABLE_MEMORY_MONITORING === 'true',
  };

  constructor() {
    this.startSessionCleanup();
    void this.initializePersistence();
  }

  private async initializePersistence(): Promise<void> {
    try {
      const persistenceType = (process.env.PERSISTENCE_TYPE || 'filesystem') as
        | 'filesystem'
        | 'memory';
      const config = getDefaultConfig(persistenceType);

      // Override with environment variables if provided
      if (process.env.PERSISTENCE_PATH) {
        config.options.path = process.env.PERSISTENCE_PATH;
      }

      this.persistenceAdapter = await createAdapter(config);
    } catch (error) {
      console.error('Failed to initialize persistence:', error);
      // Continue without persistence
    }
  }

  private startSessionCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Update session activity time
   */
  public touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityTime = Date.now();
    }
  }

  private cleanupOldSessions(): void {
    const now = Date.now();

    // Clean up expired sessions
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivityTime > this.config.sessionTTL) {
        this.sessions.delete(id);
        if (this.currentSessionId === id) {
          this.currentSessionId = null;
        }
      }
    }

    // Clean up expired plans
    for (const [planId, plan] of this.plans) {
      if (plan.createdAt && now - plan.createdAt > this.PLAN_TTL) {
        this.plans.delete(planId);
      }
    }

    // Check if eviction is needed
    if (this.sessions.size > this.config.maxSessions) {
      this.evictOldestSessions();
    }

    // Log memory metrics if monitoring is enabled
    if (this.config.enableMemoryMonitoring) {
      this.logMemoryMetrics();
    }
  }

  /**
   * Evict oldest sessions using LRU (Least Recently Used) strategy
   */
  private evictOldestSessions(): void {
    // Skip if we're within limits
    if (this.sessions.size <= this.config.maxSessions) {
      return;
    }

    // Sort sessions by last activity time (oldest first)
    const sessionList = Array.from(this.sessions.entries()).sort(
      (a, b) => a[1].lastActivityTime - b[1].lastActivityTime
    );

    // Calculate how many sessions to evict
    const sessionsToEvict = this.sessions.size - this.config.maxSessions;

    // Evict oldest sessions
    for (let i = 0; i < sessionsToEvict && i < sessionList.length; i++) {
      const [sessionId] = sessionList[i];
      this.sessions.delete(sessionId);

      // Update current session if it was evicted
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      if (this.config.enableMemoryMonitoring) {
        console.log(`[Session Eviction] Evicted session ${sessionId} (LRU)`);
      }
    }

    if (this.config.enableMemoryMonitoring) {
      console.log(
        `[Memory Management] Sessions after eviction: ${this.sessions.size}/${this.config.maxSessions}`
      );
    }
  }

  /**
   * Log memory usage metrics
   */
  private logMemoryMetrics(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    // Calculate approximate session memory usage
    let totalSessionSize = 0;
    for (const [_, session] of this.sessions) {
      // Rough estimate of session size
      totalSessionSize += JSON.stringify(session).length;
    }
    const sessionSizeKB = Math.round(totalSessionSize / 1024);
    const averageSizeKB =
      this.sessions.size > 0 ? Math.round(sessionSizeKB / this.sessions.size) : 0;

    // Log in the format expected by tests
    console.log('[Memory Metrics]', {
      timestamp: new Date().toISOString(),
      process: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${rssMB}MB`,
      },
      sessions: {
        count: this.sessions.size,
        estimatedSize: `${sessionSizeKB}KB`,
        averageSize: `${averageSizeKB}KB`,
      },
      plans: {
        count: this.plans.size,
      },
    });

    // Force garbage collection if available and memory usage is high
    if (typeof global !== 'undefined' && global.gc && heapUsedMB > heapTotalMB * 0.8) {
      console.log('[Memory Usage] Triggering garbage collection...');
      global.gc();
    }

    // Warning if memory usage is concerning
    if (heapUsedMB > 500) {
      console.warn('[Memory Warning] High memory usage detected');
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
    this.plans.clear();
  }

  // Session CRUD operations
  public createSession(sessionData: SessionData): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessions.set(sessionId, sessionData);
    this.currentSessionId = sessionId;

    // Check if eviction is needed after adding the new session
    if (this.sessions.size > this.config.maxSessions) {
      this.evictOldestSessions();
    }

    return sessionId;
  }

  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  public updateSession(sessionId: string, data: Partial<SessionData>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, data);
      this.touchSession(sessionId);
    }
  }

  public deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted && this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    return deleted;
  }

  public listSessions(): Array<[string, SessionData]> {
    return Array.from(this.sessions.entries());
  }

  // Plan management
  public savePlan(planId: string, plan: PlanThinkingSessionOutput): void {
    this.plans.set(planId, plan);
  }

  public storePlan(planId: string, plan: PlanThinkingSessionOutput): void {
    this.plans.set(planId, plan);

    // Clean up old plans after TTL
    setTimeout(() => {
      this.deletePlan(planId);
    }, this.PLAN_TTL);
  }

  public getPlan(planId: string): PlanThinkingSessionOutput | undefined {
    return this.plans.get(planId);
  }

  public deletePlan(planId: string): boolean {
    return this.plans.delete(planId);
  }

  // Current session management
  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  public setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  public setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  // Persistence operations
  public async saveSessionToPersistence(sessionId: string): Promise<void> {
    if (!this.persistenceAdapter) {
      throw new Error('Persistence not available');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Convert SessionData to SessionState for persistence
    const sessionState = this.convertToSessionState(sessionId, session);
    await this.persistenceAdapter.save(sessionId, sessionState);
  }

  public async loadSessionFromPersistence(sessionId: string): Promise<SessionData> {
    if (!this.persistenceAdapter) {
      throw new Error('Persistence not available');
    }

    const sessionState = await this.persistenceAdapter.load(sessionId);
    if (!sessionState) {
      throw new Error('Session not found');
    }

    const session = this.convertFromSessionState(sessionState);
    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    return session;
  }

  public async listPersistedSessions(options?: {
    limit?: number;
    technique?: string;
    status?: string;
  }): Promise<Array<{ id: string; data: SessionData }>> {
    if (!this.persistenceAdapter) {
      throw new Error('Persistence not available');
    }

    // The adapter returns metadata, we need to load full sessions
    const metadata = await this.persistenceAdapter.list(options as any);
    const sessions: Array<{ id: string; data: SessionData }> = [];

    for (const meta of metadata) {
      try {
        const sessionState = await this.persistenceAdapter.load(meta.id);
        if (sessionState) {
          sessions.push({
            id: meta.id,
            data: this.convertFromSessionState(sessionState),
          });
        }
      } catch {
        // Skip sessions that can't be loaded
      }
    }

    return sessions;
  }

  public async deletePersistedSession(sessionId: string): Promise<void> {
    if (!this.persistenceAdapter) {
      throw new Error('Persistence not available');
    }

    await this.persistenceAdapter.delete(sessionId);
  }

  public getPersistenceAdapter(): PersistenceAdapter | null {
    return this.persistenceAdapter;
  }

  // Memory and size utilities
  public getSessionSize(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session ? JSON.stringify(session).length : 0;
  }

  public getTotalMemoryUsage(): number {
    let total = 0;
    for (const [_, session] of this.sessions) {
      total += JSON.stringify(session).length;
    }
    return total;
  }

  public getConfig(): SessionConfig {
    return { ...this.config };
  }

  // Statistics and monitoring
  public getSessionCount(): number {
    return this.sessions.size;
  }

  public getPlanCount(): number {
    return this.plans.size;
  }

  public getMemoryStats(): {
    sessionCount: number;
    planCount: number;
    totalMemoryBytes: number;
    averageSessionSize: number;
  } {
    const totalMemory = this.getTotalMemoryUsage();
    const sessionCount = this.sessions.size;

    return {
      sessionCount,
      planCount: this.plans.size,
      totalMemoryBytes: totalMemory,
      averageSessionSize: sessionCount > 0 ? totalMemory / sessionCount : 0,
    };
  }

  // Conversion helpers
  private convertToSessionState(sessionId: string, session: SessionData): any {
    // Convert SessionData to SessionState format for persistence
    return {
      id: sessionId,
      problem: session.problem,
      technique: session.technique,
      currentStep:
        session.history.length > 0 ? session.history[session.history.length - 1].currentStep : 0,
      totalSteps: session.history.length > 0 ? session.history[0].totalSteps : 0,
      history: session.history.map((entry, index) => ({
        step: entry.currentStep,
        timestamp: entry.timestamp,
        input: entry,
        output: entry,
      })),
      branches: session.branches,
      insights: session.insights,
      startTime: session.startTime,
      endTime: session.endTime,
      metrics: session.metrics,
      tags: session.tags,
      name: session.name,
    };
  }

  private convertFromSessionState(sessionState: any): SessionData {
    // Convert SessionState format back to SessionData
    return {
      technique: sessionState.technique,
      problem: sessionState.problem,
      history: sessionState.history.map((h: any) => ({
        ...h.output,
        timestamp: h.timestamp,
      })),
      branches: sessionState.branches || {},
      insights: sessionState.insights || [],
      startTime: sessionState.startTime,
      endTime: sessionState.endTime,
      lastActivityTime: Date.now(),
      metrics: sessionState.metrics,
      tags: sessionState.tags,
      name: sessionState.name,
    };
  }
}
