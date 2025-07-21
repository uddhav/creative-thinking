/**
 * Core persistence adapter interface
 */
import type { SessionState, SessionMetadata, ListOptions, SearchQuery, ExportFormat, PersistenceConfig } from './types.js';
/**
 * Abstract interface for session persistence
 * Implementations can use filesystem, database, or cloud storage
 */
export interface PersistenceAdapter {
    /**
     * Initialize the adapter with configuration
     */
    initialize(config: PersistenceConfig): Promise<void>;
    /**
     * Save a session state
     * @param sessionId - Unique session identifier
     * @param state - Session state to save
     * @throws PersistenceError if save fails
     */
    save(sessionId: string, state: SessionState): Promise<void>;
    /**
     * Load a session state
     * @param sessionId - Session identifier to load
     * @returns Session state or null if not found
     */
    load(sessionId: string): Promise<SessionState | null>;
    /**
     * Delete a session
     * @param sessionId - Session identifier to delete
     * @returns True if deleted, false if not found
     */
    delete(sessionId: string): Promise<boolean>;
    /**
     * Check if a session exists
     * @param sessionId - Session identifier to check
     * @returns True if exists
     */
    exists(sessionId: string): Promise<boolean>;
    /**
     * List sessions with optional filtering
     * @param options - Listing options
     * @returns Array of session metadata
     */
    list(options?: ListOptions): Promise<SessionMetadata[]>;
    /**
     * Search sessions by content
     * @param query - Search query
     * @returns Array of matching session metadata
     */
    search(query: SearchQuery): Promise<SessionMetadata[]>;
    /**
     * Save multiple sessions in batch
     * @param sessions - Map of sessionId to SessionState
     * @throws PersistenceError if any save fails
     */
    saveBatch(sessions: Map<string, SessionState>): Promise<void>;
    /**
     * Delete multiple sessions in batch
     * @param sessionIds - Array of session IDs to delete
     * @returns Number of sessions deleted
     */
    deleteBatch(sessionIds: string[]): Promise<number>;
    /**
     * Export a session in specified format
     * @param sessionId - Session to export
     * @param format - Export format
     * @returns Exported data as Buffer
     */
    export(sessionId: string, format: ExportFormat): Promise<Buffer>;
    /**
     * Import a session from exported data
     * @param data - Exported data
     * @param format - Format of the data
     * @returns Session ID of imported session
     */
    import(data: Buffer, format: ExportFormat): Promise<string>;
    /**
     * Get storage statistics
     * @returns Storage usage information
     */
    getStats(): Promise<{
        totalSessions: number;
        totalSize: number;
        oldestSession?: Date;
        newestSession?: Date;
    }>;
    /**
     * Clean up old sessions
     * @param olderThan - Delete sessions older than this date
     * @returns Number of sessions deleted
     */
    cleanup(olderThan: Date): Promise<number>;
    /**
     * Close the adapter and clean up resources
     */
    close(): Promise<void>;
}
/**
 * Factory function type for creating adapters
 */
export type AdapterFactory = (config: PersistenceConfig) => Promise<PersistenceAdapter>;
//# sourceMappingURL=adapter.d.ts.map