/**
 * Filesystem implementation of PersistenceAdapter
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { PersistenceAdapter } from './adapter.js';
import {
  SessionState,
  SessionMetadata,
  ListOptions,
  SearchQuery,
  ExportFormat,
  PersistenceConfig,
  PersistenceError,
  PersistenceErrorCode,
  StorageFormat
} from './types.js';
import { ExportFactory } from '../export/index.js';

/**
 * Filesystem-based persistence adapter
 * Stores sessions as JSON files in a directory structure
 */
export class FilesystemAdapter implements PersistenceAdapter {
  private basePath: string = '';
  private initialized: boolean = false;
  private config: PersistenceConfig | null = null;

  async initialize(config: PersistenceConfig): Promise<void> {
    if (this.initialized) {
      throw new PersistenceError(
        'Adapter already initialized',
        PersistenceErrorCode.ALREADY_EXISTS
      );
    }

    this.config = config;
    
    // Validate and sanitize the base path
    const providedPath = config.options.path || path.join(process.cwd(), '.creative-thinking');
    
    // Resolve to absolute path and normalize
    this.basePath = path.resolve(path.normalize(providedPath));
    
    // Ensure the path doesn't contain dangerous patterns
    if (this.basePath.includes('..') || !path.isAbsolute(this.basePath)) {
      throw new PersistenceError(
        'Invalid base path: Path traversal detected',
        PersistenceErrorCode.PERMISSION_DENIED
      );
    }

    // Create base directory if it doesn't exist
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      await fs.mkdir(path.join(this.basePath, 'sessions'), { recursive: true });
      await fs.mkdir(path.join(this.basePath, 'metadata'), { recursive: true });
      this.initialized = true;
    } catch (error) {
      throw new PersistenceError(
        `Failed to initialize filesystem adapter: ${error}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async save(sessionId: string, state: SessionState): Promise<void> {
    this.ensureInitialized();

    const sessionPath = this.getSessionPath(sessionId);
    const metadataPath = this.getMetadataPath(sessionId);

    try {
      // Save full session state
      const sessionData: StorageFormat & { data: SessionState } = {
        version: '1.0.0',
        format: 'json',
        compressed: false,
        encrypted: false,
        data: state
      };

      // Serialize and check size limit (10MB max)
      const serialized = JSON.stringify(sessionData, null, 2);
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      
      if (Buffer.byteLength(serialized, 'utf8') > MAX_FILE_SIZE) {
        throw new PersistenceError(
          `Session data too large: exceeds ${MAX_FILE_SIZE} bytes limit`,
          PersistenceErrorCode.STORAGE_FULL
        );
      }

      await fs.writeFile(
        sessionPath,
        serialized,
        'utf8'
      );

      // Save metadata for fast listing
      const metadata = this.extractMetadata(state);
      await fs.writeFile(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        'utf8'
      );
    } catch (error) {
      throw new PersistenceError(
        `Failed to save session ${sessionId}: ${error}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async load(sessionId: string): Promise<SessionState | null> {
    this.ensureInitialized();

    const sessionPath = this.getSessionPath(sessionId);

    try {
      const data = await fs.readFile(sessionPath, 'utf8');
      const parsed = JSON.parse(data) as StorageFormat & { data: SessionState };
      
      // Version checking for future migrations
      if (parsed.version !== '1.0.0') {
        console.warn(`Loading session with version ${parsed.version}, current version is 1.0.0`);
      }

      return parsed.data;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new PersistenceError(
        `Failed to load session ${sessionId}: ${error}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async delete(sessionId: string): Promise<boolean> {
    this.ensureInitialized();

    const sessionPath = this.getSessionPath(sessionId);
    const metadataPath = this.getMetadataPath(sessionId);

    try {
      await fs.unlink(sessionPath);
      await fs.unlink(metadataPath).catch(() => {}); // Ignore metadata deletion errors
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw new PersistenceError(
        `Failed to delete session ${sessionId}: ${error}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    this.ensureInitialized();

    const sessionPath = this.getSessionPath(sessionId);
    
    try {
      await fs.access(sessionPath);
      return true;
    } catch {
      return false;
    }
  }

  async list(options?: ListOptions): Promise<SessionMetadata[]> {
    this.ensureInitialized();

    const metadataDir = path.join(this.basePath, 'metadata');
    
    try {
      const files = await fs.readdir(metadataDir);
      const metadataPromises = files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const content = await fs.readFile(path.join(metadataDir, file), 'utf8');
          return JSON.parse(content) as SessionMetadata;
        });

      let metadata = await Promise.all(metadataPromises);

      // Apply filters
      if (options?.filter) {
        metadata = this.applyFilters(metadata, options.filter);
      }

      // Apply sorting
      if (options?.sortBy) {
        metadata = this.applySorting(metadata, options.sortBy, options.sortOrder);
      }

      // Apply pagination
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0;
        const limit = options.limit || metadata.length;
        metadata = metadata.slice(offset, offset + limit);
      }

      return metadata;
    } catch (error) {
      throw new PersistenceError(
        `Failed to list sessions: ${error}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async search(query: SearchQuery): Promise<SessionMetadata[]> {
    this.ensureInitialized();

    // For filesystem adapter, we need to load each session to search
    // This is inefficient but works for small to medium datasets
    const allMetadata = await this.list();
    const results: SessionMetadata[] = [];

    for (const metadata of allMetadata) {
      const session = await this.load(metadata.id);
      if (!session) continue;

      let matches = false;

      // Search in different fields
      if (query.text) {
        const searchText = query.text.toLowerCase();
        const searchableContent = [
          session.problem,
          ...session.history.map(h => h.output),
          ...session.insights
        ].join(' ').toLowerCase();

        matches = searchableContent.includes(searchText);
      }

      if (query.problem && session.problem.toLowerCase().includes(query.problem.toLowerCase())) {
        matches = query.matchAll ? matches : true;
      }

      if (matches) {
        results.push(metadata);
      }
    }

    return results;
  }

  async saveBatch(sessions: Map<string, SessionState>): Promise<void> {
    const promises = Array.from(sessions.entries()).map(([id, state]) =>
      this.save(id, state)
    );
    await Promise.all(promises);
  }

  async deleteBatch(sessionIds: string[]): Promise<number> {
    const results = await Promise.all(
      sessionIds.map(id => this.delete(id))
    );
    return results.filter(Boolean).length;
  }

  async export(sessionId: string, format: ExportFormat): Promise<Buffer> {
    this.ensureInitialized();

    const session = await this.load(sessionId);
    if (!session) {
      throw new PersistenceError(
        `Session ${sessionId} not found`,
        PersistenceErrorCode.NOT_FOUND
      );
    }

    try {
      // Use the new export factory
      const result = await ExportFactory.export(session, format);
      
      // Convert string content to Buffer if needed
      if (typeof result.content === 'string') {
        return Buffer.from(result.content);
      }
      
      return result.content;
    } catch (error) {
      throw new PersistenceError(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`,
        PersistenceErrorCode.EXPORT_FAILED
      );
    }
  }

  async import(data: Buffer, format: ExportFormat): Promise<string> {
    this.ensureInitialized();

    let session: SessionState;

    try {
      switch (format) {
        case 'json':
          session = JSON.parse(data.toString()) as SessionState;
          break;
        
        default:
          throw new PersistenceError(
            `Import not supported for format: ${format}`,
            PersistenceErrorCode.INVALID_FORMAT
          );
      }

      // Generate new ID for imported session
      session.id = `session_${randomUUID()}`;
      await this.save(session.id, session);
      return session.id;
    } catch (error) {
      throw new PersistenceError(
        `Failed to import session: ${error}`,
        PersistenceErrorCode.INVALID_FORMAT,
        error
      );
    }
  }

  async getStats(): Promise<{
    totalSessions: number;
    totalSize: number;
    oldestSession?: Date;
    newestSession?: Date;
  }> {
    this.ensureInitialized();

    const sessionsDir = path.join(this.basePath, 'sessions');
    const files = await fs.readdir(sessionsDir);
    
    let totalSize = 0;
    let oldestTime: number | undefined;
    let newestTime: number | undefined;

    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;

      const mtime = stats.mtime.getTime();
      if (!oldestTime || mtime < oldestTime) oldestTime = mtime;
      if (!newestTime || mtime > newestTime) newestTime = mtime;
    }

    return {
      totalSessions: files.length,
      totalSize,
      oldestSession: oldestTime ? new Date(oldestTime) : undefined,
      newestSession: newestTime ? new Date(newestTime) : undefined
    };
  }

