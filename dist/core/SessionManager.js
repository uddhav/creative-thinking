/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import { randomUUID } from 'crypto';
import { MemoryManager } from './MemoryManager.js';
import { SessionError, ErrorCode } from '../errors/types.js';
import { SessionCleaner } from './session/SessionCleaner.js';
import { SessionPersistence } from './session/SessionPersistence.js';
import { SessionMetrics } from './session/SessionMetrics.js';
import { PlanManager } from './session/PlanManager.js';
// Constants for memory management
const MEMORY_THRESHOLD_FOR_GC = 0.8; // Trigger garbage collection when heap usage exceeds 80%
export class SessionManager {
    sessions = new Map();
    currentSessionId = null;
    memoryManager;
    // Extracted components
    sessionCleaner;
    sessionPersistence;
    sessionMetrics;
    planManager;
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
        // Initialize extracted components
        this.planManager = new PlanManager();
        this.sessionCleaner = new SessionCleaner(this.sessions, this.planManager.getAllPlans(), this.config, this.memoryManager, this.touchSession.bind(this));
        this.sessionPersistence = new SessionPersistence();
        this.sessionMetrics = new SessionMetrics(this.sessions, this.planManager.getAllPlans(), this.config);
        this.sessionCleaner.startCleanup();
        void this.sessionPersistence.initialize();
    }
    /**
     * Update session activity time
     */
    touchSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivityTime = Date.now();
        }
    }
    /**
     * Clean up resources on shutdown
     */
    destroy() {
        this.sessionCleaner.stopCleanup();
        this.sessions.clear();
        this.planManager.clearAllPlans();
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
                throw new SessionError(ErrorCode.INVALID_INPUT, `Invalid session ID format: ${providedSessionId}. Session IDs must be alphanumeric with underscores, hyphens, and dots only, maximum 64 characters.`);
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
                throw new SessionError(ErrorCode.MAX_SESSIONS_EXCEEDED, 'Maximum number of sessions exceeded');
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
    updateSession(sessionId, data) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, data);
            this.touchSession(sessionId);
        }
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
            throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session ${sessionId} not found`);
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
        // Add to in-memory sessions
        this.sessions.set(sessionId, session);
        this.touchSession(sessionId);
        return session;
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
}
//# sourceMappingURL=SessionManager.js.map