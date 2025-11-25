/**
 * Factory for creating persistence adapters
 *
 * Architecture Decision: Two-Tier Persistence
 * ==========================================
 *
 * This implementation separates two distinct concerns:
 *
 * 1. **Active Session Storage** (This file)
 *    - Purpose: Crash recovery and multi-server state sharing
 *    - Backends: Filesystem (simple) and PostgreSQL (production)
 *    - Lifecycle: Short-lived (24-hour TTL)
 *    - Operations: CRUD, search, batch operations
 *
 * 2. **Historical Analytics** (Future - See Issue #241)
 *    - Purpose: Learning from past sessions, technique effectiveness
 *    - Implementation: Separate append-only storage
 *    - Features: Aggregation, pattern detection, recommendation improvement
 *    - When sessions complete, write to analytics store
 *
 * Why not a single abstraction?
 * - Different access patterns (hot state vs. cold analytics)
 * - Different retention policies (TTL vs. permanent)
 * - Different query needs (simple CRUD vs. complex aggregations)
 * - Simpler to implement and maintain as separate concerns
 */

import { homedir } from 'os';
import { join } from 'path';
import type { PersistenceAdapter } from './adapter.js';
import type { PersistenceConfig } from './types.js';
import { PersistenceError, PersistenceErrorCode } from './types.js';
import { FilesystemAdapter } from './filesystem-adapter.js';
import { PostgresAdapter } from './postgres-adapter.js';

/**
 * Create a persistence adapter based on configuration
 */
export async function createAdapter(config: PersistenceConfig): Promise<PersistenceAdapter> {
  let adapter: PersistenceAdapter;

  switch (config.adapter) {
    case 'filesystem':
      adapter = new FilesystemAdapter();
      break;

    case 'postgres':
      adapter = new PostgresAdapter();
      break;

    case 'memory':
    case 'sqlite':
      throw new PersistenceError(
        `${config.adapter} adapter not available. Use 'filesystem' (simple) or 'postgres' (production).`,
        PersistenceErrorCode.INVALID_FORMAT
      );

    default:
      throw new PersistenceError(
        `Unknown adapter type: ${config.adapter as string}. Use 'filesystem' or 'postgres'.`,
        PersistenceErrorCode.INVALID_FORMAT
      );
  }

  await adapter.initialize(config);
  return adapter;
}

/**
 * Get default configuration for an adapter type
 */
export function getDefaultConfig(adapter: PersistenceConfig['adapter']): PersistenceConfig {
  switch (adapter) {
    case 'filesystem':
      return {
        adapter: 'filesystem',
        options: {
          path: process.env.PERSISTENCE_PATH || join(homedir(), '.creative-thinking'),
          autoSave: true,
          saveInterval: 60000, // 1 minute
          compression: false,
        },
      };

    case 'postgres':
      return {
        adapter: 'postgres',
        options: {
          connectionString: process.env.DATABASE_URL || 'postgres://localhost/creative_thinking',
          autoSave: true,
        },
      };

    case 'memory':
      // Memory adapter requested - return special config that SessionPersistence will handle
      return {
        adapter: 'memory',
        options: {},
      };

    case 'sqlite':
      throw new PersistenceError(
        `sqlite adapter not available. Use 'filesystem' or 'postgres'.`,
        PersistenceErrorCode.INVALID_FORMAT
      );

    default:
      throw new PersistenceError(
        `Unknown adapter type: ${adapter as string}. Use 'filesystem' or 'postgres'.`,
        PersistenceErrorCode.INVALID_FORMAT
      );
  }
}
