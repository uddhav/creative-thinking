/**
 * Plans go through the persistence adapter, and retention is one opt-in rule
 * for plans and sessions alike (#357, #358).
 *
 * Before this, plans were written by a synchronous side store to the local
 * disk under every backend, including postgres, so a multi-instance server
 * still lost them (#358); nothing ever deleted a plan file, and the 4-hour
 * in-memory eviction re-hydrated from disk on the next miss, so it was a
 * cache pretending to be a lifetime (#357). The adapter's own `cleanup` had
 * no production caller either, so sessions were never deleted from disk.
 *
 * Now `PERSISTENCE_TTL_DAYS` is the only thing that deletes, for both record
 * kinds; unset means never, which is the promise SOCKETES.md makes about
 * month-long gaps. Every assertion here is made where a caller stands,
 * through the built server, with the filesystem backend in a temp directory.
 *
 * Two of these are guards with a kill-check; two are documented as what they
 * are. The cross-instance case is a smoke test: the filesystem write already
 * preceded the response before this change, and a fire-and-forget write lands
 * long before a second process's request could arrive, so nothing on this
 * path can distinguish an awaited write from an un-awaited one. That proof
 * lives in plan-persist-ordering.test.ts, with a deferred fake adapter.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, utimesSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Keep a plan across instances and sweep old records';
const dirs: string[] = [];

afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function stateDir(label: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `ct-retention-${label}-`));
  dirs.push(dir);
  return dir;
}

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

async function connect(
  dir: string,
  extra: Record<string, string> = {}
): Promise<MCPClientTestHelper> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  delete env.PERSISTENCE_TTL_DAYS;
  env.PERSISTENCE_TYPE = 'filesystem';
  env.PERSISTENCE_PATH = dir;
  Object.assign(env, extra);
  const client = new MCPClientTestHelper();
  await client.connect({ env });
  return client;
}

async function planId(client: MCPClientTestHelper): Promise<string> {
  const result = await client.callTool('plan_thinking_session', {
    problem: PROBLEM,
    techniques: ['six_hats'],
  });
  return (JSON.parse(textOf(result)) as { planId: string }).planId;
}

async function executeStep(
  client: MCPClientTestHelper,
  plan: string,
  sessionId: string
): Promise<{ isError: boolean; code?: string }> {
  const result = await client.callTool('execute_thinking_step', {
    planId: plan,
    sessionId,
    technique: 'six_hats',
    problem: PROBLEM,
    currentStep: 1,
    totalSteps: 7,
    output: 'Blue hat: framing the retention question, at length.',
    nextStepNeeded: true,
    // The MCP server persists a step only when asked; the CLI defaults this on.
    autoSave: true,
  });
  const body = JSON.parse(textOf(result)) as { error?: { code?: string } };
  return { isError: result.isError === true, code: body.error?.code };
}

/** Age a file on disk; the plans pass of the sweep reads mtime. */
function ageFile(file: string, days: number): void {
  const then = new Date(Date.now() - days * 86_400_000);
  utimesSync(file, then, then);
}

/** A session on disk as the filesystem adapter writes it: both files, aged in the metadata. */
function seedSession(dir: string, id: string, ageDays: number): void {
  mkdirSync(path.join(dir, 'sessions'), { recursive: true });
  mkdirSync(path.join(dir, 'metadata'), { recursive: true });
  const then = new Date(Date.now() - ageDays * 86_400_000).toISOString();
  const state = {
    id,
    problem: PROBLEM,
    technique: 'six_hats',
    currentStep: 1,
    totalSteps: 7,
    startTime: Date.now() - ageDays * 86_400_000,
    insights: [],
    branches: {},
    history: [],
  };
  writeFileSync(
    path.join(dir, 'sessions', `${id}.json`),
    JSON.stringify({ version: '1.0.0', format: 'json', data: state })
  );
  writeFileSync(
    path.join(dir, 'metadata', `${id}.json`),
    JSON.stringify({
      id,
      problem: PROBLEM,
      technique: 'six_hats',
      createdAt: then,
      updatedAt: then,
      status: 'active',
      stepsCompleted: 1,
      totalSteps: 7,
      tags: [],
      insights: 0,
      branches: 0,
    })
  );
}

