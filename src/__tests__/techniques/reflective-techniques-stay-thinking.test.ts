import { describe, it, expect } from 'vitest';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';

/**
 * Three techniques are wholly reflective, and that is a design decision rather
 * than an omission (#299).
 *
 * The question that keeps getting re-asked is whether a step like
 * `neural_state` #2 "Develop Switching" is really a thinking step, since it
 * changes the practitioner's state rather than only describing it. The answer
 * is the externality rule now written into CONTRIBUTING.md: a step is ACTION
 * when something *outside the session* differs afterwards. "It changed how I
 * think" is not externality — that is what thinking steps are for. By that
 * rule all three `neural_state` steps are thinking, and so are every step of
 * `six_hats` and `random_entry`.
 *
 * Why pin it here rather than trust the comment. These three are the suite's
 * designated reflective control: `issues/flexibility-is-measured.test.ts` uses
 * exactly this set to prove the flexibility measure is a sensor and not a
 * session-length counter. Reclassify a step inside the control and that proof
 * quietly stops proving anything, because the control is no longer reflective.
 *
 * And nothing else catches it. Measured before this file existed: flipping
 * `neural_state` #2 to `type: 'action'` left the whole suite green — 217 files,
 * 3389 tests — and `tsc` accepted it too, since no compile-time rule requires
 * an action step to carry `reflexiveEffects`. The one test that does fire is
 * sensing the *reversibility* rung, not the classification: it fails only once
 * reversibility also drops to `medium`, and it would fail identically for a
 * thinking step whose rung dropped. So the classification was free to move in
 * either direction with nothing noticing, which is the gap this closes.
 */
describe('The reflective techniques stay all-thinking', () => {
  const registry = TechniqueRegistry.getInstance();

  // Keep this list in step with the REFLECTIVE control in
  // issues/flexibility-is-measured.test.ts — they describe the same set, and
  // the whole point is that the two agree.
  const REFLECTIVE = ['neural_state', 'random_entry', 'six_hats'] as const;

  REFLECTIVE.forEach(technique => {
    it(`${technique} declares every step as thinking`, () => {
      const handler = registry.getHandler(technique);
      const { totalSteps } = handler.getTechniqueInfo();

      expect(totalSteps, `${technique} reports no steps to check`).toBeGreaterThan(0);

      for (let step = 1; step <= totalSteps; step++) {
        const info = handler.getStepInfo(step);
        expect(
          info.type,
          `${technique} step ${step} ("${info.name}") is declared ${String(info.type)}. ` +
            `If it really does change something outside the session, that is a deliberate ` +
            `change to the reflective control — update flexibility-is-measured.test.ts too, ` +
            `and see #299 for the externality rule.`
        ).toBe('thinking');
      }
    });
  });

  it('is not passing vacuously — action steps do exist elsewhere', () => {
    // Without this, deleting `type` from every StepInfo, or declaring the whole
    // corpus thinking, would turn the assertions above green rather than red.
    const actionSteps = ALL_LATERAL_TECHNIQUES.flatMap(technique => {
      const handler = registry.getHandler(technique);
      const { totalSteps } = handler.getTechniqueInfo();
      return Array.from({ length: totalSteps }, (_, i) => handler.getStepInfo(i + 1)).filter(
        info => info.type === 'action'
      );
    });

    expect(
      actionSteps.length,
      'no technique declares an action step, so "all thinking" means nothing here'
    ).toBeGreaterThan(0);
  });
});
