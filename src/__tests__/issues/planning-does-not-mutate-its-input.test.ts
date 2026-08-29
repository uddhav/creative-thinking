/**
 * Planning reordered the caller's own array, and then disagreed with it.
 *
 * `generateHistoricalNote` built a lookup key with `techniques.sort()`.
 * `Array.prototype.sort` sorts in place, and that array is the caller's — so
 * planning a session for `['triz', 'six_hats']` left the caller holding
 * `['six_hats', 'triz']`. The plan's own workflow kept the requested order, so
 * the two disagreed about which technique came first.
 *
 * The consequence is not cosmetic. The natural way to execute a plan is to walk
 * the technique list you passed in, and under plan-wide numbering the step
 * number has to line up with the block at that position. A caller doing exactly
 * that sent six_hats steps where triz's block sat and had every call after the
 * first block rejected — "Step 8 is invalid for TRIZ. Valid range is 1-4".
 *
 * That is how this was found: a probe written to test something else walked its
 * own array afterwards, produced a session with zero insights and no
 * completion, and looked for all the world like a numbering regression. The
 * numbering was fine. The array had been changed underneath it.
 *
 * The sort exists only to key a table of canned "these techniques go well
 * together" strings.
 *
 * This file keeps the in-process entry point, deliberately. An MCP client
 * cannot observe the mutation at all — arguments are serialised on the way in,
 * so the caller's array is a copy by the time the server sees it, and
 * `plan.techniques` is not among the fields the response returns. The victims
 * are in-process callers: the CLI, and anything embedding the server directly.
 *
 * The last test drives the real client, and it does NOT guard this defect —
 * measured, not assumed. With the mutation restored it still passes, because
 * `workflow` is built before the sort runs and is therefore correct in both
 * versions. It is kept as a plain contract check on workflow ordering, and
 * labelled as such, because a test sitting in this file could otherwise be read
 * as covering the mutation when nothing at the client's level can.
 */

import { describe, it, expect } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { LateralTechnique } from '../../types/index.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

function plan(techniques: LateralTechnique[]) {
  return planThinkingSession(
    { problem: PROBLEM, techniques, timeframe: 'thorough' },
    new SessionManager(),
    TechniqueRegistry.getInstance()
  );
}

describe('planning leaves the caller its own array', () => {
  it('does not reorder the array it was given', () => {
    // Deliberately not in sorted order: 't' > 's', so a sort moves six_hats
    // first. Passing an already-sorted list would have hidden this for good.
    const mine: LateralTechnique[] = ['triz', 'six_hats'];
    plan(mine);

    expect(mine, "the caller's array was reordered in place").toEqual(['triz', 'six_hats']);
  });

  it('keeps the plan agreeing with itself about technique order', () => {
    const output = plan(['triz', 'six_hats']);

    // `plan.techniques` held the same reference the caller passed, so the
    // mutation reached the plan too — while `workflow` was built beforehand and
    // kept the requested order. One object, two answers.
    const workflowOrder = [...new Set(output.workflow.map(block => block.technique))];

    expect(output.techniques).toEqual(workflowOrder);
    expect(output.techniques).toEqual(['triz', 'six_hats']);
  });

  it('recognises a known pairing whichever order it is given', () => {
    // The sort was there for a reason: the note table is keyed by a sorted,
    // comma-joined list, so a pairing is recognised either way round. Copying
    // before sorting has to keep that working, or the fix trades a mutation bug
    // for a lookup bug.
    //
    // It also turned out that two of the table's four keys were written
    // unsorted — 'six_hats,scamper' and 'triz,scamper' — so the sorted lookup
    // could never match them and neither note had ever been emitted. This is
    // the pair that was dead.
    const forward = plan(['six_hats', 'scamper']).planningInsights?.historicalNote;
    const reverse = plan(['scamper', 'six_hats']).planningInsights?.historicalNote;

    expect(forward, 'the known-pairing note is still unreachable').toContain(
      'balancing systematic analysis with creative modifications'
    );
    expect(reverse, 'the note is order-dependent').toBe(forward);
  });

  it('falls back to the generic note for a pairing the table does not know', () => {
    const note = plan(['triz', 'neural_state']).planningInsights?.historicalNote;

    // The control: reviving the dead keys must not make every pairing "known".
    expect(note).toContain('2-technique workflow');
  });

  it('leaves a three-technique list alone as well', () => {
    const mine: LateralTechnique[] = ['triz', 'scamper', 'po'];
    plan(mine);

    expect(mine).toEqual(['triz', 'scamper', 'po']);
  });

  it('gives the caller a workflow in the order it asked for', async () => {
    // NOT a guard for the mutation above: kill-checked, and it passes with the
    // in-place sort restored, because `workflow` is assembled before the sort
    // runs. It checks the ordering contract itself, which nothing else does at
    // the client's level.
    const client = new MCPClientTestHelper();
    try {
      await client.connect();
      const result = await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: ['triz', 'six_hats'],
        timeframe: 'thorough',
      });
      const first = result.content[0];
      const data = JSON.parse(first.type === 'text' ? (first as { text: string }).text : '{}') as {
        workflow?: Array<{ technique: string }>;
      };

      const order = [...new Set((data.workflow ?? []).map(step => step.technique))];
      expect(order, 'the plan reordered the techniques the caller asked for').toEqual([
        'triz',
        'six_hats',
      ]);
    } finally {
      await client.disconnect();
    }
  }, 30_000);
});
