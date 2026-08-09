import { describe, it, expect } from 'vitest';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';

/**
 * This suite used to iterate a hardcoded list of 14 techniques — the cohort that
 * existed when it was written. Every handler added since went uncovered, and the
 * suite could not notice. It now iterates ALL_LATERAL_TECHNIQUES so new handlers
 * are covered automatically.
 *
 * Out-of-bounds steps currently have TWO accepted behaviours: older handlers
 * return a graceful fallback string, newer ones throw a ValidationError. This
 * asserts whichever contract a handler implements, and that it never degrades
 * into undefined, empty output, or an undescribed crash.
 *
 * [tbd] The split itself is a genuine API inconsistency worth reconciling —
 * pick one behaviour and migrate the others. Documented here rather than fixed
 * so that a third behaviour cannot appear unnoticed in the meantime.
 */
function expectGracefulOutOfBounds(
  getGuidance: () => string,
  techniqueName: string,
  problem: string
): void {
  let guidance: string;

  try {
    guidance = getGuidance();
  } catch (error) {
    // Throwing is an accepted contract, but it must be a real, described error
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(techniqueName);
    return;
  }

  // Returning is the other accepted contract: non-empty and problem-aware
  expect(guidance).toBeTruthy();
  expect(guidance).toContain(problem);
}

describe('Out-of-bounds step handling', () => {
  const registry = TechniqueRegistry.getInstance();
  const problem = 'test problem';

  ALL_LATERAL_TECHNIQUES.forEach(technique => {
    describe(`${technique} handler`, () => {
      const handler = registry.getHandler(technique);
      const info = handler.getTechniqueInfo();

      it('should handle step 0 gracefully', () => {
        expectGracefulOutOfBounds(() => handler.getStepGuidance(0, problem), info.name, problem);
      });

      it('should handle step 9999 gracefully', () => {
        expectGracefulOutOfBounds(() => handler.getStepGuidance(9999, problem), info.name, problem);
      });

      it('should handle negative step gracefully', () => {
        expectGracefulOutOfBounds(() => handler.getStepGuidance(-1, problem), info.name, problem);
      });

      it('should handle step beyond totalSteps gracefully', () => {
        expectGracefulOutOfBounds(
          () => handler.getStepGuidance(info.totalSteps + 1, problem),
          info.name,
          problem
        );
      });

      it('should provide substantive guidance for valid steps', () => {
        for (const step of [1, info.totalSteps]) {
          const guidance = handler.getStepGuidance(step, problem);
          expect(guidance).toBeTruthy();
          // Valid steps must return real guidance, not the out-of-bounds fallback
          expect(guidance.length).toBeGreaterThan(20);
        }
      });
    });
  });

  it('should throw helpful error for unknown technique', () => {
    expect(() => registry.getHandler('unknown_technique')).toThrow();

    try {
      registry.getHandler('unknown_technique');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("Invalid technique: 'unknown_technique'");
      expect(message).toContain('Valid techniques are:');
      expect(message).toContain('six_hats');
      expect(message).toContain('discover_techniques');
    }
  });

  describe('tryGetHandler', () => {
    it('returns undefined for an unknown technique instead of throwing', () => {
      expect(() => registry.tryGetHandler('unknown_technique')).not.toThrow();
      expect(registry.tryGetHandler('unknown_technique')).toBeUndefined();
    });

    it('returns the same handler as getHandler for a known technique', () => {
      expect(registry.tryGetHandler('six_hats')).toBe(registry.getHandler('six_hats'));
    });

    // The behaviour this exists for — a plan naming an unregistered technique
    // not failing the step before it — is covered end to end in
    // src/__tests__/issues/unregistered-next-technique.test.ts, which drives the
    // real executor. Re-implementing that call site here would assert on the
    // test's own copy of the logic and would pass with the fix reverted.
  });
});
