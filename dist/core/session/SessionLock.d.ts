/**
 * SessionLock - Provides async mutex functionality for session-level locking
 * Ensures thread-safe access to session data during concurrent requests
 * Supports technique-specific locking for parallel execution
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