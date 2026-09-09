/**
 * The per-step ruin verdict (#412), at the assessor.
 *
 * `survivabilityThreatened` was a plain substring scan of the step output
 * for eight words, so "studied", "dietary", "soldier" and the server's own
 * "survival constraints" advice echoed back all set it, and one hit alone
 * attached the HIGH RISK recommendation and the barbell constraints. The
 * retest's four false alarms on a family trip were exactly that.
 *
 * Now both scans match whole words (with the inflections the substring form
 * covered by accident listed explicitly), the server's own phrases are
 * stripped before scanning, and HIGH RISK needs survivability plus a second
 * signal from the set riskDismissalTracker already calls "actual risks":
 * irreversibility, time pressure high or critical, or impact broad or
 * systemic. Survivability alone is reported as a note.
 *
 * Breaks: restore `.includes` in either scan; restore the one-signal HIGH
 * RISK rule; key the barbell constraints on the flag alone; drop the
 * phrase strip; widen the second signal to `limited` impact.
 */
import { describe, expect, it } from 'vitest';
import {
  assessRuinRisk,
  generateSurvivalConstraints,
  ruinVerdictIsHighRisk,
} from '../../ergodicity/prompts.js';
import { RiskDismissalTracker } from '../../ergodicity/riskDismissalTracker.js';
import { RuinRiskDiscovery } from '../../core/RuinRiskDiscovery.js';
import type { SessionData } from '../../types/index.js';

const PROBLEM = 'should I change careers';

describe('survivabilityThreatened matches whole words', () => {
  it('does not fire on studied, dietary or soldier', () => {
    const a = assessRuinRisk(PROBLEM, 'six_hats', 'we studied the dietary options with a soldier');
    expect(a.survivabilityThreatened).toBe(false);
    expect(a.isIrreversible).toBe(false);
  });

  it('fires on the listed inflections the substring form used to cover', () => {
    for (const text of [
      'bankruptcy is possible',
      'bankrupting the firm',
      'people died',
      'we were ruined',
      'ruining us',
      'fatally flawed',
      'a fatality',
    ]) {
      expect(assessRuinRisk(PROBLEM, 'six_hats', text).survivabilityThreatened, text).toBe(true);
    }
    expect(assessRuinRisk(PROBLEM, 'six_hats', 'the irreversibility is total').isIrreversible).toBe(
      true
    );
  });

  it('the second-signal features match whole words too', () => {
    // Break: restore `.includes` in the feature scans.
    const a = assessRuinRisk(PROBLEM, 'six_hats', 'the organizational chart could ruin morale');
    expect(a.riskFeatures?.impactRadius).toBe('self');
    expect(ruinVerdictIsHighRisk(a)).toBe(false);
    expect(
      assessRuinRisk(PROBLEM, 'six_hats', 'the community could ruin it').riskFeatures?.impactRadius
    ).toBe('broad');
  });

  it('the final hat is not irreversible; cannot be undone is', () => {
    expect(assessRuinRisk(PROBLEM, 'six_hats', 'the final hat').isIrreversible).toBe(false);
    expect(assessRuinRisk(PROBLEM, 'six_hats', 'this cannot be undone').isIrreversible).toBe(true);
  });

  it("the server's own prompt and advice, echoed back, set nothing", () => {
    const echo =
      'Reversibility: can this decision be undone? Survival impact: does failure threaten ' +
      'survival (financial, health, reputation)? We add strict survival constraints.';
    const a = assessRuinRisk(PROBLEM, 'six_hats', echo);
    expect(a.survivabilityThreatened).toBe(false);
    expect(a.isIrreversible).toBe(false);
  });
});

describe('the note holds downstream', () => {
  const session = (): SessionData =>
    ({
      id: 's',
      technique: 'six_hats',
      problem: PROBLEM,
      history: [],
      insights: [],
      branches: {},
    }) as unknown as SessionData;

  it('survival language alone is not an actual risk and no survival-threat indicator', () => {
    // Break: key hasActualRisks or the indicator on the flag alone.
    const tracker = new RiskDismissalTracker();
    const alone = tracker.trackAssessment(
      assessRuinRisk(PROBLEM, 'six_hats', 'this could ruin us'),
      session(),
      'this could ruin us'
    );
    expect(alone.discoveredRiskIndicators).not.toContain('survival threat');
    const two = tracker.trackAssessment(
      assessRuinRisk(PROBLEM, 'six_hats', 'this could ruin us and it is irreversible'),
      session(),
      'this could ruin us and it is irreversible'
    );
    expect(two.discoveredRiskIndicators).toContain('survival threat');
  });

  it('the stored assessment does not read finalize as irreversible', () => {
    // Break: restore `.includes` or bare `final` in detectUndoableActions.
    const discovery = new RuinRiskDiscovery();
    expect(
      discovery.processDomainAssessment('finalize the vendor selection').riskFeatures
        ?.hasUndoableActions
    ).toBe(false);
    expect(
      discovery.processDomainAssessment('this cannot be undone').riskFeatures?.hasUndoableActions
    ).toBe(true);
  });
});

describe('HIGH RISK needs two signals', () => {
  it('survivability alone is a note, not HIGH RISK, and no barbell constraint', () => {
    const a = assessRuinRisk(PROBLEM, 'six_hats', 'this could ruin us');
    expect(a.survivabilityThreatened).toBe(true);
    expect(ruinVerdictIsHighRisk(a)).toBe(false);
    expect(a.recommendation).not.toContain('HIGH RISK');
    expect(a.recommendation).toMatch(/survival language/i);
    expect(generateSurvivalConstraints(a).join(' ')).not.toMatch(/barbell/i);
  });

  it('limited impact (family, team) is not the second signal', () => {
    const a = assessRuinRisk(PROBLEM, 'six_hats', 'this could ruin us for the family');
    expect(a.riskFeatures?.impactRadius).toBe('limited');
    expect(ruinVerdictIsHighRisk(a)).toBe(false);
    expect(a.recommendation).not.toContain('HIGH RISK');
  });

  it('survivability plus irreversibility is HIGH RISK, with the barbell constraint', () => {
    const a = assessRuinRisk(PROBLEM, 'six_hats', 'this could ruin us and it is irreversible');
    expect(ruinVerdictIsHighRisk(a)).toBe(true);
    expect(a.recommendation).toContain('HIGH RISK');
    expect(generateSurvivalConstraints(a).join(' ')).toMatch(/barbell/i);
  });

  it('the ensemble suffix still rides on a survivability-only note', () => {
    const a = assessRuinRisk(
      PROBLEM,
      'triz',
      'Works great in ensemble average but could ruin individual traders over time'
    );
    expect(a.recommendation).not.toContain('HIGH RISK');
    expect(a.recommendation).toContain('many attempts');
  });
});
