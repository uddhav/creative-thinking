/**
 * Session Manager
 * Handles session lifecycle, persistence, and cleanup
 */
import { randomUUID } from 'crypto';
import { createAdapter, getDefaultConfig } from '../persistence/factory.js';
import { MemoryManager } from './MemoryManager.js';
// Constants for memory management
const MEMORY_THRESHOLD_FOR_GC = 0.8; // Trigger garbage collection when heap usage exceeds 80%
export class SessionManager {
    sessions = new Map();
    plans = new Map();
    currentSessionId = null;
    cleanupInterval = null;
    persistenceAdapter = null;
    PLAN_TTL = 4 * 60 * 60 * 1000; // 4 hours for plans
    memoryManager;
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
                // eslint-disable-next-line no-console
                console.log('[Memory Usage] Triggering garbage collection...');
            },
        });
        this.startSessionCleanup();
        void this.initializePersistence();
    }
    async initializePersistence() {
        try {
            const persistenceType = (process.env.PERSISTENCE_TYPE || 'filesystem');
            const config = getDefaultConfig(persistenceType);
            // Override with environment variables if provided
            if (process.env.PERSISTENCE_PATH) {
                config.options.path = process.env.PERSISTENCE_PATH;
            }
            this.persistenceAdapter = await createAdapter(config);
        }
        catch (error) {
            console.error('Failed to initialize persistence:', error);
            // Continue without persistence
        }
    }
    startSessionCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldSessions();
        }, this.config.cleanupInterval);
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
    cleanupOldSessions() {
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
    evictOldestSessions() {
        // Skip if we're within limits
        if (this.sessions.size <= this.config.maxSessions) {
            return;
        }
        // Sort sessions by last activity time (oldest first)
        const sessionList = Array.from(this.sessions.entries()).sort((a, b) => a[1].lastActivityTime - b[1].lastActivityTime);
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
                // eslint-disable-next-line no-console
                console.log(`[Session Eviction] Evicted session ${sessionId} (LRU)`);
            }
        }
        if (this.config.enableMemoryMonitoring) {
            // eslint-disable-next-line no-console
            console.log(`[Memory Management] Sessions after eviction: ${this.sessions.size}/${this.config.maxSessions}`);
        }
    }
    /**
     * Log memory usage metrics
     */
    logMemoryMetrics() {
        const { heapUsed: heapUsedMB, heapTotal: heapTotalMB, rss: rssMB, } = this.memoryManager.getMemoryUsageMB();
        // Calculate approximate session memory usage using optimized estimation
        let totalSessionSize = 0;
        for (const [_, session] of this.sessions) {
            // Use optimized size estimation instead of JSON.stringify
            totalSessionSize += this.memoryManager.estimateObjectSize(session);
        }
        const sessionSizeKB = Math.round(totalSessionSize / 1024);
        const averageSizeKB = this.sessions.size > 0 ? Math.round(sessionSizeKB / this.sessions.size) : 0;
        // Log in the format expected by tests
        // eslint-disable-next-line no-console
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
        // Trigger garbage collection if needed
        this.memoryManager.triggerGCIfNeeded();
        // Warning if memory usage is concerning
        if (heapUsedMB > 500) {
            console.warn('[Memory Warning] High memory usage detected');
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.sessions.clear();
        this.plans.clear();
    }
    // Session CRUD operations
    createSession(sessionData) {
        const sessionId = `session_${randomUUID()}`;
        this.sessions.set(sessionId, sessionData);
        this.currentSessionId = sessionId;
        // Check if eviction is needed after adding the new session
        if (this.sessions.size > this.config.maxSessions) {
            this.evictOldestSessions();
        }
        return sessionId;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    updateSession(sessionId, data) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, data);
            this.touchSession(sessionId);
        }
    }
    deleteSession(sessionId) {
        const deleted = this.sessions.delete(sessionId);
        if (deleted && this.currentSessionId === sessionId) {
            this.currentSessionId = null;
        }
        return deleted;
    }
    listSessions() {
        return Array.from(this.sessions.entries());
    }
    // Plan management
    savePlan(planId, plan) {
        this.plans.set(planId, plan);
    }
    storePlan(planId, plan) {
        this.plans.set(planId, plan);
        // Clean up old plans after TTL
        setTimeout(() => {
            this.deletePlan(planId);
        }, this.PLAN_TTL);
    }
    getPlan(planId) {
        return this.plans.get(planId);
    }
    deletePlan(planId) {
        return this.plans.delete(planId);
    }
    // Current session management
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    setCurrentSessionId(sessionId) {
        this.currentSessionId = sessionId;
    }
    setCurrentSession(sessionId) {
        this.currentSessionId = sessionId;
    }
    // Persistence operations
    async saveSessionToPersistence(sessionId) {
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
    async loadSessionFromPersistence(sessionId) {
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
    async listPersistedSessions(options) {
        if (!this.persistenceAdapter) {
            throw new Error('Persistence not available');
        }
        // The adapter returns metadata, we need to load full sessions
        const metadata = await this.persistenceAdapter.list(options);
        const sessions = [];
        for (const meta of metadata) {
            try {
                const sessionState = await this.persistenceAdapter.load(meta.id);
                if (sessionState) {
                    sessions.push({
                        id: meta.id,
                        data: this.convertFromSessionState(sessionState),
                    });
                }
            }
            catch {
                // Skip sessions that can't be loaded
            }
        }
        return sessions;
    }
    async deletePersistedSession(sessionId) {
        if (!this.persistenceAdapter) {
            throw new Error('Persistence not available');
        }
        await this.persistenceAdapter.delete(sessionId);
    }
    getPersistenceAdapter() {
        return this.persistenceAdapter;
    }
    // Memory and size utilities
    getSessionSize(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? this.memoryManager.estimateObjectSize(session) : 0;
    }
    getTotalMemoryUsage() {
        let total = 0;
        for (const [_, session] of this.sessions) {
            total += this.memoryManager.estimateObjectSize(session);
        }
        return total;
    }
    getConfig() {
        return { ...this.config };
    }
    // Statistics and monitoring
    getSessionCount() {
        return this.sessions.size;
    }
    getPlanCount() {
        return this.plans.size;
    }
    getMemoryStats() {
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
    convertToSessionState(sessionId, session) {
        // Convert SessionData to SessionState format for persistence
        return {
            id: sessionId,
            problem: session.problem,
            technique: session.technique,
            currentStep: session.history.length > 0 ? session.history[session.history.length - 1].currentStep : 0,
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
    convertFromSessionState(sessionState) {
        // Convert SessionState format back to SessionData
        return {
            technique: sessionState.technique,
            problem: sessionState.problem,
            history: sessionState.history.map(h => ({
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
//# sourceMappingURL=SessionManager.js.map