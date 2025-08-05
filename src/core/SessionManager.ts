/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */

import { randomUUID } from 'crypto';
import type { SessionData } from '../types/index.js';
import type {
  PlanThinkingSessionOutput,
  ParallelPlan,
  ConvergenceOptions,
} from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import type { SessionState } from '../persistence/types.js';
import type { ParallelSessionGroup, ParallelExecutionResult } from '../types/parallel-session.js';
import type { ParallelExecutionContext } from '../layers/execution/ParallelExecutionContext.js';
import { MemoryManager } from './MemoryManager.js';
import { SessionError, ErrorCode } from '../errors/types.js';
import { ErrorFactory } from '../errors/enhanced-errors.js';
import { SessionCleaner } from './session/SessionCleaner.js';
import { SessionPersistence } from './session/SessionPersistence.js';
import { SessionMetrics } from './session/SessionMetrics.js';
import { PlanManager } from './session/PlanManager.js';
import { SessionIndex } from './session/SessionIndex.js';
import { ParallelGroupManager } from './session/ParallelGroupManager.js';

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
  private currentSessionId: string | null = null;
  private memoryManager: MemoryManager;

  // Extracted components
  private sessionCleaner: SessionCleaner;
  private sessionPersistence: SessionPersistence;
  private sessionMetrics: SessionMetrics;
  private planManager: PlanManager;

  // Parallel execution components (lazy initialized)
  private sessionIndex: SessionIndex | null = null;
  private parallelGroupManager: ParallelGroupManager | null = null;

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

    // Initialize core components only
    this.planManager = new PlanManager();

    // Parallel components will be initialized on first use (lazy initialization)

    this.sessionCleaner = new SessionCleaner(
      this.sessions,
      this.planManager.getAllPlans(),
      this.config,
      this.memoryManager,
      this.touchSession.bind(this)
    );
    this.sessionPersistence = new SessionPersistence();
    this.sessionMetrics = new SessionMetrics(
      this.sessions,
      this.planManager.getAllPlans(),
      this.config
    );

    this.sessionCleaner.startCleanup();
    void this.sessionPersistence.initialize();
  }

  /**
   * Lazy initialization for parallel execution components
   */
  private getSessionIndex(): SessionIndex {
    if (!this.sessionIndex) {
      this.sessionIndex = new SessionIndex();
    }
    return this.sessionIndex;
  }

  private getParallelGroupManager(): ParallelGroupManager {
    if (!this.parallelGroupManager) {
      this.parallelGroupManager = new ParallelGroupManager(this.getSessionIndex());
    }
    return this.parallelGroupManager;
  }

  /**
   * Set the parallel execution context for metrics and monitoring
   */
  public setParallelContext(context: unknown): void {
    this.getParallelGroupManager().setParallelContext(context as ParallelExecutionContext);
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

  /**
   * Clean up resources on shutdown
   */
  public destroy(): void {
    this.sessionCleaner.stopCleanup();
    this.sessions.clear();
    this.planManager.clearAllPlans();
  }

  /**
   * Exposed for testing - triggers cleanup manually
   */
  public cleanupOldSessions(): void {
    this.sessionCleaner.cleanupOldSessions();
  }

  /**
   * Create a new session
   */
  public createSession(sessionData: SessionData, providedSessionId?: string): string {
    let sessionId: string;

    if (providedSessionId) {
      // Validate provided session ID
      if (!this.isValidSessionId(providedSessionId)) {
        throw ErrorFactory.invalidInput(
          'sessionId',
          'alphanumeric with underscores, hyphens, and dots only (max 64 chars)',
          providedSessionId
        );
      }
      sessionId = providedSessionId;
    } else {
      // Generate new session ID
      sessionId = `session_${randomUUID()}`;
    }

    if (this.sessions.has(sessionId)) {
      throw new SessionError(
        ErrorCode.SESSION_ALREADY_EXISTS,
        `Session ${sessionId} already exists`
      );
    }

    // Check memory pressure before creating new session
    if (this.sessions.size >= this.config.maxSessions) {
      console.error(
        `[Session Manager] Maximum sessions (${this.config.maxSessions}) reached, triggering cleanup`
      );
      this.sessionCleaner.cleanupOldSessions();

      // If still over limit after cleanup, throw error
      if (this.sessions.size >= this.config.maxSessions) {
        throw ErrorFactory.memoryLimitExceeded(
          Math.round((this.sessions.size / this.config.maxSessions) * 100)
        );
      }
    }

    this.sessions.set(sessionId, sessionData);
    this.currentSessionId = sessionId;
    return sessionId;
  }

  /**
   * Validate session ID format
   */
  private isValidSessionId(sessionId: string): boolean {
    // Session IDs should be alphanumeric with underscores, hyphens, and dots
    return /^[a-zA-Z0-9._-]+$/.test(sessionId) && sessionId.length <= 64;
  }

  /**
   * Get a session by ID
   */
  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session data
   */
  public updateSession(sessionId: string, data: Partial<SessionData>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, data);
      this.touchSession(sessionId);
    }
  }

  /**
   * Delete a session
   */
  public deleteSession(sessionId: string): boolean {
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    return this.sessions.delete(sessionId);
  }

  /**
   * List all sessions
   */
  public listSessions(): Array<[string, SessionData]> {
    return Array.from(this.sessions.entries());
  }

  // Plan management - delegate to PlanManager
  public savePlan(planId: string, plan: PlanThinkingSessionOutput): void {
    this.planManager.savePlan(planId, plan);
  }

  public storePlan(planId: string, plan: PlanThinkingSessionOutput): void {
    // Add createdAt if not present
    if (!plan.createdAt) {
      plan.createdAt = Date.now();
    }
    this.planManager.savePlan(planId, plan);
  }

  public getPlan(planId: string): PlanThinkingSessionOutput | undefined {
    return this.planManager.getPlan(planId);
  }

  public deletePlan(planId: string): boolean {
    return this.planManager.deletePlan(planId);
  }

  // Current session management
  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  public setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  public setCurrentSession(sessionId: string): void {
    this.setCurrentSessionId(sessionId);
  }

  // Persistence operations - delegate to SessionPersistence
  public async saveSessionToPersistence(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw ErrorFactory.sessionNotFound(sessionId);
    }

    // Check session size before saving
    const size = this.sessionMetrics.getSessionSize(sessionId);
    if (size > this.config.maxSessionSize) {
      throw new SessionError(
        ErrorCode.SESSION_TOO_LARGE,
        `Session ${sessionId} exceeds maximum size (${size} > ${this.config.maxSessionSize})`
      );
    }

    await this.sessionPersistence.saveSession(sessionId, session);
  }

  public async loadSessionFromPersistence(sessionId: string): Promise<SessionData> {
    const session = await this.sessionPersistence.loadSession(sessionId);

    // Add to in-memory sessions
    this.sessions.set(sessionId, session);
    this.touchSession(sessionId);

    return session;
  }

  public async listPersistedSessions(options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'created' | 'updated' | 'name' | 'technique';
    order?: 'asc' | 'desc';
  }): Promise<SessionState[]> {
    return this.sessionPersistence.listPersistedSessions(options);
  }

  public async deletePersistedSession(sessionId: string): Promise<void> {
    await this.sessionPersistence.deletePersistedSession(sessionId);
  }

  public getPersistenceAdapter(): PersistenceAdapter | null {
    return this.sessionPersistence.getPersistenceAdapter();
  }

  // Metrics operations - delegate to SessionMetrics
  public getSessionSize(sessionId: string): number {
    return this.sessionMetrics.getSessionSize(sessionId);
  }

  public getTotalMemoryUsage(): number {
    return this.sessionMetrics.getTotalMemoryUsage();
  }

  public getConfig(): SessionConfig {
    return this.sessionMetrics.getConfig();
  }

  public getSessionCount(): number {
    return this.sessionMetrics.getSessionCount();
  }

  public getPlanCount(): number {
    return this.planManager.getPlanCount();
  }

  public getMemoryStats(): {
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
  } {
    return this.sessionMetrics.getMemoryStats();
  }

  public logMemoryMetrics(): void {
    this.sessionCleaner.logMemoryMetrics();
  }

  // ============= Parallel Execution Methods =============

  /**
   * Create a parallel session group from plans
   */
  public createParallelSessionGroup(
    problem: string,
    plans: ParallelPlan[],
    convergenceOptions?: ConvergenceOptions
  ): string {
    const { groupId, sessionIds } = this.getParallelGroupManager().createParallelSessionGroup(
      problem,
      plans,
      convergenceOptions,
      this.sessions
    );

    console.error(
      `[SessionManager] Created parallel group ${groupId} with ${sessionIds.length} sessions`
    );

    return groupId;
  }

  /**
   * Get parallel results for a group
   */
  public async getParallelResults(groupId: string): Promise<ParallelExecutionResult[]> {
    return Promise.resolve(
      this.getParallelGroupManager().getParallelResults(groupId, this.sessions)
    );
  }

  /**
   * Mark a session as complete (handles parallel dependencies)
   */
  public markSessionComplete(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw ErrorFactory.sessionNotFound(sessionId);
    }

    // Handle parallel group completion
    if (session.parallelGroupId) {
      this.getParallelGroupManager().markSessionComplete(sessionId, this.sessions);
    } else {
      // Regular session completion
      session.endTime = Date.now();
    }
  }

  /**
   * Check if a session can start based on dependencies
   */
  public canSessionStart(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.parallelGroupId) {
      return true; // No dependencies for non-parallel sessions
    }

    return this.getParallelGroupManager().canSessionStart(sessionId, session.parallelGroupId);
  }

  /**
   * Get parallel group information
   */
  public getParallelGroup(groupId: string): ParallelSessionGroup | undefined {
    return this.getParallelGroupManager().getGroup(groupId);
  }

  /**
   * Get all active parallel groups
   */
  public getActiveParallelGroups(): ParallelSessionGroup[] {
    return this.getParallelGroupManager().getActiveGroups();
  }

  /**
   * Update parallel group status
   */
  public updateParallelGroupStatus(groupId: string, status: ParallelSessionGroup['status']): void {
    this.getParallelGroupManager().updateGroupStatus(groupId, status);
  }

  /**
   * Get sessions in a parallel group
   */
  public getSessionsInGroup(groupId: string): SessionData[] {
    const sessionIds = this.getSessionIndex().getSessionsInGroup(groupId);
    return sessionIds
      .map(id => this.sessions.get(id))
      .filter((session): session is SessionData => session !== undefined);
  }

  /**
   * Get sessions by technique
   */
  public getSessionsByTechnique(technique: SessionData['technique']): SessionData[] {
    const sessionIds = this.getSessionIndex().getSessionsByTechnique(technique);
    return sessionIds
      .map(id => this.sessions.get(id))
      .filter((session): session is SessionData => session !== undefined);
  }

  /**
   * Detect circular dependencies
   */
  public detectCircularDependencies(): string[][] {
    return this.getSessionIndex().detectCircularDependencies();
  }

  /**
   * Get dependency statistics
   */
  public getDependencyStats(): {
    totalDependencies: number;
    circularDependencies: string[][];
    orphanedSessions: string[];
  } {
    const circular = this.getSessionIndex().detectCircularDependencies();
    const orphaned = this.getSessionIndex()
      .getSessionsByStatus('pending')
      .filter(id => {
        const session = this.sessions.get(id);
        return session && !session.parallelGroupId;
      });

    return {
      totalDependencies: this.getSessionIndex().getStats().totalDependencies,
      circularDependencies: circular,
      orphanedSessions: orphaned,
    };
  }

  /**
   * Clean up old parallel groups
   */
  public cleanupOldParallelGroups(): number {
    return this.getParallelGroupManager().cleanupOldGroups(this.config.sessionTTL);
  }
}
