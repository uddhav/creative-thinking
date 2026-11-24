/**
 * Print the version semantic-release would cut from HEAD, as JSON, without
 * cutting it: `{"version":"2.10.1"}` when a release is due, `{}` when not.
 *
 * GitHub Actions only: this exits 1 unless GITHUB_ACTIONS is `true`.
 * semantic-release fetches into the repository it runs in, dry run or not
 * (semantic-release lib/branches/index.js, lib/git.js): `refs/notes/*` always,
 * and, with tags, every configured release branch on the remote, forced over
 * the local branch of that name with --update-head-ok unless it is the branch
 * env-ci reports on an attached HEAD. The release workflow's checkout is a
 * fresh clone nothing else uses. In a local repository every worktree shares
 * those refs, so a run can move `main` under the checkout that has it, whose
 * files then read as staged changes reverting every commit it skipped. On
 * 2026-09-09 a local run did that, 62 commits deep.
 *
 * To preview locally, run these lines one at a time, without the leading `*`,
 * from the root of this repository. The dry run happens in a throwaway clone
 * of main as it is on the remote, with the variables a push to main sets in
 * Actions, so whatever semantic-release fetches lands in the clone:
 *
 *   rm -rf /tmp/next-release-preview
 *   git fetch --quiet origin main
 *   git clone --quiet --shared "$(git rev-parse --path-format=absolute --git-common-dir)" /tmp/next-release-preview
 *   git -C /tmp/next-release-preview checkout --quiet -B main "$(git rev-parse FETCH_HEAD)"
 *   (cd /tmp/next-release-preview && GITHUB_ACTIONS=true GITHUB_REF=refs/heads/main GITHUB_TOKEN="$(gh auth token)" node "$OLDPWD/scripts/release/next-release.mjs")
 *   rm -rf /tmp/next-release-preview
 *
 * Setting GITHUB_ACTIONS=true in a checkout you work in runs the dry run there
 * and can move `main`; set it only in a clone like the one above.
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

if (process.env.GITHUB_ACTIONS !== 'true') {
  process.stderr.write(
    'next-release: runs only in the release workflow. Run here, semantic-release would fetch into ' +
      'refs every worktree shares; to preview, follow the throwaway-clone steps at the top of this file.\n'
  );
  process.exit(1);
}

const result = await semanticRelease(
  { dryRun: true },
  { cwd: process.cwd(), env: process.env, stdout: process.stderr, stderr: process.stderr }
);

const version = result && result.nextRelease ? result.nextRelease.version : undefined;
process.stdout.write(JSON.stringify(version ? { version } : {}) + '\n');
