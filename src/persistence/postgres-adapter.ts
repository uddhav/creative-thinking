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

import pkg from 'pg';
const { Pool } = pkg;
import type { PoolClient } from 'pg';
import type { PersistenceAdapter } from './adapter.js';
import type {
  SessionState,
  SessionMetadata,
  ListOptions,
  SearchQuery,
  ExportFormat,
  PersistenceConfig,
} from './types.js';
import { PersistenceError, PersistenceErrorCode } from './types.js';

/**
 * Database row structure for session metadata
 */
interface SessionRow {
  id: string;
  name: string | null;
  problem: string;
  technique: string;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  status: string;
  steps_completed: number;
  total_steps: number;
  tags: unknown;
  insights_count: number;
  branches_count: number;
  metrics: unknown;
}

/**
 * PostgreSQL adapter using JSONB for session storage
 */
export class PostgresAdapter implements PersistenceAdapter {
  private pool: pkg.Pool | null = null;
  private config: PersistenceConfig['options'] | null = null;
  private initialized = false;

  async initialize(config: PersistenceConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.config = config.options;
    const connectionString = config.options.connectionString || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new PersistenceError(
        'PostgreSQL connection string not provided',
        PersistenceErrorCode.INVALID_FORMAT,
        { config }
      );
    }

