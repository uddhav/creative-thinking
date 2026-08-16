/**
 * Analysis paralysis is deliberating at length without ever committing.
 *
 * It used to be counted by naming one technique — `technique === 'six_hats'
 * && commitmentLevel < 0.3`, over a denominator of 15 — so a plan that spent
 * its steps there approached the barrier for running exactly as planned, and a
 * session that deliberated endlessly in any other technique was invisible. The
 * healthy control sat at distance 0.533 for its seven planned hats.
 *
 * It reads the path now: what share of the session bound nothing, scaled by
 * how long the session has gone on. Both terms are needed. The share alone is
 * 1.0 at step one of every session — the saturated-by-default trap that
 * `cognitive_lock_in` and `perfectionism` were both rescued from — and length
 * alone would call any long session paralysed however much it committed.
 */

import { describe, it, expect } from 'vitest';
import { ErgodicityManager } from '../../ergodicity/index.js';

/** A step that decides nothing. */
const DELIBERATION = { reversibilityCost: 0.1, commitmentLevel: 0.2 };
/** A step that binds. */
const COMMITMENT = { reversibilityCost: 0.9, commitmentLevel: 0.9 };

async function run(steps: Array<typeof DELIBERATION>): Promise<number> {
  const manager = new ErgodicityManager();
  for (let i = 0; i < steps.length; i++) {
    await manager.recordThinkingStep('six_hats', i + 1, `Step ${i + 1}.`, steps[i]);
  }
  const proximity = manager
    .getPathMemory()
    .currentFlexibility.barrierProximity.find(p => p.barrier?.subtype === 'analysis_paralysis');
  return proximity?.distance ?? 1;
}

describe('the analysis-paralysis barrier reads the path, not the technique', () => {
  it('stays clear through a reflective session of ordinary length', async () => {
    // The healthy control's length. Thirteen steps of thinking is thorough,
    // not paralysed, and this used to read 0.533 — a third of the way in.
    const distance = await run(Array<typeof DELIBERATION>(13).fill(DELIBERATION));

    expect(distance).toBeGreaterThan(0.3);
  });

  it('warns once deliberation has gone on long enough to be a decision in itself', async () => {
    const atEighteen = await run(Array<typeof DELIBERATION>(18).fill(DELIBERATION));
    const atTwenty = await run(Array<typeof DELIBERATION>(20).fill(DELIBERATION));

    expect(atEighteen, 'eighteen steps deciding nothing should warn').toBeLessThan(0.3);
    expect(atTwenty, 'twenty should be critical').toBeLessThan(0.2);
  });

  it('does not warn about a long session that keeps committing', async () => {
    // Same length as the critical case above. Committing is the opposite of
    // paralysis, however long it goes on.
    const distance = await run(Array<typeof COMMITMENT>(20).fill(COMMITMENT));

    expect(distance).toBeGreaterThan(0.3);
  });

  it('is not saturated at step one', async () => {
    // The defect shared by every barrier fixed in this sequence: a formula
    // whose default state is its own alarm.
    const distance = await run([DELIBERATION]);

    expect(distance).toBeGreaterThan(0.9);
  });

  it('does not single out one technique', async () => {
    const manager = new ErgodicityManager();
    for (let i = 0; i < 20; i++) {
      // Deliberation spread across techniques, none of them six_hats.
      const technique = (['triz', 'po', 'concept_extraction'] as const)[i % 3];
      await manager.recordThinkingStep(technique, i + 1, `Step ${i + 1}.`, DELIBERATION);
    }
    const distance =
      manager
        .getPathMemory()
        .currentFlexibility.barrierProximity.find(p => p.barrier?.subtype === 'analysis_paralysis')
        ?.distance ?? 1;

    // Invisible before, because none of these steps were six_hats.
    expect(distance).toBeLessThan(0.2);
  });
});
