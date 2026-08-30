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
export declare class SessionLock {
    private locks;
    private lockQueues;
    /**
     * Generate a lock key based on sessionId and optional technique
     * @param sessionId The session ID
     * @param technique Optional technique for technique-specific locking
     * @returns The lock key
     */
    private getLockKey;
    /**
     * Acquire a lock for a specific session or session-technique combination
     * @param sessionId The session to lock
     * @param technique Optional technique for technique-specific locking
     * @returns A release function that must be called to release the lock
     */
    acquireLock(sessionId: string, technique?: string): Promise<() => void>;
    /**
     * Execute a function with a lock held for the specified session
     * @param sessionId The session to lock
     * @param fn The async function to execute while holding the lock
     * @param technique Optional technique for technique-specific locking
     * @returns The result of the function
     */
    withLock<T>(sessionId: string, fn: () => Promise<T>, technique?: string): Promise<T>;
    /**
     * Check if a session is currently locked
     * @param sessionId The session to check
     * @param technique Optional technique to check for technique-specific lock
     * @returns true if the session is locked
     */
    isLocked(sessionId: string, technique?: string): boolean;
    /**
     * Get the number of active locks
     * @returns The count of currently held locks
     */
    getActiveLockCount(): number;
    /**
     * Clear all locks (use with caution - mainly for testing and shutdown)
     */
    clearAllLocks(): void;
    /**
     * Destroy the session lock instance and clean up resources
     * Used during server shutdown
     */
    destroy(): void;
}
export declare function getSessionLock(): SessionLock;
export declare function resetSessionLock(): void;
//# sourceMappingURL=SessionLock.d.ts.map