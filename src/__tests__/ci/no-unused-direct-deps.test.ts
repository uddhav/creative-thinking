import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Every runtime dependencies entry must be imported from non-test source.
 *
 * The zod package was declared here for years and imported nowhere: it is the
 * MCP SDK's own dependency and peer, so it resolved transitively regardless,
 * and the direct declaration only made Dependabot open bump PRs for a package
 * this package does not use. This guard fails if a dependencies entry has no
 * import, so a future dead direct dependency is caught in CI rather than by a
 * grep months later.
 *
 * Scope: dependencies only (not devDependencies, optionalDependencies, or
 * peerDependencies — a build/test/optional tool need not be imported by src).
 * Only real import/require statements count, and test files are excluded, so
 * a string literal or a doc comment mentioning a name does not satisfy the
 * guard. A subpath import counts for the bare package name.
 */
const ROOT = join(__dirname, '..', '..', '..');

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, out);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('runtime dependencies are all imported', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>;
  };
  const deps = Object.keys(pkg.dependencies);
  const source = collectSourceFiles(join(ROOT, 'src'))
    .map(f => readFileSync(f, 'utf8'))
    .join('\n');

  it('names at least one production dependency', () => {
    expect(deps.length).toBeGreaterThan(0);
  });

  for (const dep of deps) {
    it(`${dep} is imported from non-test source`, () => {
      const escaped = dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // `from 'dep'`, `import 'dep'`, `import('dep')`, `require('dep')`, with
      // an optional `/subpath`. Only an import/require context counts, so a
      // string literal or comment mentioning the name does not.
      const used = new RegExp(`(?:from|import|require\\()\\s*['"]${escaped}(?:/[^'"]*)?['"]`).test(
        source
      );
      expect(used, `${dep} is in "dependencies" but never imported from src/ (non-test)`).toBe(
        true
      );
    });
  }
});
