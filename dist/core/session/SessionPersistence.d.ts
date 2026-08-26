/**
 * SessionPersistence - Handles session persistence operations
 * Extracted from SessionManager to improve maintainability
 */
import type { SessionData } from '../../types/index.js';
import type { PersistenceAdapter } from '../../persistence/adapter.js';
import type { SessionState } from '../../persistence/types.js';
import type { PersistedReflexivity } from '../ReflexivityTracker.js';
export declare class SessionPersistence {
    private persistenceAdapter;
    private initializationPromise;
    private isInitialized;
    /**
     * Initialize persistence adapter
     */
    initialize(): Promise<void>;
    /**
     * Initialize the persistence adapter
     */
    private initializePersistence;
    /**
     * Save session to persistent storage
     */
    saveSession(sessionId: string, session: SessionData, reflexivity?: PersistedReflexivity): Promise<void>;
    /**
     * Load session from persistent storage.
     *
     * Reflexivity is returned alongside rather than on the SessionData, because
     * it belongs to `ReflexivityTracker` and not to the session record — only
     * `SessionManager`, which owns both, can put it back.
     */
    loadSessionWithReflexivity(sessionId: string): Promise<{
        session: SessionData;
        reflexivity?: PersistedReflexivity;
    }>;
    /**
     * Load session from persistent storage, discarding tracker state.
     *
     * Kept for callers that only want the session record.
     */
    loadSession(sessionId: string): Promise<SessionData>;
    /**
     * List persisted sessions with optional filtering
     */
    listPersistedSessions(options?: {
        limit?: number;
        offset?: number;
        sortBy?: 'created' | 'updated' | 'name' | 'technique';
        order?: 'asc' | 'desc';
    }): Promise<SessionState[]>;
    /**
     * Delete a persisted session
     */
    deletePersistedSession(sessionId: string): Promise<void>;
    /**
     * Get the persistence adapter
     */
    getPersistenceAdapter(): PersistenceAdapter | null;
    /**
     * Convert SessionData to SessionState for persistence
     */
    private convertToSessionState;
    /**
     * Convert SessionState back to SessionData
     */
    private convertFromSessionState;
}
//# sourceMappingURL=SessionPersistence.d.ts.map