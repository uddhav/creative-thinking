/**
 * Filesystem implementation of PersistenceAdapter
 */
import { PersistenceAdapter } from './adapter.js';
import { SessionState, SessionMetadata, ListOptions, SearchQuery, ExportFormat, PersistenceConfig } from './types.js';
/**
 * Filesystem-based persistence adapter
 * Stores sessions as JSON files in a directory structure
 */
export declare class FilesystemAdapter implements PersistenceAdapter {
    private basePath;
    private initialized;
    private config;
    initialize(config: PersistenceConfig): Promise<void>;
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
    private ensureInitialized;
    private validateSessionId;
    private getSessionPath;
    private getMetadataPath;
    private extractMetadata;
    private applyFilters;
    private applySorting;
    private sessionToMarkdown;
    private sessionToCSV;
}
//# sourceMappingURL=filesystem-adapter.d.ts.map