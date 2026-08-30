/**
 * SessionLock - async mutex keyed by `sessionId:technique`, falling back to
 * the bare `sessionId` when no technique is given.
 *
 * Serialises same-technique steps on one session while letting different
 * techniques advance concurrently — the purpose it was introduced for in the
 * parallel-execution work (#185). Two consequences of that keying are easy to
 * miss: different techniques on ONE session interleave freely, so this lock
 * does not make in-process same-session concurrency safe; and a bare-key hold
 * (SessionManager's own callers omit the technique) does not exclude a
 * technique-keyed hold, so those never serialise against the executor.
 *
 * Status: DEFENSIVE, by decision rather than by assumption (#354). Three
 * observable hunts could not distinguish it from a no-op in-process, and it
 * cannot protect cross-process use at all: each process constructs its own
 * instance, and concurrent CLI invocations against one session are
 * last-writer-wins on disk (measured, five runs of five). It is kept because
 * the atomicity that makes it unobservable today is a property of the current
 * code, not a contract. `session-lock-is-acquired.test.ts` pins that the
 * executor still takes it; removing the lock turns that test red by design.
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