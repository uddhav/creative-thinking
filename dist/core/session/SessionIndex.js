/**
 * SessionIndex - Provides fast lookups for sessions and their relationships
 */
/**
 * Manages indexes for fast session lookups
 */
export class SessionIndex {
    // Indexes for fast lookup
    techniqueToSessions = new Map();
    sessionStatus = new Map();
    /**
     * Index an individual session
     */
    indexSession(sessionId, session) {
        // Index by primary technique
        const techniqueSessions = this.techniqueToSessions.get(session.technique) || new Set();
        techniqueSessions.add(sessionId);
        this.techniqueToSessions.set(session.technique, techniqueSessions);
        // Set initial status
        this.sessionStatus.set(sessionId, 'pending');
    }
    /**
     * Get all sessions using a specific technique
     */
    getSessionsByTechnique(technique) {
        return Array.from(this.techniqueToSessions.get(technique) || []);
    }
    /**
     * Update session status
     */
    updateSessionStatus(sessionId, status) {
        this.sessionStatus.set(sessionId, status);
    }
    /**
     * Get session status
     */
    getSessionStatus(sessionId) {
        return this.sessionStatus.get(sessionId);
    }
    /**
     * Get all sessions with a specific status
     */
    getSessionsByStatus(status) {
        const sessions = [];
        for (const [sessionId, sessionStatus] of this.sessionStatus.entries()) {
            if (sessionStatus === status) {
                sessions.push(sessionId);
            }
        }
        return sessions;
    }
    /**
     * Remove a session from all indexes
     */
    removeSession(sessionId) {
        // Remove from technique indexes
        for (const sessions of this.techniqueToSessions.values()) {
            sessions.delete(sessionId);
        }
        // Remove from status
        this.sessionStatus.delete(sessionId);
    }
    /**
     * Clear all indexes
     */
    clear() {
        this.techniqueToSessions.clear();
        this.sessionStatus.clear();
    }
    /**
     * Get index statistics
     */
    getStats() {
        const techniqueDistribution = {};
        for (const [technique, sessions] of this.techniqueToSessions.entries()) {
            techniqueDistribution[technique] = sessions.size;
        }
        const statusDistribution = {};
        for (const status of this.sessionStatus.values()) {
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        }
        // Count total unique sessions
        const allSessions = new Set();
        for (const sessions of this.techniqueToSessions.values()) {
            for (const sessionId of sessions) {
                allSessions.add(sessionId);
            }
        }
        return {
            totalSessions: allSessions.size,
            techniqueDistribution: techniqueDistribution,
            statusDistribution,
        };
    }
}
//# sourceMappingURL=SessionIndex.js.map