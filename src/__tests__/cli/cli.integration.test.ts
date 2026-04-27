/**
 * Integration test for the socketes CLI.
 *
 * Spawns dist/cli.js as a real subprocess to validate the cross-process
 * persistence path that's the whole point of the CLI: plan in process A,
 * execute in process B, execute again in process C, with state surviving
 * via the filesystem store.
 *
 * Kept to a single test (one combined flow) to limit subprocess spawn
 * pressure on the worker pool — the input-parsing surface is covered by
 * the in-process unit tests in io.test.ts.
 */

import { spawn } from 'child_process';
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';

const CLI = resolve(__dirname, '../../../dist/cli.js');

interface CliResult {
  exit: number;
  stdout: string;
  stderr: string;
  json: unknown;
}

async function runCli(args: string[], opts: { cwd: string; stdin?: string }): Promise<CliResult> {
  return new Promise((resolveFn, rejectFn) => {
    const child = spawn('node', [CLI, ...args], {
      cwd: opts.cwd,
      env: {
        ...process.env,
        PERSISTENCE_PATH: join(opts.cwd, 'state'),
        PERSISTENCE_TYPE: 'filesystem',
      },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => (stdout += String(d)));
    child.stderr.on('data', d => (stderr += String(d)));
    child.on('error', rejectFn);
    child.on('close', code => {
      let json: unknown = null;
      const stream = code === 0 ? stdout : stderr;
      try {
        json = stream.trim() ? JSON.parse(stream) : null;
      } catch {
        // leave json as null — caller can inspect raw streams
      }
      resolveFn({ exit: code ?? -1, stdout, stderr, json });
    });

    if (opts.stdin) child.stdin.write(opts.stdin);
    child.stdin.end();
  });
}

describe('socketes CLI cross-process flow', () => {
  let workDir: string;

  beforeAll(() => {
    if (!existsSync(CLI)) {
      throw new Error(`CLI build missing at ${CLI} — run \`npm run build\` first`);
    }
  });

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'socketes-cli-test-'));
  });

  afterEach(() => {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
  });

  it('plan persists to disk, two executes hydrate plan + session across processes', async () => {
    const planRes = await runCli(
      ['plan', '--problem', 'test problem', '--techniques', 'six_hats', '--timeframe', 'thorough'],
      { cwd: workDir }
    );
    expect(planRes.exit).toBe(0);
    const planData = planRes.json as { planId: string };
    expect(planData?.planId).toMatch(/^plan_/);

    // Plan was persisted to disk
    expect(readdirSync(join(workDir, 'state', 'plans'))).toContain(`${planData.planId}.json`);

    // Step 1 in a fresh process — must hydrate the plan
    const exec1 = await runCli(
      [
        'execute',
        '--plan',
        planData.planId,
        '--technique',
        'six_hats',
        '--problem',
        'test problem',
        '--step',
        '1',
        '--total-steps',
        '7',
        '--output',
        'step 1 thinking',
        '--next-step-needed',
      ],
      { cwd: workDir }
    );
    expect(exec1.exit).toBe(0);
    const execData = exec1.json as { sessionId: string; historyLength: number };
    expect(execData.sessionId).toBeDefined();
    expect(execData.historyLength).toBe(1);

    // Step 2 in another fresh process — must hydrate the session
    const exec2 = await runCli(
      [
        'execute',
        '--plan',
        planData.planId,
        '--session',
        execData.sessionId,
        '--technique',
        'six_hats',
        '--problem',
        'test problem',
        '--step',
        '2',
        '--total-steps',
        '7',
        '--output',
        'step 2 thinking',
        '--next-step-needed',
      ],
      { cwd: workDir }
    );
    expect(exec2.exit).toBe(0);
    const exec2Data = exec2.json as { sessionId: string; historyLength: number };
    expect(exec2Data.sessionId).toBe(execData.sessionId);
    expect(exec2Data.historyLength).toBe(2);
  }, 30000);
});
