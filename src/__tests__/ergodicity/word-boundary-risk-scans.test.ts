/**
 * Word-boundary guards for the risk scans.
 *
 * The context detectors and the ruin-check gate used to match indicator
 * fragments inside unrelated words — 'api' in "rapid", 'system' in
 * "ecosystem", 'all' in "small", 'bet' in "between" — so a family-trip
 * problem could earn a TECHNICAL MIGRATION assessment and ordinary prose
 * tripped the ruin gate. Each table row here pins one boundary: the fragment
 * must not match, the whole word (and its simple plural) must.
 *
 * retry is disabled for this suite: it exists as a kill-checked guard, and
 * the global retry: 2 (vitest.config.ts) would let a flaky pass mask exactly
 * the regression this file is here to catch.
 */
import { describe, expect, it } from 'vitest';
import { AdaptiveRiskAssessment } from '../../ergodicity/AdaptiveRiskAssessment.js';
import { matchesRuinKeyword, requiresRuinCheck } from '../../ergodicity/prompts.js';

describe('AdaptiveRiskAssessment word boundaries', { retry: 0 }, () => {
  const assessment = new AdaptiveRiskAssessment();

  it('does not read technical migration into non-technical prose', () => {
    const context = assessment.analyzeContext(
      'Redesign the family trip: September weather shifts rapidly on the coast',
      'The tidal ecosystem walk is therapeutic for the grandparents'
    );
    expect(context.hasTechnicalMigration).toBe(false);
  });

  it('still detects technical migration from whole words, including plurals', () => {
    const context = assessment.analyzeContext(
      'Plan the database migration to the new platform',
      'The apis and vendors need review'
    );
    expect(context.hasTechnicalMigration).toBe(true);
  });

  it('does not read high stakes out of word fragments', () => {
    const context = assessment.analyzeContext(
      'A small overall challenge for the gallery wall',
      'Install the frames finally'
    );
    expect(context.hasHighStakes).toBe(false);
  });

  it('still detects high stakes from the standalone word', () => {
    const context = assessment.analyzeContext(
      'Should we bet it all on this?',
      'Everything rides on it'
    );
    expect(context.hasHighStakes).toBe(true);
  });

  it('keeps derived forms as explicit list entries', () => {
    // "permanently" and "bankruptcy" matched under the old substring scan and
    // are pinned by AdaptiveRiskAssessment.test.ts; the boundary fix keeps
    // them via explicit entries, not a widened suffix rule.
    const permanent = assessment.analyzeContext('This choice binds us permanently', 'No way back');
    expect(permanent.recoveryTimeframe).toBe('permanent - cannot recover');

    const bankrupt = assessment.analyzeContext('One misstep away from bankruptcy', 'High exposure');
    expect(bankrupt.hasHighStakes).toBe(true);
    expect(bankrupt.recoveryTimeframe).toBe('may not be able to recover');
  });

  it('does not read business context into "steam" or "confirmed"', () => {
    const context = assessment.analyzeContext(
      'The steam confirmed our hunch about the espresso machine',
      'Affirming the choice'
    );
    expect(context.hasBusinessContext).toBe(false);
  });

  it('does not read health context into "air conditioning"', () => {
    const context = assessment.analyzeContext(
      'Fix the air conditioning',
      'Reconditioning the unit'
    );
    expect(context.hasHealthSafety).toBe(false);
  });

  it('lets pure creative exploration take the fast path despite "small"/"install"', () => {
    // The fast-path guard used to see 'all' inside "small"/"installation" and
    // route creative prompts into full risk analysis.
    const context = assessment.analyzeContext(
      'Brainstorm small installation ideas for the hallway',
      'Imagine a conceptual gallery'
    );
    expect(context.hasCreativeExploration).toBe(true);
    expect(context.resourceType).toBe('creative resources');
  });
});

describe('requiresRuinCheck word boundaries', { retry: 0 }, () => {
  it('ignores keyword fragments inside larger tokens', () => {
    const fragments = [
      'between',
      'illegal',
      'critically',
      'committee',
      'publication',
      'trade-offs',
    ];
    expect(requiresRuinCheck('six_hats', fragments)).toBe(false);
  });

  it('matches whole tokens, plurals, hyphenated forms, and punctuated tokens', () => {
    expect(requiresRuinCheck('six_hats', ['bet'])).toBe(true);
    expect(requiresRuinCheck('six_hats', ['risks'])).toBe(true);
    expect(requiresRuinCheck('six_hats', ['all-in'])).toBe(true);
    expect(requiresRuinCheck('six_hats', ['invest.'])).toBe(true);
  });

  it('remains unconditional for the high-risk techniques', () => {
    expect(requiresRuinCheck('scamper', ['nothing', 'relevant'])).toBe(true);
  });

  it('matchesRuinKeyword strips punctuation but keeps hyphens', () => {
    expect(matchesRuinKeyword('"Invest,"', 'invest')).toBe(true);
    expect(matchesRuinKeyword('lock-in.', 'lock-in')).toBe(true);
    expect(matchesRuinKeyword('between', 'bet')).toBe(false);
  });
});
