/**
 * `next-release.mjs` runs only in GitHub Actions, refuses anywhere else before
 * semantic-release can fetch, and in Actions reports a dry run's version
 * without releasing.
 *
 * semantic-release fetches into the repository it runs in, dry run or not
 * (semantic-release lib/branches/index.js; lib/git.js `fetch`, `fetchNotes`):
 * `+refs/notes/*:refs/notes/*` always, and, with tags,
 * `+refs/heads/<branch>:refs/heads/<branch>` with `--update-head-ok` for every
 * configured release branch on the remote except the one env-ci reports on an
 * attached HEAD. The release workflow's checkout is a fresh clone nothing else
 * uses. In a developer's repository every worktree shares those refs, so a
 * local run can advance `main` under the checkout that has it, whose files then
 * read as staged changes reverting every commit it skipped. On 2026-09-09 a
 * local run from a worktree on another branch did this to the main checkout, 62
 * commits deep.
 *
 * The fixture is a clone whose `main` is behind its remote and whose notes
 * differ from the remote's, with a detached worktree beside it, so an in-place
 * fetch from either checkout moves a ref.
 *
 * Breaks: delete the check (the refusal cases run semantic-release, and a ref
 * moves in each); refuse unconditionally (both Actions cases exit 1); test
 * GITHUB_ACTIONS for truthiness instead of `=== 'true'` (the `false` and `1`
 * cases run semantic-release); drop `dryRun: true` (the up-to-date case pushes
 * a tag to the remote); stop reporting the version (the up-to-date case prints
 * `{}`).
 */
import { execFileSync, spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('../../../scripts/release/next-release.mjs', import.meta.url));
const REFUSAL = /next-release: /;
// Logged once semantic-release has fetched and matched the branch env-ci reports to `main`.
const REACHED_MAIN = /Run automated release from branch main /;

// No user or system git config, and an identity for the fixture's commits and notes.
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
let remote: string;
let clone: string;
let worktree: string;
let mainBefore: string;
let notesBefore: string;

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...GIT_ENV },
  }).trim();
}

function refs(repo: string): string {
  return git(repo, 'for-each-ref', '--format=%(objectname) %(refname)');
}

function runScript(cwd: string, extraEnv: Record<string, string> = {}): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: root, ...GIT_ENV, ...extraEnv },
    timeout: 25_000,
  });
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'next-release-test-'));
  remote = join(root, 'remote.git');
  const seed = join(root, 'seed');
  clone = join(root, 'clone');
  worktree = join(root, 'wt');
  git(root, 'init', '-q', '--bare', '-b', 'main', remote);
  git(root, 'init', '-q', '-b', 'main', seed);
  writeFileSync(
    join(seed, '.releaserc'),
    JSON.stringify({ branches: ['main'], plugins: ['@semantic-release/commit-analyzer'] })
  );
  git(seed, 'add', '.releaserc');
  git(seed, 'commit', '-q', '-m', 'feat: one');
  git(seed, 'notes', 'add', '-m', 'from the remote', 'HEAD');
  git(seed, 'push', '-q', remote, 'main', 'refs/notes/commits');
  git(root, 'clone', '-q', remote, clone);
  git(clone, 'notes', 'add', '-m', 'local only', 'HEAD');
  git(clone, 'worktree', 'add', '-q', '--detach', worktree, 'HEAD');
  git(seed, 'commit', '-q', '--allow-empty', '-m', 'feat: two');
  git(seed, 'push', '-q', remote, 'main');
  mainBefore = git(clone, 'rev-parse', 'refs/heads/main');
  notesBefore = git(clone, 'rev-parse', 'refs/notes/commits');
  // Without a remote ahead, a fetch has nothing to move and every refs check passes vacuously.
  expect(git(remote, 'rev-parse', 'main')).not.toBe(mainBefore);
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('next-release.mjs', () => {
  // A failed case may have moved `main` or overwritten the notes. Put both back, or the
  // next case starts with nothing left to move and its refs check passes vacuously.
  afterEach(() => {
    git(clone, 'reset', '-q', '--hard', mainBefore);
    git(clone, 'update-ref', 'refs/notes/commits', notesBefore);
  });

  it.each<[string, 'clone' | 'worktree', Record<string, string>]>([
    ['the checkout that has main attached, GITHUB_ACTIONS unset', 'clone', {}],
    ['a detached worktree, GITHUB_ACTIONS unset', 'worktree', {}],
    [
      'the checkout that has main attached, GITHUB_ACTIONS=false',
      'clone',
      { GITHUB_ACTIONS: 'false' },
    ],
    ['the checkout that has main attached, GITHUB_ACTIONS=1', 'clone', { GITHUB_ACTIONS: '1' }],
  ])(
    'refuses from %s, before fetching anything',
    (_, where, extraEnv) => {
      const cwd = where === 'clone' ? clone : worktree;
      const refsBefore = refs(clone);

      const run = runScript(cwd, extraEnv);

      expect(refs(clone)).toBe(refsBefore);
      expect(run.stderr).toMatch(REFUSAL);
      expect(run.status).toBe(1);
      expect(run.stdout).toBe('');
    },
    30_000
  );

  it('in GitHub Actions, from main behind its remote, prints {}', () => {
    const run = runScript(clone, GITHUB_ACTIONS_ENV);

    expect(run.stderr).not.toMatch(REFUSAL);
    expect(run.stderr).toMatch(REACHED_MAIN);
    expect(run.status).toBe(0);
    expect(run.stdout).toBe('{}\n');
  }, 30_000);

  it('in GitHub Actions, from main up to date with a feat commit, prints the version and tags nothing', () => {
    git(clone, 'fetch', '-q', 'origin');
    git(clone, 'reset', '-q', '--hard', git(remote, 'rev-parse', 'main'));

    const run = runScript(clone, GITHUB_ACTIONS_ENV);

    expect(run.stderr).toMatch(REACHED_MAIN);
    expect(run.status).toBe(0);
    expect(run.stdout).toBe('{"version":"1.0.0"}\n');
    // A dry run tags nothing; a real run would push v1.0.0 to the remote.
    expect(git(remote, 'tag', '--list')).toBe('');
  }, 30_000);
});
