/**
 * Telemetry under the shipping defaults, observed where an operator would
 * (#241): on disk, after the process that produced it has exited.
 *
 * Three things were true before this file and none was tested. The only
 * telemetry test ran under level 'full' and privacy 'minimal', so the
 * defaults (basic + balanced) were never exercised. Discovery emitted no
 * event at all, so a default install learned nothing about what problems it
 * was asked. And the shutdown flush was registered on `beforeExit`, which
 * neither binary ever reaches: both exit through `process.exit`, so under the
 * default batch size of 100 a `socketes discover` wrote nothing, ever.
 *
 * Env hygiene: LEVEL, PRIVACY_MODE, BATCH_SIZE, FLUSH_INTERVAL and EXCLUDE
 * are deleted from the spread env so a developer shell exporting
 * TELEMETRY_LEVEL=full cannot make this test pass for the wrong reason, and
 * PERSISTENCE_PATH points into the temp dir so the CLI's filesystem default
 * cannot write into the developer's home. Files are matched by glob, not by
 * computing today's date, so a midnight rollover cannot fail it.
 *
 * Both cases run the BUILT binaries (dist/cli.js, dist/mcp-server-main.js):
 * rebuild before trusting a kill-check.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const dirs: string[] = [];

afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function telemetryDir(label: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `ct-telemetry-${label}-`));
  dirs.push(dir);
  return dir;
}

function defaultEnv(dir: string, extra: Record<string, string> = {}): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  delete env.TELEMETRY_LEVEL;
  delete env.TELEMETRY_PRIVACY_MODE;
  delete env.TELEMETRY_BATCH_SIZE;
  delete env.TELEMETRY_FLUSH_INTERVAL;
  delete env.TELEMETRY_EXCLUDE;
  // The CLI defaults PERSISTENCE_TYPE to filesystem and the path to the home
  // directory; without this the test writes plans into ~/.creative-thinking.
  env.PERSISTENCE_PATH = path.join(dir, 'persistence');
  env.TELEMETRY_ENABLED = 'true';
  env.TELEMETRY_STORAGE = 'filesystem';
  env.TELEMETRY_PATH = dir;
  return { ...env, ...extra };
}

interface StoredEvent {
  eventType: string;
  anonymousSessionId: string;
  metrics: { category?: string; evidenceBreadth?: number; tier?: string };
}

function storedEvents(dir: string): StoredEvent[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.startsWith('telemetry-') && f.endsWith('.jsonl'))
    .flatMap(f =>
      readFileSync(path.join(dir, f), 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as StoredEvent)
    );
}

async function waitFor(pred: () => boolean, ms = 3000): Promise<void> {
  const deadline = Date.now() + ms;
  while (!pred() && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 100));
  }
}

describe('MCP server, defaults (basic level, balanced privacy)', () => {
  it('a discovery call lands a problem_discovered row carrying category, evidenceBreadth and tier', async () => {
    // Breaks, each red here: delete the discovery.ts call; drop
    // problem_discovered from basicEvents; drop category from basicFields;
    // drop the copy in sanitizeMetrics. Batch size 1 so the write does not
    // wait on the exit flush, which the next describe covers.
    const dir = telemetryDir('mcp');
    const client = new MCPClientTestHelper();
    await client.connect({ env: defaultEnv(dir, { TELEMETRY_BATCH_SIZE: '1' }) });
    try {
      await client.callTool('discover_techniques', {
        problem: 'Our weekly release train slips whenever two teams share a staging environment',
      });
      await waitFor(() => storedEvents(dir).some(e => e.eventType === 'problem_discovered'));
      const rows = storedEvents(dir).filter(e => e.eventType === 'problem_discovered');
      expect(rows, 'no problem_discovered row on disk').toHaveLength(1);
      expect(typeof rows[0].metrics.category).toBe('string');
      expect(rows[0].metrics.category?.length).toBeGreaterThan(0);
      expect(typeof rows[0].metrics.evidenceBreadth).toBe('number');
      expect(['low', 'medium', 'high']).toContain(rows[0].metrics.tier);
      // Balanced privacy: a salted hash, never the synthesized discovery id.
      expect(rows[0].anonymousSessionId).toMatch(/^anon_[0-9a-f]{16}$/);
      expect(JSON.stringify(rows[0])).not.toContain('release train');
    } finally {
      await client.disconnect();
    }
  }, 30_000);
});

describe('CLI, defaults, exit flush', () => {
  it('socketes discover writes its row before exiting, at the default batch size', () => {
    // Break: remove the flush from emit(). With batch 100 and no beforeExit,
    // nothing reaches disk and the directory stays empty.
    const dir = telemetryDir('cli');
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'dist', 'cli.js'),
        'discover',
        '--problem',
        'Cut onboarding time for new engineers in half',
      ],
      { env: defaultEnv(dir), encoding: 'utf8', timeout: 30_000 }
    );
    expect(result.status, result.stderr).toBe(0);
    const rows = storedEvents(dir).filter(e => e.eventType === 'problem_discovered');
    expect(rows, 'the CLI exited without flushing telemetry').toHaveLength(1);
  }, 40_000);

  it('writes each row once when a batch flush is already in flight at exit', () => {
    // Break: clear the buffer after the await in TelemetryCollector.flush().
    // At batch size 1 the discovery event starts a flush at once; the exit
    // flush then runs while that write is pending and must find the buffer
    // already taken, or the same row lands twice (#424 review).
    const dir = telemetryDir('cli-batch1');
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'dist', 'cli.js'),
        'discover',
        '--problem',
        'Cut onboarding time for new engineers in half',
      ],
      { env: defaultEnv(dir, { TELEMETRY_BATCH_SIZE: '1' }), encoding: 'utf8', timeout: 30_000 }
    );
    expect(result.status, result.stderr).toBe(0);
    const rows = storedEvents(dir).filter(e => e.eventType === 'problem_discovered');
    expect(rows, 'the exit flush re-wrote the rows the batch flush was writing').toHaveLength(1);
  }, 40_000);
});

describe('export script', () => {
  it('prints numbers, not NaN or undefined, and writes sessions as an array', () => {
    // Break: restore `sessions.totalSessions` in scripts/export-telemetry.js.
    const dir = telemetryDir('export');
    const now = Date.now();
    const line = (eventType: string, extra: Record<string, unknown> = {}) =>
      JSON.stringify({
        eventId: `e_${eventType}`,
        eventType,
        timestamp: now,
        anonymousSessionId: 'anon_seed',
        technique: 'six_hats',
        metrics: {},
        ...extra,
      });
    writeFileSync(
      path.join(dir, 'telemetry-2026-01-01.jsonl'),
      [
        line('session_start'),
        line('technique_start'),
        line('session_complete', { metrics: { duration: 60_000 } }),
      ].join('\n') + '\n'
    );
    const out = path.join(dir, 'out.json');
    const result = spawnSync(
      process.execPath,
      [path.join(repoRoot, 'scripts', 'export-telemetry.js'), out],
      { env: defaultEnv(dir), encoding: 'utf8', timeout: 30_000 }
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).not.toMatch(/NaN|undefined/);
    const exported = JSON.parse(readFileSync(out, 'utf8')) as { sessions: unknown };
    expect(Array.isArray(exported.sessions)).toBe(true);
    expect((exported.sessions as unknown[]).length).toBe(1);
  }, 40_000);
});
