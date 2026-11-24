/**
 * Atomic writes must rename within one directory.
 *
 * The adapter used to write its temp files in os.tmpdir() and rename them into
 * PERSISTENCE_PATH. rename(2) cannot cross filesystems, so when the store sat on
 * another device (a mounted volume, a network share) every save failed with
 * EXDEV: the CLI printed a warning and the next `socketes execute --plan` could
 * not find the plan. A real cross-device setup is not portable to CI, so these
 * tests pin the property that rules EXDEV out: each rename's source and target
 * share a directory.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { FilesystemAdapter } from '../filesystem-adapter.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { SessionState } from '../types.js';

describe('FilesystemAdapter atomic writes stay on one filesystem', () => {
  let adapter: FilesystemAdapter;
  let basePath: string;

  beforeEach(async () => {
    basePath = path.join(
      tmpdir(),
      `ct-rename-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    adapter = new FilesystemAdapter();
    await adapter.initialize({ adapter: 'filesystem', options: { path: basePath } });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fsp.rm(basePath, { recursive: true, force: true });
  });

  it('renames a session and its metadata from beside their targets', async () => {
    const rename = vi.spyOn(fsp, 'rename');
    const state = {
      id: 'rename-session',
      problem: 'p',
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 6,
      history: [],
      branches: {},
      insights: [],
    } as unknown as SessionState;

    await adapter.save('rename-session', state);

    expect(rename).toHaveBeenCalledTimes(2);
    for (const [from, to] of rename.mock.calls) {
      expect(path.dirname(String(from))).toBe(path.dirname(String(to)));
    }
    expect(await adapter.load('rename-session')).toMatchObject({ id: 'rename-session' });
  });

  it('renames a plan from beside its target', async () => {
    const rename = vi.spyOn(fsp, 'rename');
    const plan = {
      planId: 'plan_rename',
      problem: 'p',
      techniques: ['six_hats'],
      workflow: [],
      totalSteps: 7,
      executionMode: 'sequential',
      createdAt: Date.now(),
    } as unknown as PlanThinkingSessionOutput;

    await adapter.savePlan('plan_rename', plan);

    expect(rename).toHaveBeenCalledTimes(1);
    const [from, to] = rename.mock.calls[0];
    expect(path.dirname(String(from))).toBe(path.dirname(String(to)));
    expect(await adapter.loadPlan('plan_rename')).toMatchObject({ planId: 'plan_rename' });
  });

  it('leaves no temp file behind and does not count one in stats', async () => {
    const state = {
      id: 'stats-session',
      problem: 'p',
      technique: 'six_hats',
      currentStep: 1,
      totalSteps: 6,
      history: [],
      branches: {},
      insights: [],
    } as unknown as SessionState;
    await adapter.save('stats-session', state);

    const sessionsDir = path.join(basePath, 'sessions');
    expect((await fsp.readdir(sessionsDir)).filter(f => f.endsWith('.tmp'))).toEqual([]);

    // A write in flight from another process: its temp file is not a session.
    await fsp.writeFile(path.join(sessionsDir, '.other.json.inflight.tmp'), '{}');
    const stats = await adapter.getStats();
    expect(stats.totalSessions).toBe(1);
  });
});
