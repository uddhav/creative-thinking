/**
 * Factory for creating persistence adapters
 */
import { PersistenceAdapter } from './adapter.js';
import { PersistenceConfig } from './types.js';
/**
 * Create a persistence adapter based on configuration
 */
export declare function createAdapter(config: PersistenceConfig): Promise<PersistenceAdapter>;
/**
 * Get default configuration for an adapter type
 */
export declare function getDefaultConfig(adapter: PersistenceConfig['adapter']): PersistenceConfig;
//# sourceMappingURL=factory.d.ts.map