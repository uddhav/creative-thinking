/**
 * Platform shim barrel export
 *
 * The platform layer adapts Node.js-specific APIs used by the ported
 * `src/` modules to the Cloudflare Workers runtime. Call `initPlatform(env)`
 * once per Durable Object isolate (from the DO constructor) before any
 * ported code runs.
 */

import type { Env } from '../index.js';
import { setPlatformEnv, installProcessPolyfill } from './env.js';
import { refreshPlatformLogger } from './logger.js';

export {
  setPlatformEnv,
  installProcessPolyfill,
  getEnv,
  getEnvOr,
  getEnvBool,
  getEnvNumber,
  getEnvSnapshot,
} from './env.js';
export { logger, Logger, refreshPlatformLogger } from './logger.js';
export type { LogLevel } from './logger.js';
export { randomUUID, createHash, sha256Hex } from './crypto.js';
export { memoryUsage, heapUsageRatio } from './memory.js';
export type { MemoryUsage } from './memory.js';
export {
  onShutdown,
  offShutdown,
  flushShutdownHandlers,
  clearShutdownHandlers,
} from './lifecycle.js';
export type { PlatformTimeout } from './lifecycle.js';
export { KVPersistenceAdapter } from './persistence.js';

/**
 * Initialize the platform shim layer for a Workers isolate.
 *
 * Must be called once, synchronously, from the DO constructor before any
 * ported module touches `getEnv()` or the singleton `logger`.
 */
export function initPlatform(env: Env): void {
  setPlatformEnv(env);
  installProcessPolyfill();
  refreshPlatformLogger();
}
