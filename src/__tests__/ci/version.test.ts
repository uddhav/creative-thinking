/**
 * getVersion() resolution (#417). A compiled `socketes` binary cannot read
 * package.json (its import.meta.url is the bundle entry) and yargs' default
 * --version walked up from process.cwd() and printed whatever package.json
 * was there, so the build inlines CREATIVE_THINKING_VERSION and this function
 * prefers it. Under node the file is read.
 *
 * Break: drop the env branch (the injected case reads the file's version).
 * The compiled-binary behaviour is a kill-check run by hand with bun, not a
 * test: `npm run build:bin` then the binary from /private/tmp prints the
 * package version with `.version(getVersion())` and `unknown` with bare
 * `.version()`.
 */
import { readFileSync } from 'fs';
import { afterEach, describe, expect, it } from 'vitest';
import { getVersion } from '../../version.js';

const saved = process.env.CREATIVE_THINKING_VERSION;
afterEach(() => {
  if (saved === undefined) delete process.env.CREATIVE_THINKING_VERSION;
  else process.env.CREATIVE_THINKING_VERSION = saved;
});

describe('getVersion', () => {
  it('reads package.json under node', () => {
    delete process.env.CREATIVE_THINKING_VERSION;
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    expect(getVersion()).toBe(pkg.version);
  });

  it('prefers the build-time injected version', () => {
    process.env.CREATIVE_THINKING_VERSION = '9.9.9';
    expect(getVersion()).toBe('9.9.9');
  });

  it('ignores an injected value that is not a version', () => {
    process.env.CREATIVE_THINKING_VERSION = 'main';
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    expect(getVersion()).toBe(pkg.version);
  });
});
