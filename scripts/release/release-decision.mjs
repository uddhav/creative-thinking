/**
 * The release pipeline's one decision. Pure: no I/O, no git, no GitHub.
 *
 * On every push to main, semantic-release.yml learns the next version from a
 * semantic-release dry run and asks this function what the push means:
 *
 * - `release`: package.json already holds the computed version, so HEAD is
 *   the merge of the bump PR. The real semantic-release run tags it, and the
 *   tagged tree carries its own version (the property the pipeline exists
 *   for; before this, every tag's tree held the previous version).
 * - `bump`: a releasable commit landed and no open bump PR proposes the
 *   version yet. The bump PR is dispatched with the version and HEAD's sha.
 * - `none`: nothing releasable, or the right bump PR is already open.
 * - `error`: package.json is ahead of what the analyzer computes (a hand
 *   edit). A bump would be rejected by the bump job's backwards guard on
 *   every push, forever, with the release run green; failing here is loud.
 *
 * No arithmetic on versions happens here beyond comparison: `next` is what
 * semantic-release itself computed, and the tag is only ever that value.
 */

/** @param {string | undefined} v */
export function parseVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v ?? '');
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** @param {number[]} a @param {number[]} b */
function compare(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * @param {{ next?: string; current?: string; openBumpVersion?: string }} input
 * @returns {{ action: 'release' | 'bump' | 'none' | 'error'; version?: string; reason?: string }}
 */
export function decide({ next, current, openBumpVersion }) {
  if (!next) {
    return { action: 'none', reason: 'no releasable commit since the last tag' };
  }
  const n = parseVersion(next);
  const c = parseVersion(current);
  if (!n || !c) {
    return { action: 'error', reason: `unparseable version: next=${next} current=${current}` };
  }
  const order = compare(n, c);
  if (order === 0) {
    return { action: 'release', version: next };
  }
  if (order < 0) {
    return {
      action: 'error',
      reason: `package.json ${current} is ahead of the computed next release ${next}`,
    };
  }
  if (openBumpVersion === next) {
    return { action: 'none', reason: `a bump PR for ${next} is already open` };
  }
  return { action: 'bump', version: next };
}

/**
 * The version an open, mergeable bump PR proposes, from
 * `gh pr list --state open --label release --json headRefName,title,mergeable`.
 * A CONFLICTING PR counts as absent: a lockfile merge would otherwise stall
 * every release, since the decision would read `none` on every push while
 * nobody could merge the PR. UNKNOWN (the first seconds after creation)
 * counts as open.
 *
 * @param {Array<{ headRefName: string; title: string; mergeable?: string }>} prs
 * @returns {string | undefined}
 */
export function openBumpVersionFrom(prs) {
  for (const pr of prs) {
    if (!pr.headRefName.startsWith('chore/version-bump-')) continue;
    if (pr.mergeable === 'CONFLICTING') continue;
    const m = /^chore\(release\): bump version to (\d+\.\d+\.\d+)$/.exec(pr.title);
    if (m) return m[1];
  }
  return undefined;
}
