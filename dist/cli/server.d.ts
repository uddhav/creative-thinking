/**
 * Lazily build a LateralThinkingServer for the lifetime of one CLI invocation.
 *
 * The server is a stateful in-process object (sessions, registry, ergodicity).
 * For one-shot CLI runs we instantiate it on demand, perform exactly one
 * dispatch, then exit. No signal handlers, no graceful-shutdown machinery —
 * those belong to the long-running MCP stdio server in src/index.ts.
 */
import { LateralThinkingServer } from '../index.js';
export declare function getServer(): LateralThinkingServer;
/**
 * Apply CLI defaults for env vars before any module reads them. Must run
 * before LateralThinkingServer is constructed because SessionPersistence
 * snapshots PERSISTENCE_TYPE on first init.
 */
export declare function applyCliDefaults(): void;
//# sourceMappingURL=server.d.ts.map