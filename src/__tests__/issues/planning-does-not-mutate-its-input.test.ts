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
 */

import { describe, it, expect } from 'vitest';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { PlanThinkingSessionInput, LateralTechnique } from '../../types/index.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

function plan(techniques: LateralTechnique[]) {
  return planThinkingSession(
    { problem: PROBLEM, techniques, timeframe: 'thorough' } as PlanThinkingSessionInput,
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
});