  async cleanup(olderThan: Date): Promise<number> {
    this.ensureInitialized();

    const metadata = await this.list();
    const toDelete = metadata
      .filter(m => m.updatedAt < olderThan)
      .map(m => m.id);

    return this.deleteBatch(toDelete);
  }

  async close(): Promise<void> {
    // No resources to clean up for filesystem adapter
    this.initialized = false;
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new PersistenceError(
        'Adapter not initialized',
        PersistenceErrorCode.INVALID_FORMAT
      );
    }
  }

  private validateSessionId(sessionId: string): void {
    // Allow only alphanumeric, underscore, and hyphen
    const validIdPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (!sessionId || !validIdPattern.test(sessionId)) {
      throw new PersistenceError(
        'Invalid session ID: Must contain only alphanumeric characters, underscores, and hyphens',
        PersistenceErrorCode.INVALID_FORMAT
      );
    }
    
    if (sessionId.length > 255) {
      throw new PersistenceError(
        'Invalid session ID: Too long (max 255 characters)',
        PersistenceErrorCode.INVALID_FORMAT
      );
    }
  }

  private getSessionPath(sessionId: string): string {
    this.validateSessionId(sessionId);
    const safePath = path.join(this.basePath, 'sessions', `${sessionId}.json`);
    
    // Double-check the resulting path is within basePath
    const resolvedPath = path.resolve(safePath);
    if (!resolvedPath.startsWith(this.basePath)) {
      throw new PersistenceError(
        'Invalid session path: Path traversal detected',
        PersistenceErrorCode.PERMISSION_DENIED
      );
    }
    
    return resolvedPath;
  }

  private getMetadataPath(sessionId: string): string {
    this.validateSessionId(sessionId);
    const safePath = path.join(this.basePath, 'metadata', `${sessionId}.json`);
    
    // Double-check the resulting path is within basePath
    const resolvedPath = path.resolve(safePath);
    if (!resolvedPath.startsWith(this.basePath)) {
      throw new PersistenceError(
        'Invalid metadata path: Path traversal detected',
        PersistenceErrorCode.PERMISSION_DENIED
      );
    }
    
    return resolvedPath;
  }

  private extractMetadata(state: SessionState): SessionMetadata {
    const now = new Date();
    const status = state.endTime ? 'completed' : 'active';
    
    return {
      id: state.id,
      name: state.name,
      problem: state.problem,
      technique: state.technique,
      createdAt: state.startTime ? new Date(state.startTime) : now,
      updatedAt: now,
      completedAt: state.endTime ? new Date(state.endTime) : undefined,
      status,
      stepsCompleted: state.currentStep,
      totalSteps: state.totalSteps,
      tags: state.tags || [],
      insights: state.insights.length,
      branches: Object.keys(state.branches).length,
      metrics: state.metrics
    };
  }

  private applyFilters(
    metadata: SessionMetadata[],
    filter: ListOptions['filter']
  ): SessionMetadata[] {
    return metadata.filter(m => {
      if (filter?.technique && m.technique !== filter.technique) return false;
      if (filter?.status && m.status !== filter.status) return false;
      if (filter?.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every(tag => m.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      if (filter?.dateRange) {
        if (m.updatedAt < filter.dateRange.start || m.updatedAt > filter.dateRange.end) {
          return false;
        }
      }
      return true;
    });
  }

  private applySorting(
    metadata: SessionMetadata[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): SessionMetadata[] {
    const sorted = [...metadata].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'technique':
          comparison = a.technique.localeCompare(b.technique);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

}