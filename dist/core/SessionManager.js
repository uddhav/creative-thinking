/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import { randomUUID } from 'crypto';
import { MemoryManager } from './MemoryManager.js';
import { SessionError, ErrorCode } from '../errors/types.js';
import { ErrorFactory } from '../errors/enhanced-errors.js';
import { SessionCleaner } from './session/SessionCleaner.js';
import { SessionPersistence } from './session/SessionPersistence.js';
import { SessionMetrics } from './session/SessionMetrics.js';
import { PlanManager } from './session/PlanManager.js';
import { SessionIndex } from './session/SessionIndex.js';
import { SkipDetector, } from './session/SkipDetector.js';
import { getSessionLock } from './session/SessionLock.js';
// Constants for memory management
const MEMORY_THRESHOLD_FOR_GC = 0.8; // Trigger garbage collection when heap usage exceeds 80%
export class SessionManager {
    sessions = new Map();
    currentSessionId = null;
    memoryManager;
    sessionLock;
    // Extracted components
    sessionCleaner;
    sessionPersistence;
    sessionMetrics;
    planManager;
    skipDetector;
    // Session index (lazy initialized)
    sessionIndex = null;
    config = {
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
        // Initialize session lock for concurrent access control
        this.sessionLock = getSessionLock();
        // Initialize core components only
        this.planManager = new PlanManager();
        this.skipDetector = new SkipDetector();
        // Parallel components will be initialized on first use (lazy initialization)
        this.sessionCleaner = new SessionCleaner(this.sessions, this.planManager.getAllPlans(), this.config, this.memoryManager, (sessionId) => {
            // Non-blocking touch for cleanup - don't wait for lock
            this.touchSession(sessionId).catch(console.error);
        });
        this.sessionPersistence = new SessionPersistence();
        this.sessionMetrics = new SessionMetrics(this.sessions, this.planManager.getAllPlans(), this.config);
        this.sessionCleaner.startCleanup();
        void this.sessionPersistence.initialize();
    }
    /**
     * Lazy initialization for parallel execution components
     */
    getSessionIndex() {
        if (!this.sessionIndex) {
            this.sessionIndex = new SessionIndex();
        }
        return this.sessionIndex;
    }
    /**
     * Update session activity time
     */
    async touchSession(sessionId) {
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
    destroy() {
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
        console.error('[SessionManager] Cleanup complete');
    }
    /**
     * Exposed for testing - triggers cleanup manually
     */
    cleanupOldSessions() {
        this.sessionCleaner.cleanupOldSessions();
    }
    /**
     * Create a new session
     */
    createSession(sessionData, providedSessionId) {
        let sessionId;
        if (providedSessionId) {
            // Validate provided session ID
            if (!this.isValidSessionId(providedSessionId)) {
                throw ErrorFactory.invalidInput('sessionId', 'alphanumeric with underscores, hyphens, and dots only (max 64 chars)', providedSessionId);
            }
            sessionId = providedSessionId;
        }
        else {
            // Generate new session ID
            sessionId = `session_${randomUUID()}`;
        }
        if (this.sessions.has(sessionId)) {
            throw new SessionError(ErrorCode.SESSION_ALREADY_EXISTS, `Session ${sessionId} already exists`);
        }
        // Check memory pressure before creating new session
        if (this.sessions.size >= this.config.maxSessions) {
            console.error(`[Session Manager] Maximum sessions (${this.config.maxSessions}) reached, triggering cleanup`);
            this.sessionCleaner.cleanupOldSessions();
            // If still over limit after cleanup, throw error
            if (this.sessions.size >= this.config.maxSessions) {
                throw ErrorFactory.memoryLimitExceeded(Math.round((this.sessions.size / this.config.maxSessions) * 100));
            }
        }
        this.sessions.set(sessionId, sessionData);
        this.currentSessionId = sessionId;
        return sessionId;
    }
    /**
     * Validate session ID format
     */
    isValidSessionId(sessionId) {
        // Session IDs should be alphanumeric with underscores, hyphens, and dots
        return /^[a-zA-Z0-9._-]+$/.test(sessionId) && sessionId.length <= 64;
    }
    /**
     * Get a session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Update session data
     */
    async updateSession(sessionId, data) {
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
    deleteSession(sessionId) {
        if (this.currentSessionId === sessionId) {
            this.currentSessionId = null;
        }
        return this.sessions.delete(sessionId);
    }
    /**
     * List all sessions
     */
    listSessions() {
        return Array.from(this.sessions.entries());
    }
    // Plan management - delegate to PlanManager
    savePlan(planId, plan) {
        this.planManager.savePlan(planId, plan);
    }
    storePlan(planId, plan) {
        // Add createdAt if not present
        if (!plan.createdAt) {
            plan.createdAt = Date.now();
        }
        this.planManager.savePlan(planId, plan);
    }
    getPlan(planId) {
        return this.planManager.getPlan(planId);
    }
    deletePlan(planId) {
        return this.planManager.deletePlan(planId);
    }
    // Current session management
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    setCurrentSessionId(sessionId) {
        this.currentSessionId = sessionId;
    }
    setCurrentSession(sessionId) {
        this.setCurrentSessionId(sessionId);
    }
    // Persistence operations - delegate to SessionPersistence
    async saveSessionToPersistence(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw ErrorFactory.sessionNotFound(sessionId);
        }
        // Check session size before saving
        const size = this.sessionMetrics.getSessionSize(sessionId);
        if (size > this.config.maxSessionSize) {
            throw new SessionError(ErrorCode.SESSION_TOO_LARGE, `Session ${sessionId} exceeds maximum size (${size} > ${this.config.maxSessionSize})`);
        }
        await this.sessionPersistence.saveSession(sessionId, session);
    }
    async loadSessionFromPersistence(sessionId) {
        const session = await this.sessionPersistence.loadSession(sessionId);
        // Add to in-memory sessions with lock
        return this.sessionLock.withLock(sessionId, () => {
            this.sessions.set(sessionId, session);
            session.lastActivityTime = Date.now();
            return Promise.resolve(session);
        });
    }
    async listPersistedSessions(options) {
        return this.sessionPersistence.listPersistedSessions(options);
    }
    async deletePersistedSession(sessionId) {
        await this.sessionPersistence.deletePersistedSession(sessionId);
    }
    getPersistenceAdapter() {
        return this.sessionPersistence.getPersistenceAdapter();
    }
    // Metrics operations - delegate to SessionMetrics
    getSessionSize(sessionId) {
        return this.sessionMetrics.getSessionSize(sessionId);
    }
    getTotalMemoryUsage() {
        return this.sessionMetrics.getTotalMemoryUsage();
    }
    getConfig() {
        return this.sessionMetrics.getConfig();
    }
    getSessionCount() {
        return this.sessionMetrics.getSessionCount();
    }
    getPlanCount() {
        return this.planManager.getPlanCount();
    }
    getMemoryStats() {
        return this.sessionMetrics.getMemoryStats();
    }
    logMemoryMetrics() {
        this.sessionCleaner.logMemoryMetrics();
    }
    // ============= Parallel Execution Methods =============
    /**
     * Create a parallel session group from plans
     */
    /**
     * Mark a session as complete
     */
    markSessionComplete(sessionId) {
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
    getAllSessions() {
        return this.sessions;
    }
    /**
     * Get sessions by technique
     */
    getSessionsByTechnique(technique) {
        const sessionIds = this.getSessionIndex().getSessionsByTechnique(technique);
        return sessionIds
            .map(id => this.sessions.get(id))
            .filter((session) => session !== undefined);
    }
    /**
     * Get simplified session statistics
     */
    getSessionStats() {
        const stats = this.getSessionIndex().getStats();
        return {
            totalSessions: stats.totalSessions,
            completedSessions: stats.statusDistribution['completed'] || 0,
            activeSessions: (stats.statusDistribution['running'] || 0) + (stats.statusDistribution['pending'] || 0),
        };
    }
    // ============= Skip Detection Methods =============
    /**
     * Analyze skip patterns for a specific session
     */
    analyzeSessionSkipPatterns(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        // Get plan if available - need to look up via session metadata or current plan
        // Sessions don't store planId in history, so we'll check active plans
        let plan;
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
    analyzeUserSkipPatterns(limit = 10) {
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
    getSkipPatternRecommendations(sessionId) {
        const analysis = this.analyzeSessionSkipPatterns(sessionId);
        return analysis?.recommendations || [];
    }
    /**
     * Check if session has concerning skip patterns
     */
    hasHighRiskSkipPatterns(sessionId) {
        const analysis = this.analyzeSessionSkipPatterns(sessionId);
        return analysis ? analysis.riskScore > 0.7 : false;
    }
    /**
     * Get the session lock instance for external use
     */
    getSessionLock() {
        return this.sessionLock;
    }
}
//# sourceMappingURL=SessionManager.js.map