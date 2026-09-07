/**
 * Lazily build a LateralThinkingServer for the lifetime of one CLI invocation.
 *
 * The server is a stateful in-process object (sessions, registry, ergodicity).
 * For one-shot CLI runs we instantiate it on demand, perform exactly one
 * dispatch, then exit. No signal handlers, no graceful-shutdown machinery —
 * those belong to the long-running MCP stdio server in src/index.ts.
 */

import { LateralThinkingServer } from '../index.js';
import { onBeforeExit } from './io.js';

let cached: LateralThinkingServer | null = null;

export function getServer(): LateralThinkingServer {
  if (!cached) {
    cached = new LateralThinkingServer();
    // The retention sweep starts in the SessionManager constructor. A one-shot
    // process exits inside emit()'s write callback, which cut the sweep off
    // in three of three `socketes discover` runs; emit now waits for it.
    const sweep = cached.getSessionManager().startupSweep;
    onBeforeExit(() => sweep);
  }
  return cached;
}

/**
 * Apply CLI defaults for env vars before any module reads them. Must run
 * before LateralThinkingServer is constructed because SessionPersistence
 * snapshots PERSISTENCE_TYPE on first init.
 */
export function applyCliDefaults(): void {
  if (!process.env.PERSISTENCE_TYPE) {
    process.env.PERSISTENCE_TYPE = 'filesystem';
  }
  if (!process.env.DISABLE_THOUGHT_LOGGING) {
    process.env.DISABLE_THOUGHT_LOGGING = 'true';
  }
}
