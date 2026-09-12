/**
 * Print the version semantic-release would cut from HEAD, as JSON, without
 * cutting it: `{"version":"2.10.1"}` when a release is due, `{}` when not.
 *
 * A dry run runs verifyConditions, analyzeCommits, verifyRelease and
 * generateNotes only; the changelog and npm prepare steps and the GitHub
 * publish do not run. `verifyAuth` (a `git push --dry-run`) runs before the
 * plugins, so the caller must provide GITHUB_TOKEN. semantic-release logs to
 * stdout by default; that stream is redirected to stderr here so stdout is
 * exactly one JSON line for the workflow to read.
 *
 * `false` from the API means "no release from this context" (wrong branch,
 * a PR build, or the local branch behind the remote) and is reported as
 * `{}`. A thrown error is not: it propagates, and the step fails, so a broken
 * dry run can never read as "nothing to release".
 */
import { spawnSync } from 'node:child_process';
import semanticRelease from 'semantic-release';

// For each configured release branch on the remote, semantic-release
// force-fetches `+refs/heads/<branch>:refs/heads/<branch>` with
// --update-head-ok unless that branch is the one env-ci reports and HEAD is
// not detached, dry run or not. On an attached HEAD, env-ci reports
// `git rev-parse --abbrev-ref HEAD` locally, which is what this reads, for the
// one release branch in .releaserc; a detached HEAD reads here as `HEAD` and is
// force-fetched regardless. Every worktree shares branch refs: from
// anywhere else the fetch moves `main` under the checkout that has it, whose
// files then read as staged changes reverting every commit it skipped. CI
// checks out main as a branch. A second release branch would be force-fetched
// from any HEAD, which no check here can prevent.
const head = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' });
const reported = (head.stdout ?? '').trim();
if (head.status !== 0 || reported !== 'main') {
  process.stderr.write(
    `next-release: git reports HEAD as ${reported || 'nothing'}, not main; ` +
      'from anywhere else semantic-release force-fetches main under the checkout that has it.\n'
  );
  process.exit(1);
}

const result = await semanticRelease(
  { dryRun: true },
  { cwd: process.cwd(), env: process.env, stdout: process.stderr, stderr: process.stderr }
);

const version = result && result.nextRelease ? result.nextRelease.version : undefined;
process.stdout.write(JSON.stringify(version ? { version } : {}) + '\n');
