/**
 * `next-release.mjs` refuses to run unless git reports HEAD as `main`.
 *
 * For every configured release branch on the remote, semantic-release
 * force-fetches `+refs/heads/<branch>:refs/heads/<branch>` with
 * `--update-head-ok` unless that branch is the one env-ci reports and HEAD is
 * not detached (semantic-release lib/branches/index.js, lib/git.js `fetch`).
 * On an attached HEAD, env-ci reports `git rev-parse --abbrev-ref HEAD`
 * locally; under GitHub Actions it reports GITHUB_REF. A dry run does not skip
 * the fetch. Every
 * worktree shares branch refs, so from a checkout not on `main` that fetch
 * advances `main` under the checkout that has it, whose files stay behind and
 * read as staged changes reverting every commit it skipped. On 2026-09-09 a
 * run from a worktree on another branch did this to the main checkout, 62
 * commits deep.
 *
 * The fixture is that shape: a clone with `main` checked out, its remote one
 * commit ahead, and worktrees beside it. Each case runs the real script with
 * a scrubbed environment, adding GitHub Actions' variables only where the
 * case names them.
 *
 * Breaks: delete the check (`main` jumps to the remote's commit); read
 * `git symbolic-ref --short HEAD` instead (an ambiguous `heads/main` passes and
 * `main` moves); match `main` as a prefix or substring (a `main-…` branch
 * passes); refuse unconditionally, or whenever GITHUB_ACTIONS is set (the
 * release workflow can no longer compute a release).
 */
import { execFileSync, spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('../../../scripts/release/next-release.mjs', import.meta.url));
const REFUSAL = /next-release: /;

// No user or system git config, and an identity for the fixture's commits.
const GIT_ENV = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

// What a push to main sets in the release workflow, as far as env-ci reads it.
const GITHUB_ACTIONS_ENV = {
  GITHUB_ACTIONS: 'true',
  GITHUB_EVENT_NAME: 'push',
  GITHUB_REF: 'refs/heads/main',
};

let root: string;
let clone: string;
let before: string;

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...GIT_ENV },
  }).trim();
}

function runScript(cwd: string, extraEnv: Record<string, string> = {}): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: root, ...GIT_ENV, ...extraEnv },
    timeout: 25_000,
  });
}

function expectRefused(run: SpawnSyncReturns<string>): void {
  expect(git(clone, 'rev-parse', 'refs/heads/main')).toBe(before);
  expect(run.stderr).toMatch(REFUSAL);
  expect(run.status).toBe(1);
  expect(run.stdout).toBe('');
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'next-release-guard-'));
  const remote = join(root, 'remote.git');
  const seed = join(root, 'seed');
  clone = join(root, 'clone');
  git(root, 'init', '-q', '--bare', '-b', 'main', remote);
  git(root, 'init', '-q', '-b', 'main', seed);
  git(seed, 'commit', '-q', '--allow-empty', '-m', 'feat: one');
  git(seed, 'push', '-q', remote, 'main');
  git(root, 'clone', '-q', remote, clone);
  git(seed, 'commit', '-q', '--allow-empty', '-m', 'feat: two');
  git(seed, 'push', '-q', remote, 'main');
  before = git(clone, 'rev-parse', 'refs/heads/main');
  // Without a remote ahead, a fetch has nothing to move and every "main where it was" check passes vacuously.
  expect(git(remote, 'rev-parse', 'main')).not.toBe(before);
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('next-release.mjs', () => {
  // A failed case may have moved `main`; put it back so the next case starts from the fixture.
  afterEach(() => {
    git(clone, 'reset', '-q', '--hard', before);
  });

  it.each<[string, string | null]>([
    ['a detached HEAD', null],
    ['a branch other than main', 'feature'],
    ['a branch whose name starts with main', 'main-feature'],
  ])(
    'refuses from a worktree on %s, leaving main where it was',
    (_, branch) => {
      const worktree = mkdtempSync(join(root, 'wt-'));
      const flags = branch === null ? ['--detach'] : ['-b', `${branch}-${basename(worktree)}`];
      git(clone, 'worktree', 'add', '-q', ...flags, worktree, 'HEAD');

      expectRefused(runScript(worktree));
    },
    30_000
  );

  it('refuses from main when git reports it as heads/main, leaving main where it was', () => {
    // A ref under another namespace that shortens to `main` makes the short name ambiguous.
    git(clone, 'update-ref', 'refs/remotes/main', 'HEAD');
    try {
      expect(git(clone, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('heads/main');

      expectRefused(runScript(clone));
    } finally {
      git(clone, 'update-ref', '-d', 'refs/remotes/main');
    }
  }, 30_000);

  it.each<[string, Record<string, string>]>([
    ['no CI variables', {}],
    ["GitHub Actions' variables", GITHUB_ACTIONS_ENV],
  ])(
    'gets past the fetch from the checkout that has main attached, with %s',
    (_, extraEnv) => {
      const run = runScript(clone, extraEnv);

      expect(run.error).toBeUndefined();
      expect(run.stderr).not.toMatch(REFUSAL);
      // Logged once semantic-release has fetched and matched the branch env-ci reports to `main`.
      expect(run.stderr).toMatch(/Run automated release from branch main /);
      expect(git(clone, 'rev-parse', 'refs/heads/main')).toBe(before);
    },
    30_000
  );
});
