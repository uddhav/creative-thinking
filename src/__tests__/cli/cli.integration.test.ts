/**
 * Integration test for the socketes CLI.
 *
 * Spawns dist/cli.js as a real subprocess to validate the cross-process
 * persistence path that's the whole point of the CLI: plan in process A,
 * execute in process B, execute again in process C, with state surviving
 * via the filesystem store.
 *
 * Each test combines a whole flow rather than splitting per assertion, to
 * limit subprocess spawn pressure on the worker pool — the input-parsing
 * surface is covered by the in-process unit tests in io.test.ts. A claim
 * earns a test here only if it is untrue in a single process; everything
 * else belongs somewhere cheaper.
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

  it('debate persona plans persist and execute cross-process, and --crux reaches discovery', async () => {
    // --crux is a flag, not stdin-only: a caller reading --help must be able
    // to find the feature.
    const discoverRes = await runCli(
      ['discover', '--problem', 'Plan the quarterly notebook restock', '--crux', 'contested'],
      { cwd: workDir }
    );
    expect(discoverRes.exit).toBe(0);
    const discovered = discoverRes.json as {
      crux?: string;
      cruxDeclared?: boolean;
      recommendations: Array<{ technique: string }>;
    };
    expect(discovered.crux).toBe('contested');
    expect(discovered.cruxDeclared).toBe(true);
    expect(discovered.recommendations.map(r => r.technique)).toContain('steelman_red_team');

    const planRes = await runCli(
      [
        'plan',
        '--problem',
        'How should we name the internal design system',
        '--techniques',
        'random_entry',
        '--personas',
        'rich_hickey,nassim_taleb',
      ],
      { cwd: workDir }
    );
    expect(planRes.exit).toBe(0);
    const planData = planRes.json as {
      planId: string;
      parallelPlans?: Array<{ planId: string; techniques?: string[] }>;
    };
    const personaPlans = (planData.parallelPlans ?? []).filter(
      p => !(p.techniques ?? []).includes('competing_hypotheses')
    );
    expect(personaPlans.length).toBeGreaterThan(0);

    // Every advertised debate planId must survive to the NEXT process — the
    // in-memory PlanManager save is invisible to the CLI, where each command
    // is a fresh process.
    const planFiles = readdirSync(join(workDir, 'state', 'plans'));
    for (const parallel of planData.parallelPlans ?? []) {
      expect(planFiles).toContain(`${parallel.planId}.json`);
    }

    const personaExec = await runCli(
      [
        'execute',
        '--plan',
        personaPlans[0].planId,
        '--technique',
        'random_entry',
        '--problem',
        'How should we name the internal design system',
        '--step',
        '1',
        '--total-steps',
        '3',
        '--output',
        'Working from the assigned stimulus as this persona.',
        '--next-step-needed',
      ],
      { cwd: workDir }
    );
    expect(personaExec.exit).toBe(0);
    const personaData = personaExec.json as { sessionId?: string };
    expect(personaData.sessionId).toBeDefined();
  }, 30000);

  /**
   * A second test in a file that says it keeps to one, because this claim is
   * only true across processes and the CLI is the only surface where it can be
   * asserted end to end. The MCP server cannot stand in: it does not rehydrate
   * plans across processes, so a second server process answers plan-not-found
   * before reaching the behaviour (which is why the sibling
   * session-resumes-across-processes test re-plans in its second process).
   *
   * `ReflexivityTracker` holds `realityStates` and `actionHistory` in private
   * in-memory Maps that nothing persisted. In one process the tracker
   * deduplicates against `realityState.pathsForeclosed`, so re-sending a step
   * that declares the same commitment "neither counts again nor re-warns" —
   * its own words. One process per step empties that set every time.
   *
   * Measured on socketes before the fix, same session, same step, same
   * rationale, sent twice:
   *
   *                 first send    re-send
   *   one process      warning       none    (deduplicated)
   *   per-process      warning    warning    (false repeat)
   *
   * So the defect is not that reflexivity warnings are dead on this surface —
   * a fresh declaration warns identically on both. It is that they over-fire,
   * reporting a commitment as newly foreclosed after the session already
   * recorded it. Re-sending a step is what a caller does after a completion
   * gatekeeper veto (#307), so the false repeat is easy to reach.
   */
  it('does not re-announce a commitment the session already recorded', async () => {
    const problem = 'Merge two support teams with different escalation cultures';
    // Requires no field on any step, so only reflexivity is under test.
    const technique = 'cultural_integration';
    // Its step 5 is the action step whose handler prior (medium) is loose
    // enough that a 'low' claim counts as downward — the one content-provenance
    // constraint producer there is.
    const actionStep = 5;
    const stdin = JSON.stringify({
      stepReversibility: {
        level: 'low',
        rationale: 'Signs the one-year vendor commitment that cannot be unwound',
      },
    });

    const planRes = await runCli(['plan', '--problem', problem, '--techniques', technique], {
      cwd: workDir,
    });
    expect(planRes.exit).toBe(0);
    const planId = (planRes.json as { planId: string }).planId;

    interface StepJson {
      sessionId?: string;
      reflexivityWarning?: { level?: string };
      reflexivity?: { summary?: { totalActions?: number } };
    }

    let sessionId: string | undefined;
    const send = async (step: number): Promise<StepJson> => {
      const res = await runCli(
        [
          'execute',
          '--plan',
          planId,
          ...(sessionId ? ['--session', sessionId] : []),
          '--technique',
          technique,
          '--problem',
          problem,
          '--step',
          String(step),
          '--total-steps',
          '5',
          '--output',
          `Step ${step}: merged-rota work for the two escalation cultures.`,
          '--next-step-needed',
        ],
        { cwd: workDir, stdin }
      );
      expect(res.exit, `step ${step} failed: ${res.stderr}`).toBe(0);
      const json = res.json as StepJson;
      sessionId ??= json.sessionId;
      return json;
    };

    let firstSend: StepJson = {};
    for (let step = 1; step <= actionStep; step++) firstSend = await send(step);

    // The declaration has to register first, or the re-send assertion holds
    // over a warning that never fired at all.
    expect(
      firstSend.reflexivityWarning?.level,
      'the first declaration did not warn, so there is no dedup to test'
    ).toBe('warning');

    const resent = await send(actionStep);

    expect(
      resent.reflexivityWarning,
      'a commitment the session had already recorded was re-announced as newly foreclosed'
    ).toBeUndefined();

    // The counters are the other half of the same loss. Without this, restoring
    // only pathsForeclosed would satisfy the assertion above while the 5/10
    // thresholds stayed permanently unreachable on this surface.
    //
    // Asserted as an EXACT count, not a floor. The first version of this used
    // `toBeGreaterThan(1)` and passed at 3 against a build that persisted only
    // from the first action step onward, silently dropping the two thinking
    // steps before it — a floor cannot tell partial restoration from complete,
    // which is the one distinction this guard exists to make. One record per
    // execute call: five steps, then the re-send.
    expect(
      resent.reflexivity?.summary?.totalActions,
      'the restored session lost steps that ran before its first action step'
    ).toBe(actionStep + 1);
  }, 60000);
});
