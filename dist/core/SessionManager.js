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
import { ParallelGroupManager } from './session/ParallelGroupManager.js';
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
    // Parallel execution components (lazy initialized)
    sessionIndex = null;
    parallelGroupManager = null;
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
        // Initialize core components only
        this.planManager = new PlanManager();
        // Parallel components will be initialized on first use (lazy initialization)
        this.sessionCleaner = new SessionCleaner(this.sessions, this.planManager.getAllPlans(), this.config, this.memoryManager, this.touchSession.bind(this));
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
    getParallelGroupManager() {
        if (!this.parallelGroupManager) {
            this.parallelGroupManager = new ParallelGroupManager(this.getSessionIndex());
        }
        return this.parallelGroupManager;
    }
    /**
     * Set the parallel execution context for metrics and monitoring
     */
    setParallelContext(context) {
        this.getParallelGroupManager().setParallelContext(context);
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
    // ============= Parallel Execution Methods =============
    /**
     * Create a parallel session group from plans
     */
    createParallelSessionGroup(problem, plans, convergenceOptions) {
        const { groupId, sessionIds } = this.getParallelGroupManager().createParallelSessionGroup(problem, plans, convergenceOptions, this.sessions);
        console.error(`[SessionManager] Created parallel group ${groupId} with ${sessionIds.length} sessions`);
        return groupId;
    }
    /**
     * Get parallel results for a group
     */
    async getParallelResults(groupId) {
        return Promise.resolve(this.getParallelGroupManager().getParallelResults(groupId, this.sessions));
    }
    /**
     * Mark a session as complete (handles parallel dependencies)
     */
    markSessionComplete(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw ErrorFactory.sessionNotFound(sessionId);
        }
        // Handle parallel group completion
        if (session.parallelGroupId) {
            this.getParallelGroupManager().markSessionComplete(sessionId, this.sessions);
        }
        else {
            // Regular session completion
            session.endTime = Date.now();
        }
    }
    /**
     * Check if a session can start based on dependencies
     */
    canSessionStart(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.parallelGroupId) {
            return true; // No dependencies for non-parallel sessions
        }
        return this.getParallelGroupManager().canSessionStart(sessionId, session.parallelGroupId);
    }
    /**
     * Get parallel group information
     */
    getParallelGroup(groupId) {
        return this.getParallelGroupManager().getGroup(groupId);
    }
    /**
     * Get all active parallel groups
     */
    getActiveParallelGroups() {
        return this.getParallelGroupManager().getActiveGroups();
    }
    /**
     * Update parallel group status
     */
    updateParallelGroupStatus(groupId, status) {
        this.getParallelGroupManager().updateGroupStatus(groupId, status);
    }
    /**
     * Get sessions in a parallel group
     */
    getSessionsInGroup(groupId) {
        const sessionIds = this.getSessionIndex().getSessionsInGroup(groupId);
        return sessionIds
            .map(id => this.sessions.get(id))
            .filter((session) => session !== undefined);
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
     * Detect circular dependencies
     */
    detectCircularDependencies() {
        return this.getSessionIndex().detectCircularDependencies();
    }
    /**
     * Get dependency statistics
     */
    getDependencyStats() {
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
    cleanupOldParallelGroups() {
        return this.getParallelGroupManager().cleanupOldGroups(this.config.sessionTTL);
    }
}
//# sourceMappingURL=SessionManager.js.map