/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */

import { randomUUID } from 'crypto';
import type { SessionData, ThinkingOperationData } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import type { SessionState } from '../persistence/types.js';
import { createAdapter, getDefaultConfig } from '../persistence/factory.js';
import { MemoryManager } from './MemoryManager.js';
import { SessionError, PersistenceError, ErrorCode } from '../errors/types.js';

// Constants for memory management
const MEMORY_THRESHOLD_FOR_GC = 0.8; // Trigger garbage collection when heap usage exceeds 80%

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
  private memoryManager: MemoryManager;

  private config: SessionConfig = {
    maxSessions: parseInt(process.env.MAX_SESSIONS || '100', 10),
    maxSessionSize: parseInt(process.env.MAX_SESSION_SIZE || String(1024 * 1024), 10), // 1MB default
    sessionTTL: parseInt(process.env.SESSION_TTL || String(24 * 60 * 60 * 1000), 10), // 24 hours
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || String(60 * 60 * 1000), 10), // 1 hour
    enableMemoryMonitoring: process.env.ENABLE_MEMORY_MONITORING === 'true',
  };

  constructor() {
    this.memoryManager = MemoryManager.getInstance({
      gcThreshold: MEMORY_THRESHOLD_FOR_GC,
      enableGC: true,
      onGCTriggered: () => {
        console.error('[Memory Usage] Triggering garbage collection...');
      },
    });
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
        console.error(`[Session Eviction] Evicted session ${sessionId} (LRU)`);
      }
    }

    if (this.config.enableMemoryMonitoring) {
      console.error(
        `[Memory Management] Sessions after eviction: ${this.sessions.size}/${this.config.maxSessions}`
      );
    }
  }

  /**
   * Log memory usage metrics
   */
  private logMemoryMetrics(): void {
    const {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: rssMB,
    } = this.memoryManager.getMemoryUsageMB();

    // Calculate approximate session memory usage using optimized estimation
    let totalSessionSize = 0;
    for (const [_, session] of this.sessions) {
      // Use optimized size estimation instead of JSON.stringify
      totalSessionSize += this.memoryManager.estimateObjectSize(session);
    }
    const sessionSizeKB = Math.round(totalSessionSize / 1024);
    const averageSizeKB =
      this.sessions.size > 0 ? Math.round(sessionSizeKB / this.sessions.size) : 0;

    // Log in the format expected by tests
    console.error('[Memory Metrics]', {
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

    // Trigger garbage collection if needed
    this.memoryManager.triggerGCIfNeeded();

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
  public createSession(sessionData: SessionData, providedSessionId?: string): string {
    // Use provided ID if given, otherwise generate a new one
    const sessionId = providedSessionId || `session_${randomUUID()}`;

    // Validate provided session ID format if given
    if (providedSessionId && !this.isValidSessionId(providedSessionId)) {
      throw new SessionError(
        ErrorCode.INVALID_INPUT,
        `Invalid session ID format: ${providedSessionId}. Session IDs must be alphanumeric with hyphens, underscores, or dots.`,
        providedSessionId
      );
    }

    this.sessions.set(sessionId, sessionData);
    this.currentSessionId = sessionId;

    // Check if eviction is needed after adding the new session
    if (this.sessions.size > this.config.maxSessions) {
      this.evictOldestSessions();
    }

    return sessionId;
  }

  private isValidSessionId(sessionId: string): boolean {
    // Allow alphanumeric characters, hyphens, underscores, and dots
    // Must be 1-100 characters long
    const sessionIdPattern = /^[a-zA-Z0-9\-_.]{1,100}$/;
    return sessionIdPattern.test(sessionId);
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
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_NOT_AVAILABLE,
        'Persistence adapter is not available',
        'saveSession'
      );
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionError(
        ErrorCode.SESSION_NOT_FOUND,
        `Session ${sessionId} not found`,
        sessionId
      );
    }

    // Convert SessionData to SessionState for persistence
    const sessionState = this.convertToSessionState(sessionId, session);
    await this.persistenceAdapter.save(sessionId, sessionState);
  }

  public async loadSessionFromPersistence(sessionId: string): Promise<SessionData> {
    if (!this.persistenceAdapter) {
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_NOT_AVAILABLE,
        'Persistence adapter is not available',
        'loadSession'
      );
    }

    const sessionState = await this.persistenceAdapter.load(sessionId);
    if (!sessionState) {
      throw new SessionError(
        ErrorCode.SESSION_NOT_FOUND,
        `Session ${sessionId} not found in persistence`,
        sessionId
      );
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
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_NOT_AVAILABLE,
        'Persistence adapter is not available',
        'listPersistedSessions'
      );
    }

    // The adapter returns metadata, we need to load full sessions
    const metadata = await this.persistenceAdapter.list(options);
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
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_NOT_AVAILABLE,
        'Persistence adapter is not available',
        'deleteSession'
      );
    }

    await this.persistenceAdapter.delete(sessionId);
  }

  public getPersistenceAdapter(): PersistenceAdapter | null {
    return this.persistenceAdapter;
  }

  // Memory and size utilities
  public getSessionSize(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session ? this.memoryManager.estimateObjectSize(session) : 0;
  }

  public getTotalMemoryUsage(): number {
    let total = 0;
    for (const [_, session] of this.sessions) {
      total += this.memoryManager.estimateObjectSize(session);
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
  private convertToSessionState(sessionId: string, session: SessionData): SessionState {
    // Convert SessionData to SessionState format for persistence
    return {
      id: sessionId,
      problem: session.problem,
      technique: session.technique,
      currentStep:
        session.history.length > 0 ? session.history[session.history.length - 1].currentStep : 0,
      totalSteps: session.history.length > 0 ? session.history[0].totalSteps : 0,
      history: session.history.map(entry => ({
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

  private convertFromSessionState(sessionState: SessionState): SessionData {
    // Convert SessionState format back to SessionData
    return {
      technique: sessionState.technique,
      problem: sessionState.problem,
      history: sessionState.history.map(h => ({
        ...h.output,
        timestamp: h.timestamp,
      })) as (ThinkingOperationData & { timestamp: string })[],
      branches: (sessionState.branches as Record<string, ThinkingOperationData[]>) || {},
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
