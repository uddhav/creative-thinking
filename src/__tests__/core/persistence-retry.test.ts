/**
 * A persistence backend that fails to start is retried, not given up on.
 *
 * Hosted on Cloud Run with Neon, the database may still be waking when the
 * server boots. The adapter used to latch that first failure and run from
 * memory for the life of the process, so every session after a slow start
 * was lost on the next scale-to-zero. `getStatus` is what /health reports.
 */

import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SessionPersistence } from '../../core/session/SessionPersistence.js';

describe('SessionPersistence start-up retry', () => {
  let dir: string;
  let blocker: string;
  const saved = { type: process.env.PERSISTENCE_TYPE, path: process.env.PERSISTENCE_PATH };

  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'ct-retry-'));
    // A file where the store's parent directory should be: mkdir fails.
    blocker = path.join(dir, 'blocker');
    writeFileSync(blocker, '');
    process.env.PERSISTENCE_TYPE = 'filesystem';
    process.env.PERSISTENCE_PATH = path.join(blocker, 'store');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(dir, { recursive: true, force: true });
    for (const [key, value] of [
      ['PERSISTENCE_TYPE', saved.type],
      ['PERSISTENCE_PATH', saved.path],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('reports failed, waits, then connects once the backend is reachable', async () => {
    // Break: return early in initialize() whenever isInitialized is true.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const now = vi.spyOn(Date, 'now');
    let clock = 1_000_000;
    now.mockImplementation(() => clock);

    const persistence = new SessionPersistence();
    expect(persistence.getStatus()).toEqual({ type: 'filesystem', state: 'pending' });

    await persistence.initialize();
    expect(persistence.getStatus()).toEqual({ type: 'filesystem', state: 'failed' });

    // The backend comes back, but inside the back-off window nothing retries.
    unlinkSync(blocker);
    clock += SessionPersistence.RETRY_AFTER_MS - 1;
    await persistence.initialize();
    expect(persistence.getStatus().state).toBe('failed');

    clock += 1;
    await persistence.initialize();
    expect(persistence.getStatus()).toEqual({ type: 'filesystem', state: 'ready' });
    expect(persistence.getPersistenceAdapter()).not.toBeNull();
  });

  it('reports memory when no backend is configured', async () => {
    delete process.env.PERSISTENCE_TYPE;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const persistence = new SessionPersistence();
    await persistence.initialize();
    expect(persistence.getStatus()).toEqual({ type: 'memory', state: 'memory' });
  });
});
