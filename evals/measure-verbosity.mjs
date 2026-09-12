#!/usr/bin/env node
// Re-price `minimal` against `full`: run scamper (8), six_hats (7) and triz (4)
// through the built CLI under each RESPONSE_VERBOSITY and report stdout bytes
// AND token counts per step. The env var is read on every call, so the same
// script measures before and after the default flip.
//
// Tokens: with ANTHROPIC_API_KEY set, count_tokens gives Claude's own count
// (TOKEN_MODEL, default claude-opus-5); otherwise gpt-tokenizer o200k_base, an
// approximation (see evals/lib/token-count.mjs). The tokenMode column carries
// which. Usage: node evals/measure-verbosity.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeCounter } from './lib/token-count.mjs';

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const PROBLEM = 'Cut the release train from monthly to weekly';
const TECHNIQUES = { scamper: 8, six_hats: 7, triz: 4 };
const TOKEN_MODEL = process.env.TOKEN_MODEL || 'claude-opus-5';
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

function invoke(args, stdin, verbosity, home) {
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
  return r.stdout;
}

async function session(counter, technique, steps, verbosity) {
  const home = mkdtempSync(join(tmpdir(), 'measure-verbosity-'));
  try {
    const planOut = invoke(
      ['plan', '--problem', PROBLEM, '--techniques', technique],
      {},
      verbosity,
      home
    );
    const { planId } = JSON.parse(planOut);
    const perStepBytes = [];
    const perStepTokens = [];
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
      const stdout = invoke(args, stdin, verbosity, home);
      sessionId = JSON.parse(stdout).sessionId;
      perStepBytes.push(Buffer.byteLength(stdout));
      perStepTokens.push(await counter.count(stdout));
    }
    return { perStepBytes, perStepTokens };
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

async function main() {
  const counter = await makeCounter({ apiKey: process.env.ANTHROPIC_API_KEY, model: TOKEN_MODEL });
  const sum = a => a.reduce((x, y) => x + y, 0);
  const rows = [];
  for (const [technique, steps] of Object.entries(TECHNIQUES)) {
    const full = await session(counter, technique, steps, 'full');
    const minimal = await session(counter, technique, steps, 'minimal');
    const fb = sum(full.perStepBytes);
    const mb = sum(minimal.perStepBytes);
    const ft = sum(full.perStepTokens);
    const mt = sum(minimal.perStepTokens);
    rows.push({
      technique,
      steps,
      full: fb,
      minimal: mb,
      delta: `${((mb / fb - 1) * 100).toFixed(1)}%`,
      fullTokens: ft,
      minimalTokens: mt,
      tokenDelta: `${((mt / ft - 1) * 100).toFixed(1)}%`,
      tokenMode: counter.label,
      fullPerStep: full.perStepBytes.join('/'),
      minimalPerStep: minimal.perStepBytes.join('/'),
    });
  }
  // stdout on purpose: this is a report, not an MCP stream (the repo's console
  // rule guards the server, not evals/).
  const header = [
    'technique',
    'steps',
    'full',
    'minimal',
    'delta',
    'fullTokens',
    'minimalTokens',
    'tokenDelta',
    'tokenMode',
    'fullPerStep',
    'minimalPerStep',
  ];
  process.stdout.write(header.join('\t') + '\n');
  for (const r of rows) process.stdout.write(header.map(h => String(r[h])).join('\t') + '\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