    // Create connection pool
    this.pool = new Pool({
      connectionString,
      // Recommended pool settings for production
      max: 20, // maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await this.createTablesIfNeeded(client);
      client.release();
      this.initialized = true;
    } catch (error) {
      throw new PersistenceError(
        'Failed to connect to PostgreSQL',
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  /**
   * Create necessary tables if they don't exist
   */
  private async createTablesIfNeeded(client: PoolClient): Promise<void> {
    // Main sessions table using JSONB for flexible schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS creative_sessions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500),
        problem TEXT NOT NULL,
        technique VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',

        -- Full session state as JSONB
        state JSONB NOT NULL,

        -- Denormalized metadata for efficient querying
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,

        steps_completed INTEGER NOT NULL DEFAULT 0,
        total_steps INTEGER NOT NULL DEFAULT 0,
        insights_count INTEGER NOT NULL DEFAULT 0,
        branches_count INTEGER NOT NULL DEFAULT 0,

        -- JSONB fields for queryable data
        tags JSONB DEFAULT '[]'::JSONB,
        metrics JSONB DEFAULT '{}'::JSONB,

        -- TTL support for automatic cleanup
        expires_at TIMESTAMP
      )
    `);

    // Indexes for efficient querying
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_status
      ON creative_sessions(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_technique
      ON creative_sessions(technique)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_created
      ON creative_sessions(created_at DESC)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_updated
      ON creative_sessions(updated_at DESC)
    `);

    // GIN index for JSONB full-text search
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_state_gin
      ON creative_sessions USING GIN(state)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_tags_gin
      ON creative_sessions USING GIN(tags)
    `);

    // Index for TTL cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_expires
      ON creative_sessions(expires_at)
      WHERE expires_at IS NOT NULL
    `);

    // Auto-update updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_updated_at ON creative_sessions
    `);

    await client.query(`
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON creative_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at()
    `);
  }

  private ensureInitialized(): pkg.Pool {
    if (!this.initialized || !this.pool) {
      throw new PersistenceError('Adapter not initialized', PersistenceErrorCode.IO_ERROR);
    }
    return this.pool;
  }

  async save(sessionId: string, state: SessionState): Promise<void> {
    const pool = this.ensureInitialized();

    const metadata = this.extractMetadata(state);
    const expiresAt = this.calculateExpiry();

    const query = `
      INSERT INTO creative_sessions (
        id, name, problem, technique, status,
        state, steps_completed, total_steps,
        insights_count, branches_count, tags, metrics,
        completed_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6::jsonb, $7, $8,
        $9, $10, $11::jsonb, $12::jsonb,
        $13, $14
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        problem = EXCLUDED.problem,
        technique = EXCLUDED.technique,
        status = EXCLUDED.status,
        state = EXCLUDED.state,
        steps_completed = EXCLUDED.steps_completed,
        total_steps = EXCLUDED.total_steps,
        insights_count = EXCLUDED.insights_count,
        branches_count = EXCLUDED.branches_count,
        tags = EXCLUDED.tags,
        metrics = EXCLUDED.metrics,
        completed_at = EXCLUDED.completed_at,
        expires_at = EXCLUDED.expires_at
    `;

    const values = [
      sessionId,
      state.name || null,
      state.problem,
      state.technique,
      metadata.status,
      JSON.stringify(state),
      metadata.stepsCompleted,
      state.totalSteps,
      state.insights?.length || 0,
      Object.keys(state.branches || {}).length,
      JSON.stringify(metadata.tags),
      JSON.stringify(state.metrics || {}),
      metadata.completedAt || null,
      expiresAt,
    ];

    try {
      await pool.query(query, values);
    } catch (error) {
      throw new PersistenceError(
        `Failed to save session ${sessionId}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async load(sessionId: string): Promise<SessionState | null> {
    const pool = this.ensureInitialized();

    const query = 'SELECT state FROM creative_sessions WHERE id = $1';

    try {
      const result = await pool.query(query, [sessionId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as { state: SessionState };
      return row.state;
    } catch (error) {
      throw new PersistenceError(
        `Failed to load session ${sessionId}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async delete(sessionId: string): Promise<boolean> {
    const pool = this.ensureInitialized();

    const query = 'DELETE FROM creative_sessions WHERE id = $1';

    try {
      const result = await pool.query(query, [sessionId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      throw new PersistenceError(
        `Failed to delete session ${sessionId}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    const pool = this.ensureInitialized();

    const query = 'SELECT 1 FROM creative_sessions WHERE id = $1';

    try {
      const result = await pool.query(query, [sessionId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new PersistenceError(
        `Failed to check session existence ${sessionId}`,
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async list(options: ListOptions = {}): Promise<SessionMetadata[]> {
    const pool = this.ensureInitialized();

    const { limit = 100, offset = 0, sortBy = 'updated', sortOrder = 'desc', filter } = options;

    let query = `
      SELECT
        id, name, problem, technique, status,
        created_at, updated_at, completed_at,
        steps_completed, total_steps,
        insights_count, branches_count,
        tags, metrics
      FROM creative_sessions
      WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filter?.technique) {
      query += ` AND technique = $${paramIndex}`;
      params.push(filter.technique);
      paramIndex++;
    }

    if (filter?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filter.status);
      paramIndex++;
    }

    if (filter?.dateRange) {
      query += ` AND created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
      params.push(filter.dateRange.start, filter.dateRange.end);
      paramIndex += 2;
    }

    if (filter?.tags && filter.tags.length > 0) {
      query += ` AND tags ?| $${paramIndex}`;
      params.push(filter.tags);
      paramIndex++;
    }

    // Sorting
    const sortColumn =
      sortBy === 'created'
        ? 'created_at'
        : sortBy === 'updated'
          ? 'updated_at'
          : sortBy === 'name'
            ? 'name'
            : 'technique';
    query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      return result.rows.map((row: SessionRow) => this.rowToMetadata(row));
    } catch (error) {
      throw new PersistenceError('Failed to list sessions', PersistenceErrorCode.IO_ERROR, error);
    }
  }

  async search(query: SearchQuery): Promise<SessionMetadata[]> {
    const pool = this.ensureInitialized();

    let sql = `
      SELECT
        id, name, problem, technique, status,
        created_at, updated_at, completed_at,
        steps_completed, total_steps,
        insights_count, branches_count,
        tags, metrics
      FROM creative_sessions
      WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (query.problem) {
      conditions.push(`problem ILIKE $${paramIndex}`);
      params.push(`%${query.problem}%`);
      paramIndex++;
    }

    if (query.outputs) {
      conditions.push(`state::text ILIKE $${paramIndex}`);
      params.push(`%${query.outputs}%`);
      paramIndex++;
    }

    if (query.insights) {
      conditions.push(`state->'insights' @> $${paramIndex}::jsonb`);
      params.push(JSON.stringify([query.insights]));
      paramIndex++;
    }

    if (query.text) {
      conditions.push(`(
        problem ILIKE $${paramIndex} OR
        state::text ILIKE $${paramIndex}
      )`);
      params.push(`%${query.text}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const operator = query.matchAll ? ' AND ' : ' OR ';
      sql += ` AND (${conditions.join(operator)})`;
    }

    sql += ' ORDER BY updated_at DESC LIMIT 100';

    try {
      const result = await pool.query(sql, params);
      return result.rows.map((row: SessionRow) => this.rowToMetadata(row));
    } catch (error) {
      throw new PersistenceError('Failed to search sessions', PersistenceErrorCode.IO_ERROR, error);
    }
  }

  async saveBatch(sessions: Map<string, SessionState>): Promise<void> {
    const pool = this.ensureInitialized();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const [sessionId, state] of sessions) {
        await this.save(sessionId, state);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new PersistenceError('Failed to save batch', PersistenceErrorCode.IO_ERROR, error);
    } finally {
      client.release();
    }
  }

  async deleteBatch(sessionIds: string[]): Promise<number> {
    const pool = this.ensureInitialized();

    const query = 'DELETE FROM creative_sessions WHERE id = ANY($1)';

    try {
      const result = await pool.query(query, [sessionIds]);
      return result.rowCount ?? 0;
    } catch (error) {
      throw new PersistenceError('Failed to delete batch', PersistenceErrorCode.IO_ERROR, error);
    }
  }

  async export(sessionId: string, format: ExportFormat): Promise<Buffer> {
    const state = await this.load(sessionId);

    if (!state) {
      throw new PersistenceError(`Session ${sessionId} not found`, PersistenceErrorCode.NOT_FOUND);
    }

    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(state, null, 2));

      case 'markdown':
      case 'csv':
        throw new PersistenceError(
          `Export format ${format} not yet implemented`,
          PersistenceErrorCode.EXPORT_FAILED
        );

      default:
        throw new PersistenceError(
          `Unknown export format: ${format as string}`,
          PersistenceErrorCode.EXPORT_FAILED
        );
    }
  }

  async import(data: Buffer, format: ExportFormat): Promise<string> {
    if (format !== 'json') {
      throw new PersistenceError(
        `Import format ${format} not yet implemented`,
        PersistenceErrorCode.INVALID_FORMAT
      );
    }

    try {
      const state = JSON.parse(data.toString()) as SessionState;
      await this.save(state.id, state);
      return state.id;
    } catch (error) {
      throw new PersistenceError(
        'Failed to import session',
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
    const pool = this.ensureInitialized();

    const query = `
      SELECT
        COUNT(*) as total,
        MIN(created_at) as oldest,
        MAX(created_at) as newest,
        COALESCE(SUM(pg_column_size(state)), 0) as size
      FROM creative_sessions
    `;

    try {
      const result = await pool.query(query);
      const row = result.rows[0] as {
        total: string;
        oldest: Date | string | null;
        newest: Date | string | null;
        size: string;
      };

      return {
        totalSessions: parseInt(row.total, 10),
        totalSize: parseInt(row.size, 10),
        oldestSession: row.oldest ? new Date(row.oldest) : undefined,
        newestSession: row.newest ? new Date(row.newest) : undefined,
      };
    } catch (error) {
      throw new PersistenceError('Failed to get stats', PersistenceErrorCode.IO_ERROR, error);
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    const pool = this.ensureInitialized();

    const query = `
      DELETE FROM creative_sessions
      WHERE updated_at < $1
      AND (expires_at IS NULL OR expires_at < NOW())
    `;

    try {
      const result = await pool.query(query, [olderThan]);
      return result.rowCount ?? 0;
    } catch (error) {
      throw new PersistenceError(
        'Failed to cleanup old sessions',
        PersistenceErrorCode.IO_ERROR,
        error
      );
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.initialized = false;
    }
  }

  /**
   * Helper: Extract metadata from session state
   */
  private extractMetadata(state: SessionState): {
    status: 'active' | 'completed' | 'abandoned';
    stepsCompleted: number;
    tags: string[];
    completedAt?: Date;
  } {
    const stepsCompleted = state.currentStep;
    const isComplete = state.currentStep >= state.totalSteps;

    return {
      status: isComplete ? 'completed' : 'active',
      stepsCompleted,
      tags: state.tags || [],
      completedAt: isComplete && state.endTime ? new Date(state.endTime) : undefined,
    };
  }

  /**
   * Helper: Convert database row to SessionMetadata
   */
  private rowToMetadata(row: SessionRow): SessionMetadata {
    return {
      id: row.id,
      name: row.name || undefined,
      problem: row.problem,
      technique: row.technique as SessionMetadata['technique'],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      status: row.status as SessionMetadata['status'],
      stepsCompleted: row.steps_completed,
      totalSteps: row.total_steps,
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      insights: row.insights_count || 0,
      branches: row.branches_count || 0,
      metrics: row.metrics as SessionMetadata['metrics'],
    };
  }

  /**
   * Helper: Calculate session expiry (24 hours from now)
   */
  private calculateExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry;
  }
}
