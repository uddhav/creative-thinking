#!/usr/bin/env node
// Re-price `minimal` against `full`: run scamper (8), six_hats (7) and triz (4)
// through the built CLI under each RESPONSE_VERBOSITY and report stdout bytes
// per step. The env var is read on every call, so the same script measures
// before and after the default flip. Usage: node evals/measure-verbosity.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const PROBLEM = 'Cut the release train from monthly to weekly';
const TECHNIQUES = { scamper: 8, six_hats: 7, triz: 4 };
const SCAMPER = [
  'substitute',
  'combine',
  'adapt',
  'modify',
  'put_to_other_use',
  'eliminate',
  'reverse',
  'parameterize',
];
const HATS = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'];

function run(args, stdin, verbosity, home) {
  const env = {
    ...process.env,
    RESPONSE_VERBOSITY: verbosity,
    PERSISTENCE_TYPE: 'filesystem',
    PERSISTENCE_PATH: home,
  };
  const r = spawnSync('node', [CLI, ...args], {
    input: JSON.stringify(stdin ?? {}),
    env,
    encoding: 'utf8',
  });
  if (r.status !== 0)
    throw new Error(`${args.slice(0, 2).join(' ')} exited ${r.status}: ${r.stderr}`);
  return { bytes: Buffer.byteLength(r.stdout), json: JSON.parse(r.stdout) };
}

function session(technique, steps, verbosity) {
  const home = mkdtempSync(join(tmpdir(), 'measure-verbosity-'));
  try {
    const { planId } = run(
      ['plan', '--problem', PROBLEM, '--techniques', technique],
      {},
      verbosity,
      home
    ).json;
    const perStep = [];
    let sessionId;
    for (let step = 1; step <= steps; step++) {
      const stdin =
        technique === 'scamper'
          ? { scamperAction: SCAMPER[step - 1] }
          : technique === 'six_hats'
            ? { hatColor: HATS[step - 1] }
            : {};
      const args = [
        'execute',
        '--plan',
        planId,
        '--technique',
        technique,
        '--step',
        String(step),
        '--total-steps',
        String(steps),
        '--output',
        `Step ${step} thinking for ${technique}, written at length.`,
        step < steps ? '--next-step-needed' : '--no-next-step-needed',
      ];
      if (sessionId) args.push('--session', sessionId);
      const r = run(args, stdin, verbosity, home);
      sessionId = r.json.sessionId;
      perStep.push(r.bytes);
    }
    return perStep;
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

const rows = [];
for (const [technique, steps] of Object.entries(TECHNIQUES)) {
  const full = session(technique, steps, 'full');
  const minimal = session(technique, steps, 'minimal');
  const sum = a => a.reduce((x, y) => x + y, 0);
  rows.push({
    technique,
    steps,
    full: sum(full),
    minimal: sum(minimal),
    delta: `${((sum(minimal) / sum(full) - 1) * 100).toFixed(1)}%`,
    fullPerStep: full.join('/'),
    minimalPerStep: minimal.join('/'),
  });
}
// stdout on purpose: this is a report, not an MCP stream (the repo's console rule guards the server).
const header = ['technique', 'steps', 'full', 'minimal', 'delta', 'fullPerStep', 'minimalPerStep'];
process.stdout.write(header.join('\t') + '\n');
for (const r of rows) process.stdout.write(header.map(h => String(r[h])).join('\t') + '\n');
