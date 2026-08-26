/**
 * The response's advice must not contradict the response's own scoring.
 *
 * `buildNextStepGuidance` took `recommendations.slice(0, 3)` — the first three
 * in ARRAY order. Quality-fill picks are appended by `fillCoverageGaps` after
 * sorting, so they sit at the end of the array while carrying the highest
 * scores. The slice therefore cut exactly the highest-scoring entries, and the
 * field labelled "here is your next call" proposed the three weakest.
 *
 * Measured on the current build before the fix, `crux: "path"`:
 *
 *   recommendations          suggestedParameters.techniques
 *     temporal_creativity  0.830  crux          included
 *     triz                 0.801  crux          included
 *     temporal_work        0.772  crux          included
 *     steelman_red_team    0.950  quality-fill  DROPPED   <- highest score
 *     random_entry         0.900  quality-fill  DROPPED   <- second highest
 *
 * A field report of a production run found the two dropped picks were also the
 * two that carried the session. PR #305 added `scoreProvenance`, which is what
 * made that visible — and then left this block computing its shortlist the old
 * way, so the response now reports honest provenance beside advice that
 * contradicts it.
 *
 * The invariant asserted is ordering-independent on purpose: not "returns five
 * techniques", which pins today's scoring, but "never drops a technique that
 * outscores one it keeps". That stays true if scores move.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM =
  'Plan a thirteen-night family rail trip across three countries balancing seven competing wants against limited stamina';
const CONSTRAINTS = [
  'Budget is fixed at the deposit already paid',
  'No single travel day over six hours',
];

let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
}, 30_000);

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

interface DiscoveryResponse {
  recommendations: Array<{
    technique: string;
    effectiveness: number;
    scoreProvenance?: string;
  }>;
  nextStepGuidance?: {
    suggestedParameters?: {
      techniques?: string[];
      constraints?: string[];
      objectives?: unknown;
      timeframe?: unknown;
    };
    example?: { parameters?: { techniques?: string[] } };
  };
}

async function discover(): Promise<DiscoveryResponse> {
  return JSON.parse(
    textOf(
      await client.callTool('discover_techniques', {
        problem: PROBLEM,
        crux: 'path',
        constraints: CONSTRAINTS,
      })
    )
  ) as DiscoveryResponse;
}

describe('discovery guidance does not contradict discovery scoring', () => {
  it('never suggests a technique while dropping a higher-scoring one', async () => {
    const data = await discover();
    const suggested = data.nextStepGuidance?.suggestedParameters?.techniques;

    // Preconditions. Without these the invariant below can hold vacuously —
    // over an empty suggestion list, or over a response whose recommendations
    // all tie.
    expect(data.recommendations.length, 'discovery returned too few picks to test').toBeGreaterThan(
      3
    );
    expect(suggested, 'suggestedParameters carried no techniques').toBeDefined();
    expect(suggested?.length ?? 0).toBeGreaterThan(0);

    const scoreOf = new Map(data.recommendations.map(r => [r.technique, r.effectiveness]));
    const kept = suggested ?? [];
    const dropped = data.recommendations.map(r => r.technique).filter(t => !kept.includes(t));

    const worstKept = Math.min(...kept.map(t => scoreOf.get(t) ?? 0));
    const offenders = dropped.filter(t => (scoreOf.get(t) ?? 0) > worstKept);

    expect(
      offenders,
      `dropped ${offenders.join(', ')} while keeping something scored lower`
    ).toEqual([]);
  }, 30_000);

  it("echoes the caller's constraints instead of filtering its own warnings", async () => {
    const data = await discover();
    expect(data.nextStepGuidance?.suggestedParameters?.constraints).toEqual(CONSTRAINTS);
  }, 30_000);

  it('does not invent objectives or a timeframe it was never given', async () => {
    // Neither is an input to discover_techniques — they belong to
    // plan_thinking_session. Filling them here produced "Achieve team
    // consensus" for a solo planning problem.
    const suggested = (await discover()).nextStepGuidance?.suggestedParameters;
    expect(suggested?.objectives, 'objectives were invented at discovery time').toBeUndefined();
    expect(suggested?.timeframe, 'a timeframe was invented at discovery time').toBeUndefined();
  }, 30_000);
});
