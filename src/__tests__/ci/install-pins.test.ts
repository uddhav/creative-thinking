/**
 * Every documented install is pinned to the current major (#311).
 *
 * The README, SOCKETES and CLAUDE.md installed from
 * `github:uddhav/creative-thinking` unpinned, a git spec that resolves to
 * the default branch, so a major release would have flipped the response
 * default under every client on its next start ("ships as a major" was a
 * changelog entry, not a gate). Each site now carries `#semver:^N`, the
 * newest release inside the major; pr-version-bump.yml rewrites N on a
 * major release and refuses a spec that lost its pin, and this test is the
 * gate in CI for both.
 *
 * Breaks: unpin one site; rewrite one site to the wrong major.
 */
import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const SPEC = 'github:uddhav/creative-thinking';
const major = (
  JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }
).version.split('.')[0];

describe('documented installs are pinned to the major', () => {
  for (const file of ['README.md', 'SOCKETES.md', 'CLAUDE.md', 'SPECIFICATIONS.md']) {
    it(`${file}: every spec carries #semver:^${major}`, () => {
      const text = readFileSync(file, 'utf8');
      const sites = text.match(new RegExp(`${SPEC}[^\\s"'\`)\\]]*`, 'g')) ?? [];
      expect(sites.length, `${file} names no install spec`).toBeGreaterThan(0);
      for (const site of sites) {
        expect(site, `${file}: ${site}`).toBe(`${SPEC}#semver:^${major}`);
      }
    });
  }
});
