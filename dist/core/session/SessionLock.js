/**
 * SessionLock - Provides async mutex functionality for session-level locking
 * Ensures thread-safe access to session data during concurrent requests
 * Supports technique-specific locking for parallel execution
 */
export class SessionLock {
    locks = new Map();
    lockQueues = new Map();
    /**
     * Generate a lock key based on sessionId and optional technique
     * @param sessionId The session ID
     * @param technique Optional technique for technique-specific locking
     * @returns The lock key
     */
    getLockKey(sessionId, technique) {
        // If technique is provided, create a technique-specific lock key
        // This allows different techniques to run in parallel for the same plan
        return technique ? `${sessionId}:${technique}` : sessionId;
    }
    /**
     * Acquire a lock for a specific session or session-technique combination
     * @param sessionId The session to lock
     * @param technique Optional technique for technique-specific locking
     * @returns A release function that must be called to release the lock
     */
    async acquireLock(sessionId, technique) {
        const lockKey = this.getLockKey(sessionId, technique);
        // Wait for any existing lock to be released
        while (this.locks.has(lockKey)) {
            await this.locks.get(lockKey);
        }
        // Create new lock
        let releaseLock;
        const lockPromise = new Promise(resolve => {
            releaseLock = resolve;
        });
        this.locks.set(lockKey, lockPromise);
        // Return release function
        return () => {
            this.locks.delete(lockKey);
            releaseLock();
            // Process any queued requests
            const queue = this.lockQueues.get(lockKey);
            if (queue && queue.length > 0) {
                const next = queue.shift();
                if (next) {
                    next();
                }
                if (queue.length === 0) {
                    this.lockQueues.delete(lockKey);
                }
            }
        };
    }
    /**
     * Execute a function with a lock held for the specified session
     * @param sessionId The session to lock
     * @param fn The async function to execute while holding the lock
     * @param technique Optional technique for technique-specific locking
     * @returns The result of the function
     */
    async withLock(sessionId, fn, technique) {
        const release = await this.acquireLock(sessionId, technique);
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
     * @param technique Optional technique to check for technique-specific lock
     * @returns true if the session is locked
     */
    isLocked(sessionId, technique) {
        const lockKey = this.getLockKey(sessionId, technique);
        return this.locks.has(lockKey);
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