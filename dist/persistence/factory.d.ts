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
import type { PersistenceAdapter } from './adapter.js';
import type { PersistenceConfig } from './types.js';
/**
 * Create a persistence adapter based on configuration
 */
export declare function createAdapter(config: PersistenceConfig): Promise<PersistenceAdapter>;
/**
 * Get default configuration for an adapter type
 */
export declare function getDefaultConfig(adapter: PersistenceConfig['adapter']): PersistenceConfig;
//# sourceMappingURL=factory.d.ts.map