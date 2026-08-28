/**
 * The resubmission delta has to be reproducible, because it is the number
 * Round 2 will be argued from.
 *
 * `analyse-live.mjs` reads a real CT_CALL_LOG and reports how often an advisory
 * finding was followed by a caller who addressed it. That figure is the gate on
 * flipping `severity: 'advisory'` to `'blocking'` — the replay ratchet measures
 * emission and structurally cannot measure reaction, since a replayed
 * transcript's "caller" does what the recording did regardless of what the
 * server says.
 *
 * The fixture holds one session where the caller dropped the offending field
 * after being told about it, and one where the caller re-sent it and moved on.
 * So the correct answer is known by construction: 2 findings, 1 addressed,
 * 1 ignored, delta 0.5. A tool that reports anything else is not measuring what
 * it claims to.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const analyser = path.join(repoRoot, 'evals/replay/analyse-live.mjs');
// Deliberately NOT under evals/replay/fixtures/: that directory is the
// replay corpus, globbed as *.calls.jsonl, and a log containing result
// lines is not replayable. Putting it there widened the fixture set and
// the ratchet refused it, which was the ratchet working correctly.
const fixture = path.join(repoRoot, 'evals/replay/live-logs/delta-sample.jsonl');

interface Report {
  calls: number;
  sessions: number;
  findingsEmitted: number;
  stepsCarryingFindings: number;
  addressed: number;
  ignored: number;
  endedSession: number;
  resubmissionDelta: number | null;
  byGate: Record<string, { addressed: number; ignored: number; endedSession: number }>;
}

function run(): Report {
  return JSON.parse(
    execFileSync('node', [analyser, '--json', fixture], { encoding: 'utf8' })
  ) as Report;
}

describe('the live-log analyser measures the resubmission delta', () => {
  it('separates a caller who addressed a finding from one who did not', () => {
    const report = run();

    // Both sessions tripped the same gate once.
    expect(report.findingsEmitted).toBe(2);
    expect(report.stepsCarryingFindings).toBe(2);

    // Session A dropped `randomStimulus` on the next call; session B re-sent it
    // unchanged and advanced. That is the whole distinction being measured.
    expect(report.addressed).toBe(1);
    expect(report.ignored).toBe(1);
    expect(report.resubmissionDelta).toBe(0.5);

    // Attributed to the gate, not just totalled — Round 2 flips gates
    // individually, so a blended number would not support the decision.
    expect(report.byGate['stimulus.mismatch']).toEqual({
      addressed: 1,
      ignored: 1,
      endedSession: 0,
    });
  });

  it('groups a plan and the steps that follow it as one session', () => {
    // Keyed on planId rather than sessionId: the plan call has no sessionId
    // yet, so keying on that counted it as a session of its own and reported
    // twice the real number.
    expect(run().sessions).toBe(2);
  });

  it('counts every call, including the ones that carried no finding', () => {
    // 2 plans + 4 steps. If the parser silently dropped result lines as calls,
    // or dropped calls whose result had no findings, this would move.
    expect(run().calls).toBe(6);
  });
});