async function settle(ms = 2000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

describe('plans through the adapter', () => {
  it('a plan issued by one live instance executes on another (smoke, see header)', async () => {
    const dir = stateDir('shared');
    const a = await connect(dir);
    const b = await connect(dir);
    try {
      const plan = await planId(a);
      expect(existsSync(path.join(dir, 'plans', `${plan}.json`)), 'plan file on disk').toBe(true);
      const onB = await executeStep(b, plan, `session_shared_${Date.now()}`);
      expect(onB.isError, `instance B could not see the plan: ${onB.code ?? ''}`).toBe(false);
    } finally {
      await a.disconnect();
      await b.disconnect();
    }
  }, 60_000);

  it('a plan file written before this change, bare JSON, still loads', async () => {
    // Backward compatibility of the on-disk layout: the old store wrote the
    // plan object bare, with no {version, format, data} envelope. The adapter
    // keeps writing bare so old and new files are one format. Break: wrap
    // plans in the session envelope and this returns E202.
    const dir = stateDir('legacy');
    mkdirSync(path.join(dir, 'plans'), { recursive: true });
    const legacy = 'plan_legacy_00000000-0000-4000-8000-000000000000';
    writeFileSync(
      path.join(dir, 'plans', `${legacy}.json`),
      JSON.stringify({
        planId: legacy,
        problem: PROBLEM,
        techniques: ['six_hats'],
        workflow: [
          {
            technique: 'six_hats',
            steps: Array.from({ length: 7 }, (_, i) => ({
              stepNumber: i + 1,
              description: `hat ${i + 1}`,
              expectedOutputs: [],
            })),
          },
        ],
        totalSteps: 7,
        executionMode: 'sequential',
        createdAt: Date.now(),
      })
    );
    const client = await connect(dir);
    try {
      const r = await executeStep(client, legacy, `session_legacy_${Date.now()}`);
      expect(r.isError, `legacy plan did not load: ${r.code ?? ''}`).toBe(false);
    } finally {
      await client.disconnect();
    }
  }, 60_000);
});

describe('PERSISTENCE_TTL_DAYS', () => {
  it('sweeps a plan and a session older than the TTL, and keeps fresh ones', async () => {
    // Break: delete the plans pass in FilesystemAdapter.cleanup (the old plan
    // survives), or the constructor's sweep call (both survive).
    const dir = stateDir('sweep');
    mkdirSync(path.join(dir, 'plans'), { recursive: true });
    const oldPlan = path.join(dir, 'plans', 'plan_old_00000000-0000-4000-8000-000000000001.json');
    const freshPlan = path.join(dir, 'plans', 'plan_new_00000000-0000-4000-8000-000000000002.json');
    for (const file of [oldPlan, freshPlan]) {
      writeFileSync(
        file,
        JSON.stringify({
          planId: path.basename(file, '.json'),
          problem: PROBLEM,
          techniques: ['six_hats'],
          workflow: [],
          totalSteps: 7,
          executionMode: 'sequential',
          createdAt: Date.now(),
        })
      );
    }
    ageFile(oldPlan, 2);
    seedSession(dir, 'session_old_seed', 2);
    seedSession(dir, 'session_new_seed', 0);

    const client = await connect(dir, { PERSISTENCE_TTL_DAYS: '1' });
    try {
      // The sweep runs at construction, fire-and-forget; poll for the
      // positive outcome, then assert the negatives.
      const deadline = Date.now() + 5000;
      while (existsSync(oldPlan) && Date.now() < deadline) await settle(200);
      expect(existsSync(oldPlan), 'plan older than the TTL survived').toBe(false);
      expect(
        existsSync(path.join(dir, 'sessions', 'session_old_seed.json')),
        'old session survived'
      ).toBe(false);
      expect(
        existsSync(path.join(dir, 'metadata', 'session_old_seed.json')),
        'old metadata survived'
      ).toBe(false);
      expect(existsSync(freshPlan), 'fresh plan was swept').toBe(true);
      expect(
        existsSync(path.join(dir, 'sessions', 'session_new_seed.json')),
        'fresh session was swept'
      ).toBe(true);
    } finally {
      await client.disconnect();
    }
  }, 60_000);

  it('unset means never: a plan 400 days old survives a server start and a call', async () => {
    // The SOCKETES.md promise that plans survive month-long gaps. Break:
    // default the TTL to 30 days. The sweep is fire-and-forget, so wait a
    // fixed interval after the call before asserting, or a slow worker could
    // show green under the break.
    const dir = stateDir('never');
    mkdirSync(path.join(dir, 'plans'), { recursive: true });
    const ancient = 'plan_ancient_00000000-0000-4000-8000-000000000003';
    const file = path.join(dir, 'plans', `${ancient}.json`);
    writeFileSync(
      file,
      JSON.stringify({
        planId: ancient,
        problem: PROBLEM,
        techniques: ['six_hats'],
        workflow: [
          {
            technique: 'six_hats',
            steps: Array.from({ length: 7 }, (_, i) => ({
              stepNumber: i + 1,
              description: `hat ${i + 1}`,
              expectedOutputs: [],
            })),
          },
        ],
        totalSteps: 7,
        executionMode: 'sequential',
        createdAt: Date.now() - 400 * 86_400_000,
      })
    );
    ageFile(file, 400);
    const client = await connect(dir);
    try {
      const r = await executeStep(client, ancient, `session_ancient_${Date.now()}`);
      expect(r.isError, `a 400-day-old plan did not load: ${r.code ?? ''}`).toBe(false);
      await settle(1500);
      expect(existsSync(file), 'a plan was deleted with no TTL set').toBe(true);
    } finally {
      await client.disconnect();
    }
  }, 60_000);
});

describe('session delete requires confirm', () => {
  it('refuses without confirm and leaves the file; deletes with it', async () => {
    // SOCKETES.md documented --confirm as required; the handler never read it.
    // Break: delete the confirm check in handleDeleteOperation.
    const dir = stateDir('confirm');
    const client = await connect(dir);
    try {
      const plan = await planId(client);
      const sessionId = `session_confirm_${Date.now()}`;
      await executeStep(client, plan, sessionId);
      const file = path.join(dir, 'sessions', `${sessionId}.json`);
      expect(existsSync(file), 'session was not persisted').toBe(true);

      const refused = await client.callTool('execute_thinking_step', {
        sessionOperation: 'delete',
        deleteOptions: { sessionId },
      });
      expect(refused.isError, 'delete without confirm must be an error').toBe(true);
      const body = JSON.parse(textOf(refused)) as { error?: { recovery?: string[] } };
      expect((body.error?.recovery ?? []).join(' ')).toContain('confirm');
      expect(existsSync(file), 'delete without confirm removed the file').toBe(true);

      // The confirmed delete goes to a FRESH server as its first call. Read
      // before initialisation settled, the availability flag said "no adapter"
      // and the message said nothing was deleted, while the file was in fact
      // gone; a delete issued after other calls never showed it. Break: read
      // the adapter synchronously again in the handler.
      const fresh = await connect(dir);
      try {
        const done = await fresh.callTool('execute_thinking_step', {
          sessionOperation: 'delete',
          deleteOptions: { sessionId, confirm: true },
        });
        expect(done.isError).not.toBe(true);
        expect(existsSync(file), 'delete with confirm left the file').toBe(false);
        const report = JSON.parse(textOf(done)) as {
          result?: { persistenceAvailable?: boolean; message?: string };
        };
        expect(report.result?.persistenceAvailable, 'the report must match the deed').toBe(true);
        expect(report.result?.message ?? '').not.toContain('nothing was deleted');
      } finally {
        await fresh.disconnect();
      }
    } finally {
      await client.disconnect();
    }
  }, 60_000);
});

describe('CLI sweep and orphan metadata (review findings)', () => {
  it('socketes discover completes the startup sweep before it exits', async () => {
    // Measured before the fix: with TTL=1 and 3-day-old seeds, `discover`
    // deleted nothing in 3 of 3 runs, because the constructor fired the sweep
    // and emit() exited inside the stdout write callback. Break: stop
    // registering the sweep with onBeforeExit in cli/server.ts.
    const { spawnSync } = await import('child_process');
    const { fileURLToPath } = await import('url');
    const here = path.dirname(fileURLToPath(import.meta.url));
    const cli = path.resolve(here, '..', '..', '..', 'dist', 'cli.js');
    const dir = stateDir('cli-sweep');
    mkdirSync(path.join(dir, 'plans'), { recursive: true });
    const oldPlan = path.join(
      dir,
      'plans',
      'plan_cliold_00000000-0000-4000-8000-000000000004.json'
    );
    writeFileSync(
      oldPlan,
      JSON.stringify({
        planId: 'plan_cliold_00000000-0000-4000-8000-000000000004',
        problem: PROBLEM,
        techniques: ['six_hats'],
        workflow: [],
        totalSteps: 7,
        executionMode: 'sequential',
        createdAt: Date.now(),
      })
    );
    ageFile(oldPlan, 3);
    seedSession(dir, 'session_cli_old', 3);
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env))
      if (value !== undefined) env[key] = value;
    env.PERSISTENCE_TYPE = 'filesystem';
    env.PERSISTENCE_PATH = dir;
    env.PERSISTENCE_TTL_DAYS = '1';
    const result = spawnSync(process.execPath, [cli, 'discover', '--problem', PROBLEM], {
      env,
      encoding: 'utf8',
      timeout: 30_000,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(oldPlan), 'the CLI exited before the sweep removed the plan').toBe(false);
    expect(
      existsSync(path.join(dir, 'sessions', 'session_cli_old.json')),
      'old session survived'
    ).toBe(false);
    expect(
      existsSync(path.join(dir, 'metadata', 'session_cli_old.json')),
      'old metadata survived'
    ).toBe(false);
  }, 60_000);

  it('a metadata file with no session behind it is reclaimed by the next sweep', async () => {
    // The orphan a cut-off sweep used to leave: delete unlinked the session,
    // hit ENOENT on the next attempt, and returned before touching metadata,
    // so the orphan was permanent and hidden from `list`. Break: restore the
    // early return on the session file's ENOENT in FilesystemAdapter.delete.
    const dir = stateDir('orphan');
    seedSession(dir, 'session_orphan', 3);
    rmSync(path.join(dir, 'sessions', 'session_orphan.json'));
    expect(existsSync(path.join(dir, 'metadata', 'session_orphan.json'))).toBe(true);
    const client = await connect(dir, { PERSISTENCE_TTL_DAYS: '1' });
    try {
      const deadline = Date.now() + 5000;
      while (
        existsSync(path.join(dir, 'metadata', 'session_orphan.json')) &&
        Date.now() < deadline
      ) {
        await settle(200);
      }
      expect(
        existsSync(path.join(dir, 'metadata', 'session_orphan.json')),
        'orphan metadata survived the sweep'
      ).toBe(false);
    } finally {
      await client.disconnect();
    }
  }, 60_000);
});
