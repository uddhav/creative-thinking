import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Two workflow-pin invariants that CI cannot otherwise catch.
 *
 * 1. Every `github/codeql-action/*` step across the workflows pins the SAME
 *    SHA and version comment. The action refuses to run when `init` and the
 *    analysis steps are on different versions ("Loaded a configuration file
 *    for version X, but running version Y"); #339 bumped `init` alone and
 *    left the codeql job broken for 13 days, and `pr-checks.yml` hid it
 *    behind `continue-on-error`.
 *
 * 2. Every `with:` key passed to `anthropics/claude-code-action` is one the
 *    action actually declares. `direct_prompt:` was a v0 input that v1
 *    renamed to `prompt:`; the workflow kept passing the dead name, so GitHub
 *    logged "Unexpected input(s) 'direct_prompt'" and the review ran with an
 *    empty prompt. The allowlist is the set of inputs the workflows pass,
 *    checked against action.yml at the pinned SHA below; a claude-code-action
 *    bump changes that SHA, so this guard reddens until the allowlist is
 *    re-checked against the new version's action.yml.
 */
const WORKFLOWS = join(__dirname, '..', '..', '..', '.github', 'workflows');

function workflowFiles(): { name: string; text: string }[] {
  return readdirSync(WORKFLOWS)
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map(name => ({ name, text: readFileSync(join(WORKFLOWS, name), 'utf8') }));
}

describe('codeql-action steps are pinned to one version', () => {
  const pinRe = /uses:\s*github\/codeql-action\/[a-z-]+@([0-9a-f]{40})\s*#\s*(\S+)/g;
  const pins: { file: string; sha: string; comment: string }[] = [];
  for (const { name, text } of workflowFiles()) {
    for (const m of text.matchAll(pinRe)) {
      pins.push({ file: name, sha: m[1], comment: m[2] });
    }
  }

  it('finds the codeql-action steps', () => {
    expect(pins.length).toBeGreaterThanOrEqual(4);
  });

  it('all pin the same SHA and comment', () => {
    const distinct = [...new Set(pins.map(p => `${p.sha} ${p.comment}`))];
    expect(distinct, `codeql-action steps disagree: ${JSON.stringify(pins)}`).toHaveLength(1);
  });
});

describe('claude-code-action is passed only inputs it declares', () => {
  // action.yml inputs at the pinned SHA below (byte-identical at a874e9ec and
  // d75b94d5). Re-derive with:
  //   gh api repos/anthropics/claude-code-action/contents/action.yml?ref=<sha> \
  //     --jq .content | base64 -d | grep -E '^  [a-z_]+:'
  const PINNED_SHA = 'd75b94d5ad426cb8546e6628b6f5f19b84e5cce1'; // checked 2026-09-12
  const ALLOWED = new Set([
    'additional_permissions',
    'claude_code_oauth_token',
    'github_token',
    'prompt',
    'use_sticky_comment',
  ]);

  const users = workflowFiles().filter(f => f.text.includes('anthropics/claude-code-action@'));

  it('is used by at least one workflow', () => {
    expect(users.length).toBeGreaterThan(0);
  });

  for (const { name, text } of users) {
    it(`${name}: pins the checked SHA`, () => {
      expect(text).toContain(`anthropics/claude-code-action@${PINNED_SHA}`);
    });

    it(`${name}: passes only declared inputs`, () => {
      const lines = text.split('\n');
      const usesIdx = lines.findIndex(l => /uses:\s*anthropics\/claude-code-action@/.test(l));
      expect(usesIdx, 'claude-code-action step not found').toBeGreaterThanOrEqual(0);
      const withIdx = lines.findIndex((l, i) => i > usesIdx && /^\s*with:\s*$/.test(l));
      expect(withIdx, 'no with: block after the step').toBeGreaterThan(usesIdx);
      const withIndent = lines[withIdx].search(/\S/);
      const keys: string[] = [];
      for (let i = withIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        const indent = line.search(/\S/);
        if (indent <= withIndent) break; // dedent ends the with block
        const key = /^\s*([a-z_]+):/.exec(line);
        if (key && indent === withIndent + 2) keys.push(key[1]);
      }
      expect(keys.length, `${name}: no with: keys parsed`).toBeGreaterThan(0);
      const undeclared = keys.filter(k => !ALLOWED.has(k));
      expect(undeclared, `${name}: passes inputs claude-code-action does not declare`).toEqual([]);
    });
  }
});
