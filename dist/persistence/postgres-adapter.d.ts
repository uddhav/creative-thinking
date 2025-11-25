/**
 * PostgreSQL persistence adapter for production deployments
 *
 * Designed for:
 * - Multi-server deployments with shared state
 * - Crash recovery with persistent sessions
 * - Horizontal scaling across server instances
 *
 * Uses JSONB for flexible schema and efficient querying
 * Includes automatic TTL cleanup for expired sessions
 */
import type { PersistenceAdapter } from './adapter.js';
import type { SessionState, SessionMetadata, ListOptions, SearchQuery, ExportFormat, PersistenceConfig } from './types.js';
/**
 * PostgreSQL adapter using JSONB for session storage
 */
export declare class PostgresAdapter implements PersistenceAdapter {
    private pool;
    private config;
    private initialized;
    initialize(config: PersistenceConfig): Promise<void>;
    /**
     * Create necessary tables if they don't exist
     */
    private createTablesIfNeeded;
    private ensureInitialized;
    save(sessionId: string, state: SessionState): Promise<void>;
    load(sessionId: string): Promise<SessionState | null>;
    delete(sessionId: string): Promise<boolean>;
    exists(sessionId: string): Promise<boolean>;
    list(options?: ListOptions): Promise<SessionMetadata[]>;
    search(query: SearchQuery): Promise<SessionMetadata[]>;
    saveBatch(sessions: Map<string, SessionState>): Promise<void>;
    deleteBatch(sessionIds: string[]): Promise<number>;
    export(sessionId: string, format: ExportFormat): Promise<Buffer>;
    import(data: Buffer, format: ExportFormat): Promise<string>;
    getStats(): Promise<{
        totalSessions: number;
        totalSize: number;
        oldestSession?: Date;
        newestSession?: Date;
    }>;
    cleanup(olderThan: Date): Promise<number>;
    close(): Promise<void>;
    /**
     * Helper: Extract metadata from session state
     */
    private extractMetadata;
    /**
     * Helper: Convert database row to SessionMetadata
     */
    private rowToMetadata;
    /**
     * Helper: Calculate session expiry (24 hours from now)
     */
    private calculateExpiry;
}
//# sourceMappingURL=postgres-adapter.d.ts.map