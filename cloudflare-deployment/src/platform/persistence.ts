/**
 * KV-backed persistence adapter for Cloudflare Workers.
 *
 * Implements the `PersistenceAdapter` interface from `../persistence/adapter.ts`
 * using Cloudflare KV as the backing store.
 *
 * Key layout:
 *   `session:{id}`         → JSON-serialized `SessionState`
 *   `index:session:{id}`   → JSON-serialized `SessionMetadata` (for listings)
 *
 * Notes:
 *   - KV has eventual consistency, ~1 write/sec/key, 7-day TTL default.
 *   - `search()` walks the index namespace with `kv.list()`; acceptable for
 *     a typical single-user MCP client session volume (tens to low hundreds).
 *   - `export()`/`import()` return Buffer-typed values for interface
 *     compatibility but always carry `string` content at runtime.
 */

import type { PersistenceAdapter } from '../persistence/adapter.js';
import type {
  SessionState,
  SessionMetadata,
  ListOptions,
  SearchQuery,
  ExportFormat,
  PersistenceConfig,
} from '../persistence/types.js';
import { PersistenceError, PersistenceErrorCode } from '../persistence/types.js';

const SESSION_PREFIX = 'session:';
const INDEX_PREFIX = 'index:session:';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export class KVPersistenceAdapter implements PersistenceAdapter {
  private kv: KVNamespace;
  private ttl: number;

  constructor(kv: KVNamespace, ttlSeconds: number = DEFAULT_TTL_SECONDS) {
    this.kv = kv;
    this.ttl = ttlSeconds;
  }

  async initialize(_config: PersistenceConfig): Promise<void> {
    // No-op: KV is already initialized by the Workers runtime.
  }

  async save(sessionId: string, state: SessionState): Promise<void> {
    try {
      const stateJson = JSON.stringify(state);
      const metadata = this.toMetadata(sessionId, state);
      const metadataJson = JSON.stringify(metadata);

      await Promise.all([
        this.kv.put(SESSION_PREFIX + sessionId, stateJson, { expirationTtl: this.ttl }),
        this.kv.put(INDEX_PREFIX + sessionId, metadataJson, { expirationTtl: this.ttl }),
      ]);
    } catch (err) {
      throw new PersistenceError(
        `Failed to save session ${sessionId}`,
        PersistenceErrorCode.IO_ERROR,
        err
      );
    }
  }

  async load(sessionId: string): Promise<SessionState | null> {
    try {
      const raw = await this.kv.get(SESSION_PREFIX + sessionId);
      if (raw === null) return null;
      return JSON.parse(raw) as SessionState;
    } catch (err) {
      throw new PersistenceError(
        `Failed to load session ${sessionId}`,
        PersistenceErrorCode.IO_ERROR,
        err
      );
    }
  }

  async delete(sessionId: string): Promise<boolean> {
    try {
      const existing = await this.kv.get(SESSION_PREFIX + sessionId);
      if (existing === null) return false;
      await Promise.all([
        this.kv.delete(SESSION_PREFIX + sessionId),
        this.kv.delete(INDEX_PREFIX + sessionId),
      ]);
      return true;
    } catch (err) {
      throw new PersistenceError(
        `Failed to delete session ${sessionId}`,
        PersistenceErrorCode.IO_ERROR,
        err
      );
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    const raw = await this.kv.get(SESSION_PREFIX + sessionId);
    return raw !== null;
  }

  async list(options?: ListOptions): Promise<SessionMetadata[]> {
    const items: SessionMetadata[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.kv.list({ prefix: INDEX_PREFIX, cursor });
      for (const key of result.keys) {
        const raw = await this.kv.get(key.name);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as SessionMetadata;
            items.push(this.reviveMetadata(parsed));
          } catch {
            // Skip corrupted entries
          }
        }
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return this.applyListOptions(items, options);
  }

  async search(query: SearchQuery): Promise<SessionMetadata[]> {
    const all = await this.list();
    const text = query.text?.toLowerCase();
    const problem = query.problem?.toLowerCase();

    return all.filter(m => {
      const checks: boolean[] = [];
      if (text) {
        checks.push(
          m.problem.toLowerCase().includes(text) ||
            (m.name?.toLowerCase().includes(text) ?? false) ||
            m.tags.some(t => t.toLowerCase().includes(text))
        );
      }
      if (problem) {
        checks.push(m.problem.toLowerCase().includes(problem));
      }
      if (checks.length === 0) return true;
      return query.matchAll ? checks.every(Boolean) : checks.some(Boolean);
    });
  }

  async saveBatch(sessions: Map<string, SessionState>): Promise<void> {
    const tasks: Promise<void>[] = [];
    for (const [id, state] of sessions) {
      tasks.push(this.save(id, state));
    }
    await Promise.all(tasks);
  }

  async deleteBatch(sessionIds: string[]): Promise<number> {
    const results = await Promise.all(sessionIds.map(id => this.delete(id)));
    return results.filter(Boolean).length;
  }

  async export(sessionId: string, format: ExportFormat): Promise<Buffer> {
    const state = await this.load(sessionId);
    if (!state) {
      throw new PersistenceError(`Session ${sessionId} not found`, PersistenceErrorCode.NOT_FOUND);
    }

    let content: string;
    switch (format) {
      case 'json':
        content = JSON.stringify(state, null, 2);
        break;
      case 'markdown':
        content = this.exportAsMarkdown(state);
        break;
      case 'csv':
        content = this.exportAsCsv(state);
        break;
      default:
        throw new PersistenceError(
          `Unsupported format: ${format}`,
          PersistenceErrorCode.EXPORT_FAILED
        );
    }

    // `Buffer` type is covered by `nodejs_compat`. Return a string that
    // satisfies the declared interface; downstream MCP code reads `.toString()`.
    return Buffer.from(content, 'utf-8');
  }

  async import(data: Buffer, format: ExportFormat): Promise<string> {
    if (format !== 'json') {
      throw new PersistenceError(
        `Only JSON import is supported in Workers`,
        PersistenceErrorCode.INVALID_FORMAT
      );
    }

    try {
      const state = JSON.parse(data.toString('utf-8')) as SessionState;
      await this.save(state.id, state);
      return state.id;
    } catch (err) {
      throw new PersistenceError(
        `Failed to import session`,
        PersistenceErrorCode.INVALID_FORMAT,
        err
      );
    }
  }

  async getStats(): Promise<{
    totalSessions: number;
    totalSize: number;
    oldestSession?: Date;
    newestSession?: Date;
  }> {
    const all = await this.list();
    let oldest: Date | undefined;
    let newest: Date | undefined;
    for (const m of all) {
      if (!oldest || m.createdAt < oldest) oldest = m.createdAt;
      if (!newest || m.createdAt > newest) newest = m.createdAt;
    }
    return {
      totalSessions: all.length,
      totalSize: 0, // KV does not expose per-key byte counts cheaply
      oldestSession: oldest,
      newestSession: newest,
    };
  }

  async cleanup(olderThan: Date): Promise<number> {
    const all = await this.list();
    const stale = all.filter(m => m.updatedAt < olderThan).map(m => m.id);
    return this.deleteBatch(stale);
  }

  async close(): Promise<void> {
    // No-op: KV connection is managed by the runtime.
  }

  // ---- helpers ----

  private toMetadata(sessionId: string, state: SessionState): SessionMetadata {
    const now = new Date();
    const insights = Array.isArray(state.insights) ? state.insights.length : 0;
    const branches = state.branches ? Object.keys(state.branches).length : 0;
    return {
      id: sessionId,
      name: state.name,
      problem: state.problem,
      technique: state.technique,
      createdAt: state.startTime ? new Date(state.startTime) : now,
      updatedAt: now,
      completedAt: state.endTime ? new Date(state.endTime) : undefined,
      status: state.endTime ? 'completed' : 'active',
      stepsCompleted: state.currentStep,
      totalSteps: state.totalSteps,
      tags: state.tags ?? [],
      insights,
      branches,
      metrics: state.metrics,
    };
  }

  private reviveMetadata(m: SessionMetadata): SessionMetadata {
    return {
      ...m,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
      completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
    };
  }

  private applyListOptions(items: SessionMetadata[], options?: ListOptions): SessionMetadata[] {
    let filtered = items;

    if (options?.filter) {
      const { technique, status, dateRange, tags } = options.filter;
      filtered = filtered.filter(m => {
        if (technique && m.technique !== technique) return false;
        if (status && m.status !== status) return false;
        if (dateRange && (m.createdAt < dateRange.start || m.createdAt > dateRange.end))
          return false;
        if (tags && tags.length > 0 && !tags.some(t => m.tags.includes(t))) return false;
        return true;
      });
    }

    const sortBy = options?.sortBy ?? 'updated';
    const sortOrder = options?.sortOrder ?? 'desc';
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'created':
          cmp = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updated':
          cmp = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'name':
          cmp = (a.name ?? '').localeCompare(b.name ?? '');
          break;
        case 'technique':
          cmp = a.technique.localeCompare(b.technique);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? filtered.length;
    return filtered.slice(offset, offset + limit);
  }

  private exportAsMarkdown(state: SessionState): string {
    const lines: string[] = [];
    lines.push(`# ${state.name ?? 'Session ' + state.id}`);
    lines.push('');
    lines.push(`**Technique:** ${state.technique}`);
    lines.push(`**Problem:** ${state.problem}`);
    lines.push(`**Step:** ${state.currentStep}/${state.totalSteps}`);
    lines.push('');
    lines.push('## History');
    for (const entry of state.history) {
      lines.push(`### Step ${entry.step}`);
      lines.push(`_${entry.timestamp}_`);
      lines.push('');
      lines.push(entry.output.output || '');
      lines.push('');
    }
    if (state.insights.length > 0) {
      lines.push('## Insights');
      for (const i of state.insights) lines.push(`- ${i}`);
    }
    return lines.join('\n');
  }

  private exportAsCsv(state: SessionState): string {
    const rows: string[] = ['step,timestamp,technique,output'];
    for (const entry of state.history) {
      const output = (entry.output.output || '').replace(/"/g, '""');
      rows.push(`${entry.step},${entry.timestamp},${state.technique},"${output}"`);
    }
    return rows.join('\n');
  }
}
