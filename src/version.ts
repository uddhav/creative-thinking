/**
 * The server's version, for `serverInfo.version`, `socketes --version` and the
 * `serverVersion` field on the discover and plan responses (#417).
 *
 * Resolution order:
 * 1. `process.env.CREATIVE_THINKING_VERSION`. The four `build:bin*` scripts
 *    pass `--env='CREATIVE_THINKING_*'` to `bun build --compile`, which inlines
 *    the variable at build time, and release-binaries.yml sets it from the
 *    tag. A compiled binary cannot read package.json: its `import.meta.url` is
 *    the bundle entry, so the relative read below misses; and yargs' own
 *    `--version` walks up from `process.cwd()` inside a bundle and printed
 *    whatever package.json happened to be there. Under node the variable is
 *    normally unset, and a shell that sets it overrides the file.
 * 2. `package.json` one level up from `dist/`, as the MCP entry always did.
 *    Exact at a tag only since the release tag is cut on the bump commit.
 * 3. `'0.0.0'` when neither is available.
 *
 * No top-level side effect: importing this module reads nothing, so
 * `src/index.ts` stays import-safe.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SEMVER = /^\d+\.\d+\.\d+(?:[-+].*)?$/;

export function getVersion(): string {
  const injected = process.env.CREATIVE_THINKING_VERSION;
  if (injected && SEMVER.test(injected)) {
    return injected;
  }
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
