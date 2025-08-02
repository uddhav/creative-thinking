/**
 * SessionMetrics - Handles session metrics and memory statistics
 * Extracted from SessionManager to improve maintainability
 */
export class SessionMetrics {
    sessions;
    plans;
    config;
    constructor(sessions, plans, config) {
        this.sessions = sessions;
        this.plans = plans;
        this.config = config;
    }
    /**
     * Get the number of active sessions
     */
    getSessionCount() {
        return this.sessions.size;
    }
    /**
     * Get the number of stored plans
     */
    getPlanCount() {
        return this.plans.size;
    }
    /**
     * Calculate the size of a specific session
     */
    getSessionSize(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? this.calculateSessionSize(session) : 0;
    }
    /**
     * Get total memory usage across all sessions
     */
    getTotalMemoryUsage() {
        let total = 0;
        for (const session of this.sessions.values()) {
            total += this.calculateSessionSize(session);
        }
        return total;
    }
    /**
     * Get comprehensive memory statistics
     */
    getMemoryStats() {
        const memoryUsageBySession = new Map();
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
    getConfig() {
        return { ...this.config };
    }
    /**
     * Calculate approximate size of a session in bytes
     */
    calculateSessionSize(session) {
        try {
            // Rough estimation based on JSON stringification
            return JSON.stringify(session).length * 2; // UTF-16 characters
        }
        catch {
            return 0;
        }
    }
    /**
     * Check if session size exceeds configured limit
     */
    isSessionTooLarge(sessionId) {
        const size = this.getSessionSize(sessionId);
        return size > this.config.maxSessionSize;
    }
    /**
     * Get sessions sorted by size (largest first)
     */
    getSessionsBySize() {
        const sessionSizes = [];
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
    getSessionsByAge() {
        const now = Date.now();
        const sessionAges = [];
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
    isMemoryPressureHigh() {
        const stats = this.getMemoryStats();
        const heapUsagePercent = stats.heapUsed / stats.heapTotal;
        return heapUsagePercent > 0.8 || this.sessions.size > this.config.maxSessions;
    }
}
//# sourceMappingURL=SessionMetrics.js.map