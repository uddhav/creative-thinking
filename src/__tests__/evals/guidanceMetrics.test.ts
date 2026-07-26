/**
 * Ratchet test for guidance quality.
 *
 * This is the project's first mechanism that can fail on the QUALITY of what it
 * produces rather than the plumbing that produces it. Before this, guidance
 * prose could be replaced wholesale with filler and the full suite still passed.
 *
 * It is a ratchet, not a gate: `baseline.json` records the state as measured,
 * warts included, and these tests only forbid getting worse. A gate that is red
 * on arrival gets disabled; a ratchet gets paid down.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll } from 'vitest';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import {
  analyzeAllTechniques,
  summarize,
  formatReport,
  type TechniqueGuidanceMetrics,
  type GuidanceMetricsSummary,
} from '../../evals/guidanceMetrics.js';

interface Baseline {
  generatedFrom: string;
  summary: GuidanceMetricsSummary;
  techniques: TechniqueGuidanceMetrics[];
}

/**
 * Minimum interpolation rate for a technique that is not yet in the baseline.
 * A brand-new technique whose steps mostly ignore their own input is the defect
 * this file exists to prevent, so new work must clear at least half its steps —
 * a bar 14 existing techniques already meet at 100%.
 */
const NEW_TECHNIQUE_MIN_INTERPOLATION = 0.5;

describe('Guidance quality ratchet', () => {
  let baseline: Baseline;
  let current: TechniqueGuidanceMetrics[];

  beforeAll(() => {
    baseline = JSON.parse(
      readFileSync(new URL('../../evals/baseline.json', import.meta.url), 'utf-8')
    ) as Baseline;
    current = analyzeAllTechniques(TechniqueRegistry.getInstance());
  });

  it('does not reduce the share of steps that reference their problem', () => {
    const summary = summarize(current);
    expect(
      summary.overallProblemInterpolationRate,
      `Overall problem interpolation fell below the recorded baseline.\n\n${formatReport(current)}`
    ).toBeGreaterThanOrEqual(baseline.summary.overallProblemInterpolationRate);
  });

  it('does not regress any individual technique', () => {
    const regressions: string[] = [];

    for (const recorded of baseline.techniques) {
      const now = current.find(m => m.technique === recorded.technique);
      if (!now) {
        // Removing a technique is a deliberate act, not a guidance regression
        continue;
      }
      if (now.problemInterpolationRate < recorded.problemInterpolationRate) {
        regressions.push(
          `${now.technique}: ${recorded.problemInterpolationRate} -> ${now.problemInterpolationRate}`
        );
      }
    }

    expect(
      regressions,
      `Guidance stopped referencing the problem:\n${regressions.join('\n')}`
    ).toEqual([]);
  });

  it('holds new techniques to a minimum standard', () => {
    const recorded = new Set(baseline.techniques.map(t => t.technique));
    const offenders = current
      .filter(m => !recorded.has(m.technique))
      .filter(m => m.problemInterpolationRate < NEW_TECHNIQUE_MIN_INTERPOLATION)
      .map(m => `${m.technique}: ${m.problemInterpolationRate}`);

    expect(
      offenders,
      `New techniques must reference their problem in at least ${
        NEW_TECHNIQUE_MIN_INTERPOLATION * 100
      }% of steps.\nSteps that ignore their input return identical text for every problem:\n${offenders.join(
        '\n'
      )}`
    ).toEqual([]);
  });

  it('produces a metric for every registered technique', () => {
    const registered = TechniqueRegistry.getInstance().getAllTechniques();
    expect(current.length).toBe(registered.length);
    for (const metric of current) {
      expect(metric.totalSteps).toBeGreaterThan(0);
      expect(metric.meanGuidanceLength).toBeGreaterThan(0);
      expect(metric.stepsReferencingProblem).toBeLessThanOrEqual(metric.totalSteps);
    }
  });
});
