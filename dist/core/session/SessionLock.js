/**
 * SessionLock - Provides async mutex functionality for session-level locking
 * Ensures thread-safe access to session data during concurrent requests
 */
export class SessionLock {
    locks = new Map();
    lockQueues = new Map();
    /**
     * Acquire a lock for a specific session
     * @param sessionId The session to lock
     * @returns A release function that must be called to release the lock
     */
    async acquireLock(sessionId) {
        // Wait for any existing lock to be released
        while (this.locks.has(sessionId)) {
            await this.locks.get(sessionId);
        }
        // Create new lock
        let releaseLock;
        const lockPromise = new Promise(resolve => {
            releaseLock = resolve;
        });
        this.locks.set(sessionId, lockPromise);
        // Return release function
        return () => {
            this.locks.delete(sessionId);
            releaseLock();
            // Process any queued requests
            const queue = this.lockQueues.get(sessionId);
            if (queue && queue.length > 0) {
                const next = queue.shift();
                if (next) {
                    next();
                }
                if (queue.length === 0) {
                    this.lockQueues.delete(sessionId);
                }
            }
        };
    }
    /**
     * Execute a function with a lock held for the specified session
     * @param sessionId The session to lock
     * @param fn The async function to execute while holding the lock
     * @returns The result of the function
     */
    async withLock(sessionId, fn) {
        const release = await this.acquireLock(sessionId);
        try {
            return await fn();
        }
        finally {
            release();
        }
    }
    /**
     * Check if a session is currently locked
     * @param sessionId The session to check
     * @returns true if the session is locked
     */
    isLocked(sessionId) {
        return this.locks.has(sessionId);
    }
    /**
     * Get the number of active locks
     * @returns The count of currently held locks
     */
    getActiveLockCount() {
        return this.locks.size;
    }
    /**
     * Clear all locks (use with caution - mainly for testing and shutdown)
     */
    clearAllLocks() {
        // Resolve all pending lock promises to unblock any waiting operations
        for (const [sessionId] of this.locks.entries()) {
            // Force resolve the lock promise
            const queue = this.lockQueues.get(sessionId);
            if (queue && queue.length > 0) {
                // Resolve all queued callbacks
                queue.forEach(callback => callback());
            }
        }
        // Clear all locks
        this.locks.clear();
        // Clear all queues
        this.lockQueues.clear();
    }
    /**
     * Destroy the session lock instance and clean up resources
     * Used during server shutdown
     */
    destroy() {
        console.error(`[SessionLock] Destroying, clearing ${this.locks.size} active locks`);
        this.clearAllLocks();
    }
}
// Singleton instance for global session locking
let sessionLockInstance = null;
export function getSessionLock() {
    if (!sessionLockInstance) {
        sessionLockInstance = new SessionLock();
    }
    return sessionLockInstance;
}
// For testing purposes - reset the singleton
export function resetSessionLock() {
    if (sessionLockInstance) {
        sessionLockInstance.clearAllLocks();
    }
    sessionLockInstance = null;
}
//# sourceMappingURL=SessionLock.js.map