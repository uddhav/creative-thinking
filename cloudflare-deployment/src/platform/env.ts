/**
 * Platform environment shim
 *
 * Wraps Workers `Env` bindings so that code originally written against
 * `process.env` can run unchanged after a small adaptation layer.
 *
 * Initialized once per Durable Object isolate via `initPlatform(env)`.
 * All reads fall back to `undefined` before initialization so modules that
 * touch `getEnv()` during module-load (e.g. config constants) do not throw.
 */

import type { Env } from '../index.js';

type EnvRecord = Record<string, string | undefined>;

let currentEnv: EnvRecord = {};

/**
 * Initialize the platform env with Workers bindings.
 * Called from the DO constructor before any user code runs.
 */
export function setPlatformEnv(env: Env | undefined): void {
  if (!env) {
    currentEnv = {};
    return;
  }

  const record: EnvRecord = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      record[key] = value;
    }
  }
  currentEnv = record;
}

/**
 * Read a single env var (string or undefined).
 * Drop-in replacement for `process.env.FOO`.
 */
export function getEnv(key: string): string | undefined {
  return currentEnv[key];
}

/**
 * Read an env var with a default fallback.
 */
export function getEnvOr(key: string, fallback: string): string {
  const value = currentEnv[key];
  return value === undefined ? fallback : value;
}

/**
 * Read an env var as a boolean (`'true'`/`'1'` → true).
 */
export function getEnvBool(key: string, fallback = false): boolean {
  const value = currentEnv[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

/**
 * Read an env var as a number.
 */
export function getEnvNumber(key: string, fallback: number): number {
  const value = currentEnv[key];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Returns a snapshot of the env record.
 * Used by code that inspects many keys at once (e.g. telemetry/privacy).
 */
export function getEnvSnapshot(): EnvRecord {
  return { ...currentEnv };
}

/**
 * Install a `globalThis.process.env` polyfill populated from Workers `env` bindings.
 *
 * Ported modules from main `src/` often read `process.env.X` directly at module
 * load time. Rather than touching every callsite, we expose a Proxy-backed
 * `process.env` object that reads from `currentEnv`. This lets verbatim copies
 * of main src files resolve env values without modification.
 *
 * Idempotent — safe to call on every DO request. Always re-points the polyfill
 * at the latest `currentEnv` via Proxy get traps, so env updates flow through.
 */
export function installProcessPolyfill(): void {
  const globalRef = globalThis as unknown as {
    process?: { env?: Record<string, string | undefined>; [key: string]: unknown };
  };

  const envProxy = new Proxy({} as EnvRecord, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return currentEnv[prop];
    },
    has(_target, prop) {
      return typeof prop === 'string' && prop in currentEnv;
    },
    ownKeys() {
      return Object.keys(currentEnv);
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop !== 'string' || !(prop in currentEnv)) return undefined;
      return { configurable: true, enumerable: true, value: currentEnv[prop], writable: false };
    },
  });

  const existing = globalRef.process ?? {};
  globalRef.process = { ...existing, env: envProxy };
}
