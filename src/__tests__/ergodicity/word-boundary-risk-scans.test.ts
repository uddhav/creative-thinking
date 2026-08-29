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
import { StakesDiscovery } from '../../ergodicity/stakesDiscovery.js';
import { RiskDismissalTracker } from '../../ergodicity/riskDismissalTracker.js';
import { EscalationPromptGenerator } from '../../ergodicity/escalationPrompts.js';

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

/**
 * The three scans downstream of the ones above kept the substring behaviour
 * until #309. These drive them through their public methods rather than through
 * the matcher, because a helper test cannot show that a module actually calls
 * the helper — the modules are what the caller reaches.
 */
describe('StakesDiscovery word boundaries', { retry: 0 }, () => {
  const stakes = new StakesDiscovery();

  it('does not read total commitment out of "small" or "finally"', () => {
    const context = stakes.generateHistoricalContext({}, [
      'a small schema change',
      'finally shipped the migration',
    ]);
    expect(context).not.toContain('LTCM');
  });

  it('still matches the standalone words', () => {
    expect(stakes.generateHistoricalContext({}, ['all of the runway'])).toContain('LTCM');
    expect(stakes.generateHistoricalContext({}, ['total commitment'])).toContain('LTCM');
  });

  it('does not read irreversibility out of a longer token', () => {
    // "irreversibly" does not contain "irreversible" — the 12th letter differs
    // — so the old substring scan missed this too. Pinning current behaviour,
    // not a boundary the conversion introduced.
    expect(stakes.generateHistoricalContext({}, ['irreversibly committed'])).not.toContain(
      'Blockbuster'
    );
    expect(stakes.generateHistoricalContext({}, ['irreversible'])).toContain('Blockbuster');
  });

  it('still matches the derived forms the substring scan used to catch', () => {
    // These are the true positives word matching would otherwise lose, so the
    // call sites list them. Each one matched under `includes` before #309.
    expect(stakes.generateStakesPrompt.length).toBeGreaterThan(0); // sanity: method exists
    const prompt = (indicators: string[]) =>
      stakes.generateHistoricalContext({}, indicators) +
      // generateRiskSpecificPrompts is private; drive it through the public
      // prompt builder with the indicators on a bare session.
      stakes.generateStakesPrompt(
        {
          problem: 'p',
          history: [],
          riskEngagementMetrics: {
            dismissalCount: 0,
            averageConfidence: 0,
            escalationLevel: 1,
            discoveredRiskIndicators: indicators,
            consecutiveLowConfidence: 0,
            totalAssessments: 0,
          },
        } as unknown as Parameters<typeof stakes.generateStakesPrompt>[0],
        'act'
      );

    expect(prompt(['a $2M investment at risk'])).toContain('Dollar amount');
    expect(prompt(['the investor pulls out'])).toContain('Dollar amount');
    expect(prompt(['timeline slippage'])).toContain('cannot be recovered');
    expect(prompt(['unplanned downtime'])).toContain('cannot be recovered');

    // And the false positive the conversion exists to remove stays removed.
    expect(prompt(['after some investigation'])).not.toContain('Dollar amount');
  });
});

/**
 * escalationPrompts has the most converted call sites and, until this block,
 * no test of its own — and its inputs are the least structured of the three,
 * being free-form caller prose out of `history[].output` and `history[].risks`.
 */
describe('EscalationPromptGenerator word boundaries', { retry: 0 }, () => {
  const generator = new EscalationPromptGenerator();

  const metrics = {
    dismissalCount: 3,
    averageConfidence: 0.1,
    escalationLevel: 3,
    discoveredRiskIndicators: ['irreversibility'],
    consecutiveLowConfidence: 3,
    totalAssessments: 3,
  };

  /** A session whose single step carries the given risk and action prose. */
  const sessionWith = (risk: string, action: string) =>
    ({
      problem: 'Whether to consolidate the billing services',
      history: [{ output: action, risks: [risk] }],
    }) as unknown as Parameters<typeof generator.generatePrompt>[2];

  it('does not call ordinary prose a total commitment', () => {
    // 'all' inside "small"/"finally" and 'bet' inside "between" used to make
    // this contradiction fire on any prose at all.
    const prompt = generator.generatePrompt(
      metrics,
      [],
      sessionWith(
        'irreversible schema change once it ships',
        'We made a small change between the two services and finally shipped it.'
      )
    );
    expect(prompt?.prompt).not.toContain('propose total commitment');
  });

  it('still calls a real total commitment what it is', () => {
    const prompt = generator.generatePrompt(
      metrics,
      [],
      sessionWith(
        'irreversible schema change once it ships',
        'We are going to bet everything on the single cutover with no rollback.'
      )
    );
    expect(prompt?.prompt).toContain('propose total commitment');
  });

  it('does not read certainty out of "uncertain"', () => {
    // includes('certain') matched "uncertain", so this contradiction fired on
    // the action that ACKNOWLEDGED the uncertainty — the opposite of its name.
    const prompt = generator.generatePrompt(
      metrics,
      [],
      sessionWith(
        'uncertainty about the migration window',
        'The outcome here is genuinely uncertain and we should hedge.'
      )
    );
    expect(prompt?.prompt).not.toContain('shows certainty despite');
  });

  it('still reads certainty out of "certainly"', () => {
    const prompt = generator.generatePrompt(
      metrics,
      [],
      sessionWith(
        'uncertainty about the migration window',
        'We are certainly proceeding with the cutover as planned this quarter.'
      )
    );
    expect(prompt?.prompt).toContain('shows certainty despite');
  });
});

describe('RiskDismissalTracker word boundaries', { retry: 0 }, () => {
  const tracker = new RiskDismissalTracker();
  const metrics = {
    dismissalCount: 0,
    averageConfidence: 0,
    escalationLevel: 1,
    discoveredRiskIndicators: [],
    consecutiveLowConfidence: 0,
    totalAssessments: 0,
  };

  /** Long enough to clear the 50-word minimum, so scoring is what is measured. */
  const pad =
    'We considered the rollout carefully and wrote down what we expect to happen. '.repeat(6);

  it('does not count stakeholder consideration from "steam"', () => {
    const result = tracker.evaluateUnlockResponse(
      `${pad} The project is running out of steam after 3 months.`,
      0.9,
      { ...metrics }
    );
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('stakeholder impact analysis');
  });

  it('still counts it from the standalone word', () => {
    const result = tracker.evaluateUnlockResponse(
      `${pad} The team and our customers were consulted over 3 months.`,
      0.9,
      { ...metrics }
    );
    expect(result.feedback).not.toContain('stakeholder impact analysis');
  });

  it('keeps % and $ as substring checks, since word boundaries cannot match them', () => {
    // Anchoring these silently disabled the calculation check — it failed open.
    const result = tracker.evaluateUnlockResponse(
      `${pad} We would lose 40% of revenue, about $2m, if this fails.`,
      0.9,
      { ...metrics }
    );
    expect(result.feedback).not.toContain('specific calculations');
  });
});
