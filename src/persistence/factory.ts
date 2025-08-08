/**
 * Factory for creating persistence adapters
 */

import { homedir } from 'os';
import { join } from 'path';
import type { PersistenceAdapter } from './adapter.js';
import type { PersistenceConfig } from './types.js';
import { PersistenceError, PersistenceErrorCode } from './types.js';
import { FilesystemAdapter } from './filesystem-adapter.js';

/**
 * Create a persistence adapter based on configuration
 */
export async function createAdapter(config: PersistenceConfig): Promise<PersistenceAdapter> {
  let adapter: PersistenceAdapter;

  switch (config.adapter) {
    case 'filesystem':
      adapter = new FilesystemAdapter();
      break;

    case 'memory':
      // TODO: Implement in-memory adapter for testing
      throw new PersistenceError(
        'Memory adapter not yet implemented',
        PersistenceErrorCode.INVALID_FORMAT
      );

    case 'sqlite':
      // TODO: Implement SQLite adapter
      throw new PersistenceError(
        'SQLite adapter not yet implemented',
        PersistenceErrorCode.INVALID_FORMAT
      );

    case 'postgres':
      // TODO: Implement PostgreSQL adapter
      throw new PersistenceError(
        'PostgreSQL adapter not yet implemented',
        PersistenceErrorCode.INVALID_FORMAT
      );

    default:
      throw new PersistenceError(
        `Unknown adapter type: ${config.adapter as string}`,
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

    case 'memory':
      return {
        adapter: 'memory',
        options: {
          maxSize: 100 * 1024 * 1024, // 100MB
          autoSave: false,
        },
      };

    case 'sqlite':
      return {
        adapter: 'sqlite',
        options: {
          path: 'creative-thinking.db',
          autoSave: true,
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
  }
}
