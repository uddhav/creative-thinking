/**
 * SessionLock - Provides async mutex functionality for session-level locking
 * Ensures thread-safe access to session data during concurrent requests
 */

export class SessionLock {
  private locks = new Map<string, Promise<void>>();
  private lockQueues = new Map<string, Array<() => void>>();

  /**
   * Acquire a lock for a specific session
   * @param sessionId The session to lock
   * @returns A release function that must be called to release the lock
   */
  async acquireLock(sessionId: string): Promise<() => void> {
    // Wait for any existing lock to be released
    while (this.locks.has(sessionId)) {
      await this.locks.get(sessionId);
    }

    // Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>(resolve => {
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
  async withLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
    const release = await this.acquireLock(sessionId);
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Check if a session is currently locked
   * @param sessionId The session to check
   * @returns true if the session is locked
   */
  isLocked(sessionId: string): boolean {
    return this.locks.has(sessionId);
  }

  /**
   * Get the number of active locks
   * @returns The count of currently held locks
   */
  getActiveLockCount(): number {
    return this.locks.size;
  }

  /**
   * Clear all locks (use with caution - mainly for testing)
   */
  clearAllLocks(): void {
    // Resolve all pending locks
    this.locks.clear();

    // Clear all queues
    this.lockQueues.clear();
  }
}

// Singleton instance for global session locking
let sessionLockInstance: SessionLock | null = null;

export function getSessionLock(): SessionLock {
  if (!sessionLockInstance) {
    sessionLockInstance = new SessionLock();
  }
  return sessionLockInstance;
}

// For testing purposes - reset the singleton
export function resetSessionLock(): void {
  if (sessionLockInstance) {
    sessionLockInstance.clearAllLocks();
  }
  sessionLockInstance = null;
}
