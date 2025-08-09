/**
 * SessionLock - Provides async mutex functionality for session-level locking
 * Ensures thread-safe access to session data during concurrent requests
 */
export declare class SessionLock {
    private locks;
    private lockQueues;
    /**
     * Acquire a lock for a specific session
     * @param sessionId The session to lock
     * @returns A release function that must be called to release the lock
     */
    acquireLock(sessionId: string): Promise<() => void>;
    /**
     * Execute a function with a lock held for the specified session
     * @param sessionId The session to lock
     * @param fn The async function to execute while holding the lock
     * @returns The result of the function
     */
    withLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Check if a session is currently locked
     * @param sessionId The session to check
     * @returns true if the session is locked
     */
    isLocked(sessionId: string): boolean;
    /**
     * Get the number of active locks
     * @returns The count of currently held locks
     */
    getActiveLockCount(): number;
    /**
     * Clear all locks (use with caution - mainly for testing)
     */
    clearAllLocks(): void;
}
export declare function getSessionLock(): SessionLock;
export declare function resetSessionLock(): void;
//# sourceMappingURL=SessionLock.d.ts.map