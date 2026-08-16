import { describe, it, expect } from 'vitest';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';

/**
 * Every step of every technique must say what kind of step it is and how hard it
 * is to undo.
 *
 * The flexibility measure is moving off keyword-matching the user's prose and
 * onto what the technique itself declares. Under that reading, a step that
 * declares nothing does not read as neutral — it reads as free: it costs no
 * commitment, because there is no commitment recorded to charge for. So the
 * failure mode of an under-declared step is silent and in one direction, which
 * is exactly the kind a suite has to catch rather than a reviewer.
 *
 * A thinking step declares `reversibility` directly on its StepInfo; an action
 * step may instead carry it inside `reflexiveEffects`, next to the reality
 * changes that make it hard to undo. Either satisfies this — what is not
 * allowed is neither.
 *
 * This iterates ALL_LATERAL_TECHNIQUES, so a technique added without these
 * fields fails here rather than shipping as a free step.
 */
describe('Every step declares its reversibility', () => {
  const registry = TechniqueRegistry.getInstance();

  ALL_LATERAL_TECHNIQUES.forEach(technique => {
    describe(technique, () => {
      const handler = registry.getHandler(technique);
      const { totalSteps } = handler.getTechniqueInfo();

      it('has at least one step to check', () => {
        expect(totalSteps).toBeGreaterThan(0);
      });

      for (let step = 1; step <= totalSteps; step++) {
        it(`step ${step} declares a type and a reversibility`, () => {
          const info = handler.getStepInfo(step);

          expect(info.type, `${technique} step ${step} declares no type`).toBeDefined();
          expect(['thinking', 'action']).toContain(info.type);

          const reversibility = info.reversibility ?? info.reflexiveEffects?.reversibility;
          expect(
            reversibility,
            `${technique} step ${step} ("${info.name}") declares no reversibility, so it would ` +
              `cost nothing to take`
          ).toBeDefined();
          expect(['high', 'medium', 'low', 'very_low']).toContain(reversibility);
        });
      }
    });
  });

  it('covers every step of every technique', () => {
    const stepCount = ALL_LATERAL_TECHNIQUES.reduce(
      (total, technique) => total + registry.getHandler(technique).getTechniqueInfo().totalSteps,
      0
    );

    // Not a target to hold at a number — techniques come and go. It asserts the
    // walk above is walking something, so a registry that returned no steps
    // would fail rather than pass vacuously.
    expect(stepCount).toBeGreaterThanOrEqual(ALL_LATERAL_TECHNIQUES.length);
  });
});
