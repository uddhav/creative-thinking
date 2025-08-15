/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */

import { randomUUID } from 'crypto';
import type { SessionData, LateralTechnique } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import type { PersistenceAdapter } from '../persistence/adapter.js';
import type { SessionState } from '../persistence/types.js';
import { MemoryManager } from './MemoryManager.js';
import { SessionError, ErrorCode } from '../errors/types.js';
import { ErrorFactory } from '../errors/enhanced-errors.js';
import { SessionCleaner } from './session/SessionCleaner.js';
import { SessionPersistence } from './session/SessionPersistence.js';
import { SessionMetrics } from './session/SessionMetrics.js';
import { PlanManager } from './session/PlanManager.js';
import { SessionIndex } from './session/SessionIndex.js';
import {
  SkipDetector,
  type SkipDetectionResult,
  type SkipPattern,
} from './session/SkipDetector.js';
import { getSessionLock, type SessionLock } from './session/SessionLock.js';
import { ReflexivityTracker } from './ReflexivityTracker.js';
import type { ReflexiveEffects } from '../techniques/types.js';
import { getNLPService } from '../nlp/NLPService.js';
import type { NLPService } from '../nlp/NLPService.js';
import type { SamplingManager } from '../sampling/SamplingManager.js';

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
  private sessionLock: SessionLock;
  private reflexivityTracker: ReflexivityTracker;
  private nlpService: NLPService;

  // Extracted components
  private sessionCleaner: SessionCleaner;
  private sessionPersistence: SessionPersistence;
  private sessionMetrics: SessionMetrics;
  private planManager: PlanManager;
  private skipDetector: SkipDetector;

  // Session index (lazy initialized)
  private sessionIndex: SessionIndex | null = null;

  private config: SessionConfig = {
    maxSessions: parseInt(process.env.MAX_SESSIONS || '100', 10),
    maxSessionSize: parseInt(process.env.MAX_SESSION_SIZE || String(1024 * 1024), 10), // 1MB default
    sessionTTL: parseInt(process.env.SESSION_TTL || String(24 * 60 * 60 * 1000), 10), // 24 hours
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || String(60 * 60 * 1000), 10), // 1 hour
    enableMemoryMonitoring: process.env.ENABLE_MEMORY_MONITORING === 'true',
  };

  constructor(samplingManager?: SamplingManager) {
    this.memoryManager = MemoryManager.getInstance({
      gcThreshold: MEMORY_THRESHOLD_FOR_GC,
      enableGC: true,
      onGCTriggered: () => {
        console.error('[Memory Usage] Triggering garbage collection...');
      },
    });

    // Initialize session lock for concurrent access control
    this.sessionLock = getSessionLock();

    // Initialize NLP service with optional sampling manager
    this.nlpService = getNLPService(samplingManager);

    // Initialize reflexivity tracker with NLP service
    this.reflexivityTracker = new ReflexivityTracker(this.nlpService);

    // Initialize core components only
    this.planManager = new PlanManager();
    this.skipDetector = new SkipDetector();

    // Parallel components will be initialized on first use (lazy initialization)

    this.sessionCleaner = new SessionCleaner(
      this.sessions,
      this.planManager.getAllPlans(),
      this.config,
      this.memoryManager,
      (sessionId: string) => {
        // Non-blocking touch for cleanup - don't wait for lock
        this.touchSession(sessionId).catch(console.error);
      }
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

  /**
   * Update session activity time
   */
  public async touchSession(sessionId: string): Promise<void> {
    return this.sessionLock.withLock(sessionId, () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActivityTime = Date.now();
      }
      return Promise.resolve();
    });
  }

  /**
   * Clean up resources on shutdown
   */
  public destroy(): void {
    console.error('[SessionManager] Starting cleanup...');

    // Stop the cleanup interval first
    this.sessionCleaner.stopCleanup();
    console.error('[SessionManager] Stopped cleanup interval');

    // Clear all session locks
    this.sessionLock.clearAllLocks();
    console.error('[SessionManager] Cleared all session locks');

    // Clear all sessions
    const sessionCount = this.sessions.size;
    this.sessions.clear();
    console.error(`[SessionManager] Cleared ${sessionCount} sessions`);

    // Clear all plans
    const planCount = this.planManager.getPlanCount();
    this.planManager.clearAllPlans();
    console.error(`[SessionManager] Cleared ${planCount} plans`);

    // Clear current session ID
    this.currentSessionId = null;

    // Clear session index if initialized
    if (this.sessionIndex) {
      this.sessionIndex = null;
      console.error('[SessionManager] Cleared session index');
    }

    // Clean up reflexivity tracker
    this.reflexivityTracker.destroy();
    console.error('[SessionManager] Destroyed reflexivity tracker');

    console.error('[SessionManager] Cleanup complete');
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
  public async updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    return this.sessionLock.withLock(sessionId, () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        Object.assign(session, data);
        session.lastActivityTime = Date.now();
      }
      return Promise.resolve();
    });
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

    // Add to in-memory sessions with lock
    return this.sessionLock.withLock(sessionId, () => {
      this.sessions.set(sessionId, session);
      session.lastActivityTime = Date.now();
      return Promise.resolve(session);
    });
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

  /**
   * Get reflexivity-specific memory statistics
   * Provides type-safe access to reflexivity tracker's memory stats
   */
  public getReflexivityMemoryStats(): {
    estimatedMemoryBytes: number;
    sessionCount: number;
    totalActions: number;
    totalConstraints: number;
  } {
    return this.reflexivityTracker.getMemoryStats();
  }

  public logMemoryMetrics(): void {
    this.sessionCleaner.logMemoryMetrics();
  }

  // ============= Parallel Execution Methods =============

  /**
   * Create a parallel session group from plans
   */
  /**
   * Mark a session as complete
   */
  public markSessionComplete(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw ErrorFactory.sessionNotFound(sessionId);
    }

    // Regular session completion
    session.endTime = Date.now();
  }

  /**
   * Get all sessions (simplified replacement for group functionality)
   */
  public getAllSessions(): Map<string, SessionData> {
    return this.sessions;
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
   * Get simplified session statistics
   */
  public getSessionStats(): {
    totalSessions: number;
    completedSessions: number;
    activeSessions: number;
  } {
    const stats = this.getSessionIndex().getStats();
    return {
      totalSessions: stats.totalSessions,
      completedSessions: stats.statusDistribution['completed'] || 0,
      activeSessions:
        (stats.statusDistribution['running'] || 0) + (stats.statusDistribution['pending'] || 0),
    };
  }

  // ============= Skip Detection Methods =============

  /**
   * Analyze skip patterns for a specific session
   */
  public analyzeSessionSkipPatterns(sessionId: string): SkipDetectionResult | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Get plan if available - need to look up via session metadata or current plan
    // Sessions don't store planId in history, so we'll check active plans
    let plan: PlanThinkingSessionOutput | undefined;

    // Try to find a plan that includes this session's technique
    for (const [_planId, p] of this.planManager.getAllPlans()) {
      if (p.techniques.includes(session.technique)) {
        plan = p;
        break;
      }
    }

    return this.skipDetector.analyzeSession(session, plan);
  }

  /**
   * Analyze skip patterns across all sessions for a user
   */
  public analyzeUserSkipPatterns(limit = 10): {
    consistentPatterns: SkipPattern[];
    problematicTechniques: LateralTechnique[];
    overallSkipRate: number;
    improvementTrend: 'improving' | 'declining' | 'stable';
  } {
    // Get recent sessions sorted by last activity
    const recentSessions = Array.from(this.sessions.values())
      .sort((a, b) => b.lastActivityTime - a.lastActivityTime)
      .slice(0, limit);

    if (recentSessions.length === 0) {
      return {
        consistentPatterns: [],
        problematicTechniques: [],
        overallSkipRate: 0,
        improvementTrend: 'stable',
      };
    }

    return this.skipDetector.analyzeUserPatterns(recentSessions);
  }

  /**
   * Get skip pattern recommendations for current session
   */
  public getSkipPatternRecommendations(sessionId: string): string[] {
    const analysis = this.analyzeSessionSkipPatterns(sessionId);
    return analysis?.recommendations || [];
  }

  /**
   * Check if session has concerning skip patterns
   */
  public hasHighRiskSkipPatterns(sessionId: string): boolean {
    const analysis = this.analyzeSessionSkipPatterns(sessionId);
    return analysis ? analysis.riskScore > 0.7 : false;
  }

  /**
   * Get the session lock instance for external use
   */
  public getSessionLock(): SessionLock {
    return this.sessionLock;
  }

  /**
   * Get reflexivity data for a session
   */
  public getSessionReflexivity(sessionId: string): {
    realityState: ReturnType<ReflexivityTracker['getRealityState']>;
    actionHistory: ReturnType<ReflexivityTracker['getActionHistory']>;
    summary: ReturnType<ReflexivityTracker['getSessionSummary']>;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      realityState: this.reflexivityTracker.getRealityState(sessionId),
      actionHistory: this.reflexivityTracker.getActionHistory(sessionId),
      summary: this.reflexivityTracker.getSessionSummary(sessionId),
    };
  }

  /**
   * Track reflexivity for a step execution
   */
  public trackReflexivity(
    sessionId: string,
    technique: string,
    stepNumber: number,
    stepType?: 'thinking' | 'action',
    reflexiveEffects?: ReflexiveEffects
  ): void {
    if (stepType) {
      // Use technique and step as action description
      const actionDescription = `${technique} step ${stepNumber}`;
      this.reflexivityTracker.trackStep(
        sessionId,
        technique,
        stepNumber,
        stepType,
        actionDescription,
        reflexiveEffects
      );
    }
  }
}
