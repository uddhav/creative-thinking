/**
 * The release pipeline's one decision, tested as a pure function.
 *
 * Since #437 (2026-09) the release tag is cut on the merge of the bump PR,
 * not on the feature merge, so `package.json` at every tag equals the tag.
 * Before that, every tag's tree carried the previous version (v2.10.0 held
 * 2.9.0, v2.9.0 held 2.8.0), because semantic-release tagged the feature
 * merge and the bump PR landed one merge later.
 *
 * semantic-release.yml runs a dry run on every push to main to learn the
 * next version, then asks `decide` what the push means. Everything that can
 * cut a wrong tag or stall a release lives in that function, which is why it
 * has no I/O and is pinned here.
 *
 * Breaks: flip the equality in `decide` (the bump merge reads `bump`);
 * drop the `error` branch (a package.json ahead of the analyzer reads
 * `bump`, and the bump job's backwards guard then rejects it on every push,
 * forever, with the release run green); treat a CONFLICTING bump PR as open
 * (every release stalls after a lockfile merge).
 */
import { describe, expect, it } from 'vitest';
import { decide, openBumpVersionFrom } from '../../../scripts/release/release-decision.mjs';

describe('decide', () => {
  it('a push with nothing releasable does nothing', () => {
    expect(decide({ next: undefined, current: '2.10.0', openBumpVersion: undefined }).action).toBe(
      'none'
    );
  });

  it('the bump merge is the release: package.json already holds the computed version', () => {
    expect(decide({ next: '2.10.1', current: '2.10.1', openBumpVersion: undefined })).toEqual({
      action: 'release',
      version: '2.10.1',
    });
  });

  it('a duplicate bump PR still open does not stop the release', () => {
    expect(decide({ next: '2.10.1', current: '2.10.1', openBumpVersion: '2.10.1' }).action).toBe(
      'release'
    );
  });

  it('the first fix after a tag proposes a bump', () => {
    expect(decide({ next: '2.10.1', current: '2.10.0', openBumpVersion: undefined })).toEqual({
      action: 'bump',
      version: '2.10.1',
    });
  });

  it('a second fix while that bump is open proposes nothing new', () => {
    expect(decide({ next: '2.10.1', current: '2.10.0', openBumpVersion: '2.10.1' }).action).toBe(
      'none'
    );
  });

  it('a feat after a patch bump supersedes it', () => {
    expect(decide({ next: '2.11.0', current: '2.10.0', openBumpVersion: '2.10.1' })).toEqual({
      action: 'bump',
      version: '2.11.0',
    });
  });

  it('a stale bump merged by hand is skipped, never tagged', () => {
    expect(decide({ next: '2.11.0', current: '2.10.1', openBumpVersion: undefined })).toEqual({
      action: 'bump',
      version: '2.11.0',
    });
  });

  it('package.json ahead of the analyzer is an error, not a bump the guard rejects forever', () => {
    const result = decide({ next: '2.10.1', current: '2.11.0', openBumpVersion: undefined });
    expect(result.action).toBe('error');
    expect(result.reason).toMatch(/2\.11\.0.*ahead.*2\.10\.1/);
  });

  it('an unparseable version is an error', () => {
    expect(decide({ next: '2.10.1', current: 'main', openBumpVersion: undefined }).action).toBe(
      'error'
    );
  });
});

describe('openBumpVersionFrom', () => {
  const pr = (title: string, mergeable: string, headRefName = 'chore/version-bump-20260908') => ({
    title,
    mergeable,
    headRefName,
  });

  it('reads the version from an open, mergeable bump PR', () => {
    expect(openBumpVersionFrom([pr('chore(release): bump version to 2.10.1', 'MERGEABLE')])).toBe(
      '2.10.1'
    );
  });

  it('a CONFLICTING bump PR counts as absent, so the run re-dispatches instead of stalling', () => {
    expect(
      openBumpVersionFrom([pr('chore(release): bump version to 2.10.1', 'CONFLICTING')])
    ).toBeUndefined();
  });

  it('UNKNOWN mergeability (the first seconds after creation) counts as open', () => {
    expect(openBumpVersionFrom([pr('chore(release): bump version to 2.10.1', 'UNKNOWN')])).toBe(
      '2.10.1'
    );
  });

  it('ignores PRs off the bump branch prefix and titles without a version', () => {
    expect(
      openBumpVersionFrom([
        pr('chore(release): bump version to 2.10.1', 'MERGEABLE', 'feature/other'),
        pr('chore: something else', 'MERGEABLE'),
      ])
    ).toBeUndefined();
  });
});
