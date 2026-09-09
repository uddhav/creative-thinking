/**
 * Workflow glue for the release decision: reads the three inputs from the
 * environment, calls the pure `decide`, and prints `action`, `version` and
 * `reason` as GITHUB_OUTPUT lines on stdout.
 *
 * Inputs (all set by semantic-release.yml, never interpolated into a shell):
 * - NEXT_JSON: stdout of next-release.mjs (`{"version":"X.Y.Z"}` or `{}`)
 * - CURRENT_VERSION: package.json's version at HEAD
 * - OPEN_PRS_JSON: `gh pr list --state open --label release
 *   --json headRefName,title,mergeable`
 */
import { decide, openBumpVersionFrom } from './release-decision.mjs';

const next = JSON.parse(process.env.NEXT_JSON || '{}').version;
const current = process.env.CURRENT_VERSION;
const openPrs = JSON.parse(process.env.OPEN_PRS_JSON || '[]');

const decision = decide({ next, current, openBumpVersion: openBumpVersionFrom(openPrs) });

process.stdout.write(`action=${decision.action}\n`);
process.stdout.write(`version=${decision.version ?? ''}\n`);
process.stdout.write(`reason=${(decision.reason ?? '').replace(/\n/g, ' ')}\n`);
process.stderr.write(
  `[release] next=${next ?? 'none'} current=${current} open=${openBumpVersionFrom(openPrs) ?? 'none'} -> ${decision.action}${decision.reason ? ` (${decision.reason})` : ''}\n`
);
