/**
 * The stored domain assessment (#413), observed where a caller observes it:
 * only in the session export, through the built server; plus the time and
 * uncertainty rules at the assessment directly. The per-step ruin verdict
 * (#412) is guarded at the assessor in ruin-verdict-412.test.ts.
 *
 * The domain used to be extracted from a synthesised string, "This problem
 * involves <problem>. The user is considering: <output>", by greedy regexes
 * with a 50-character class and no boundary, so a step-6 output produced
 * `primaryDomain: "is the assumption that splitting the party is emot"`.
 * Time pressure read `high` whenever any temporal expression contained
 * "day" (so "13 days", "long stretches of the day"), uncertainty matched
 * `certain` inside `uncertain`, and `topics` carried the prefix artefacts.
 *
 * Now the domain comes from the problem only, at a word boundary, with the
 * leading article or preposition stripped; time pressure keeps its four
 * phrase tiers and no longer promotes on bare durations; uncertainty matches
 * whole words and `will` is no certainty marker.
 *
 * Breaks: restore the concatenation; restore one `allTemporal.includes`
 * clause; restore `.includes` in assessUncertainty; restore `will`.
 *
 * The problem is the retest's (long form): its "risk" opens the ruin gate,
 * so the assessment runs on every step. Runs the BUILT server (dist/):
 * rebuild before trusting a kill-check.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RuinRiskDiscovery } from '../../core/RuinRiskDiscovery.js';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM =
  'Plan a two-week family trip for September: balance the schedule across time zones, the ' +
  'trade-off between must-see cities and rest, and the risk that splitting the party backfires';

// Prose that carries "about " and "dealing with ", the two patterns that
// produced the mid-word slice; the break is red only with such an output.
const OUTPUT =
  'We are dealing with jet lag across three time zones and thinking about whether the party ' +
  'should split for two days; the assumption that splitting the party is emotionally costly ' +
  'needs testing, and 13 days is long enough to recover if it goes wrong.';

interface Exported {
  riskDiscoveryData?: {
    domainAssessment?: {
      primaryDomain?: string;
      riskFeatures?: { timePressure?: string; uncertaintyLevel?: string };
      nlpAnalysis?: { topics?: string[] };
    };
  };
}

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content[0]?.text ?? '';
}

describe('the stored domain assessment (#413), read from the export', () => {
  let client: MCPClientTestHelper;

  beforeAll(async () => {
    client = new MCPClientTestHelper();
    await client.connect({ env: { ...process.env } });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('derives the domain from the problem, at a word boundary, without the prefix artefacts', async () => {
    const plan = JSON.parse(
      textOf(
        await client.callTool('plan_thinking_session', {
          problem: PROBLEM,
          techniques: ['six_hats'],
        })
      )
    ) as { planId: string };
    const step = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          planId: plan.planId,
          technique: 'six_hats',
          problem: PROBLEM,
          currentStep: 1,
          totalSteps: 7,
          output: OUTPUT,
          nextStepNeeded: true,
        })
      )
    ) as { sessionId: string };
    const exported = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          sessionOperation: 'export',
          exportOptions: { sessionId: step.sessionId, format: 'json' },
        })
      )
    ) as { result?: { data?: string } };
    const session = JSON.parse(exported.result?.data ?? '{}') as Exported;
    const assessment = session.riskDiscoveryData?.domainAssessment;
    expect(assessment, 'the gate did not open; the problem must carry a gate word').toBeDefined();
    const domain = assessment?.primaryDomain ?? '';
    expect(domain.length).toBeLessThanOrEqual(50);
    expect(domain).toMatch(/\w$/);
    expect(domain).not.toMatch(/^(a|an|the|about|with|of)\s/i);
    expect(domain).toMatch(/family trip/i);
    expect(domain).not.toMatch(/jet lag|splitting the party/i);
    expect(assessment?.riskFeatures?.timePressure).toBe('none');
    const topics = assessment?.nlpAnalysis?.topics ?? [];
    expect(topics).not.toContain('This problem');
    expect(topics).not.toContain('The user');
    for (const t of topics) expect(t, `topic keeps punctuation: ${t}`).toMatch(/^\w.*\w$|^\w$/);
  }, 40_000);
});

describe('time pressure and uncertainty rules', () => {
  const discovery = new RuinRiskDiscovery();
  const features = (text: string) => discovery.processDomainAssessment(text).riskFeatures;

  it('durations and bare temporal nouns do not raise time pressure', () => {
    for (const text of ['long stretches of the day', '13 days', 'a two-week trip', 'next month']) {
      expect(features(text)?.timePressure, text).toBe('none');
    }
  });

  it('the four phrase tiers still hold', () => {
    expect(
      features('This needs to be decided immediately within the next hour.')?.timePressure
    ).toBe('critical');
    expect(features('The deadline is tomorrow at 5pm.')?.timePressure).toBe('high');
    expect(features('We should make a decision sometime next week.')?.timePressure).toBe('medium');
    expect(features('This can be addressed eventually when convenient.')?.timePressure).toBe('low');
  });

  it('uncertain is not certain, and will is no certainty marker', () => {
    expect(features('The outcome is uncertain.')?.uncertaintyLevel).toBe('high');
    expect(features('The plan is unclear.')?.uncertaintyLevel).toBe('high');
    expect(features('we will finish today')?.uncertaintyLevel).not.toBe('low');
    expect(features('The outcome is certain and definite.')?.uncertaintyLevel).toBe('low');
  });
});
