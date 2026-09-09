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
import semanticRelease from 'semantic-release';

const result = await semanticRelease(
  { dryRun: true },
  { cwd: process.cwd(), env: process.env, stdout: process.stderr, stderr: process.stderr }
);

const version = result && result.nextRelease ? result.nextRelease.version : undefined;
process.stdout.write(JSON.stringify(version ? { version } : {}) + '\n');
