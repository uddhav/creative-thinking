/**
 * Factory for creating persistence adapters
 */
import { PersistenceError, PersistenceErrorCode } from './types.js';
import { FilesystemAdapter } from './filesystem-adapter.js';
/**
 * Create a persistence adapter based on configuration
 */
export async function createAdapter(config) {
    let adapter;
    switch (config.adapter) {
        case 'filesystem':
            adapter = new FilesystemAdapter();
            break;
        case 'memory':
            // TODO: Implement in-memory adapter for testing
            throw new PersistenceError('Memory adapter not yet implemented', PersistenceErrorCode.INVALID_FORMAT);
        case 'sqlite':
            // TODO: Implement SQLite adapter
            throw new PersistenceError('SQLite adapter not yet implemented', PersistenceErrorCode.INVALID_FORMAT);
        case 'postgres':
            // TODO: Implement PostgreSQL adapter
            throw new PersistenceError('PostgreSQL adapter not yet implemented', PersistenceErrorCode.INVALID_FORMAT);
        default:
            throw new PersistenceError(`Unknown adapter type: ${config.adapter}`, PersistenceErrorCode.INVALID_FORMAT);
    }
    await adapter.initialize(config);
    return adapter;
}
/**
 * Get default configuration for an adapter type
 */
export function getDefaultConfig(adapter) {
    switch (adapter) {
        case 'filesystem':
            return {
                adapter: 'filesystem',
                options: {
                    path: '.creative-thinking',
                    autoSave: true,
                    saveInterval: 60000, // 1 minute
                    compression: false
                }
            };
        case 'memory':
            return {
                adapter: 'memory',
                options: {
                    maxSize: 100 * 1024 * 1024, // 100MB
                    autoSave: false
                }
            };
        case 'sqlite':
            return {
                adapter: 'sqlite',
                options: {
                    path: 'creative-thinking.db',
                    autoSave: true
                }
            };
        case 'postgres':
            return {
                adapter: 'postgres',
                options: {
                    connectionString: process.env.DATABASE_URL || 'postgres://localhost/creative_thinking',
                    autoSave: true
                }
            };
    }
}
//# sourceMappingURL=factory.js.map